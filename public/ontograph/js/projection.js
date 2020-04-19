var projection = (function () {

    var self = {};

    var uniqueNodes = [];
    self.sliceZize = 500;

    self.onConceptAggrLevelSliderChange = function (evt) {
        var conceptLevelAggr = parseInt($("#conceptAggrLevelSlider").slider("option", "value"));
        var corpusLevelAggr = $("#corpusAggrLevelSelect").val();
        paragraphs.drawParagraphsEntitiesGraphAggr(self.currentProjection.paragraphs, self.currentProjection.conceptsInfos, {
            conceptLevelAggr: conceptLevelAggr,
            corpusLevelAggr: corpusLevelAggr
        })
    }


    self.onAggregateCorpusSelectChange = function (type) {
        var conceptLevelAggr = parseInt($("#conceptAggrLevelSlider").slider("option", "value"));
        var corpusLevelAggr = $("#corpusAggrLevelSelect").val();
        paragraphs.drawParagraphsEntitiesGraphAggr(self.currentProjection.paragraphs, self.currentProjection.conceptsInfos, {
            conceptLevelAggr: conceptLevelAggr,
            corpusLevelAggr: corpusLevelAggr
        })

    }


    self.onShowResoucesParentsResourcesSelectChange = function (value) {


    }


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
                        idCorpus = corpus.getSelectedResource();
                    callbackSeries();
                },
                //getParagraphs
                function (callbackSeries) {
                    options.conceptsSets = true;
                    paragraphs.sparql_getEntitiesParagraphsX(idCorpus, allConceptsMap, options, function (err, result) {
                        //  paragraphs.sparql_getEntitiesParagraphs(idCorpus, selectedConcepts,  ConceptsDepth, options, function (err, result) {
                        if (err)
                            return callbackSeries(err);

                        if (result.length == 0)
                            return callbackSeries("No results")

                        allParagraphs = result;

                        callbackSeries();
                    })

                },

                //getAncestors
                function (callbackSeries) {
                    if (allParagraphs.length == 0)
                        return callbackSeries();
                    var conceptsIds = [];
                    allParagraphs.forEach(function (item) {
                        if (item.entity && conceptsIds.indexOf(item.entity.value) < 0)
                            conceptsIds.push(item.entity.value)
                    })
                    if (conceptsIds.length == 0)
                        return callbackSeries();

                    if (paragraphs.previousConceptsFilter)
                        conceptsIds = conceptsIds.concat(paragraphs.previousConceptsFilter)

                    Concepts.getConceptsInfos(conceptsIds, {}, function (err, result) {
                        if (err)
                            return callbackSeries(err);

                        result.forEach(function (item) {
                            console.log(item.concept.value)
                            var obj = {id: item.concept.value, ancestors: [{id: item.concept.value, label: item.conceptLabel.value}]}
                            for (var i = 1; i < 7; i++) {
                                var broader = item["broaderId" + i];
                                if (typeof broader !== "undefined") {
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
                    self.currentProjection = {
                        paragraphs: allParagraphs,
                        conceptsInfos: allConceptsInfosMap,
                    }

                    paragraphs.drawParagraphsEntitiesGraphAggr(allParagraphs, allConceptsInfosMap, options)

                    callbackSeries();
                }


            ],

            function (err) {
                if (err)
                    return common.message(err)
            }
        )


    }

    self.filterGraph = function () {
        var allConcepts = [];
        async.series([


            //getDescendants
            function (callbackSeries) {
                Concepts.getSelectedConceptDescendants(function (err, concepts) {
                    if (err)
                        return callbackSeries(err);
                    allConcepts = concepts;


                    callbackSeries();
                })

            },

            //hide selectedNodes in graph
            function (callbackSeries) {
                var existingNodeIds = visjsGraph.data.nodes.getIds();
                var newNodes = []
                allConcepts.forEach(function (itemId) {
                    var p = existingNodeIds.indexOf(itemId)
                    if (p > -1)
                        newNodes.push({id: itemId, hidden: true})
                })
                visjsGraph.data.nodes.update(newNodes)
                callbackSeries();

            }], function (err) {
            if (err)
                common.message(err)
        })
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


    return self;
})
()