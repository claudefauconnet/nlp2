var multiSkosGraph2 = (function () {
    var self = {};

    var maxEdges = 200
    self.distinctThesaurus = {};
    self.context = {}
    var palette = [
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
    ]

    var colorsMap = {}


    self.setTheaurusList = function (thesaurusList) {
        var html = "<ul>"
        html += " <li><input type='checkbox' checked='checked' onchange='multiSkosGraph2.switchThesCbxs($(this))' class='thesCBXall' id='thes_all" + "'>"
        for (var key in thesaurusList) {
            //    console.log(thesaurusList);
            var color = thesaurusList[key]

            html += "<li><input type='checkbox' checked='checked' class='thesCBX' id='thes_" + key + "'><span style='color:" + color + "'>" + key + "</span></li>"

        }
        html += "</ul>"
        $("#thesaurusListDiv").html(html);
        $(".thesCBX").bind('change', multiSkosGraph2.onThesCBXChange);
    }


    self.drawConceptGraph = function (word, options) {

        self.context.currentWord = word
        if (!options)
            options = {};
        $("#waitImg").css("display", "block");
        $("#rigthDivWikidataSelect").html("")
        $("#rigthDivDetails").html("")
        $("#definitionsDiv").html("")
        var uniqueMatchingConcepts = {}
        var exactMatch = $("#exactMatchCBX").prop("checked")
        var rootNodeColor = "#dda";
        var rootNodeSize = 20
        $("#graphDiv").width($(window).width() - 600)

        var thesaurusMatching = []
        var visjsData = {nodes: [], edges: []}
        var uniqueNodes = []
        var uniqueEdges = [];
        var edgesCount = 0;
        var thesaurusNodeIds = [];


        self.rootNode = {
            label: word,
            id: word,
            color: rootNodeColor,
            size: rootNodeSize
        }
        visjsData.nodes.push(self.rootNode);


        var paths = [];
        async.series([


            // rootNode
            function (callbackSeries) {

                callbackSeries()
            },


            function (callbackSeries) {
                if (!$("#queryElasticCbx").prop("checked"))
                    return callbackSeries();
                self.queryElastic(word, options, function (err, result) {
                    if (err)
                        return console.log(err);
                    var hits = result.hits.hits;
                    hits.forEach(function (hit) {
                        paths.push(hit._source)
                    })
                    callbackSeries()

                })
            },
            function (callbackSeries) {


                paths.forEach(function (path) {

                    var thesaurus = path.thesaurus.replace(/\s/g, "_");

                    var color = self.distinctThesaurus[thesaurus];

                    if (!options.keepMatchingConcepts) {
                        var str3 = path.prefLabels.toLocaleLowerCase()
                        if (!uniqueMatchingConcepts[str3])
                            uniqueMatchingConcepts[str3] = ""
                        uniqueMatchingConcepts[str3] += thesaurus.substring(0, 5) + ","
                    }


                    if (exactMatch) {
                        var histWords = path.prefLabels.replace(/\*/g, "").toLowerCase().split(",")
                        if (histWords.indexOf(word.replace(/\*/g, "").toLowerCase()) < 0)
                            return;

                    }


                    var thesaurusNodeId = "TH_" + thesaurus
                    var theaurusNodeEdge = false;
                    if (false && thesaurusNodeIds.indexOf(thesaurusNodeId) < 0) {
                        thesaurusNodeIds.push(thesaurusNodeId);
                        var thesaurusNode = {
                            label: thesaurus,
                            id: thesaurusNodeId,
                            color: color,
                            size: 30,
                            shape: "star"
                        }
                        visjsData.nodes.push(thesaurusNode);

                    }

                    var newVisjsData = self.pathsToVisjsData(path)

                    newVisjsData.nodes.forEach(function (node) {
                        visjsData.nodes.push(node)
                    })
                    newVisjsData.edges.forEach(function (edge) {
                        visjsData.edges.push(edge)
                    })

                })


                callbackSeries()
            },
            // query Sparql bnf
            function (callbackSeries) {
                if (true || !$("#queryBNFcbx").prop("checked"))
                    return callbackSeries();

                sparql.queryBNF(word, {exactMatch: exactMatch}, function (err, result) {
                    if (err) {
                        console.log(err);
                        callbackSeries()
                    }
                    paths = paths.concat(result)
                    callbackSeries()
                })

            },

            function (callbackSeries) {


                var edgesCount = visjsData.edges.length;
                if (edgesCount > maxEdges) {
                    return alert("too many edges :select a specific value")
                }

                visjsGraph.draw("graphDiv", visjsData, {
                    onclickFn: multiSkosGraph2.onNodeClick,
                    afterDrawing: function () {
                        $("#waitImg").css("display", "none")
                    }
                })

                if (!options.selectedThesaurus)
                    self.setTheaurusList(self.distinctThesaurus);


                if (!options.keepMatchingConcepts) {
                    var array = [];
                    var keys = Object.keys(uniqueMatchingConcepts);
                    keys.sort();
                    keys.forEach(function (key) {

                        array.push({text: key + " : " + uniqueMatchingConcepts[key], value: key})
                    })
                    //   $("#matchingConceptsSelect").val("");
                    $("#matchingConceptsSelect").prop("size", 10)
                    common.fillSelectOptions("matchingConceptsSelect", array, false, "text", "value")
                }


                $(".thesCBX").parent().css("background-color", "none")
                $(".thesCBX").parent().css("border", "none")
                thesaurusMatching.forEach(function (thesaurus) {
                    thesaurus = "thes_" + thesaurus
                    $("#" + thesaurus).parent().css("background-color", "#ddd")

                })
                callbackSeries()
            },
            function (callbackSeries) {
                if (!$("#queryWikidataCbx").prop("checked"))
                    return callbackSeries();

                sparql.queryWikidataList(word, function (err, result) {
                    if (err) {
                        console.log(err);
                        callbackSeries()
                    }
                    self.wikidataData = result;
                    var FrenchVikidiaID = null;
                    var wikidataLabels = [];
                    result.forEach(function (item, index) {
                        var parent = "";
                        if (item.others["subclass of"])
                            parent = "/" + item.others["subclass of"]
                        else if (item.others["instance of"])
                            parent = "/" + item.others["instance of"]
                        wikidataLabels.push({id: item.id, label: item.label + parent})
                        var labelOk = false;

                        for (var key in item.others) {
                            if (!FrenchVikidiaID)
                                if (key == "French Vikidia ID") {
                                    FrenchVikidiaID = item.others[key]
                                }
                        }
                        for (var key in item.linkedData) {
                            if (!FrenchVikidiaID)
                                if (key == "French Vikidia ID") {
                                    FrenchVikidiaID = item.others[key]
                                }
                        }
                        if (index == 0)
                            $("#definitionsDiv").append("<B>Wikidata</B> :" + item.description)

                    })
                    common.fillSelectOptions("rigthDivWikidataSelect", wikidataLabels, null, "label", "id")


                    if (wikidataLabels.length > 0) {
                        sparql.getWikidataAncestors(wikidataLabels[0], function (err, result) {
                            if (err)
                                return console.log(err);
                            var existingNodes = visjsGraph.data.nodes.getIds()
                            result.forEach(function (item) {
                                var newVisjsData = self.pathsToVisjsData(item)

                                newVisjsData.nodes.forEach(function (node) {
                                    if (existingNodes.indexOf(node.id < 0))
                                        visjsGraph.data.nodes.add(node)
                                })
                                newVisjsData.edges.forEach(function (edge) {
                                    visjsGraph.data.edges.add(edge)
                                })
                            })

                        })

                    }
                    if (FrenchVikidiaID) {
                        sparql.queryBNF_list(FrenchVikidiaID, function (err, result) {
                            var bnfLabels = []
                            result.forEach(function (item, index) {
                                bnfLabels.push({id: item.id.value, label: item.value.value})

                            })
                            common.fillSelectOptions("rigthDivBNFSelect", bnfLabels, null, "label", "id")

                            if (bnfLabels.length > 0)
                                sparql.queryBNF_ancestors(bnfLabels[0], {exectMatch: exactMatch}, function (err, result) {

                                    if (err)
                                        return console.log(err);
                                    var existingNodes = visjsGraph.data.nodes.getIds()
                                    result.forEach(function (item) {
                                        var newVisjsData = self.pathsToVisjsData(item)

                                        newVisjsData.nodes.forEach(function (node) {
                                            if (existingNodes.indexOf(node.id < 0))
                                                visjsGraph.data.nodes.add(node)
                                        })
                                        newVisjsData.edges.forEach(function (edge) {
                                            visjsGraph.data.edges.add(edge)
                                        })
                                    })

                                })
                        })

                    }
                })
                return callbackSeries();
            },
        ])


    }
    self.pathsToVisjsData = function (path) {
        var thesaurus = path.thesaurus
        var color = self.distinctThesaurus[thesaurus];
        var ancestorsStr = path.ancestors;
        var ancestorsStr = ancestorsStr.replace(/\|/g, "\n")

        var visjsData = {nodes: [], edges: []}
        var regex = /(_*)(.*);(.*)/g
        var array;
        var previouslLevel = 1;
        var uniqueNodesLevels = {}
        var uniqueNodes = []
        while ((array = regex.exec(ancestorsStr)) != null) {
            var level = array[1].length;
            var id = array[2];
            var name = array[3];


            if (uniqueNodes.indexOf(id) < 0) {
                uniqueNodes.push(id);
                if (!uniqueNodesLevels[level])
                    uniqueNodesLevels[level] = [];
                uniqueNodesLevels[level].push(id);


                if (level == 1) {
                    visjsData.edges.push({
                        from: self.rootNode.id,
                        to: id,
                        type: "match",
                        arrows: "to",
                        label: thesaurus,
                        font: {
                            color: color,
                            weight: "bold",
                            size: 12
                        }
                    })
                } else if (level == previouslLevel) {
                    var parent = uniqueNodesLevels[level - 1][uniqueNodesLevels[level - 1].length - 1]
                    visjsData.edges.push({
                        from: parent,
                        to: id,
                        type: "match",
                        arrows: "to",


                    });
                } else if (level > previouslLevel) {
                    visjsData.edges.push({
                        from: uniqueNodes[uniqueNodes.length - 2],
                        to: id,
                        type: "match",
                        arrows: "to",


                    });
                } else if (level < previouslLevel) {

                    var parent = uniqueNodesLevels[level - 1][uniqueNodesLevels[level - 1].length - 1]
                    visjsData.edges.push({
                        from: parent,
                        to: id,
                        type: "match",
                        arrows: "to",


                    });
                }

                if (level == 1) {
                    shape = "dot";
                    //   color = rootNodeColor;
                    size = 10;
                } else {
                    color = self.distinctThesaurus[thesaurus];
                    var shape = "box";
                    var size = 20;
                }


                var visjNode = {
                    label: name,
                    id: id,
                    color: color,
                    data: {thesaurus: thesaurus, ancestors: ancestorsStr},
                    shape: shape,
                    size: size,

                }

                visjsData.nodes.push(visjNode);

            }
            previouslLevel = level;


        }


        return visjsData;

    }


    self.onNodeClick = function (obj, point) {
        $(".thesCBX").parent().css("border-style", "none")
        $("#" + "thes_" + obj.data.thesaurus).parent().css("border", "2px blue solid")

        if (obj.data.thesaurus == "BNF") {
            self.showNodeInfosBNF(obj);
        } else if (obj.data.thesaurus == "Wikidata") {
            self.showNodeInfosWikidata(obj);
        } else {
            self.showNodeInfosElastic(obj);
        }
    }

    self.onThesCBXChange = function (ev) {

        var checked = $(this).prop("checked")
        self.filterGraphByThesaurus();

    }

    self.showNodeInfosElastic = function (node) {
        $("#infosDiv").html("")
        var str = node.id;
        var _node = node
        var p;
        if ((p = str.indexOf(".")) > -1)
            str = str.substring(p + 1)
        if ((p = str.indexOf("/")) > -1)
            str = str.substring(p + 1)
        if ((p = str.indexOf("#")) > -1)
            str = str.substring(p + 1)
        str = str.replace(/[-_]/g, " ")
        var queryString = "*" + str;


        self.queryElastic(queryString, {default_field: "ancestors"}, function (err, result) {
            if (err)
                return console.log(err);
            var hits = result.hits.hits;
            hits.sort(function (a, b) {
                if (a._source.prefLabels > b._source.prefLabels)
                    return 1
                if (b._source.prefLabels > a._source.prefLabels)
                    return -1
                return 0;
            })
            var childrenStr = "<ul>";
            var children = [];
            hits.forEach(function (hit) {
                var ancestorsStr = hit._source.ancestors;
                var ancestorsStr = ancestorsStr.replace(/\|/g, "\n")


                var regex = /(_*)(.*);(.*)/g
                var array;
                var previouslLevel = 1;
                var nodes = [];
                var selectNodeLevel = 1000;
                while ((array = regex.exec(ancestorsStr)) != null) {
                    var level = array[1].length;
                    var id = array[2];
                    var name = array[3];
                    nodes.push({id: id, name: name, level: level})
                    if (id == _node.id) {
                        selectNodeLevel = level;

                    }
                }
                nodes.forEach(function (node) {
                    if (node.level == (selectNodeLevel - 1)) {
                        childrenStr += "<li onclick='multiSkosGraph2.drawConceptGraph(\"" + node.name + "\")'>" + node.name + "</li>"
                    }
                })
            })


            /*   var id = hit._source.prefLabels.split(",")[0]
               if (id != "")
                   childrenStr += "<li onclick='multiSkosGraph2.drawConceptGraph(\"" + id + "\")'>" + hit._source.prefLabels + "</li>"*/


            childrenStr += "</ul>"

            var id2 = node.label.split(",")[0]
            str = "<div>"
            str += "<span class='title' onclick='multiSkosGraph2.drawConceptGraph(\"" + id2 + "\")'>" + node.label + "</span><br>";
            str += "<span class='id'>" + node.id + "</span>";
            str += "</div>"
            str += "<div  style='width:280px;max-height:450px;font-size:12px;overflow:auto'>"
            str += childrenStr;
            str += "</div>"

            $("#infosDiv").html(str)
        })
    }


    self.showNodeInfosBNF = function (obj) {
        sparql.queryBNFchildren(obj.id, function (err, result) {
            if (err)
                return console.log(err);

            var newNodes=[];
            var newEdges=[];
            var existingNodes=  visjsGraph.data.nodes.getIds()
            result.forEach(function(item){
                if(existingNodes.indexOf(item.narrowerId.value)<0) {
                    newNodes.push({
                        label: item.narrowerLabel.value,
                        id: item.narrowerId.value,
                        shape: "box"

                    })
                    newEdges.push({
                        from: obj.id,
                        to: item.narrowerId.value

                    })

                }
                })
                visjsGraph.data.nodes.add(newNodes)
                visjsGraph.data.edges.add(newEdges)

            })


    }

    self.showNodeInfosWikidata = function (obj) {

    }


    self.queryElastic = function (queryString, options, callback) {
        var default_field = "prefLabels";
        if (options.default_field)
            default_field = options.default_field
        var query = {

            "query": {
                "bool": {
                    "must": [
                        {
                            "query_string": {
                                "query": queryString,
                                "default_field": default_field,
                                "default_operator": "AND"
                            }
                        }
                    ]
                }
            },
            "from": 0,
            "size": 1000,
        }

        if (options.selectedThesaurus) {
            query.query.bool.must.push({terms: {thesaurus: options.selectedThesaurus}})
        }


        var strQuery = JSON.stringify(query, null, 2);
        console.log(strQuery)
        var payload = {
            executeQuery: strQuery,
            indexes: JSON.stringify(["flat_thesaurus2"])

        }
        $.ajax({
            type: "POST",
            url: "/elastic",
            data: payload,
            dataType: "json",
            success: function (data, textStatus, jqXHR) {
                var xx = data;
                callback(null, data)

            }
            , error: function (err) {
                $("#waitImg").css("display", "none");
                console.log(err.responseText)
                if (callback) {
                    return callback(err)
                }
                return (err);
            }

        });


    }

    self.switchThesCbxs = function (cbx) {
        var checked = ($(cbx).prop('checked'));
        $(".thesCBX").each(function () {
            $(this).prop("checked", checked)
        })
        self.filterGraphByThesaurus();
    }
    self.filterGraphByThesaurus = function () {
        var selectedThesaurus = [];
        $(".thesCBX").each(function () {

            if ($(this).prop("checked")) {
                selectedThesaurus.push($(this).attr("id").substring(5))
            }

        })

        var nodesToHide = []
        self.drawConceptGraph(self.context.currentWord, {selectedThesaurus: selectedThesaurus});

        /*  var nodes = visjsGraph.data.nodes.get()
           nodes.forEach(function (node) {

               if (node.data && selectedThesaurus.indexOf("thes_" + node.data.thesaurus) < 0) {
                   node.hidden = true;
               } else {
                   node.hidden = false;
               }
           })
           visjsGraph.network.stopSimulation();
           visjsGraph.simulationOn = false;
           visjsGraph.data.nodes.update(nodes)*/


    }
    self.zoomOnSelectedMatchingConcept = function () {
        var value = $("#matchingConceptsSelect").val();
        self.drawConceptGraph(value, {keepMatchingConcepts: true});
    }

    self.loadThesaurusList = function (callback) {

        var query = {
            "aggs": {
                "thesaurus": {
                    "terms": {
                        "field": "thesaurus"
                    }
                }
            }
            , "size": 0
        }
        var payload = {
            executeQuery: JSON.stringify(query),
            indexes: JSON.stringify(["flat_thesaurus2"])

        }

        $.ajax({
            type: "POST",
            url: "/elastic",
            data: payload,
            dataType: "json",

            success: function (data, textStatus, jqXHR) {
                var items = data.aggregations.thesaurus.buckets;
                items.forEach(function (item) {
                    self.distinctThesaurus[item.key] = palette[Object.keys(self.distinctThesaurus).length]
                })

                self.distinctThesaurus["BNF"] = palette[Object.keys(self.distinctThesaurus).length]
                self.distinctThesaurus["Wikidata"] = palette[Object.keys(self.distinctThesaurus).length]


            }
            , error: function (err) {
                $("#waitImg").css("display", "none");
                console.log(err.responseText)
                if (callback) {
                    return callback(err)
                }
                return (err);
            }

        });
    }

    self.showWikiDataDetails = function (id) {
        var strAll = ""
        self.wikidataData.forEach(function (item) {
            if (item.id == id) {


                sparql.getWikidataAncestors(item, function (err, result) {
                    if (err)
                        return console.log(err);

                    //   var existingNodes= visjsGraph.data.nodes.getIds()
                    function removeThesaurusNodes(thesaurus) {
                        var allNodes = visjsGraph.data.nodes.get();
                        var thesaurusNodes = [];
                        allNodes.forEach(function (item) {
                            if (item.data && item.data.thesaurus == thesaurus)
                                thesaurusNodes.push(item.id)

                        });
                        visjsGraph.data.nodes.remove(thesaurusNodes)

                    }

                    removeThesaurusNodes("Wikidata")


                    result.forEach(function (item) {
                        var newVisjsData = self.pathsToVisjsData(item)

                        newVisjsData.nodes.forEach(function (node) {
                            visjsGraph.data.nodes.add(node)
                        })
                        newVisjsData.edges.forEach(function (edge) {
                            visjsGraph.data.edges.add(edge)
                        })
                    })

                })

                for (var key in item) {
                    var str = ""
                    if (typeof item[key] != "object")
                        continue
                    for (var key2 in item[key]) {

                        if (key2.indexOf('image') > -1) {
                            str += "<img src='" + item[key][key2] + "' width='200px'/></br>"
                        } else {
                            str += "<span style='font-style: italic'>" + key2 + " : </span>" + "<span style='font-weight: bold'>" + item[key][key2] + "</span><br>";
                        }
                    }
                    strAll += str
                    strAll += "<hr>"
                }

            }
        })
        $("#rigthDivDetails").html(strAll)

    }

    return self;

})
()


