var projection = (function () {

    var self = {};

    var uniqueNodes=[];

    self.clusterNodes=function(nodes,clusters, options){
        var edgesToRemove=[];
        var edgesToCreate=[];
        var nodesToRemove=[];
        var nodesToCreate=[];
        var existingNodeIds=visjsGraph.data.nodes.getIds()
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
        var newLevel = $(this).slider("value") + 1;


        if (self.currentConceptsClusters) {
            self.currentConceptsClusters.forEach(function (cid) {
                try {
                    visjsGraph.network.openCluster(cid)
                } catch (e) {
                    var x = 3
                }
            })
        }
        self.currentConceptsClusters = [];
        var nodes = visjsGraph.data.nodes.get();
        var distinctCid = {}
        var newNodes = [];


        nodes.forEach(function (node) {

            if (node.id.indexOf("/vocabulary/") > -1) {
                var currentLevel = node.data.ancestors.indexOf(node.id)
                newLevel = newLevel + currentLevel;
                if (newLevel < 0)
                    return;


                node.data.cid = null;
                if (node.data.ancestors && newLevel < node.data.ancestors.length - 1) {
                    var cid = node.data.ancestors[newLevel].id
                    if (!distinctCid[cid])
                        distinctCid[cid] = node.data.ancestors[newLevel].label;
                    node.data.cidConcept = cid;
                    self.currentConceptsClusters.push(cid);
                    newNodes.push(node)


                }
            }

        })
        visjsGraph.data.nodes.update(newNodes);

        var options = {
            joinCondition: function (childOptions,cid) {
                try {
                    var test = false;
                    if (childOptions.id.indexOf("/vocabulary/") && childOptions.data) {

                        test = childOptions.data.cidConcept && childOptions.data.cidConcept == cid
                        //  console.log("---"+childOptions.data.cidConcept)
                        // console.log(test)
                    }
                } catch (e) {
                    console.log(e)
                }
                return test
            },
          //  clusterNodeProperties: {id: cid, label: cidLabel, shape: 'square', size: 20}
        };
        self.clusterNodes(nodes, distinctCid, options)



      /*  for (var cid in distinctCid) {
            var cidLabel = distinctCid[cid]
            var options = {
                joinCondition: function (childOptions) {
                    try {
var test=false;
                      if(childOptions.id.indexOf("/vocabulary/")  && childOptions.data  ) {

                          test = childOptions.data.cidConcept && childOptions.data.cidConcept == cid
                          //  console.log("---"+childOptions.data.cidConcept)
                          // console.log(test)
                      }
                    } catch (e) {
                        console.log(e)
                    }
                    return test
                },
                clusterNodeProperties: {id: cid, label: cidLabel, shape: 'square', size: 20}
            };
            visjsGraph.network.cluster(options);


        }*/
    }


    self.onAggregateResourcesSelectChange = function (type) {
        if (self.currentCorpusClusters) {
            self.currentCorpusClusters.forEach(function (cid) {
                try {
                    visjsGraph.network.openCluster(cid)
                } catch (e) {
                    var x = 3
                }
            })
        }
        self.currentCorpusClusters = [];
        var nodes = visjsGraph.data.nodes.get();
        var distinctCid = {}
        var newNodes = [];
        nodes.forEach(function (node) {

            if (node.id.indexOf("/Paragraph/") > -1) {
                node.data.cid = null;
                if (node.data && node.data[type]) {
                    var cid = node.data[type].value
                    if (!distinctCid[cid])
                        distinctCid[cid] = node.data[type + "Label"].value;
                    node.data.cidCorpus = cid;
                    self.currentCorpusClusters.push(cid);
                    newNodes.push(node)

                }
            }

        })

        visjsGraph.data.nodes.update(newNodes);

        var options = {
            joinCondition: function (childOptions,cid) {
                try {
                    var test = (childOptions.data && childOptions.data.cidCorpus == cid);

                } catch (e) {
                    console.log(e)
                }
                return test
            },
           // clusterNodeProperties: {id: cid, label: cidLabel, shape: 'square', size: 20}
        };
        self.clusterNodes(nodes, distinctCid, options)

   /*    for (var cid in distinctCid) {
            var cidLabel = distinctCid[cid]
            var options = {
                joinCondition: function (childOptions) {
                    try {
                        var test = (childOptions.data && childOptions.data.cidCorpus == cid);

                    } catch (e) {
                        console.log(e)
                    }
                    return test
                },
                clusterNodeProperties: {id: cid, label: cidLabel, shape: 'square', size: 20}
            };
            visjsGraph.network.cluster(options);


        }*/

    }


    self.onShowResoucesParentsResourcesSelectChange = function (value) {


    }


    self.displayParagraphsGraph = function () {
        var conceptAggrLevel = $("#conceptAggrLevelSlider").val()
        var resourceAggrLevel = $("#resourcesAggrLevelSelect").val();
        var resourcesShowParentResources = $("#resourcesShowParentResourcesSelect").val();
        var conceptAncestorsMap = {}
        var corpusAncestorsMap = {}
        var allConceptsMap = {}
        var allParagraphs = [];
        var paragraphsInfos = {};
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

                //getParagraphs
                function (callbackSeries) {
                    common.message("Drawing graph paragraphs:" + allParagraphs.length)
                    paragraphs.drawParagraphsEntitiesGraph(allParagraphs, paragraphsInfos, {
                            conceptAggrLevel: conceptAggrLevel,
                            resourceAggrLevel: resourceAggrLevel,
                            resourcesShowParentResources: resourcesShowParentResources
                        }
                    );
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
