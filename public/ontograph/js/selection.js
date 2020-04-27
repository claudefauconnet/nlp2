var Selection = (function () {

    var self = {};

    var uniqueNodes = [];
    self.sliceZize = 500;






    self.displayParagraphsGraph = function (booleanQuery, corpusIds, conceptIds) {
        var conceptLevelAggr = parseInt($("#conceptAggrLevelSlider").slider("option", "value"));
        var corpusLevelAggr = $("#corpusAggrLevelSelect").val();


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
        var allConceptsMap = {}
        var allParagraphs = [];
        var allConceptsInfosMap = {};
        var idCorpus = null;
        var ConceptsDepth = 0;
        var maxConceptsTreeDepth = 6
        async.series([


                //getDescendants
                function (callbackSeries) {
                    //    return callbackSeries();
                    if (conceptIds) {
                        allConceptsMap = conceptIds;
                        return callbackSeries();
                    }
                    Concepts.getSelectedConceptDescendants(function (err, concepts) {
                        if (err)
                            return callbackSeries(err);
                        allConceptsMap = concepts;


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
                    paragraphs.sparql_getEntitiesParagraphs(idCorpus, allConceptsMap, options, function (err, result) {
                        //  paragraphs.sparql_getEntitiesParagraphs(idCorpus, selectedConcepts,  ConceptsDepth, options, function (err, result) {
                        if (err)
                            return callbackSeries(err);

                        if (result.length == 0)
                            return callbackSeries("No results")


                        allParagraphs = result;
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
                    if (allParagraphs.length == 0)
                        return callbackSeries();
                    var conceptsIds = [];
                    allParagraphs.forEach(function (item) {
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
                    common.message("Drawing graph : " + allParagraphs.length + "relations")
                    //  paragraphs.drawParagraphsEntitiesGraph(allParagraphs, paragraphsInfos, {
                    self.currentSelection = {
                        paragraphs: allParagraphs,
                        conceptsInfos: allConceptsInfosMap,
                    }

                    paragraphs.drawParagraphsEntitiesGraphAggr(allParagraphs, allConceptsInfosMap, options)
                    $(".projection-item").css("display", "block")
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
        showResourceConcepts: function (resourceId,withOtherResourcesEdges) {
           // if (resourceId.indexOf("Paragraph") > -1) {
                paragraphs.alterGraph.addConceptsToGraph(resourceId,withOtherResourcesEdges)

          //  }
        },
        showResourceConceptsOfType:function(){

        }
    }

    self.resetSelection = function (reload) {
        $("#messageDiv").html("");
        $("#currentConceptsSpan").html("");
        $("#currentResourcesSpan").html("");
        $("#graphDiv").html("");
        $("#searchSelectedConceptsButton").css("display", "none")
        $("#resetSelectedConceptsButton").css("display", "none")
        $(".projection-item").css("display", "none")
        self.currentConceptsSelection = null;
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
    self.setConceptSelectedCBX = function (obj, bool) {

        var tooltip = ""
        var nodeLabel= obj.node.text;
        obj.node.parents.forEach(function (parent, index) {
            var jstree;
            if (parent.indexOf("/vocabulary/") > -1)
                jstree = "#jstreeConceptDiv"
            else {
                jstree = "#jstreeCorpusDiv"

            }

            var parentLabel = $(jstree).jstree(true).get_node(parent)
            if (index < obj.node.parents.length - 1)
                tooltip += "/" + parentLabel.text
        })



        if (obj.node.id.indexOf("/vocabulary/") <0) {
            var text = $("#currentResourcesSpan").html();
            if (text != "")
                text += "<br><span style='font-size: 12px;font-weight: bold;' title='" + tooltip + "'> &nbsp;" + bool + "&nbsp;</span> "
            text += "<span style='font-size: 12px' title='" + tooltip + "'>" +tooltip+"/"+nodeLabel + "</span>"
            $("#currentResourcesSpan").html(text);

        }else {
            var text = $("#currentConceptsSpan").html();
            if (text != "")
                text += "<br><span style='font-size: 12px;font-weight: bold;' title='" + tooltip + "'> &nbsp;" + bool + "&nbsp;</span> "
            text += "<span style='font-size: 12px' title='" + tooltip + "'>" +nodeLabel + "</span>"

            $("#currentConceptsSpan").html(text);
        }



        $("#searchSelectedConceptsButton").css("display", "block")
        $("#resetSelectedConceptsButton").css("display", "block")
        //   $(".projection-item").css("display","block")
    }


    return self;
})
()
