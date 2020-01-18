var sinequaResultVis = (function () {
    var self = {};

    self.sliderIndexMin = 20;
    self.sliderIndexMax = 300;
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
                var data = {entities: json.chart_data, docStats: json.doc_stats, extracts: json.extracts, question: json.internalqueryanalysis, only_extracts: json.only_extracts};
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


        function getEntitiesMapFromExtracts(extracts, docEntities) {

            var allEntitiesMap = {};
            extracts.forEach(function (extracts, rowIndex) {
                extracts.extracts.forEach(function (extract, extractIndex) {

                    var docId = extract.doc;
                    var array;
                    var extractEntities = [];
                    var array;
                    var ids = extract.ids.split(" ")
                    ids.forEach(function (id) {
                        if (id.indexOf("_") < 0)
                            return;
                        if (!allEntitiesMap[id])
                            allEntitiesMap[id] = {extracts: [], associations: {}}

                        allEntitiesMap[id].extracts.push(extractIndex)


                    })


                })
            })
            return allEntitiesMap
        }


        function getDocumentsEntitiesAssociations(docs) {
            var docEntitiesMap = {};
            var docEntitiesArray = [];
            docs.forEach(function (doc) {
                var docName = doc.docid.substring(doc.docid.indexOf("|") + 1)

                docEntitiesMap[docName] = {}

                var keys = Object.keys(doc);
                var entityColors = {}
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

                        if (!docEntitiesMap[docName][entityName])
                            docEntitiesMap[docName][entityName] = {color: color, offsets: []}
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
                                            coocurrences[entity1] = {color: docEntitiesMap[doc][entity1].color, coocurrences: []}
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

        getEntitiesNamesFromDocs = function (docs) {
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


        getEntitiesMapFromOnlyExtracts = function (onlyExtracts) {
            var allEntitiesMap = {};
            onlyExtracts.forEach(function (extract, extractIndex) {
                var entitystats = extract.entitystats;
                if (!entitystats)
                    var x = 0
                else {
                    var lines = entitystats.split("\r\n");

                    lines.forEach(function (line) {
                        var array2 = line.split(" | ");
                        var obj = {
                            name: array2[0],
                            type: array2[1],
                            score1: array2[2],
                            score2: array2[3],
                        }


                        if (!allEntitiesMap[obj.name])
                            allEntitiesMap[obj.name] = {extractIds: [], extracts: [], associations: {}}
                        obj.extract = extractIndex
                        allEntitiesMap[obj.name].extracts.push(obj)
                        allEntitiesMap[obj.name].extractIds.push(extractIndex)


                    })
                }
            })


            return allEntitiesMap


        }
        setEntitiesAssociations = function (allEntitiesMap) {
            for (var key in allEntitiesMap) {
                var extracts1 = allEntitiesMap[key].extractIds;

                for (var key2 in allEntitiesMap) {
                    if (key != key2) {
                        var extracts2 = allEntitiesMap[key2].extractIds;

                        extracts1.forEach(function (extract1) {
                            if (extracts2.indexOf(extract1) > -1) {
                                if (!allEntitiesMap[key].associations[key2])
                                    allEntitiesMap[key].associations[key2] = {extract: extract1, freq: 0}
                                allEntitiesMap[key].associations[key2].freq += 1;
                            } else {
                                var x = 3
                            }


                        })
                    }
                }

            }

            return allEntitiesMap;

        }


        getVisjData = function (allEntitiesMap) {

            function getHashNumber(str) {
                var hashStr = ""
                for (var i = 0; i < str.length; i++) {
                    hashStr += str.charCodeAt(i);
                }
                return parseInt(hashStr)
            }

            var entityColors = {};


            var nodes = [];
            var edges = [];
            var edgesMap={}
            for (var key in allEntitiesMap) {
                if (key != "") {
                    var entity = allEntitiesMap[key];
                    if (entity.extracts.length > 0) {
                        var type = entity.extracts[0].type;
                        if (!entityColors[type]) {
                            entityColors[type] = self.palette[Object.keys(entityColors).length]
                        }
                        var color = entityColors[type];

                        var node = {
                            label: key,
                            shape: "dot",
                           value: entity.extractIds.length,
                            id: key,
                            color: color

                        }
                        nodes.push(node)



                        for (var key2 in entity.associations) {
                            var id = (getHashNumber(key) * getHashNumber(key2)) / 100000

                            if(!edgesMap[id]) {
                                edgesMap[id] = {
                                    from: key,
                                    to: key2,
                                    value:0,
                                    data:{extracts:[]}

                                }
                            }
                            edgesMap[id].value+= entity.associations[key2].freq;
                            edgesMap[id].data.extracts.push(entity.associations.extract)

                        }
                    }
                }
            }
            for(var id in edgesMap){
                edges.push(edgesMap[id])
            }


            return {nodes: nodes, edges: edges}
        }


        //    var allEntities = getDocumentsEntitiesAssociations(data.docs);

        //    var docEntities = getDocEntities(data.docs);
        // var allEntities = getEntitiesMapFromExtracts(data.extracts);

        var allEntities = getEntitiesMapFromOnlyExtracts(data.only_extracts);
        allEntities = setEntitiesAssociations(allEntities);
        self.visJsData = getVisjData(allEntities);


        self.visJsData.edges.sort(function (a, b) {
            if (a.value > b.value)
                return -1;
            if (a.value < b.value)
                return 1;
            return 0;
        })
        self.sliderEdges =  self.visJsData.edges;
        self.sliderEdges.index = self.sliderIndexMin;
        var edges=  self.visJsData.edges.slice(0, self.sliderIndexMin)

        self.drawSubset(edges);






    }

    self.drawSubset=function(edges){
        var uniqueNodes=[];
        var nodes=[]
        self.visJsData.nodes.forEach(function(node){
            edges.forEach(function(edge){
                if(edge.from==node.id || edge.to==node.id)
                    if(uniqueNodes.indexOf(node.id)<0) {
                        uniqueNodes.push(node.id);
                        nodes.push(node);
                    }

            })

        })
        visjsGraph.draw("graphDiv", {nodes: nodes, edges: edges}, {})
    }

    self.onEdgeClicked=function(edge,point){
        var xx=3
    }


    return self;

})
()
