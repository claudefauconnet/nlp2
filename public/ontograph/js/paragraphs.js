var paragraphs=(function(){

    var self={};

    self.displayGraphParagraphs = function () {
        $('#dialogDiv').dialog('close')
        ontograph.context.currentParagraphs = {};
        ontograph.context.currentGraphType = "displayGraphParagraphs"

        var selectedEntities = ontograph.getSelectedEntities();
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

                allParagraphIds.push(paragraphId)

                var paragraphIdStr = paragraphId.substring(paragraphId.lastIndexOf("/") + 1)

                if (uniqueNodeIds.indexOf(paragraphIdStr) < 0) {
                    uniqueNodeIds.push(paragraphIdStr)

                    var node = {
                        label: paragraphIdStr,
                        id: paragraphId,
                        color: ontograph.entityTypeColors["paragraph"],
                        data: {type: "Paragraph"},
                        shape: "ellipse",
                        /*   x: x1,
                           y: (y1 += y1Offset),
                           fixed: {x: false, y: false}*/

                    }
                    visjsData.nodes.push(node)
                }

                {// a single noe for selected entities in main dialog
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
                            color: ontograph.entityTypeColors["clusteredEntities"],
                            shape: "box",
                            font: {size: 18, color: "white"}


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
                if (paragraph.indexOf("20") > -1)
                    var x = 3
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
                        var type = ontograph.getTypeFromEntityUri(item["entity" + index].value)

                        if (uniqueNodeIds.indexOf(entityId) < 0) {
                            uniqueNodeIds.push(entityId)

                            var node = {
                                label: entityLabel,
                                id: entityId,
                                color: ontograph.entityTypeColors[type],
                                data: {type: "Entity"},
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
                    ontograph.getParagraphsDetails(slice, function (err, result) {
                        if (err)
                            return callbackEach(err);
                        callbackEach();
                    })


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






    return self;



})();
