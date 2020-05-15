var Selection = (function () {

    var self = {};

    var uniqueNodes = [];
    self.sliceZize = 500;


    self.displayParagraphsGraph = function (booleanQuery, corpusIds, conceptIds) {
        //  var conceptLevelAggr = parseInt($("#conceptAggrLevelSlider").slider("option", "value"));
        var conceptLevelAggr = 0;
        var corpusLevelAggr = $("#corpusAggrLevelSelect").val();
      /*  if (conceptLevelAggr == "0")
            conceptLevelAggr = "1";*/


        options = {
            conceptLevelAggr: conceptLevelAggr,
            corpusLevelAggr: corpusLevelAggr
        }
        if (booleanQuery) {
            options.booleanQuery = booleanQuery;
        }

        //   var resourcesShowParentResources = $("#resourcesShowParentResourcesSelect").val();
        var selectedConcepts = []
        //  var conceptAncestorsMap = {}
        //  var corpusAncestorsMap = {}
        var conceptsSets = {}
        var allResource = [];
        var allConceptsInfosMap = {};
        var idCorpus = null;
        var ConceptsDepth = 0;
        var maxConceptsTreeDepth = 6
        async.series([


                //getDescendants
                function (callbackSeries) {
                    //    return callbackSeries();
                    if (conceptIds) {
                        conceptsSets = conceptIds;
                        return callbackSeries();
                    }
                    Concepts.getConceptDescendants({depth: conceptLevelAggr}, function (err, concepts) {
                        if (err)
                            return callbackSeries(err);
                        conceptsSets = concepts;


                        callbackSeries();
                    })

                },
                //getselectedResource
                function (callbackSeries) {
                    if (corpusIds)
                        idCorpus = corpusIds;
                    else
                        idCorpus = Corpus.getSelectedResource();
                    callbackSeries();
                },
                //getParagraphs
                function (callbackSeries) {
                    options.conceptsSets = true;
                    common.message("Searching resources ... ")
                    paragraphs.sparql_getEntitiesParagraphs(idCorpus, conceptsSets, options, function (err, result) {
                        //  paragraphs.sparql_getEntitiesParagraphs(idCorpus, selectedConcepts,  ConceptsDepth, options, function (err, result) {
                        if (err)
                            return callbackSeries(err);

                        if (result.length == 0)
                            return callbackSeries("No results")


                        allResource = result;
                        if (result.length >= paragraphs.sparql_limit) {
                            if (confirm("result length > Maximum limit for queries (" + paragraphs.sparql_limit + "). Show partialGraph ?"))
                                return callbackSeries();
                            else
                                return callbackSeries("STOP");
                        }
                        callbackSeries();
                    })

                },

                //getAncestors
                function (callbackSeries) {
                    if (allResource.length == 0)
                        return callbackSeries();
                    var conceptsIds = [];
                    allResource.forEach(function (item) {
                        if (item.entity0 && conceptsIds.indexOf(item.entity0.value) < 0)
                            conceptsIds.push(item.entity0.value)
                    })
                    if (conceptsIds.length == 0)
                        return callbackSeries();

                    if (paragraphs.previousConceptsFilter)
                        conceptsIds = conceptsIds.concat(paragraphs.previousConceptsFilter)

                    Concepts.getConceptsInfos(conceptsIds, {}, function (err, result) {
                        if (err)
                            return callbackSeries(err);
                        /*   var topSelectedConcepts = [];
                           Concepts.currentConceptsSelection.forEach(function (item) {
                               topSelectedConcepts.push(item[0])
                           })*/
                        result.forEach(function (item) {
                            //  console.log(item.concept.value)
                            var obj = {id: item.concept.value, ancestors: [{id: item.concept.value, label: item.conceptLabel.value}]}
                            for (var i = 1; i < 7; i++) {
                                var broader = item["broaderId" + i];
                                if (typeof broader !== "undefined") {
                                    //   if (topSelectedConcepts.indexOf(broader.value) < 0)
                                    obj.ancestors.push({id: broader.value, label: item["broader" + i].value})
                                }
                            }
                            allConceptsInfosMap[obj.id] = obj;

                        })

                        return callbackSeries()

                    })

                },
                //getParagraphs
                function (callbackSeries) {
                    common.message("Drawing graph : " + allResource.length + "relations")
                    //  paragraphs.drawParagraphsEntitiesGraph(allResource, paragraphsInfos, {
                    self.currentSelection = {
                        resources: allResource,
                        conceptsInfos: allConceptsInfosMap,
                    }

                    paragraphs.drawParagraphsEntitiesGraphSimple(allResource, allConceptsInfosMap, options)
                    //paragraphs.drawParagraphsEntitiesGraphAggr(allResource, allConceptsInfosMap, options)
                    $(".projection-item").css("display", "block")
                    callbackSeries();

                }
                , function (callbackSeries) {
                    filterGraph.alterGraph.addConceptsToGraph(null, true, true);
                    callbackSeries();
                }


            ],

            function (err) {
                if (err)
                    return common.message(err)
            }
        )


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
        showResourceConcepts: function (resourceId, withOtherResourcesEdges) {
            // if (resourceId.indexOf("Paragraph") > -1) {
            paragraphs.alterGraph.addConceptsToGraph(resourceId, withOtherResourcesEdges)

            //  }
        },
        showResourceConceptsOfType: function () {

        }
    }

    self.resetSelection = function (reload) {
        Infos.setInfosDivHeight(5);
        $("#messageDiv").html("");
        $("#currentConceptsSpan").html("");
        $("#currentResourcesSpan").html("");
        $("#graphDiv").html("");
        $("#searchSelectedConceptsButton").css("display", "none")
        $("#resetSelectedConceptsButton").css("display", "none")
        $("#compareConceptsButton").css("display", "none")

        $(".projection-item").css("display", "none")
        self.currentConceptsSelection = null;
        Concepts.currentConceptsSelection=[[]];
        Corpus.currentCorpusSelection=[[]];
        $("#jstreeConceptDiv").jstree(true).uncheck_all();
        $("#jstreeCorpusDiv").jstree(true).uncheck_all();
        if (reload) {
            Concepts.loadConceptsJsTree();
            Corpus.loadCorpusJsTree();
        }

    }


    self.clusterNodes = function (nodes, clusters, options) {
        var edgesToRemove = [];
        var edgesToCreate = [];
        var nodesToRemove = [];
        var nodesToCreate = [];
        var existingNodeIds = visjsGraph.data.nodes.getIds()
        for (var cid in clusters) {
            if (uniqueNodes.indexOf(cid) < 0 && existingNodeIds.indexOf(cid) < 0) {
                uniqueNodes.push(cid)
                nodesToCreate.push({id: cid, label: clusters[cid], shape: 'square', size: 20})
            }
            nodes.forEach(function (node) {
                var test = options.joinCondition(node, cid);
                if (test === true) {
                    nodesToRemove.push(node);
                    var nodeIncomingEdges = visjsGraph.network.getConnectedEdges(node.id);
                    edgesToRemove = edgesToRemove.concat(nodeIncomingEdges);
                }
            })


            var uniqueNewEdges = [];
            var oldEdges = visjsGraph.data.edges.get(edgesToRemove);
            nodes.forEach(function (node) {
                oldEdges.forEach(function (edge) {

                    if (edge.from == node.id) {
                        var newEdgeId = cid + "_" + edge.to
                        if (uniqueNewEdges.indexOf(newEdgeId) < 0) {
                            uniqueNewEdges.push(newEdgeId);
                            edgesToCreate.push({id: newEdgeId, from: cid, to: edge.to})
                        }

                    }
                    if (edge.to == node.id) {
                        var newEdgeId = edge.from + "_" + cid
                        if (uniqueNewEdges.indexOf(newEdgeId) < 0) {
                            uniqueNewEdges.push(newEdgeId);
                            edgesToCreate.push({id: newEdgeId, from: edge.from, to: cid})
                        }
                    }
                })
            })

        }
        visjsGraph.data.nodes.remove(nodesToRemove)
        visjsGraph.data.edges.remove(edgesToRemove)

        visjsGraph.data.nodes.add(nodesToCreate)
        visjsGraph.data.edges.add(edgesToCreate)

    }
    self.onJsTreeSelectionCBXchecked = function (obj, bool) {

        var selectOptionHtml = "<option>OR</option>" + "<option>AND</option>" + "<option>NO</option>"

        var tooltip = ""
        var nodeLabel = obj.node.text;
        obj.node.parents.forEach(function (parent, index) {
            var jstree;
            if (  obj.type == "concept")
                jstree = "#jstreeConceptDiv"
            else {
                jstree = "#jstreeCorpusDiv"

            }

            var parentLabel = $(jstree).jstree(true).get_node(parent)
            if (index < obj.node.parents.length - 1)
                tooltip += "/" + parentLabel.text
        })

        if (  obj.type == "corpus") {
            var text = $("#currentResourcesSpan").html();
            var index = Corpus.currentCorpusSelection.length - 1;
            var index2 = Corpus.currentCorpusSelection[index].length - 1;
            var selectId = "R" + "_" + index + "_" + index2
            var selectHtml = "<select onchange=Selection.updateSelection($(this).attr(\"id\")) id='" + selectId + "'>" + selectOptionHtml + "</select>";
            if (text != "")
                text += "<br>";
            text += selectHtml + "<span style='font-size: 12px' title='" + tooltip + "'>" + nodeLabel + "</span>"
            $("#currentResourcesSpan").html(text);
            $("#" + selectId).val(bool)

        } else if(  obj.type == "concept"){

            var text = $("#currentConceptsSpan").html();
            var index = Concepts.currentConceptsSelection.length - 1;
            var index2 = Concepts.currentConceptsSelection[index].length - 1
            var selectId = "C" + "_" + index + "_" + index2
            var selectHtml = "<select onchange=Selection.updateSelection($(this).attr(\"id\")) id='" + selectId + "'>" + selectOptionHtml + "</select>";
            if (text != "")
                text += "<br>";
            text += selectHtml + "<span style='font-size: 12px' title='" + tooltip + "'>" + nodeLabel + "</span>"

            $("#currentConceptsSpan").html(text);
            $("#" + selectId).val(bool)
        }


        $("#searchSelectedConceptsButton").css("display", "block")
        $("#resetSelectedConceptsButton").css("display", "block");
        $("#compareConceptsButton").css("display", "block");

        //   $(".projection-item").css("display","block")
    }

    self.updateSelection = function (selectId) {
        var array = selectId.split("_");
        var value = $("#" + selectId).val();
        if (array[0] == "R") {

            var resourceId = Corpus.currentCorpusSelection[parseInt(array[1])][parseInt(array[2])];
            if (resourceId)
                Corpus.currentCorpusSelection[parseInt(array[1])].splice([parseInt(array[2])], 1)
            if (value == "NO") {
                $("#jstreeCorpusDiv").jstree(true).uncheck_node(resourceId)

            }
            if (value == "AND") {
                $("#jstreeCorpusDiv").jstree(true).uncheck_node(resourceId)
                Corpus.currentCorpusSelection[parseInt(array[0])].splice([parseInt(array[1])], 1)
                Corpus.currentCorpusSelection[parseInt(array[0])].push(resourceId)
            }
            if (value == "OR") {
                $("#jstreeCorpusDiv").jstree(true).uncheck_node(resourceId)
                Corpus.currentCorpusSelection[parseInt(array[0])].splice([parseInt(array[1])], 1)
                Corpus.currentCorpusSelection[parseInt(array[0])].push(resourceId)
            }


        } else if (array[0] == "C") {

        }


    }


    return self;
})
()
