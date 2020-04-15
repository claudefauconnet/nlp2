var ontograph = (function () {

    var maxEntitiesEdgeBeforeFiltering = 30


    var self = {};

    self.context = {}
    self.context.conceptsMap = {};
    self.context.currentParagraphs = {};
    var uniqueNodeIds = [];
    var uniqueEdgesIds = [];


    self.entityTypeColors = {

        "Equipment": "#F5B8F9",
        "Component": "#FFD000",
        "Phenomenon": "#91F7C1",
        "Characterisation": "#91D3F7",
        "Method": "#BCD2FF",

        "technology-equipment": "#F5B8F9",
        "technology-component": "#FFD000",
        "technology-phenomenon": "#91F7C1",
        "technology-characterisation": "#91D3F7",
        "technology-method": "#BCD2FF",
        "technology-product": "#F99393",

        "EQUIPMENT": "#F5B8F9",
        "COMPONENT": "#FFD000",
        "PHENOMENON": "#91F7C1",
        "CHARACTERISATION": "#91D3F7",
        "METHOD": "#BCD2FF",
        "PRODUCT": "#F99393",


        "clusteredEntities": "#a51544",
        "paragraph": "#ddd",
        "anyEntity":"#FFD000"
    }
    self.entityTypeDictionary = {
        "technology-equipment": "EQUIPMENT",
        "technology-component": "COMPONENT",
        "technology-phenomenon": "PHENOMENON",
        "technology-characterisation": "CHARACTERISATION",
        "Characterisation": "CHARACTERISATION",
        "technology-method": "METHOD",
        "technology-product": "PRODUCT",
    }

    self.getTypeFromEntityUri = function (uri) {
        var array = uri.split("/")
        return array[array.length - 2]

    }

    self.showSearchDialog = function (searchPanel) {
        $('#dialogDiv').dialog('open')
        if (searchPanel) {
            $("#filteredEntitiesPanel").css("display", "none");
            $("#searchPanel").css("display", "flex");
        }
    }
    self.searchItem = function (word) {
        self.context.conceptsMap = {}
        sparql.listEntities(word, null, function (err, result) {
            if (err)
                return $("#messageDiv").html(err);
            var entityTypesMap = {}
            result.forEach(function (item) {
                self.context.conceptsMap[item.entity.value] = item;
                var type = self.getTypeFromEntityUri(item.entity.value);
                if (!entityTypesMap[type])
                    entityTypesMap[type] = {entityType: type, entities: []}
                entityTypesMap[type].entities.push(item);

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
                            parent: key
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

    self.getSelectedEntities = function (jstreeDiv) {
        if(!jstreeDiv)
            jstreeDiv="jstreeConceptDiv";
        var selectedEntities = []
        var xx = $("#"+jstreeDiv).jstree(true).get_checked(null, true)
        xx.forEach(function (nodeId) {
            if (self.context.conceptsMap[nodeId])
                selectedEntities.push(nodeId);

        });
        return selectedEntities;
    }










    self.drawGraph = function (visjsData, options) {
        if (!options)
            options = self.context.currentGraphOptions;
        if (!options)
            options = {};
        if (options.addToGraph) {
            var visjsDataAdd = {nodes: [], edges: []}
            self.context.newNodes = [];
            self.context.newEdges = [];
            var existingNodes = visjsGraph.data.nodes.getIds();
            var existingEdges = visjsGraph.data.edges.getIds();

            var color = parent.color;
            visjsData.nodes.forEach(function (node) {

                if (existingNodes.indexOf(node.id) < 0) {
                    visjsDataAdd.nodes.push(node)
                }
            })
            visjsData.edges.forEach(function (edge) {
                if (existingEdges.indexOf(edge.id) < 0) {
                    visjsDataAdd.edges.push(edge)
                }
            })
            visjsGraph.data.nodes.add(visjsDataAdd.nodes)
            visjsGraph.data.edges.add(visjsDataAdd.edges)

            /*  for (var edgeId in totalTypeOccurences) {
                  var edge = {id: edgeId, value: totalTypeOccurences[edgeId]}
                  visjsGraph.data.edges.update(edge)
              }*/

        } else {
          //  $("#graphDiv").width($(window).width() - 20)
            visjsGraph.draw("graphDiv", visjsData, {
                onclickFn: options.onclickFn,
                onHoverNodeFn: options.onHoverNodeFn,
                afterDrawing: function () {
                    $("#waitImg").css("display", "none")
                    /*  if (totalTypeOccurences) {
                          for (var edgeId in totalTypeOccurences) {
                              var edge = {id: edgeId, value: totalTypeOccurences[edgeId]}
                              visjsGraph.data.edges.update(edge)
                          }

                      }*/
                }
            })
        }

    }


    self.getParagraphsDetails = function (paragraphsIds, callback) {
        sparql.queryParagraphsDetails(paragraphsIds, {containers: 1}, function (err, result) {
                if (err)
                    return callback(err);
                var containers = result;
                sparql.queryParagraphsDetails(paragraphsIds, {offsets: 1}, function (err, result) {
                    var offsets = result;
                    var texts = [];

                    containers.forEach(function (item) {
                        var container = item.container.value;
                        var idParagraph = item.paragraph.value;
                        var documentLabel = null;
                        if (item.documentLabel)
                            documentLabel = item.documentLabel.value;
                        if (!self.context.currentParagraphs[idParagraph])
                            self.context.currentParagraphs[idParagraph] = {id: idParagraph, containers: [], offsets: []}
                        if (self.context.currentParagraphs[idParagraph].containers.indexOf(container) < 0)
                            self.context.currentParagraphs[idParagraph].containers.push(container);
                        if (documentLabel && !self.context.currentParagraphs[idParagraph].documentLabel)
                            self.context.currentParagraphs[idParagraph].documentLabel = documentLabel;


                    })
                    offsets.forEach(function (item) {

                        var idParagraph = item.paragraph.value;
                        var text = item.paragraphText.value;
                        var offset = item.offset.value;
                        if (!self.context.currentParagraphs[idParagraph].text)
                            self.context.currentParagraphs[idParagraph].text = text;

                        if (self.context.currentParagraphs[idParagraph].offsets.indexOf(offset) < 0)
                            self.context.currentParagraphs[idParagraph].offsets.push(offset);
                    })


                    callback()

                })
            }
        )
    }


    self.onNodeHover = function (obj, point) {
        $("#messageDiv").html("");
        if (!self.context.currentParagraphs[obj.id])
            return
        var html = ""
        var text = self.context.currentParagraphs[obj.id].text
        var textRich = self.getEntichedParagraphText(obj.id);
        html += "<span class='paragraph-docTitle'>" + self.context.currentParagraphs[obj.id].documentLabel + "</span>&nbsp;";
        self.context.currentParagraphs[obj.id].containers.forEach(function (container) {
            var p = container.indexOf("_")

            if (p == 1)
                html += "<span class='paragraph-chapter'>" + container.substring(p + 1) + "</span>&nbsp;";

        })
        html += "<span class='text'>" + textRich + "</span>&nbsp;";
        //    html += "<span style='font-weight:bold'>" + text + "</span>&nbsp;";
        if (text)
            $("#paragraphTextDiv").html(html);
    }

    self.onNodeClick = function (obj, point) {
        if (obj.data.type && obj.data.type == "Entity") {
            if (self.context.currentGraphType == "displayGraphEntitiesCooccurrences") {
                cooccurrences.displayGraphEntitiesCooccurrences([obj.id], {addToGraph: true})

            } else if (self.context.currentGraphType == "displayGraphParagraphs") {
                sparql.queryEntitiesCooccurrencesParagraphs([obj.id], {minManadatoryEntities: 1}, function (err, paragraphs) {
                    if (err)
                        return console.log(err);

                    ontograph.addChildrenNodesToGraph(obj.id, paragraphs);
                    var paragraphIds = []
                    paragraphs.forEach(function (paragraph) {
                        paragraphIds.push(paragraph.paragraph.value)
                    })
                    ontograph.getParagraphsDetails(paragraphIds);
                })
            }


        }
        if (obj.data.type && obj.data.type == "Paragraph") {
            sparql.queryParagraphsEntities([obj.id], {}, function (err, result) {
                if (err)
                    return console.log(err);
                ontograph.addChildrenNodesToGraph(obj.id, result)
            })


        }
    }


    self.getEntichedParagraphText = function (paragraphId) {


        var allOffsets = []
        var allUniqueOffsets = []
        var obj = self.context.currentParagraphs[paragraphId]
        obj.offsets.forEach(function (offset) {
            var offsetArray = offset.split("|");
            if (allUniqueOffsets.indexOf(offsetArray[2] + "_" + offsetArray[3]) < 0) {
                allUniqueOffsets.push(offsetArray[2] + "_" + offsetArray[3])
                var type = offsetArray[0];
                //   type=type.substring(type.lastIndexOf("/")+1)
                allOffsets.push({type: type, start: parseInt(offsetArray[3]), end: parseInt(offsetArray[4])})
            }

        })

        var previousOffset = 0
        var chunks = [];

     //   obj.text=obj.text.replace(/\\n/g,"")
        allOffsets.forEach(function (offset, index) {
            chunks.push(obj.text.substring(previousOffset, offset.start))

            var color = self.entityTypeColors[offset.type]
            var newText = "<span style='background-color:" + color + "'>" + obj.text.substring(offset.start, offset.end) + "</span>"
            chunks.push(newText)
            previousOffset = offset.end

        })
        //  chunks.push(obj.text.substring(previousOffset))
        var htmlText = ""
        chunks.forEach(function (chunk, index) {

            htmlText += chunk
        })
        return htmlText;


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
            var type;
            var color;

            if (parentNodeId.indexOf("Paragraph") > -1) {

                childId = item.entity0.value
                childLabel = item.entity0Label.value
                shape = "box"
                type = "Entity"
                color = self.entityTypeColors[self.getTypeFromEntityUri(item.entity0.value)]

            } else if (parentNodeId.indexOf("Document") > -1) {
                childId = item;

                var array = parentNodeId.split("|")
                parentNodeId = array[0];
                var docLabel = array[1];
                if (existingNodes.indexOf(parentNodeId) < 0 && uniqueNodeIds.indexOf(parentNodeId) < 0) {
                    existingNodes.push(parentNodeId)
                    self.context.newNodes.push({
                        label: docLabel,
                        id: parentNodeId,
                        shape: "text",
                        data: {type: document},
                        //   color: "#003eff",
                        font: "12 arial blue"

                    })
                }

            } else {
                //  if (item.entity0Type.value.indexOf("Entity") > -1) {
                childId = item.paragraph.value

                childLabel = childId.substring(childId.lastIndexOf("/") + 1)
                shape = "ellipse"
                type = "Paragraph"
                color = self.entityTypeColors["paragraph"]
            }

            if (existingNodes.indexOf(childId) < 0 && uniqueNodeIds.indexOf(childId) < 0) {
                existingNodes.push(childId)
                self.context.newNodes.push({
                    label: childLabel,
                    id: childId,
                    shape: shape,
                    data: {type: type},
                    color: color,

                })
            }
            var edgeId = parentNodeId + "_" + childId
            if (existingEdges.indexOf(edgeId) < 0 && uniqueEdgesIds.indexOf(edgeId) < 0) {
                self.context.newEdges.push({
                    from: parentNodeId,
                    to: childId,
                    id: edgeId,
                    dashes: [5, 5]

                })
            }

        })
        visjsGraph.data.nodes.add(self.context.newNodes)
        visjsGraph.data.edges.add(self.context.newEdges)
        self.context.selectedNode = parent;


    }


    self.graphActions = {

        modifyGraph: function (action) {

            if (action == "showDocumentNodes") {
                var documentsMap = {};
                for (var key in self.context.currentParagraphs) {

                    var paragraphId = key;
                    var documentLabel = self.context.currentParagraphs[key].documentLabel;
                    var documentId = self.context.currentParagraphs[key].containers[0];

                    if (!documentsMap[documentId])
                        documentsMap[documentId] = {label: documentLabel, paragraphs: []};
                    documentsMap[documentId].paragraphs.push(paragraphId)
                }
                for (var key in documentsMap) {
                    ontograph.addChildrenNodesToGraph(key + "|" + documentsMap[key].label, documentsMap[key].paragraphs)
                }


            } else if (action == "hideParagraphs") {


            } else if (action == "expand") {


            }


        },


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
