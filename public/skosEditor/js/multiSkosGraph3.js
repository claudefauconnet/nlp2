var multiSkosGraph3 = (function () {
    var self = {};

    var maxEdges = 200;
    self.multisearchTimeout = 500;
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
        //  sources.forEach(function (source) {
        async.eachSeries(sources, function (source, callbackEach) {

            if (true && source.sparql_url != 'http://vps475829.ovh.net:8890/sparql') {
                callbackEach()
            }

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
                        // setTimeout(function () {
                        $("#conceptsJstreeDiv").jstree(true).create_node(source.name, newNode, "first", function () {
                            $("#conceptsJstreeDiv").jstree(true)._open_to(newNode.id);


                        }, false);

                        //  }, 1000)
                    }

                })
                if (source.sparql_url == 'http://vps475829.ovh.net:8890/sparql') {
                    callbackEach()
                }


            })


        }, function (err) {
            if (err)
                return $("#messageDiv").html(err)
            $("#messageDiv").html("done")
        })
        return;


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

    self.displayGraph = function (direction) {
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
                concept.color = "ddd"
                if (sparql_abstract.rdfsMap[concept.source])
                    concept.color = sparql_abstract.rdfsMap[concept.source].color;

                if (direction == "ancestors") {
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
                } else if (direction == "children") {

                    self.drawSourceRootNode(self.context.currentWord, concept);
                    sparql_abstract.getChildren(concept.source, concept.id, {}, function (err, result) {
                        if (err)
                            return console.log(err);
                        self.addChildrenNodesToGraph(concept, result)
                    })
                }


            })
                , self.multisearchTimeout
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
            onclickFn: multiSkosGraph3.onNodeClick,
            //  onHoverNodeFn: multiSkosGraph3.onNodeClick,
            afterDrawing: function () {
                $("#waitImg").css("display", "none")
            }
        })


    }

    self.drawSourceRootNode = function (rootNode, sourceRootNode) {

        var nodes = [{
            label: sourceRootNode.title,
            id: sourceRootNode.id,
            color: sourceRootNode.color,
            data: {source: sourceRootNode.source, thesaurus: sourceRootNode.source, ancestors: ""},
            shape: "dot",
            size: 10
        }];


        var edges = [{
            from: self.rootNode.id,
            to: sourceRootNode.id,
            id: self.rootNode.id + "_" + sourceRootNode.id,
            type: "match",
            // arrows: "to",
            color: sourceRootNode.color,
            width: 6,
            label: sourceRootNode.source,
            font: {
                color: sourceRootNode.color,
                weight: "bold",
                size: 12
            }
        }]
        visjsGraph.data.nodes.add(nodes);
        visjsGraph.data.edges.add(edges);

    }


    self.onNodeClick = function (obj, point) {
        if (obj) {
            self.graphActions.currentNode = obj;

            self.graphActions.showPopup(point)
        }

    }
    self.onAllConceptsCbxChange=function(){
        var checked=$("#allConceptsCbx").prop("checked")
       if(checked){
           $("#conceptsJstreeDiv").jstree(true).check_all ()
       }else{
           $("#conceptsJstreeDiv").jstree(true).uncheck_all ()
       }
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
        showDetails: function (defaultLang) {

            self.graphActions.hidePopup();


            var defaultProps = ["UUID", "http://www.w3.org/2004/02/skos/core#prefLabel",
                "http://www.w3.org/2004/02/skos/core#definition", "" +
                "http://www.w3.org/2004/02/skos/core#altLabel",
                "http://www.w3.org/2004/02/skos/core#broader",
                "http://www.w3.org/2004/02/skos/core#narrower",
                "http://www.w3.org/2004/02/skos/core#related",
                "http://www.w3.org/2004/02/skos/core#exactMatch",
                "http://www.w3.org/2004/02/skos/core#closeMatch",
                //  "http://www.w3.org/2004/02/skos/core#sameAs"
            ];

            if (!defaultLang)
                defaultLang = 'en';
            sparql_abstract.getDetails(self.graphActions.currentNode.data.source, self.graphActions.currentNode.id, {}, function (err, details) {
                for (var key in details.properties) {
                    if (defaultProps.indexOf(key) < 0)
                        defaultProps.push(key)
                }
                var str = "<table >"
                str += "<tr><td>UUID</td><td><a target='_blank' href='"+details.id+"'>"+details.id+"</a></td></tr>"

                defaultProps.forEach(function (key) {
                    if (!details.properties[key])
                        return;

                    str += "<tr >"


                    if (details.properties[key].value) {
                        var value=details.properties[key].value;
                        if(value.indexOf("http")==0)
                            value="<a target='_blank' href='"+value+"'>"+value+"</a>"
                        str += "<td class='detailsCell'>" + details.properties[key].name + "</td>"
                        str += "<td class='detailsCell'>" + value + "</td>"

                    } else {
                        var keyName = details.properties[key].name
                        var selectId = "detailsLangSelect_" + keyName
                        var propNameSelect = "<select id='" + selectId + "' onchange=multiSkosGraph3.graphActions.onDetailsLangChange('" + keyName + "') >"
                        var langDivs = "";

                        for (var lang in details.properties[key].langValues) {
                            var value = details.properties[key].langValues[lang];

                            if(value.indexOf("http")==0)
                                value="<a target='_blank' href='"+value+"'>"+value+"</a>"
                            var selected = "";
                            if (lang == defaultLang)
                                selected = "selected";
                            propNameSelect += "<option " + selected + ">" + lang + "</option> ";


                            langDivs += "<div class='detailsLangDiv_"+keyName+"' id='detailsLangDiv_" + keyName + "_" + lang + "'>" + value + "</div>"
                        }
                        propNameSelect += "</select>"

                        str += "<td class='detailsCell'>" + details.properties[key].name + " " + propNameSelect + "</td>"
                        str += "<td class='detailsCell'>" + langDivs + "</td>";
                        if(details.properties[key].langValues[defaultLang])
                        str += "<script>multiSkosGraph3.graphActions.onDetailsLangChange('" + keyName + "','" + defaultLang + "') </script>";

                    }
                    str += "</tr>"
                })
                str += "</table>"


                $("#detailsDiv").html(str)
                $("#detailsDiv").dialog("open");


            })

        },
        onDetailsLangChange: function (property, lang) {
           $('.detailsLangDiv_'+property).css('display', 'none')
            if (!lang)
                lang = $("#detailsLangSelect_" + property).val();
            if( $("#detailsLangDiv_" + property + "_" + lang).html())
            $("#detailsLangDiv_" + property + "_" + lang).css("display", "block");

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
        var color = "#dda";
        if (sparql_abstract.rdfsMap[node.source])
            color = sparql_abstract.rdfsMap[node.source].color;
        if (node.color)
            color = node.color;
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
                        color: color,
                        width: 6,
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
                    /*  var color = "#dda"
                      if (sparql_abstract.rdfsMap[node.source])
                          color = sparql_abstract.rdfsMap[node.source].color;*/
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

    self.fadeDialog = function () {
        $("#dialogDiv").css("opacity", 0.5);
        $("#dialogDiv").css("left", 0);
        $("#dialogDiv").css("top", 0);
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
        html += " <li><input type='checkbox' checked='checked' onchange='multiSkosGraph3.switchThesCbxs($(this))' class='thesCBXall' id='thes_all" + "'>"
        for (var key in thesaurusList) {
            //    console.log(thesaurusList);
            var color = thesaurusList[key]

            html += "<li><input type='checkbox' checked='checked' class='thesCBX' id='thes_" + key + "'><span style='color:" + color + "'>" + key + "</span></li>"

        }
        html += "</ul>"
        $("#thesaurusListDiv").html(html);
        $(".thesCBX").bind('change', multiSkosGraph3.onThesCBXChange);
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
                    onclickFn: multiSkosGraph3.onNodeClick,
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


