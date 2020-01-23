var sinequaResultVis = (function () {
    var self = {};

    self.sliderIndexMin = 20;
    self.sliderIndexMax = 300;
    self.minWindowOffset = 10;
    self.graphDivPosition = {};
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


        self.entitiesColors = {
            "entity45": "#E2F2C1",
            "entity15": "#B9E3F7",
            "entity22": "#91D3F7",
            "entity23": "#FFD000",
            "entity27": "#E29A9A",
            "entity24": "#F5B8F9",
            "entity1": "#F99393",
            "entity16": "#91F7C1",
            "entity25": "#BCD2FF",
            "entity28": "#91F7C1",
            "entity26": "#A1E2A7",
            "entity18": "#EDC4B4",
            "entity20": "#C9F8FF",
            "entity46": "#E2F2C1",
            "entity51": "#E2F2C1",
            "entity52": "#E2F2C1",

            /*   "entity45": "#E2F2C1",
               "entity6": "#0072d5",
               "entity9": '#FF7D07',
               "entity13": "#c00000",
               "entity14": '#FFD900',
               "entity22": '#B354B3',
               "entity23": "#a6f1ff",
               "entity24": "#007aa4",
               "entity25": "#584f99",
               "entity26": "#cd4850",
               "entity27": "#005d96",
               "entity28": "#ffc6ff",
               "entity33": '#007DFF',
               "entity36": "#ffc36f",
               "entity37": "#ff6983",
               "entity38": "#7fef11",
               "entity42": '#B3B005',
               "entity43": "#0072d5",
               "entity47": '#FF7D07',
               "entity70": "#c00000",
               "entity71": '#FFD900',
               "entity72": '#B354B3',
               "entity73": "#a6f1ff",
               "entity74": "#007aa4",
               "entity75": "#584f99",
               "entity76": "#cd4850",*/

        }


    self.showSinequaResult = function (fileName, windowOffset) {


        $.getJSON("data/" + fileName, function (json) {

            var data = {chart_data: json.chart_data, docStats: json.doc_stats, extracts: json.extracts, question: json.internalqueryanalysis, only_extracts: json.only_extracts};
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
                                    allEntitiesMap[key].associations[key2] = {extracts: [], freq: 0}
                                allEntitiesMap[key].associations[key2].freq += 1;
                                allEntitiesMap[key].associations[key2].extracts.push(extract1);
                            } else {
                                var x = 3
                            }


                        })
                    }
                }

            }

            return allEntitiesMap;

        }

        // max score des extracts de l'assocation
        setAssociationsScore = function (allEntitiesMap, only_extracts) {


            for (var key1 in allEntitiesMap) {
                for (var key2 in allEntitiesMap[key1].associations) {
                    var association = allEntitiesMap[key1].associations[key2];
                    var extracts = association.extracts;
                    var scoreMax = 0
                    extracts.forEach(function (extractId) {
                        var extractObj = only_extracts[extractId];
                        scoreMax = Math.max(scoreMax, extractObj.finalscore)

                    })
                    allEntitiesMap[key1].associations[key2].scoreMax = scoreMax
                }
            }
            return allEntitiesMap;
        }

        setEntitiesScore = function (allEntitiesMap, chart_data) {
            scoreMap = {}
            chart_data.forEach(function (type) {
                type.values.forEach(function (entity) {
                    var name = entity.name;
                    name = /.*>(.*)<.*/.exec(name)[1]
                    var value = entity.value;
                    allEntitiesMap[name].score = value;
                })

            })

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
            var edgesMap = {}
            for (var key in allEntitiesMap) {
                if (key != "") {
                    var entity = allEntitiesMap[key];
                    if (entity.extracts.length > 0) {
                        var type = entity.extracts[0].type;

                        var color = self.entitiesColors[type];

                        var node = {
                            label: key,
                            shape: "dot",
                            value: entity.score,
                            id: key,
                            color: color

                        }
                        nodes.push(node)


                        for (var key2 in entity.associations) {
                            var id = (getHashNumber(key) * getHashNumber(key2)) / 100000
                            var score = entity.associations[key2].scoreMax;
                            if (!edgesMap[id]) {
                                edgesMap[id] = {
                                    from: key,
                                    to: key2,
                                    value: score,
                                    color:"#ddd",
                                    data: {extracts: []}

                                }
                            }
                            //   edgesMap[id].value += entity.associations[key2].freq;
                            edgesMap[id].data.extracts = entity.associations[key2].extracts;

                        }
                    }
                }
            }
            for (var id in edgesMap) {
                edges.push(edgesMap[id])
            }


            return {nodes: nodes, edges: edges}
        }


        //    var allEntities = getDocumentsEntitiesAssociations(data.docs);

        //    var docEntities = getDocEntities(data.docs);
        // var allEntities = getEntitiesMapFromExtracts(data.extracts);

        self.onlyExtracts = data.only_extracts
        var allEntities = getEntitiesMapFromOnlyExtracts(data.only_extracts);
        allEntities = setEntitiesAssociations(allEntities);
        allEntities = setEntitiesScore(allEntities, data.chart_data)
        allEntities = setAssociationsScore(allEntities, data.only_extracts)
        self.visJsData = getVisjData(allEntities);


        self.visJsData.edges.sort(function (a, b) {
            if (a.value > b.value)
                return -1;
            if (a.value < b.value)
                return 1;
            return 0;
        })
        self.sliderEdges = self.visJsData.edges;
        self.sliderEdges.index = self.sliderIndexMin;
        var edges = self.visJsData.edges.slice(0, self.sliderIndexMin)

        self.drawSubset(edges);


    }

    self.drawSubset = function (edges) {
        var uniqueNodes = [];
        var nodes = []
        self.visJsData.nodes.forEach(function (node) {
            edges.forEach(function (edge) {
                if (edge.from == node.id || edge.to == node.id)
                    if (uniqueNodes.indexOf(node.id) < 0) {
                        uniqueNodes.push(node.id);
                        nodes.push(node);
                    }

            })

        })
        visjsGraph.draw("graphDiv", {nodes: nodes, edges: edges}, {})
    }

    self.onEdgeHover = function (edge, point) {
        var xx = 3
        var extractIndexes = edge.data.extracts;
        var str = "";
        var extractIndexesDone = []
        extractIndexes.forEach(function (extractIndex, index) {
            if (extractIndexesDone.indexOf(extractIndex) < 0) {
                extractIndexesDone.push(extractIndex)
                if (str.length > 0)
                    str += "<hr>"
                str += sinequaResultVis.onlyExtracts[extractIndex].sentence
            }
        })


        $("#graphPopover").html(str)
        $("#graphPopover").css("display", "block");
        $("#graphPopover").css("position", "absolute")
        /*    $("#graphPopover").css("left", point.x + sinequaResultVis.graphDivPosition.x)
            $("#graphPopover").css("top", point.y + sinequaResultVis.graphDivPosition.y)*/

    }

    self.onEdgeBlur = function () {
        $("#graphPopover").css("display", "none");
    }


    return self;

})
()
