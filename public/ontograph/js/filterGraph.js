var filterGraph = (function () {
    var self = {};
    self.selectedGraphNode = null;

    self.onShowHideScope = function (value) {
        if (!value || value == "")
            return
        else if (value == "SelectedNode") {

        } else if (value == "AllNodes") {

        }

    }

    self.onShowResources = function (value) {

        var scope = $("#filterGraphScopeSelect").val();
        if (scope == "SelectedNode" && !self.selectedGraphNode)
            return;

        $("#filterGraphResourceSelect").val("")

        if (value == "ShowParents") {
            if (scope == "SelectedNode") {
                filterGraph.alterGraph.addResourcesParentsToGraph([self.selectedGraphNode])

            } else if (scope == "AllNodes") {
                filterGraph.alterGraph.addResourcesParentsToGraph(null)

            }

        }

    }

    self.onShowConcept = function (value) {
        if (!value || value == "")
            return

        var scope = $("#filterGraphScopeSelect").val();
        if (scope == "SelectedNode" && !self.selectedGraphNode)
            return;


        $("#filterGraphConceptSelect").val("")
        if (value == "ShowParents") {
            if (scope == "SelectedNode") {
                filterGraph.alterGraph.addConceptsParentsToGraph([self.selectedGraphNode])

            } else if (scope == "AllNodes") {
                filterGraph.alterGraph.addConceptsParentsToGraph(null)

            }

        } else if (value == "ListAssociatedConcepts") {
            if (scope == "SelectedNode") {
                filterGraph.alterGraph.addConceptsToGraph([self.selectedGraphNode], true, true)
            } else if (scope == "AllNodes") {
                filterGraph.alterGraph.addConceptsToGraph(null, true, true)
            }
        } else if (value == "ShowAllAssociatedConcepts") {
            if (scope == "SelectedNode") {
                filterGraph.alterGraph.addConceptsToGraph([self.selectedGraphNode], true, false)
            } else if (scope == "AllNodes") {
                filterGraph.alterGraph.addConceptsToGraph(null, true, false)
            }

        }
     else if (value == "ShowCooccurrences") {

            filterGraph.alterGraph.ShowCooccurrences()
        }

    }


    self.showConceptsParents = function (show) {
        if (scope == "SelectedNode") {
            if (!self.selectedGraphNode)
                return;
            self.showHideParents(self.selectedGraphNode)
        } else {

        }
    }


    self.onConceptAggrLevelSliderChange = function (evt) {
        var conceptLevelAggr = parseInt($("#conceptAggrLevelSlider").slider("option", "value"));
        var corpusLevelAggr = $("#corpusAggrLevelSelect").val();
        self.resetUI();
        paragraphs.drawParagraphsEntitiesGraphAggr(projection.currentProjection.paragraphs, projection.currentProjection.conceptsInfos, {
            conceptLevelAggr: conceptLevelAggr,
            corpusLevelAggr: corpusLevelAggr
        })
    }


    self.onAggregateCorpusSelectChange = function (type) {
        var conceptLevelAggr = parseInt($("#conceptAggrLevelSlider").slider("option", "value"));
        var corpusLevelAggr = $("#corpusAggrLevelSelect").val();
        self.resetUI();
        paragraphs.drawParagraphsEntitiesGraphAggr(projection.currentProjection.paragraphs, projection.currentProjection.conceptsInfos, {
            conceptLevelAggr: conceptLevelAggr,
            corpusLevelAggr: corpusLevelAggr
        })

        filterGraph.resetUI();

    }


    self.resetUI = function () {

        $("#filterGraphScopeSelect").val("AllNodes");
        $("#filterGraphResourceSelect").val("");
        $("#filterGraphConceptSelect").val("");
        $("#jstreeFilterConceptsDiv").html("");

    }

    self.alterGraph = {


        addConceptsToGraph: function (resourceIds, withOtherResourcesEdges, showJstree) {
            var existingNodes = visjsGraph.data.nodes.getIds()
            var existingEdges = visjsGraph.data.edges.getIds()
            var newConceptsIds = []
            if (resourceIds == null) {
                resourceIds = existingNodes;
            }
            var url = sparql.source.sparql_url + "?default-graph-uri=&query=";// + query + queryOptions
            var query = "    PREFIX terms:<http://purl.org/dc/terms/>        PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#>        PREFIX rdfsyn:<https://www.w3.org/1999/02/22-rdf-syntax-ns#>PREFIX mime:<http://purl.org/dc/dcmitype/> PREFIX mime:<http://www.w3.org/2004/02/skos/core#>   " +
                "      select  distinct *      where { ?paragraph terms:subject ?entity. ?entity skos:prefLabel ?entityLabel. ?entity rdfsyn:type ?entityType.";
            if (!Array.isArray(resourceIds))
                resourceIds = [resourceIds]

            if (resourceIds.length == 0)
                return;
            var resourceIdStr = ""
            resourceIds.forEach(function (node, index) {
                if (index > 0)
                    resourceIdStr += ","
                resourceIdStr += "<" + node + ">";

            })


            if (resourceIds[0].indexOf("Paragraph") > -1) {
                query += "filter (?paragraph in (" + resourceIdStr + ")) "

            } else if (resourceIds[0].indexOf("Chapter") > -1) {
                query += " ?paragraph skos:broader ?resource ." + "filter (?resource in (" + resourceIdStr + ")) "
            } else if (resourceIds[0].indexOf("Document") > -1) {
                query += " ?paragraph skos:broader ?chapter . ?chapter skos:broader ?resource ." + "filter (?resource in (" + resourceIdStr + ")) "
            } else
                return;


            if (withOtherResourcesEdges) {
                var otherResources = "";

                existingNodes.forEach(function (node) {
                    if (node.match(/[Paragraph|Chapter|Document]/)) {
                        if (otherResources != "")
                            otherResources += ","
                        otherResources += "<" + node + ">";

                    }
                })


                if (resourceIds[0].indexOf("Paragraph") > -1) {
                    query += "OPTIONAL {?linkedResource   terms:subject ?entity. "

                } else if (resourceIds[0].indexOf("Chapter") > -1) {
                    query += "OPTIONAL {?otherResource   terms:subject ?entity. ?otherResource skos:broader ?linkedResource."
                } else if (resourceIds[0].indexOf("Document") > -1) {
                    query += "OPTIONAL {?otherResource   terms:subject ?entity. ?otherResource skos:broader ?chapter.  ?chapter skos:broader ?linkedResource."
                }

                query += "filter (?linkedResource in(" + otherResources + ")) }"

            }
            query += "} limit 1000 "
            var queryOptions = "&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=5000&debug=on"
            sparql.querySPARQL_GET_proxy(url, query, queryOptions, null, function (err, result) {
                if (err) {
                    console.log(query)
                    return common.message(err);
                }

                var visjsData = {nodes: [], edges: []}

                var uniqueNodes = []
                var uniqueEdges = []
                result.results.bindings.forEach(function (item) {
                    var conceptId = item.entity.value;
                    if (existingNodes.indexOf(conceptId) < 0 && uniqueNodes.indexOf(conceptId) < 0) {
                        if (item.entityLabel.value == "Carbonate")
                            var x = 3;
                        newConceptsIds.push(conceptId)
                        uniqueNodes.push(conceptId)
                        var type = item.entityType.value.substring(item.entityType.value.lastIndexOf("/") + 1);
                        var hidden = false;
                        if (false && showJstree)
                            hidden = true;


                        visjsData.nodes.push({
                            id: conceptId,
                            label: item.entityLabel.value,
                            shape: "box",
                            color: ontograph.entityTypeColors[type],
                            data: {ancestors: []},
                            hidden: hidden

                        })


                        var resourceId
                        if (resourceIds[0].indexOf("Paragraph") > -1)
                            resourceId = item.paragraph.value;
                        else
                            resourceId = item.resource.value;
                        var edgeId = resourceId + "_" + conceptId;
                        if (existingEdges.indexOf(edgeId) < 0 && uniqueEdges.indexOf(edgeId) < 0) {
                            uniqueEdges.push(edgeId);
                            visjsData.edges.push({
                                id: edgeId,
                                from: resourceId,
                                to: conceptId,
                                arrows: "to",
                                dashes: [5, 5]
                            })
                        }


                    }

                    if (withOtherResourcesEdges) {

                        if (item.linkedResource) {
                            var edgeId = item.linkedResource.value + "_" + conceptId
                            if (existingEdges.indexOf(edgeId) < 0 && uniqueEdges.indexOf(edgeId) < 0) {
                                uniqueEdges.push(edgeId);
                                visjsData.edges.push({
                                    id: edgeId,
                                    from: conceptId,
                                    to: item.linkedResource.value,
                                    arrows: "to",
                                    dashes: [6, 3]
                                })

                            }
                        }
                    }
                })

                var jstreeMap = {}
                Concepts.getConceptsInfos(newConceptsIds, {}, function (err, result) {
                    if (err)
                        return common.message(err);
                    var allConceptsInfosMap = {};
                    result.forEach(function (item) {

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
                    visjsData.nodes.forEach(function (node) {
                        node.data.ancestors = allConceptsInfosMap[node.id].ancestors;
                        if (!node.data.ancestors)
                            return;
                        if (showJstree) {
                            node.data.ancestors.forEach(function (ancestor, index) {
                                if (!jstreeMap[ancestor.id]) {
                                    var parent = "#"
                                    if (index < node.data.ancestors.length - 1)
                                        parent = node.data.ancestors[index + 1].id
                                    jstreeMap[ancestor.id] = {
                                        id: ancestor.id,
                                        text: ancestor.label,
                                        parent: parent,
                                        data: node.data
                                    }

                                }
                            })
                        }


                    })

                    if (showJstree) {

                        var jstreeData = [];
                        for (var key in jstreeMap) {
                            jstreeData.push(jstreeMap[key])
                        }
                        common.loadJsTree("jstreeFilterConceptsDiv", jstreeData, {
                            withCheckboxes: 1,
                            openAll: true,
                            onCheckNodeFn: function (evt, obj) {
                                filterGraph.alterGraph.onFilterConceptsChecked(evt, obj);
                            },
                            onUncheckNodeFn: function (evt, obj) {
                                filterGraph.alterGraph.onFilterConceptsChecked(evt, obj);
                            },
                            /*   selectNodeFn: function (evt, obj) {
                              Concepts.onNodeSelect(evt, obj);
                          },
                          onUncheckNodeFn: function (evt, obj) {
                              Concepts.onNodeUnchecked(evt, obj);

                          }*/
                        })
                        self.addedConceptsVisjData=visjsData;

                    }
                    else{


                       /* visjsGraph.data.nodes.add(visjsData.nodes)
                        visjsGraph.data.edges.add(visjsData.edges)*/

                    }




                })
            })
        },

        onFilterConceptsChecked: function (event, obj) {




            var jstreeNode = obj.node;

            var jstreeSelectedNodes = [obj.node.id].concat(obj.node.children);// node and children
            var visjsNodeIds = visjsGraph.data.nodes.getIds();
            var nodesToShow = []
            var edgesToShow = []
            var nodeIdsToShow = [];

            self.addedConceptsVisjData.nodes.forEach(function(visjsNode){
                if(jstreeSelectedNodes.indexOf(visjsNode.id)>-1){
                    visjsNode.hidden==false;
                    nodesToShow.push(visjsNode)

                }
            })
            self.addedConceptsVisjData.edges.forEach(function(visjsEdge){
                jstreeSelectedNodes.forEach(function(jstreeNodeId){
                    if(visjsEdge.id.indexOf(jstreeNodeId)>-1) {
                        edgesToShow.push(visjsEdge)
                    }
                })
            })
            if(event.type=="uncheck_node"){
                visjsGraph.data.nodes.remove(nodesToShow)
                visjsGraph.data.edges.remove(edgesToShow)
            }else{
                visjsGraph.data.nodes.add(nodesToShow)
                visjsGraph.data.edges.add(edgesToShow)
            }





            /*   jstreeSelectedNodes.forEach(function (jstreeNodeId) {
                   if (visjsNodeIds.indexOf(jstreeNodeId) > -1 && nodeIdsToShow.indexOf(jstreeNode.id) < 0) {
                       nodeIdsToShow.push(jstreeNodeId)
                       nodesToShow.push({id: jstreeNodeId, hidden: hidden})
                   }

               })

               visjsGraph.data.nodes.update(nodesToShow)*/


        },


        addConceptsParentsToGraph: function (selectedResourceId) {
            var existingNodes = visjsGraph.data.nodes.get();
            var existingNodeIds = visjsGraph.data.nodes.getIds();
            var existingEdgeIds = visjsGraph.data.edges.getIds();


            var visjsData = {nodes: [], edges: []}
            var uniqueNodes = []
            var uniqueEdgeIds = []

            existingNodes.forEach(function (node) {
                if (node.hidden)
                    return;
                if (node.id.indexOf("/vocabulary/") < 0)
                    return;

                if (!selectedResourceId || (selectedResourceId = node.id)) {
                    var newNode = null;
                    node.data.ancestors.forEach(function (ancestor, index) {
                        if (ancestor.id == node.id && index < node.data.ancestors.length - 1) {
                            newNode = node.data.ancestors[index + 1]
                        }
                    })


                    if (newNode) {
                        //  var newNodeId =  node.data[newNodeName + "Label"].value;
                        if (existingNodeIds.indexOf(newNode.id) < 0 && uniqueNodes.indexOf(newNode.id) < 0) {
                            uniqueNodes.push(newNode.id);
                            var label = newNode.label;
                            if (label.length > 12)
                                label = label.substring(0, 12) + "..."
                            visjsData.nodes.push({
                                id: newNode.id,
                                label: label,
                                color: node.color,
                                data: node.data,
                                shape: "box"
                            })


                        }
                        var edgeId = node.id + "_" + newNode.id
                        if (existingEdgeIds.indexOf(edgeId) < 0 && uniqueEdgeIds.indexOf(edgeId) < 0) {
                            uniqueEdgeIds.push(edgeId)
                            var edge = {
                                from: node.id,
                                to: newNode.id,
                                id: edgeId,
                                arrows: "to",

                            }
                            visjsData.edges.push(edge)
                        }


                    }


                }
            })

            ontograph.drawGraph(visjsData, {addToGraph: 1})


        },


        addResourcesParentsToGraph: function (selectedResourceId) {
            var existingNodes = visjsGraph.data.nodes.get();
            var existingNodeIds = visjsGraph.data.nodes.getIds();
            var existingEdgeIds = visjsGraph.data.edges.getIds();


            var visjsData = {nodes: [], edges: []}
            var uniqueNodes = []
            var uniqueEdgeIds = []

            existingNodes.forEach(function (node) {

                if (!selectedResourceId || (selectedResourceId = node.id)) {
                    var size = 15
                    var shape = "triangle"
                    var newNodeName = null;
                    if (node.id.indexOf("/Paragraph/") > -1) {
                        newNodeName = "chapter"
                        size = 8
                        color = "#ccd2dd"
                        shape = "ellipse"
                    } else if (node.id.indexOf("/Chapter/") > -1) {
                        newNodeName = "document"
                        size = 10
                        color = "#8c94dd"
                        shape = "triangle"
                    } else if (node.id.indexOf("/Document/") > -1) {
                        size = 15
                        color = "#4977dd"
                        newNodeName = "documentType"
                        shape = "square"
                    } else if (node.id.indexOf("/Document-type/") > -1) {
                        size = 20
                        color = "#4345dd"
                        newNodeName = "branch"
                        shape = "hexagon"
                    } else if (node.id.indexOf("/Branch/") > -1) {
                        size = 25
                        color = "#0f2edd"
                        shape = "star"
                        newNodeName = "domain";
                    }


                    if (newNodeName && node.data[newNodeName]) {
                        var newNodeId = node.data[newNodeName].value;

                        //  var newNodeId =  node.data[newNodeName + "Label"].value;
                        if (existingNodeIds.indexOf(newNodeId) < 0 && uniqueNodes.indexOf(newNodeId) < 0) {
                            uniqueNodes.push(newNodeId);
                            var label = node.data[newNodeName + "Label"].value;
                            if (label.length > 12)
                                label = label.substring(0, 12) + "..."
                            visjsData.nodes.push({
                                id: newNodeId,
                                label: label,
                                color: color,
                                size: size,
                                font: {strokeWidth: color, size: 18},
                                shape: shape,
                                data: node.data

                            })


                        }
                        var edgeId = node.id + "_" + newNodeId
                        if (existingEdgeIds.indexOf(edgeId) < 0 && uniqueEdgeIds.indexOf(edgeId) < 0) {
                            uniqueEdgeIds.push(edgeId)
                            var edge = {
                                from: node.id,
                                to: newNodeId,
                                id: edgeId,
                                arrows: "to",

                            }
                            visjsData.edges.push(edge)
                        }


                    }


                }
            })

            ontograph.drawGraph(visjsData, {addToGraph: 1})

        }
    }

    return self;

})()
