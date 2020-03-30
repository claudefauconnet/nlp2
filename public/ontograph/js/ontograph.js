var ontograph = (function () {

    var self = {};

    self.context = {}
    self.context.conceptsMap = {};
    self.context.currentParagraphs = {};
    var uniqueNodeIds = [];
    var uniqueEdgesIds = [];
    self.entityTypeColors = {

        "Equipment": "#F5B8F9",
        "Component": "#FFD000",
        "Phenomenon ": "#91F7C1",
        "Characterisation": "#91D3F7",
        "Method": "#BCD2FF",



        "clusteredEntities":"#a51544",
        "paragraph":"#ddd",
    }




    self.searchItem = function (word) {
        self.context.conceptsMap = {}
        sparql.listEntities(word, null, function (err, result) {
            if (err)
                return $("#messageDiv").html(err);
            var entityTypesMap = {}
            result.forEach(function (item) {
                self.context.conceptsMap[item.entity.value] = item;
                if (!entityTypesMap[item.entityTypeLabel.value])
                    entityTypesMap[item.entityTypeLabel.value] = {entityType: item.entityType.value, entities: []}
                entityTypesMap[item.entityTypeLabel.value].entities.push(item);

            })

            var nodes = [];
            for (var key in entityTypesMap) {
                var type = key.substring(key.lastIndexOf("/") + 1)
                nodes.push({
                    text: "<span class='tree_level_1' style='background-color: " + self.entityTypeColors[type] + "'>" + key + "</span>",
                    id: entityTypesMap[key].entityType, parent: "#"
                })
                entityTypesMap[key].entities.forEach(function (entity) {

                    nodes.push(
                        {
                            text: entity.entityLabel.value,
                            id: entity.entity.value,
                            parent: entity.entityType.value
                        })
                })
            }
            if ($('#conceptsJstreeDiv').jstree)
                $('#conceptsJstreeDiv').jstree("destroy")
            $("#conceptsJstreeDiv").jstree({

                "checkbox": {
                    "keep_selected_style": false
                },
                "plugins": ["checkbox"],
                "core": {
                    'check_callback': true,
                    'data': nodes
                }


            }).on('loaded.jstree', function () {
                $("#conceptsJstreeDiv").jstree(true).open_all();
            });
            ;


        })


    }



    self.displayGraphParagraphs = function () {
        $('#dialogDiv').dialog('close')

        var selectedEntities = []
        var xx = $("#conceptsJstreeDiv").jstree(true).get_checked(null, true)
        xx.forEach(function (nodeId) {
            if (self.context.conceptsMap[nodeId])
                selectedEntities.push(nodeId);

        });
        var xx = selectedEntities;

        var minManadatoryEntities = parseInt($("#minManadatoryEntities").val())
        sparql.queryEntitiesCooccurrencesParagraphs(selectedEntities, {minManadatoryEntities: minManadatoryEntities}, function (err, result) {
            if (err)
                return $("#messageDiv").html(err);

            var visjsData = {
                nodes: [],
                edges: []
            }

           uniqueNodeIds = [];
           uniqueEdgesIds = [];
            var visjNodes = [];

            var width = $(window).width();
            var height = $(window).height();
            var allParagraphIds = []

            result.forEach(function (item, indexLine) {


                var paragraphId = item.paragraph.value
                self.context.currentParagraphs[paragraphId] = item.paragraphText.value
                allParagraphIds.push(paragraphId)

                var paragraphIdStr = paragraphId.substring(paragraphId.lastIndexOf("/") + 1)

                if (uniqueNodeIds.indexOf(paragraphIdStr) < 0) {
                    uniqueNodeIds.push(paragraphIdStr)

                    var node = {
                        label: paragraphIdStr,
                        id: paragraphId,
                        color: self.entityTypeColors["paragraph"],
                        shape: "ellipse",
                        /*   x: x1,
                           y: (y1 += y1Offset),
                           fixed: {x: false, y: false}*/

                    }
                    visjsData.nodes.push(node)
                }
                if (false) { // draw each entity selected in main dialog
                    selectedEntities.forEach(function (entity, index) {
                        if (!item["entity" + index]) //optional
                            return;

                        var entityId = item["entity" + index].value
                        var entityLabel = item["entity" + index + "Label"].value
                        var type = item["entity" + index + "Type"].value
                        type = type.substring(type.lastIndexOf("/") + 1)

                        if (uniqueNodeIds.indexOf(entityId) < 0) {
                            uniqueNodeIds.push(entityId)

                            var node = {
                                label: entityLabel,
                                id: entityId,
                                color: self.entityTypeColors[type],
                                shape: "box",
                                /*   x: x1,
                                   y: (y1 += y1Offset),
                                   fixed: {x: false, y: false}*/

                            }
                            visjsData.nodes.push(node)
                        }

                        //  var previousEntityId = item["entity" + (index - 1)].value
                        var edgeId = paragraphId + "_" + entityId
                        if (uniqueEdgesIds.indexOf(edgeId) < 0) {
                            uniqueEdgesIds.push(edgeId)
                            var edge = {
                                from: paragraphId,
                                to: entityId,
                                id: edgeId,

                            }
                            visjsData.edges.push(edge)
                        }

                    })
                } else {// a single noe for selected entities in main dialog
                    var clusterId = "";
                    var clusterLabel = "";
                    selectedEntities.forEach(function (entity, index) {
                        if (!item["entity" + index]) //optional
                            return;
                        var entityId = item["entity" + index].value
                        uniqueNodeIds.push(entityId);
                        if (index > 0) {

                            clusterLabel += " + "
                        }
                        clusterId += "_"
                        clusterId += entityId
                        clusterLabel += item["entity" + index + "Label"].value

                    })
                    if (uniqueNodeIds.indexOf(clusterId) < 0) {
                        uniqueNodeIds.push(clusterId)
                        var node = {
                            label: clusterLabel,
                            id: clusterId,
                            color: self.entityTypeColors["clusteredEntities"],
                            shape: "box",
                            font: {size: 18, color:"white"}


                        }
                        visjsData.nodes.push(node)
                    }


                    var edgeId = paragraphId + "_" + clusterId
                    if (uniqueEdgesIds.indexOf(edgeId) < 0) {
                        uniqueEdgesIds.push(edgeId)
                        var edge = {
                            from: paragraphId,
                            to: clusterId,
                            id: edgeId,

                        }
                        visjsData.edges.push(edge)
                    }


                }
            })

            var paragraphSlices = [];
            var slice = [];
            allParagraphIds.forEach(function (paragraph) {
                if(paragraph.indexOf("20")>-1)
                    var x=3
                slice.push(paragraph)
                if (slice.length > 50) {
                    paragraphSlices.push(slice);
                    slice = [];
                }
            })
            paragraphSlices.push(slice);

            async.eachSeries(paragraphSlices, function (slice, callbackEach) {

                sparql.queryParagraphsEntities(slice, null, function (err, result) {
                    if (err)
                        return callbackEach(err);
                    result.forEach(function (item, indexLine) {
                        var index = 0;
                        var paragraphId = item.paragraph.value;


                        var entityId = item["entity" + index].value
                        var entityLabel = item["entity" + index + "Label"].value
                        var type = item["entity" + index + "Type"].value
                        type = type.substring(type.lastIndexOf("/") + 1)

                        if (uniqueNodeIds.indexOf(entityId) < 0) {
                            uniqueNodeIds.push(entityId)

                            var node = {
                                label: entityLabel,
                                id: entityId,
                                color: self.entityTypeColors[type],
                                shape: "box",
                                /*   x: x1,
                                   y: (y1 += y1Offset),
                                   fixed: {x: false, y: false}*/

                            }
                            visjsData.nodes.push(node)
                        }

                        //  var previousEntityId = item["entity" + (index - 1)].value
                        var edgeId = paragraphId + "_" + entityId
                        if (uniqueEdgesIds.indexOf(edgeId) < 0) {
                            uniqueEdgesIds.push(edgeId)
                            var edge = {
                                from: paragraphId,
                                to: entityId,
                                id: edgeId,

                            }
                            visjsData.edges.push(edge)
                        }

                    })
                    callbackEach();


                })
            }, function (err, result) {
                $("#graphDiv").width($(window).width() - 20)

                visjsGraph.draw("graphDiv", visjsData, {
                    onclickFn: ontograph.onNodeClick,
                    onHoverNodeFn: ontograph.onNodeHover,
                    afterDrawing: function () {
                        $("#waitImg").css("display", "none")
                    }
                })
            })


        })


    }


    self.onNodeHover = function (obj, point) {
        $("#messageDiv").html("");
        var text = self.context.currentParagraphs[obj.id]
        if (text)
            $("#messageDiv").html(text);
    }

    self.onNodeClick = function (obj, point) {
        if (obj.id.indexOf("Entity") > 0) {
            sparql.queryEntitiesCooccurrencesParagraphs([obj.id], {minManadatoryEntities: 1}, function (err, result) {
                if (err)
                    return console.log(err);
                ontograph.addChildrenNodesToGraph(obj.id, result)
            })


        } else if (obj.id.indexOf("Paragraph") > 0) {
            sparql.queryParagraphsEntities([obj.id], {}, function (err, result) {
                if (err)
                    return console.log(err);
                ontograph.addChildrenNodesToGraph(obj.id, result)
            })


        }
    }

    self.addChildrenNodesToGraph = function (parentNodeId, children) {

        self.context.newNodes = [];
        self.context.newEdges = [];
        var existingNodes = visjsGraph.data.nodes.getIds();
        var existingEdges = visjsGraph.data.edges.getIds();

        var color = parent.color;
        children.forEach(function (item) {
            var size = 12;
            var shape;
            var childId;
            var childLabel;
            if (parentNodeId.indexOf("Entity") > -1) {
                childId = item.paragraph.value
                self.context.currentParagraphs[childId] = item.paragraphText.value
                childLabel = childId.substring(childId.lastIndexOf("/") + 1)
                shape = "ellipse"
            } else if (parentNodeId.indexOf("Paragraph") > -1) {

                childId = item.entity0.value
                childLabel = item.entity0Label.value
                shape = "box"

            }

            if (existingNodes.indexOf(childId) < 0 && uniqueNodeIds.indexOf(childId)<0) {
                existingNodes.push(childId)
                self.context.newNodes.push({
                    label: childLabel,
                    id: childId,
                    shape: shape,
                    color:  self.entityTypeColors["paragraph"],

                })
                var edgeId = parentNodeId + "_" + childId
                if (existingEdges.indexOf(edgeId) < 0  && uniqueEdgesIds.indexOf(edgeId)<0) {
                    self.context.newEdges.push({
                        from: parentNodeId,
                        to: childId,
                        id: edgeId,
                        dashes: [5, 5]

                    })
                }
            }
        })
        visjsGraph.data.nodes.add(self.context.newNodes)
        visjsGraph.data.edges.add(self.context.newEdges)
        self.context.selectedNode = parent;


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

    return self;

})
()
