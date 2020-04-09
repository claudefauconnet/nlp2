var projection = (function () {

    var self = {};

    self.onConceptAggrLevelSliderChange = function (evt) {
        var newLevel = $(this).slider("value") + 1;

        var nodes = visjsGraph.data.nodes.get();
        var edges = visjsGraph.data.edges.get();
        var newVisjData = {nodes: [], edges: []};
        var broaderConcepts;
        var uniqueNodeIds = []
        var edgesToRemove = []
        nodes.forEach(function (node) {

            if (node.id.indexOf("/vocabulary/") > -1) {
                var currentLevel = node.data.ancestors.indexOf(node.id)
                newLevel = newLevel + currentLevel;
                if (node.data.ancestors.length == 0 || newLevel > node.data.ancestors.length - 1 || newLevel <= 0)
                    return newVisjData.nodes.push(node);

                var newNodeId = node.data.ancestors[newLevel].id;
                if (uniqueNodeIds.indexOf(newNodeId) < 0) {
                    uniqueNodeIds.push(newNodeId);
                    var newLabel = node.data.ancestors[newLevel].id;
                    var newNode = {

                        label: newLabel,
                        id: newNodeId,
                        color: node.color,
                        data: {ancestors: node.data.ancestors},
                        shape: node.shape,
                        //  font: {size: 18, color: "white"}
                    }
                    newVisjData.nodes.push(newNode)

                    edges.forEach(function (edge, index) {
                        if (edge.to == node.id) {
                            edgesToRemove.push(edge.id)
                            var newEdgeId = edge.from + "_" + newNodeId
                            newVisjData.edges.push({
                                id: newEdgeId,
                                from: edge.from,
                                to: newNodeId

                            })
                        }
                        if (edge.from == node.id) {
                            edgesToRemove.push(edge.id)
                            var newEdgeId = newNodeId + "_" + edge.to;
                            newVisjData.edges.push({
                                id: newEdgeId,
                                from: newNodeId,
                                to: edge.to,

                            })
                        }
                    })


                }
            }


        })

        edges.forEach(function (edge) {
            if (edgesToRemove.indexOf(edge.id) < 0) {
                newVisjData.edges.push(edge)
            }


        })
        ontograph.drawGraph(newVisjData, {addToGraph: true})
    }


    self.onAggregateResourcesSelectChange = function (type) {
if( self.currentCorpusClusters){
    self.currentCorpusClusters.forEach(function(cid){
        try {
            visjsGraph.network.openCluster(cid)
        }catch(e){
            var x=3
        }
    })
}
        self.currentCorpusClusters=[];
        var nodes = visjsGraph.data.nodes.get();
        var distinctCid={}
        var newNodes=[];
        nodes.forEach(function (node) {

            if (node.id.indexOf("/Paragraph/") > -1) {
                node.data.cid = null;
                if (node.data && node.data[type]) {
                    var cid = node.data[type].value
                    if (!distinctCid[cid])
                        distinctCid[cid]= node.data[type+"Label"].value;
                    node.data.cid = cid;
                    self.currentCorpusClusters.push(cid);
                    newNodes.push(node)

                }
            }

        })
        visjsGraph.data.nodes.update(newNodes)

       for( var cid in distinctCid){
           var cidLabel=distinctCid[cid]
           var options= {
                joinCondition:function(childOptions) {
                    try {
                        var test = (childOptions.data && childOptions.data.cid == cid);
                    }
                    catch(e){
                        console.log(e)
                    }
                   return test
                },
                clusterNodeProperties: {id:cid, label:cidLabel, shape:'square',size:20}
            };
           visjsGraph.network.cluster(options);



        }

    }


    self.onShowResoucesParentsResourcesSelectChange = function (value) {


    }


    self.displayParagraphsGraph = function () {
        var conceptAggrLevel = $("#conceptAggrLevelSlider").val()
        var resourceAggrLevel = $("#resourcesAggrLevelSelect").val();
        var resourcesShowParentResources = $("#resourcesShowParentResourcesSelect").val();
        var conceptAncestorsMap = {}
        var corpusAncestorsMap = {}
        var allConcepts = {}
        var allParagraphs = [];
        var paragraphsInfos = {};
        var idCorpus = null;
        async.series([


                // get Concepts Ancestors
                function (callbackSeries) {
                    var selectedConcepts = $("#jstreeConceptDiv").jstree(true).get_checked(true);
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
                    thesaurus.getSelectedConceptDescendants(function (err, concepts) {
                        if (err)
                            return callbackSeries(err);
                        allConcepts = concepts
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
                    paragraphs.sparql_getEntitiesParagraphs(idCorpus, allConcepts, {concepts_OR: 1}, function (err, result) {
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
