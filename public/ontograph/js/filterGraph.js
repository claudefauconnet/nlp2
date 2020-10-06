var filterGraph = (function () {
    var self = {};
    self.selectedGraphNode = null;
        self.conceptTypeColors={}
    self.onShowHideScope = function (value) {
        if (!value || value == "")
            return
        else if (value == "SelectedNode") {

        } else if (value == "AllNodes") {

        }

    }

    self.onShowResources = function (value) {

        var scope = "AllNodes";// $("#filterGraphScopeSelect").val();
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

        var scope = "AllNodes";// $("#filterGraphScopeSelect").val();
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

        } else if (value == "ShowCooccurrences") {

            filterGraph.alterGraph.ShowCooccurrences()
        }

    }


    self.onConceptAggrLevelSliderChange = function (evt) {
        var conceptLevelAggr = parseInt($("#conceptAggrLevelSlider").slider("option", "value"));
        var corpusLevelAggr = $("#corpusAggrLevelSelect").val();
        self.resetUI();
        return;
        paragraphs.drawParagraphsEntitiesGraphAggr(Selection.currentSelection.resources, Selection.currentSelection.conceptsInfos, {
            conceptLevelAggr: conceptLevelAggr,
            corpusLevelAggr: corpusLevelAggr
        })
    }


    self.onAggregateCorpusSelectChange = function (type) {
        //  Selection.resetSelection();
        Infos.setInfosDivHeight(5)
        Selection.displayParagraphsGraph();

    }


    self.resetUI = function () {

        $("#filterGraphScopeSelect").val("AllNodes");
        $("#filterGraphResourceSelect").val("");
        $("#filterGraphConceptSelect").val("");
        $("#jstreeFilterConceptsDiv").html("");

    }

    self.alterGraph = {
        addConceptsToGraph: function (resourceIds, withOtherResourcesEdges, showJstree) {

            var resourcesConcepts = [];

            var conceptsMap = {};

            // get all concepts associated with corpus resource group by entity count
            async.series([
                    function (callbackSeries) {
                        var resourceIds = []
                        var corpusLevelAggr = $("#corpusAggrLevelSelect").val();
                        Selection.currentSelection.resources.forEach(function (paragraph) {
                            var resourceId = paragraph[corpusLevelAggr];
                            if (resourceIds.indexOf(resourceId) < 0)
                                resourceIds.push(resourceId.value)

                        })

                        var slicedResourceIds = common.sliceArray(resourceIds, 500);
                        common.message("<br>Searching AssociatedConcepts  ", true)

                        var corpusLevels = app_config.ontologies[app_config.currentOntology].resourceLevels;
                        var linkedResourceVar = "?" + corpusLevels[corpusLevels.length - 1].label
                        var fromStr = "from <" + app_config.ontologies[app_config.currentOntology].corpusGraphUri + "> "
                        fromStr += "from <" + app_config.ontologies[app_config.currentOntology].conceptsGraphUri + "> "
                        async.eachSeries(slicedResourceIds, function (resourceIds, callbackEach) {


                            var query = "    PREFIX terms:<http://purl.org/dc/terms/>        PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#>        PREFIX rdfsyn:<http://www.w3.org/1999/02/22-rdf-syntax-ns#>PREFIX mime:<http://purl.org/dc/dcmitype/> PREFIX mime:<http://www.w3.org/2004/02/skos/core#>   " +
                                "      SELECT  DISTINCT ?entity ?entityLabel ?entityType ?resource  (count(?entity) AS ?countEntities)   " + fromStr + "  where {" + linkedResourceVar + " terms:subject ?entity. ?entity skos:prefLabel ?entityLabel. ?entity rdfsyn:type ?entityType.";
                            if (!Array.isArray(resourceIds))
                                resourceIds = [resourceIds]

                            if (resourceIds.length == 0)
                                return;
                            var linkedResourceQuery = ""
                            var corpusAggrLevel = $("#corpusAggrLevelSelect").val()
                            var resourceIdStr = ""


                            resourceIds.forEach(function (resourceId, index) {
                                // resourceIds.forEach(function (node, index) {
                                if (index > 0)
                                    resourceIdStr += ","
                                resourceIdStr += "<" + resourceId + ">";

                            })


                            var okDistinctSelect = true;
                            var pathOperator = "+"
                            if (corpusAggrLevel == corpusLevels[corpusLevels.length - 1].label)
                                pathOperator = "*"

                            query += linkedResourceVar + " skos:broader" + pathOperator + " ?resource ." + "filter (?resource in (" + resourceIdStr + ")) "

                            /*     if (corpusAggrLevel == corpusLevels[corpusLevels.length-1].label) {
                                     //  query += linkedResourceVar + " skos:broader ?xx . ?resource skos:broader ?xx .  filter (" + linkedResourceVar + " in (" + resourceIdStr + ")) ";
                                     // query +=   linkedResourceVar + " skos:broader  ?resource.  filter (" + linkedResourceVar + " in (" + resourceIdStr + ")) ";
                                     query += "bind (" + linkedResourceVar + " as ?resource) filter (" + linkedResourceVar + " in (" + resourceIdStr + ")) ";
                                 }
                                 else {
                                     corpusLevels.forEach(function (item, index) {
                                         if (index > 0 && okDistinctSelect) {
                                             if (corpusAggrLevel != item.label) {
                                                 query += " ?" + corpusLevels[index - 1].label + " ^skos:broader ?" + item.label + ".";
                                             } else {
                                                 query += " ?" + corpusLevels[index - 1].label + " ^skos:broader ?resource ." + "filter (?resource in (" + resourceIdStr + ")) "
                                                 okDistinctSelect = false;
                                             }
                                         }
                                     })
                                 }*/


                            query += "}" +
                                " GROUP BY    ?entity ?entityLabel ?entityType ?resource" +
                                " limit 10000 "


                            var url = app_config.sparql_url + "?default-graph-uri=&query=";// + query + queryOptions
                            var queryOptions = "&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=20000&debug=off"
                            sparql.querySPARQL_GET_proxy_cursor(url, query, queryOptions, null, function (err, result) {
                                if (err) {
                                    return callbackEach(err);
                                }
                                resourcesConcepts = resourcesConcepts.concat(result.results.bindings);
                                callbackEach();

                            })
                        }, function (err) {
                            common.message("<br>AssociatedConcepts : " + Math.round(resourcesConcepts.length / 2), true)  // pourquoi /2 ???
                            callbackSeries(err);
                        })
                    },


                    // get concepts infos
                    function (callbackSeries) {
                        var conceptsIds = []

                        resourcesConcepts.forEach(function (item) {
                            if (conceptsIds.indexOf(item.entity.value) < 0) {
                                conceptsIds.push(item.entity.value);
                                var entityType = item.entityType.value;
                                entityType = entityType.substring(entityType.lastIndexOf("/") + 1)
                                conceptsMap[item.entity.value] = {
                                    id: item.entity.value,
                                    countEntities: 0,
                                    type: entityType,
                                    ancestors: [],
                                    resources: []
                                }
                            }
                            conceptsMap[item.entity.value].resources.push(item.resource.value);
                            conceptsMap[item.entity.value].countEntities += parseInt(item.countEntities.value);

                        })


                        Concepts.getConceptsInfos(conceptsIds, {}, function (err, result) {
                            if (err)
                                return callbackSeries(err);

                            result.forEach(function (item, index) {
                                if (!conceptsMap[item.concept.value])
                                    return;
                                var type = conceptsMap[item.concept.value].type
                                conceptsMap[item.concept.value].ancestors.push({id: item.concept.value, label: item.conceptLabel.value, type: type})

                                for (var i = 1; i < 7; i++) {
                                    var broader = item["broaderId" + i];
                                    if (typeof broader !== "undefined") {
                                        //   if (topSelectedConcepts.indexOf(broader.value) < 0)
                                        conceptsMap[item.concept.value].ancestors.push({id: broader.value, label: item["broader" + i].value, type: type})
                                    }
                                }

                            })


                            callbackSeries();

                        })


                    }

                    ,


                    // draw  concepts jsTree
                    function (callbackSeries) {

                        var conceptsMapWithParents = {};
                        for (var key in conceptsMap) {
                            var leafCountEntities = conceptsMap[key].countEntities;
                            var resources = conceptsMap[key].resources;
                            //    var type = conceptsMap[key].type;
                            conceptsMap[key].ancestors.forEach(function (item, index) {
                                if (!conceptsMapWithParents[item.id]) {
                                    conceptsMapWithParents[item.id] = {id: item.id, text: item.label, data: {type: item.type, label: item.label, countEntities: 0, resources: []}};
                                }
                                conceptsMapWithParents[item.id].data.countEntities += leafCountEntities || 0;
                                conceptsMapWithParents[item.id].data.label = item.label;

                                conceptsMapWithParents[item.id].data.resources = conceptsMapWithParents[item.id].data.resources.concat(resources)

                                if (index < conceptsMap[key].ancestors.length - 1)
                                    conceptsMapWithParents[item.id].parent = conceptsMap[key].ancestors[index + 1].id;
                                else
                                    conceptsMapWithParents[item.id].parent = "#"


                            })
                        }

                        var jstreeData = [];

                        for (var key in conceptsMapWithParents) {
                            var item = conceptsMapWithParents[key]
                         //  var color = ontograph.entityTypeColors[item.data.type];
                            var color = self.conceptTypeColors[item.data.type]
                            if( !color){
                                self.conceptTypeColors[item.data.type]=graphController.palette[Object.keys(self.conceptTypeColors).length]
                            }

                            item.text = "<span style='background-color:" + color + "'>" + item.text + " (" + item.data.countEntities + ")</span>"
                            jstreeData.push(conceptsMapWithParents[key])
                        }
                        jstreeData.sort(function (a, b) {
                            if (a.text > b.text)
                                return 1;
                            if (a.text < b.text)
                                return -1;
                            return 0;
                        })
                        $("#lefTabs").tabs("option", "active", 1);
                        common.loadJsTree("jstreeFilterConceptsDiv", jstreeData, {
                            withCheckboxes: 1,
                            //  openAll: true,
                            selectDescendants: true,
                            searchPlugin: true,
                            onCheckNodeFn: function (evt, obj) {
                                filterGraph.alterGraph.onFilterConceptsChecked(evt, obj);
                            },
                            onUncheckNodeFn: function (evt, obj) {
                                filterGraph.alterGraph.onFilterConceptsChecked(evt, obj);
                            }

                        })
                        callbackSeries();


                    }


                ],

                function (err) {
                    if (err)
                        return;
                    common.message(err)

                }
            )
        },


        onFilterConceptsChecked: function (event, obj) {


            var resources = obj.node.data.resources;
            var conceptId = obj.node.id;
            var conceptType = obj.node.data.type;
            var countConcepts = obj.node.data.countEntities;

            var conceptLabel = obj.node.data.label;


            var visjsData = {nodes: [], edges: []}

            var existingNodes = visjsGraph.data.nodes.getIds();
            var existingEdges = visjsGraph.data.edges.getIds();
            var uniqueNodes = []
            var uniqueEdges = []


            if (event.type == "uncheck_node") {
                visjsGraph.data.nodes.remove(conceptId)
            } else {


                if (existingNodes.indexOf(conceptId) < 0 && uniqueNodes.indexOf(conceptId) < 0) {
                    uniqueNodes.push(conceptId)
                    //  var type = item.entityType.value.substring(item.entityType.value.lastIndexOf("/") + 1);
                 //   var color=ontograph.entityTypeColors[conceptType]
                    var color=self.conceptTypeColors[conceptType]

                    visjsData.nodes.push({
                        id: conceptId,
                        label: conceptLabel,
                        shape: "box",
                        color: color,
                        data: {ancestors: []},


                    })
                }
                resources.forEach(function (resourceId) {
                    var edgeId = resourceId + "_" + conceptId;
                    if (existingEdges.indexOf(edgeId) < 0 && uniqueEdges.indexOf(edgeId) < 0) {
                        uniqueEdges.push(edgeId);
                        visjsData.edges.push({
                            id: edgeId,
                            from: resourceId,
                            to: conceptId,
                            //  arrows: "to",
                            // dashes: [5, 5],
                            value: countConcepts
//
                        })
                    }
                })
                ontograph.drawGraph(visjsData, {addToGraph: 1})
            }
        }
        ,


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
                            if (label.length > app_config.visjsGraph.maxLabelLength)
                                label = label.substring(0, app_config.visjsGraph.maxLabelLength) + "..."
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


        }
        ,


        addResourcesParentsToGraph: function (selectedResourceId) {
            var existingNodes = visjsGraph.data.nodes.get();
            var existingNodeIds = visjsGraph.data.nodes.getIds();
            var existingEdgeIds = visjsGraph.data.edges.getIds();


            var visjsData = {nodes: [], edges: []}
            var uniqueNodes = []
            var uniqueEdgeIds = []

            Corpus.getCurrentResourcesParents(function (err, result) {
                result.forEach(function (item) {
                    if (existingNodeIds.indexOf(item.broader.value) < 0 && uniqueNodes.indexOf(item.broader.value) < 0) {
                        uniqueNodes.push(item.broader.value);
                        Corpus.currentResourceIds.push(item.broader.value)
                        visjsData.nodes.push({
                            id: item.broader.value,
                            label: item.broaderLabel.value,
                            data: {type: "resource"}
                        })
                    }
                    var edgeId = item.concept.value + "_" + item.broader.value
                    if (existingEdgeIds.indexOf(edgeId) < 0 && uniqueEdgeIds.indexOf(edgeId) < 0) {
                        uniqueEdgeIds.push(edgeId);
                        visjsData.edges.push({
                            id: edgeId,
                            from: item.concept.value,
                            to: item.broader.value,
                        })
                    }

                })
                ontograph.drawGraph(visjsData, {addToGraph: 1})
            })




        }
        ,

        conceptInfos: function (resourceId) {
            Infos.showInfos(resourceId);
        },

        hideConcept: function (conceptId) {
            $("#jstreeFilterConceptsDiv").jstree(true).uncheck_node(conceptId)
        },


        expandConcept: function (conceptId) {

            var node = $("#jstreeFilterConceptsDiv").jstree(true).get_node(conceptId)
            if (node.children.length > 0)
                $("#jstreeFilterConceptsDiv").jstree(true).uncheck_node(conceptId)
            node.children.forEach(function (child) {
                $("#jstreeFilterConceptsDiv").jstree(true).check_node(child)

            })
        },
        showResourceParents: function (resourceId) {
            self.alterGraph.addResourcesParentsToGraph(resourceId)
        },

        expandResource: function (resourceId) {


            var conceptIdsStr = "";
            var existingNodes = visjsGraph.data.nodes.getIds();
            existingNodes.forEach(function (id, index) {
                if (id.indexOf("/vocabulary/") > -1) {
                    if (conceptIdsStr != "")
                        conceptIdsStr += ","
                    conceptIdsStr += "<" + id + ">"
                }
            })
            var query = " select * where { ?childResource skos:broader  <" + resourceId + ">. ?childResource terms:subject ?concept. filter (?concept in (" + conceptIdsStr + "))} limit 5000"

            var url = app_config.sparql_url + "?default-graph-uri=&query=";// + query + queryOptions
            var queryOptions = "&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=20000&debug=off"
            sparql.querySPARQL_GET_proxy_cursor(url, query, queryOptions, null, function (err, result) {
                if (err) {
                    return common.message(err);
                }


            })


        },
        hideResource: function (conceptId) {
            $("#jstreeFilterConceptsDiv").jstree(true).uncheck_node(conceptId)
        },
        showResourceConcepts: function (resourceId) {

        },

        resourceInfos: function (resourceId) {
            Infos.showInfos(resourceId);

        },


        ShowCooccurrences: function () {
            var existingNodes = visjsGraph.data.nodes.get();
            var existingEdges = visjsGraph.data.edges.get();
            var existingNodeIds = visjsGraph.data.nodes.getIds();
            var existingEdgeIds = visjsGraph.data.edges.getIds();

            var existingNodesMap = {}
            existingNodes.forEach(function (node) {
                existingNodesMap[node.id] = node
            })

            var newNodes = [];
            var newNodeIds = [];
            var newNodesMap = {};
            var newEdges = [];
            var newEdgeIds = [];
            existingEdges.forEach(function (edge) {
                var paragraph;
                var concept;
                if (edge.from.indexOf("vocabulary") && edge.to.indexOf("vocabulary") < 0) {
                    paragraph = edge.to;
                    concept = edge.from;
                } else if (edge.to.indexOf("vocabulary") && edge.from.indexOf("vocabulary") < 0) {
                    paragraph = edge.to;
                    concept = edge.from;
                } else
                    return;

                if (!newNodesMap[paragraph]) {
                    newNodesMap[paragraph] = {concepts: {}}
                }
                if (!newNodesMap[paragraph].concepts[concept])
                    newNodesMap[paragraph].concepts[concept] = 0;
                newNodesMap[paragraph].concepts[concept] += 1;


            })

            for (var key in newNodesMap) {
                var concepts = newNodesMap[key].concepts;
                for (var concept1 in concepts) {
                    if (newNodeIds.indexOf(concept1) < 0) {
                        newNodeIds.push(concept1)
                        newNodes.push(existingNodesMap[concept1])

                    }
                    for (var concept2 in concepts) {
                        if (concept2 != concept1) {
                            var edgeId = concept1 + "_" + concept2;

                            if (newEdgeIds.indexOf(edgeId) < 0) {
                                if (newEdgeIds.indexOf(concept2 + "_" + concept1) < 0)
                                    newNodeIds.push(edgeId)
                                newEdges.push({
                                    id: edgeId,
                                    from: concept1,
                                    to: concept2,
                                    value: 3


                                })
                            }
                        }
                    }
                }
            }
            var visjsData = {nodes: newNodes, edges: newEdges};

            ontograph.drawGraph(visjsData)

        }
    }
    self.getConceptsRootTypeMap = function () {
        var map = {};
        var xx = $("#jstreeFilterConceptsDiv").jstree(true).get_checked(true)
        xx.forEach(function (node) {
            var typeId;
            var typeLabel;
            if (node.parents.length > 1)
                typeId = node.parents[node.parents.length - 2];
            else
                typeId = map[node.id];
            var typeNode = $("#jstreeFilterConceptsDiv").jstree(true).get_node(typeId);
            if (typeNode.data) {
                typeLabel = $("#jstreeFilterConceptsDiv").jstree(true).get_node(typeId).data.label
                map[node.id] = {id: typeId, label: typeLabel};
            }

        });
        return map;
    };


    self.showConceptsHeatMap = function () {

        var conceptsRootTypeMap = filterGraph.getConceptsRootTypeMap()


        var existingNodes = visjsGraph.data.nodes.get();
        var nodesMap = {}
        existingNodes.forEach(function (node) {
            nodesMap[node.id] = node
        })
        //   var existingEdges = visjsGraph.data.edges.get();
        var newNodes = [];
        var newEdges = [];

        var visjsData = {nodes: [], edges: []}
        var nodesToRemove = []
        existingNodes.forEach(function (node) {
            if (node.data.type == "resource") {
                nodesToRemove.push(node.id)

            } else {
                visjsData.nodes.push(node)
            }
        })

        nodesToRemove.forEach(function (node) {
            var edges = visjsGraph.network.getConnectedEdges(node);
            var newEdgesNodes = []
            edges.forEach(function (edgeId) {
                var edge = visjsGraph.data.edges.get(edgeId)
                if (edge.from == node) {
                    newEdgesNodes.push(edge.to)
                }
                if (edge.to == node) {
                    newEdgesNodes.push(edge.to)
                }
            })

            //connect all entities nodes common to resource
            newEdgesNodes.forEach(function (node1) {
                newEdgesNodes.forEach(function (node2) {
                    if (node1 == node2)
                        return;
                    var edgeId = node1 + "_" + node2
                    var inverseEdgeId = node2 + "_" + node1
                    var p, q;
                    if ((p = newEdges.indexOf(edgeId)) < 0 && (q = newEdges.indexOf(inverseEdgeId)) < 0) {

                        newEdges.push(edgeId)
                        visjsData.edges.push({
                            id: edgeId,
                            from: node1,
                            to: node2,
                            value: 1,
                            fromLabel: nodesMap[node1].label,
                            toLabel: nodesMap[node2].label,
                            fromType: conceptsRootTypeMap[node1],
                            toType: conceptsRootTypeMap[node2]

                        })

                    } else {
                        var j = Math.max(p, q);
                        if (j > -1)
                            visjsData.edges[j].value += 1
                    }
                })

            })
        })


        //   ontograph.drawGraph(visjsData,)


        //set conceptTypes

        function getConceptsCoocMatrix(data, xType, yType) {
            var xValues = {}
            var yValues = {};

            data.forEach(function (item, index) {
                var xValue = item.from;
                var yValue = item.to;
                var valueValue = item.value;
                if(!item.fromType ||!item.fromType.label )
                   return;
                if ( item.fromType.label == xType) {
                    if (!xValues[xValue])
                        xValues[xValue] = {label: item.fromLabel, rels: []}
                    if (xValues[xValue].rels.indexOf(index) < 0)
                        xValues[xValue].rels.push(index)
                }
                if (item.toType.label == xType) {
                    if (!xValues[yValue])
                        xValues[yValue] = {label: item.toLabel, rels: []}
                    if (xValues[yValue].rels.indexOf(index) < 0)
                        xValues[yValue].rels.push(index)
                }
                if (item.fromType.label == yType) {
                    if (!yValues[xValue])
                        yValues[xValue] = {label: item.fromLabel, rels: []}
                    if (yValues[xValue].rels.indexOf(index) < 0)
                        yValues[xValue].rels.push(index)
                }
                if (item.toType.label == yType) {
                    if (!yValues[yValue])
                        yValues[yValue] = {label: item.toLabel, rels: []}
                    if (yValues[yValue].rels.indexOf(index) < 0)
                        yValues[yValue].rels.push(index)
                }

            })

            var X = []
//init with 0
            for (var xKey in xValues) {
                var line = []
                for (var yKey in yValues) {
                    line.push(0)
                }
                X.push(line)
            }

            var xIndex = 0;
            var x = [];
            var y = [];
            for (var xKey in xValues) {
                x.push({id: xKey, label: xValues[xKey].label})


                var yIndex = 0;
                for (var yKey in yValues) {//interscetion
                    if (xIndex == 0)
                        y.push({id: yKey, label: yValues[yKey].label})
                    yValues[yKey].rels.forEach(function (dataIndex) {
                        if (xValues[xKey].rels.indexOf(dataIndex) > -1)
                            X[xIndex][yIndex] = data[dataIndex].value
                    })
                    yIndex += 1
                }
                xIndex += 1
            }
            return {X: X, x: x, y: y}
        }


            var w = 500;
            var h = 500;

            var types=[]
        for (var key in conceptsRootTypeMap){
            var type=conceptsRootTypeMap[key].label
            if(types.indexOf(type)<0)
            types.push(type)
        }
        if(types.length!=2){
            return alert("heat map must concern only two different concept types")
        }
            var obj = getConceptsCoocMatrix(visjsData.edges, types[0], types[1])
            var heatMapData = Heatmap.getHeatMapData(obj.X,obj.x,obj.y,h,w);

         //   var heatMapData = Heatmap.bindCanvasSquareHeatMapData(visjsData.edges, "from", "to", "value", nodesMap, h, w)
            //var heatMapData = Heatmap.bindCanvasConceptTypeHeatMapData(visjsData.edges, "Failure Mechanism", "Retained Action", "value", nodesMap, h, w)
            var html = "<div style='display: flex;flex-direction: row'>" +
                "<div id='chart' style='width:" + h + "px;height: " + w + "px'></div>" +
                "<div id='heatMapParagraphsDiv'></div>" +
                "</div>"

            $("#dialogDiv").html(html);
            $("#dialogDiv").dialog("open");
            var options = {
                graphDiv: "chart",
                onclickFn: Heatmap.onCellClick
            }
            drawCanvas.drawData(heatMapData, options, function (err, result) {

            })


            /*
                        var html="<div id=\"chart\"></div>"
                     //   $("#dialogDiv").width(800);
                      //  $("#dialogDiv").height(800);
                        $("#dialogDiv").html(html);
                        $("#dialogDiv").dialog("open")

                        var chart = c3.generate({
                            data: {
                                columns: [
                                    ['data1', 30, 200, 100, 400, 150, 250],
                                    ['data2', 50, 20, 10, 40, 15, 25]
                                ]
                            }
                        });

            */


        }


        return self;

    }
)
()
