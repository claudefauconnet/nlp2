var sinequaResultVis = (function () {
    var self = {};
    self.minWindowOffset = 10
    self.palette = [
        "#0072d5",
        '#FF7D07',
        "#c00000",
        '#FFD900',
        '#B354B3',
        "#a6f1ff",
        "#007aa4",
        "#584f99",
        "#cd4850",
        "#005d96",
        "#ffc6ff",
        '#007DFF',
        "#ffc36f",
        "#ff6983",
        "#7fef11",
        '#B3B005',
    ],

        self.showSinequaResult = function (fileName, windowOffset) {

            $.getJSON("data/" + fileName, function (json) {
                console.log(json); // this will show the info it in firebug console
                var data = {entities: json.chart_data, docStats: json.doc_stats, docs: json.Result.Docs, extracts: json.extracts, question: json.internalqueryanalysis};
                if (!windowOffset) {
                    windowOffset = self.minWindowOffset
                  //  $("#slider").slider("value", minWindowOffset)
                }
                self.drawGraph(data, windowOffset);
            });


        }

    self.drawGraph = function (data, windowOffset) {
        var types = {}
        var nodes = [];


        function getEntitiesMap(extracts, docEntities) {

            var allEntities = {};
            extracts.forEach(function (extracts, rowIndex) {


                var associations = [];
                var type = extracts.caption

                extracts.extracts.forEach(function (extract) {

                    var docId = extract.doc;
                    var array;
                    var extractEntities = [];
                    var array;
                    var ids = extract.ids.split(" ")
                    ids.forEach(function (id) {
                        var array = id.split("_");
                        var entityName
                        if (array.length == 2)
                            entityName = docEntities.array[docId][array[1]]
                        else {
                            id = id.substring(id.indexOf("-") + 1)
                            entityName = docEntities.map[docId][id]
                        }

                        extractEntities.push({type: type, value: entityName})
                    })
                    /*  while ((array = regexEntityNumbers.exec(extract.sentence)) != null) {
                          var name = array[2].toLowerCase();
                          console.log(name)
                          extractEntities.push({type: "entity" + array[1], value: array[2]})
                      }*/
                    extractEntities.forEach(function (entity, index1) {
                        if (!allEntities[entity.value])
                            allEntities[entity.value] = {type: entity.type, linkedEntities: []}
                        extractEntities.forEach(function (entity2, index2) {
                            if (index1 != index2 && allEntities[entity.value].linkedEntities.indexOf(entity2.value) < 0)
                                allEntities[entity.value].linkedEntities.push(entity2.value);
                        })
                    })
                })
            })
            return allEntities
        }

        getDocEntities = function (docs) {
            var docEntitiesMap = {};
            var docEntitiesArray = [];
            docs.forEach(function (doc) {
                    var docName = doc.docid.substring(doc.docid.indexOf("|") + 1)
                    docEntitiesArray[docName] = []
                    docEntitiesMap[docName] = {}

                    var keys = Object.keys(doc);
                    keys.forEach(function (key) {
                        if (key.indexOf("entity") == 0) {
                            var entityStr = doc[key];
                            var array = entityStr.split(";")
                            array.forEach(function (item, index) {
                                if (index % 4 == 0) {
                                    var entityName = item;
                                    if (!docEntitiesMap[docName][key])
                                        docEntitiesMap[docName][key] = entityName;
                                    if (docEntitiesArray[docName].indexOf(entityName) < 0)
                                        docEntitiesArray[docName].push(item)

                                }
                            })
                        }
                    })


                }
            )

            return {map: docEntitiesMap, array: docEntitiesArray}


        }


        function getDocumentsEntitiesAssociations(docs) {
            var docEntitiesMap = {};
            var docEntitiesArray = [];
            docs.forEach(function (doc) {
                var docName = doc.docid.substring(doc.docid.indexOf("|") + 1)

                docEntitiesMap[docName] = {}

                var keys = Object.keys(doc);
                var entityColors={}
                keys.forEach(function (key) {
                    if (key.indexOf("entity") == 0) {
                        if (!entityColors[key]) {
                            entityColors[key] = self.palette[Object.keys(entityColors).length]
                        }
                        color = entityColors[key];

                        var entityStr = doc[key];
                        var offsetStr;
                        var entityName;
                        var array = entityStr.split(";")
                        array.forEach(function (item, index) {
                            if (index % 4 == 0) {
                                entityName = item;
                            }
                            if (index % 2 == 0) {

                                offsetStr = item;
                            }


                        })

                        if( !docEntitiesMap[docName][entityName])
                            docEntitiesMap[docName][entityName]={color:color,offsets:[]}
                        var offsets = offsetStr.split(",")
                        offsets.forEach(function (offset, index2) {
                            if (index2 % 2 == 0)
                                docEntitiesMap[docName][entityName].offsets.push(offsets)
                        })


                    }
                })
            })

            var coocurrences = {}
            for (var doc in docEntitiesMap) {

                for (var entity1 in docEntitiesMap[doc]) {
                    for (var entity2 in docEntitiesMap[doc]) {
                        if (entity1 != entity2) {
                            var offsets1 = docEntitiesMap[doc][entity1].offsets
                            var offsets2 = docEntitiesMap[doc][entity2].offsets
                            offsets1.forEach(function (offset1) {
                                offset1 = parseInt(offset1)
                                offsets2.forEach(function (offset2) {
                                    offset2 = parseInt(offset2)

                                    if ((offset1 - windowOffset) < offset2 && (offset1 + windowOffset) > offset2) {
                                        if (!coocurrences[entity1])
                                            coocurrences[entity1] ={color: docEntitiesMap[doc][entity1].color,coocurrences: []}
                                        coocurrences[entity1].coocurrences.push(entity2)
                                    }

                                })

                            })
                        }

                    }
                }

            }
            return coocurrences;


        }


        var edges = [];
        var allEntities = getDocumentsEntitiesAssociations(data.docs);

//        var docEntities = getDocEntities(data.docs);
//var allEntities = getEntitiesMap(data.extracts,docEntities);


        var entityColors = {}

        for (var key in allEntities) {


            var node = {
                label: key,
                shape: "dot",
                size: 20,
                id: key,
                color: allEntities[key].color

            }
            nodes.push(node)


            var uniqueEdges={}
            allEntities[key].coocurrences.forEach(function (entity2) {

                if (key == entity2)
                    return;

                if (!uniqueEdges[key + "_" + entity2] && !uniqueEdges[entity2 + "_" + key])
                    uniqueEdges[key + "_" + entity2] = {from:key,to:entity2,count:1}
                else
                    uniqueEdges[key + "_" + entity2].count += 1
            })

            for(var key in uniqueEdges){
                var edge = {
                    from: uniqueEdges[key].from,
                    to:  uniqueEdges[key].to,
                    width:  Math.min(uniqueEdges[key].count,12)
                }


                edges.push(edge)
            }
        }


        visjsGraph.draw("graphDiv", {nodes: nodes, edges: edges}, {})


    }


    return self;

})
()
