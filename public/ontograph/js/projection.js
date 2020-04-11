var projection = (function () {

    var self = {};

    var uniqueNodes = [];

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
    self.onConceptAggrLevelSliderChange = function (evt) {
        var conceptLevelAggr = parseInt($("#conceptAggrLevelSlider").slider("option", "value"));
        var corpusLevelAggr = $("#corpusAggrLevelSelect").val();
        paragraphs.drawParagraphsEntitiesGraphAggr(self.currentProjection.paragraphs, self.currentProjection.conceptsInfos, {
            conceptLevelAggr: conceptLevelAggr,
            corpusLevelAggr: corpusLevelAggr
        })
    }


    self.onAggregateResourcesSelectChange = function (type) {
        var conceptLevelAggr = parseInt($("#conceptAggrLevelSlider").slider("option", "value"));
        var corpusLevelAggr = $("#corpusAggrLevelSelect").val();
        paragraphs.drawParagraphsEntitiesGraphAggr(self.currentProjection.paragraphs, self.currentProjection.conceptsInfos, {
            conceptLevelAggr: conceptLevelAggr,
            corpusLevelAggr: corpusLevelAggr
        })

    }


    self.onShowResoucesParentsResourcesSelectChange = function (value) {


    }


    self.displayParagraphsGraph = function () {
        var conceptLevelAggr = parseInt($("#conceptAggrLevelSlider").slider("option", "value"));
        var corpusLevelAggr = $("#corpusAggrLevelSelect").val();

        //   var resourcesShowParentResources = $("#resourcesShowParentResourcesSelect").val();
        var conceptAncestorsMap = {}
        var corpusAncestorsMap = {}
        var allConceptsMap = {}
        var allParagraphs = [];
        var allConceptsInfosMap = {};
        var idCorpus = null;
        async.series([


                // get Concepts Ancestors
                function (callbackSeries) {
                    var selectedConcepts = $("#jstreeConceptDiv").jstree(true).get_selected(true);
                    selectedConcepts.forEach(function (concept, index) {
                        conceptAncestorsMap[concept.id] = [];
                        concept.parents.forEach(function (parent, index) {
                            if (parent != "#") {
                                var parentNode = $("#jstreeConceptDiv").jstree(true).get_node(parent);
                                conceptAncestorsMap[concept.id].push({text: parentNode.text, id: parent})
                            }
                        })

                    })
                    callbackSeries();
                },
                // get resources Ancestors
                function (callbackSeries) {
                    var selectedConcepts = $("#jstreeCorpusDiv").jstree(true).get_selected(true);
                    selectedConcepts.forEach(function (concept, index) {
                        corpusAncestorsMap[concept.id] = [];
                        concept.parents.forEach(function (parent, index) {
                            if (parent != "#") {
                                var parentNode = $("#jstreeCorpusDiv").jstree(true).get_node(parent);
                                corpusAncestorsMap[concept.id].push({text: parentNode.text, id: parent})
                            }
                        })

                    })
                    callbackSeries();
                },

                //getDescendants
                function (callbackSeries) {
                    Concepts.getSelectedConceptDescendants(function (err, concepts) {
                        if (err)
                            return callbackSeries(err);
                        allConceptsMap = concepts
                        callbackSeries();
                    })

                },
                //getselectedResource
                function (callbackSeries) {
                    idCorpus = corpus.getSelectedResource();
                    callbackSeries();
                },
                //getParagraphs
                function (callbackSeries) {
                    paragraphs.sparql_getEntitiesParagraphs(idCorpus, allConceptsMap, {concepts_OR: 1}, function (err, result) {
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
                        if (item.entity)
                            conceptsIds.push(item.entity.value)
                    })
                    if (conceptsIds.length == 0)
                        return callbackSeries();

                    Concepts.getConceptsInfos(conceptsIds, {onlyAncestors: true}, function (err, result) {
                        if (err)
                            return callbackSeries(err);
                        result.forEach(function (item) {
                            var obj = {id: item.concept.value, ancestors: [{id:item.concept.value, label: item.conceptLabel.value}]}
                            for (var i = 1; i < 9; i++) {
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
                    common.message("Drawing graph paragraphs:" + allParagraphs.length)
                    //  paragraphs.drawParagraphsEntitiesGraph(allParagraphs, paragraphsInfos, {
                    self.currentProjection = {
                        paragraphs: allParagraphs,
                       conceptsInfos: allConceptsInfosMap,
                    }
                    paragraphs.drawParagraphsEntitiesGraphAggr(allParagraphs, allConceptsInfosMap, {
                        conceptLevelAggr: conceptLevelAggr,
                        corpusLevelAggr: corpusLevelAggr
                    })

                    callbackSeries();
                }


            ],

            function (err) {
                if (err)
                    return common.message(err)
            }
        )


    }


    return self;
})
()
