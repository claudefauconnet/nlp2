var multiSkosGraph2 = (function () {
    var self = {};

    var maxEdges = 200
    self.distinctThesaurus = {};
    self.context = {currentSelectdNode: null};

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

    var palette = [


        '#fe6666',
        '#f49e19',// '#fdfe67',
        '#6cff66',
        '#6678fe',
        '#fe66f9',

        '#f49e19',
        '#fbdf6b',
        '#909dc1',
        '#a5cca5',
        '#7da6d4',


        '#aba4d9',
        '#c7c7c7',
        '#858585',
        '#a68f81',
        '#e0d6b8',
        '#f9e1e0',
        '#feadb9',
        '#bc85a3',
        '#9799ba',
        '#5c85a3',
        '#b8dae0',
        '#f2b2b0',
        '#f8a09f',
        '#3d956b',
        '#985624',

    ]

    var colorsMap = {}

    var conceptsMap = {};


    var sources = [];

    self.initRdfResources = function () {
        if (sources.length > 0)
            return;
        for (var key in sparql_abstract.rdfsMap) {
            var source = sparql_abstract.rdfsMap[key]
            source.name = key;
            source.color = palette[Object.keys(sources).length]
            sources.push(source)
        }


    }


    self.searchConcepts = function (word) {

        self.initRdfResources()
        self.context.currentWord = word
        conceptsMap = {}


        var exactMatch = $("#exactMatchCBX").prop("checked")

        var bindings = {}
        var sourceNodes = [];

        sources.forEach(function (source) {
            sourceNodes.push({id: source.name, text: "<span class='tree_level_1' style='background-color: " + source.color + "'>" + source.name + "</span>", chldren: [], parent: "#"})


        })
        if ($('#conceptsJstreeDiv').jstree)
            $('#conceptsJstreeDiv').jstree("destroy")
        $("#conceptsJstreeDiv").jstree({

            "checkbox": {
                "keep_selected_style": false
            },
            "plugins": ["checkbox"],
            "core": {
                'check_callback': true,
                'data': sourceNodes
            }


        });

        var selectedIds = [];
        sources.forEach(function (source) {
            sparql_abstract.list(source.name, word, {exactMatch: exactMatch}, function (err, result) {

                if (err) {
                    return console.log(err);
                }

                result.forEach(function (item) {
                    if (!conceptsMap[item.id]) {
                        if (result.length == 1)
                            selectedIds.push(item.id)
                        conceptsMap[item.id] = item;
                        item.source = source.name;
                        item.title = item.label + " / " + (item.description || "")

                        var newNode = {id: item.id, text: "<span class='tree_level_2'>" + item.title + "</span>", data: item}
                        setTimeout(function () {
                            $("#conceptsJstreeDiv").jstree(true).create_node(source.name, newNode, "first", function () {
                                $("#conceptsJstreeDiv").jstree(true)._open_to(newNode.id);


                            }, false);
                        }, 1000)
                    }

                })


            })


        })
        setTimeout(function () {

            $("#conceptsJstreeDiv").jstree(true).select_node(selectedIds);

        }, 3000)


    }

    self.searchConceptsContainWord = function () {
        var selectedConcepts = []
        var xx = $("#conceptsJstreeDiv").jstree(true).get_checked(null, true)
        xx.forEach(function (nodeId) {
            if (conceptsMap[nodeId])
                selectedConcepts.push(conceptsMap[nodeId]);
        });
        $("#conceptsJstreeDiv").jstree(true).uncheck_all()
        var xx = selectedConcepts;
        selectedConcepts.forEach(function (concept) {
            sparql_abstract.list(concept.source, self.context.currentWord, {exactMatch: false, selectedThesaurus: concept.thesaurus}, function (err, result) {

                if (err) {
                    return console.log(err);
                }
                result.forEach(function (item) {
                    if (!conceptsMap[item.id]) {
                        conceptsMap[item.id] = item;
                        item.source = concept.source;
                        item.title = item.label + " / " + item.description
                        if (concept.source == "private") {
                            item.title = item.thesaurus + " : " + item.title
                        }
                        var newNode = {id: item.id, text: item.title, data: item}
                        setTimeout(function () {
                            $("#conceptsJstreeDiv").jstree(true).create_node(concept.id, newNode, "first", function () {
                                $("#conceptsJstreeDiv").jstree(true)._open_to(newNode.id);

                            }, false);
                        }, 1000)
                    }

                })

            })


        })


    }

    self.displayGraph = function () {
      $('#dialogDiv').dialog('close')
      //  self.fadeDialog();
        var selectedConcepts = []
        var xx = $("#conceptsJstreeDiv").jstree(true).get_checked(null, true)
        xx.forEach(function (nodeId) {
            if (conceptsMap[nodeId])
                selectedConcepts.push(conceptsMap[nodeId]);
        });
        var xx = selectedConcepts;


        self.drawRootNode(self.context.currentWord)
        setTimeout(function () {
            selectedConcepts.forEach(function (concept) {

                sparql_abstract.getAncestors(concept.source, concept.id, {exactMatch: true}, function (err, result) {
                    if (err)
                        return console.log(err)
                    if (!result || !result.forEach)
                        return;
                    result.forEach(function (binding) {
                        binding.source = concept.source;
                        if (!binding.thesaurus)
                            binding.thesaurus = concept.source;

                        var visjsData = self.pathsToVisjsData(binding)

                        self.addVisJsDataToGraph(visjsData)

                    })
                })


            })
                , 1000
        })


    }

    self.drawRootNode = function (word) {
        var rootNodeColor = "#dda";
        var rootNodeSize = 20
        $("#graphDiv").width($(window).width() - 20)
        self.rootNode = {
            label: word,
            id: word,
            color: rootNodeColor,
            size: rootNodeSize
        }
        var visjsData = {nodes: [], edges: []}
        visjsData.nodes.push(self.rootNode);
        visjsGraph.draw("graphDiv", visjsData, {
            onclickFn: multiSkosGraph2.onNodeClick,
            onHoverNodeFn: multiSkosGraph2.onNodeClick,
            afterDrawing: function () {
                $("#waitImg").css("display", "none")
            }
        })


    }


    self.onNodeClick = function (obj, point) {

        self.graphActions.currentNode = obj;
        self.graphActions.showPopup(point)


    }


    self.graphActions = {

        showPopup: function (point) {
            $("#graphPopupDiv").css("left", point.x)
            $("#graphPopupDiv").css("top", point.y)
            $("#graphPopupDiv").css("display", "flex")
        },
        hidePopup: function () {
            $("#graphPopupDiv").css("display", "none")
        },


        drawChildren: function () {
            self.graphActions.hidePopup();
            sparql_abstract.getChildren(self.graphActions.currentNode.data.source, self.graphActions.currentNode.id, {}, function (err, children) {
                if (err)
                    return console.log(err);
                self.addChildrenNodesToGraph(self.graphActions.currentNode, children)
            })
        }
        ,
        showDetails: function () {
            self.graphActions.hidePopup();

            sparql_abstract.getDetails(self.graphActions.currentNode.data.source, self.graphActions.currentNode.id, {}, function (err, details) {
                var str = ""
                for (var key in details.properties) {
                    if (key == "P268")
                        self.context.currentBNFid = details.properties[key].value
                    if (key == "P244")
                        self.context.currentLOCid = details.properties[key].value

                    if (key.indexOf('image') > -1) {
                        str += "<img src='" + details.properties[key].value + "' width='200px'/></br>"
                    } else {
//var link="<a target='_blank' href='"+result.properties[key].id+"'>"
                        str += "<span style='font-style: italic'>" + details.properties[key].name + " : </span>" + "<span style='font-weight: bold'>" + details.properties[key].value + "</span><br>";
                    }
                }

                $("#detailsDiv").html(str)
                $("#detailsDiv").dialog("open");


            })

        }
        ,
        setAsRootNode: function () {
            self.graphActions.hidePopup();
            var word = self.graphActions.currentNode.label
            $('#searchWordInput').val(word)
            $('#dialogDiv').dialog('open')
            self.searchConcepts(word);


        }


    }

    self.pathsToVisjsData = function (node) {
        var thesaurus = node.thesaurus
        var source = node.source
        var color = sparql_abstract.rdfsMap[node.source].color;
        var ancestorsStr = node.ancestors;
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
                        id: self.rootNode.id + "_" + id,
                        type: "match",
                       // arrows: "to",
                        color:color,
                        width:6,
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
                        id: parent + "_" + id


                    });
                } else if (level > previouslLevel) {
                    var from = uniqueNodes[uniqueNodes.length - 2];
                    visjsData.edges.push({
                        from: from,
                        to: id,
                        type: "match",
                        arrows: "to",
                        id: from + "_" + id


                    });
                } else if (level < previouslLevel) {

                    var parent = uniqueNodesLevels[level - 1][uniqueNodesLevels[level - 1].length - 1]
                    visjsData.edges.push({
                        from: parent,
                        to: id,
                        type: "match",
                        arrows: "to",
                        id: parent + "_" + id

                    });
                }

                if (level == 1) {
                    shape = "dot";
                    //   color = rootNodeColor;
                    size = 10;
                } else {
                    color = sparql_abstract.rdfsMap[node.source].color;
                    var shape = "box";
                    var size = 20;
                }


                var visjNode = {
                    label: name,
                    id: id,
                    color: color,
                    data: {source: source, thesaurus: thesaurus, ancestors: ancestorsStr},
                    shape: shape,
                    size: size,

                }

                visjsData.nodes.push(visjNode);

            }
            previouslLevel = level;


        }


        return visjsData;

    }
    self.addChildrenNodesToGraph = function (parent, children) {

        if (self.context.selectedNode && self.context.selectedNode.id == parent.id) {//bascule
            visjsGraph.data.nodes.remove(self.newNodes)
            visjsGraph.data.edges.remove(self.newEdges)
            self.context.selectedNode.id = null;

        } else {


            self.context.newNodes = [];
            self.context.newEdges = [];
            var existingNodes = visjsGraph.data.nodes.getIds();
            var existingEdges = visjsGraph.data.edges.getIds();

            var color = parent.color;
            children.forEach(function (item) {
                var size = 12;
                var shape = "triangle";
                if (item.countNarrowers2 < 1) {
                    var shape = "dot";
                    size = 6
                }
                var data = {
                    source: item.data.source.name,
                    parent: parent.id
                }
                if (existingNodes.indexOf(item.narrowerId) < 0) {
                    self.context.newNodes.push({
                        label: item.narrowerLabel,
                        id: item.narrowerId,
                        shape: shape,
                        data: data,
                        color: color,
                        size: size
                    })
                    if (existingEdges.indexOf(parent.id + "_" + item.narrowerId) < 0) {
                        self.context.newEdges.push({
                            from: parent.id,
                            to: item.narrowerId,
                            id: parent.id + "_" + item.narrowerId,
                            dashes: [5, 5]

                        })
                    }
                }
            })
            visjsGraph.data.nodes.add(self.context.newNodes)
            visjsGraph.data.edges.add(self.context.newEdges)
            self.context.selectedNode = parent;



        }

    }

    self.fadeDialog=function(){
        $("#dialogDiv").css("opacity",0.5);
        $("#dialogDiv").css("left",0);
        $("#dialogDiv").css("top",0);
    }

    /*-------------------------------------------------------------------------------------------*/
    /*-------------------------------------------------------------------------------------------*/
    /*-------------------------------------------------------------------------------------------*/
    /*-------------------------------------------------------------------------------------------*/
    /*-------------------------------------------------------------------------------------------*/
    /*-------------------------------------------------------------------------------------------*/
    /*-------------------------------------------------------------------------------------------*/

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
        $("#conceptsWikidata_Select").html("")
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
                if (false && !$("#queryElasticCbx").prop("checked"))
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


// draw graph with ElasticData
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


            //get Wikidata and BNF -> show first items
            function (callbackSeries) {
                if (!$("#queryWikidataCbx").prop("checked"))
                    return callbackSeries();
                sparql_abstract.list("Wikidata", word, {}, function (err, bindings) {
                    if (err) {
                        console.log(err);
                        callbackSeries()
                    }

                    var index = 0;
                    async.eachSeries(bindings, function (item, callbackEach) {
                            sparql_abstract.getDetails("Wikidata", item.id, {}, function (err, details) {
                                bindings[index].FrenchVikidiaID = details.properties["P7818"]
                                bindings[index].parent = details.properties["P31"] || details.properties["P279"];
                                index++;
                                callbackEach()

                            })
                        }
                        ,

                        function (err) {
                            var wikiDatList = [];
                            bindings.forEach(function (item, index) {
                                var parent = "/";
                                wikiDatList.push({id: item.id, label: item.label + " / " + item.parent.value})
                            })
                            common.fillSelectOptions("conceptsWikidata_Select", wikiDatList, null, "label", "id")
                        })


                })
                return callbackSeries();
            },
        ])


    }


    self.showBNFgraph = function (item) {
        sparql_abstract.getAncestors("BNF", item.id, {exectMatch: exactMatch}, function (err, result) {

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

    self.onThesCBXChange = function (ev) {

        var checked = $(this).prop("checked")
        self.filterGraphByThesaurus();

    }

    self.showNodeInfosElastic = function (node) {
        $("#infosDiv").html("")

    }


    self.showNodeChildren = function (obj) {
        sparql_abstract.getChildren(obj.data.source, obj.id, {}, function (err, children) {
            if (err)
                return console.log(err);
            self.addChildrenNodesToGraph(obj, children)

        })
    }


    self.addVisJsDataToGraph = function (newVisjsData) {

        var existingNodes = visjsGraph.data.nodes.getIds();
        var existingEdges = visjsGraph.data.edges.getIds();
        newVisjsData.nodes.forEach(function (node) {
            if (existingNodes.indexOf(node.id) < 0) {
                visjsGraph.data.nodes.add(node)
            }
        })
        newVisjsData.edges.forEach(function (edge) {
            if (existingEdges.indexOf(edge.from + "_" + edge.to) < 0) {
                visjsGraph.data.edges.add(edge)
            }
        })


    }


    self.showNodeInfosWikidata = function (obj) {

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

    self.removeThesaurusNodes = function (thesaurus) {
        var allNodes = visjsGraph.data.nodes.get();
        var thesaurusNodes = [];
        allNodes.forEach(function (item) {
            if (item.data && item.data.thesaurus == thesaurus)
                thesaurusNodes.push(item.id)

        });
        visjsGraph.data.nodes.remove(thesaurusNodes)

    }

    self.showWikiDataDetailsAndAncestors = function (id) {
        var BNFid = null;
        var LOCid = null;
        async.series([
            //draw ancestors
            function (callbackSeries) {
                sparql_abstract.getAncestors("Wikidata", id, {}, function (err, result) {
                    if (err)
                        return callbackSeries(err);

                    self.removeThesaurusNodes("Wikidata")
                    result.forEach(function (item) {
                        var newVisjsData = self.pathsToVisjsData(item);
                        self.addVisJsDataToGraph(newVisjsData);

                    })
                })

                return callbackSeries()
            },
            //showDetails
            function (callbackSeries) {
                sparql_abstract.getDetails("Wikidata", id, {}, function (err, result) {
                    var str = ""
                    for (var key in result.properties) {
                        if (key == "P268")
                            BNFid = result.properties[key].value
                        if (key == "P244")
                            LOCid = result.properties[key].value

                        if (key.indexOf('image') > -1) {
                            str += "<img src='" + result.properties[key].value + "' width='200px'/></br>"
                        } else {
//var link="<a target='_blank' href='"+result.properties[key].id+"'>"
                            str += "<span style='font-style: italic'>" + result.properties[key].name + " : </span>" + "<span style='font-weight: bold'>" + result.properties[key].value + "</span><br>";
                        }
                    }

                    $("#detailsDiv").html(str)
                    return callbackSeries()
                })

            },

            //show BNF ancestors
            function (callbackSeries) {
                if (!BNFid)
                    return callbackSeries()

                sparql_abstract.getAncestors("BNF", "http://data.bnf.fr/ark:/12148/cb" + BNFid, {}, function (err, bindings) {
                    if (err)
                        return callbackSeries();
                    self.removeThesaurusNodes("BNF")
                    bindings.forEach(function (item) {
                        var newVisjsData = self.pathsToVisjsData(item)
                        self.addVisJsDataToGraph(newVisjsData);


                    })


                    return callbackSeries()
                })


            }
            ,
            //show LOC ancestors
            function (callbackSeries) {
                if (!LOCid)
                    return callbackSeries()

                sparql_abstract.getAncestors("LOC", LOCid, {}, function (err, bindings) {
                    if (err)
                        return callbackSeries();


                    self.removeThesaurusNodes("LOC")
                    bindings.forEach(function (item) {
                        var newVisjsData = self.pathsToVisjsData(item)

                        newVisjsData.nodes.forEach(function (node) {
                            visjsGraph.data.nodes.add(node)
                        })
                        newVisjsData.edges.forEach(function (edge) {
                            visjsGraph.data.edges.add(edge)
                        })
                    })


                    return callbackSeries()
                })


            }


        ], function (err) {
            if (err)
                return console.log(err);
        })

    }

    return self;

})
()


