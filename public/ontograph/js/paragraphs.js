var paragraphs = (function () {

    var self = {};

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

                {
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

    self.sparql_getEntitiesParagraphs = function (idCorpus, idConcepts, options, callback) {
        if (!options)
            options = {minManadatoryEntities: 2}
        var queryCorpus = ""
        var queryConcept = ""
        var countParagraphMin = 20
        if (idCorpus) {
            if (idCorpus.indexOf("/Domain/") > -1) {
                countParagraphMin = 20;
                queryCorpus += "?paragraph  skos:broader ?chapter ."
                queryCorpus += "?chapter  skos:broader ?document ."
                queryCorpus += "?document  skos:broader ?document_type ."
                queryCorpus += "?document_type  skos:broader ?branch."
                queryCorpus += "?branch   skos:broader <" + idCorpus + ">."
            }
            if (idCorpus.indexOf("/Branch/") > -1) {
                countParagraphMin = 10;
                queryCorpus += "?paragraph  skos:broader ?chapter ."
                queryCorpus += "?chapter  skos:broader ?document ."
                queryCorpus += "?document  skos:broader ?document-type ."
                queryCorpus += "?document-type   skos:broader <" + idCorpus + ">."
            }
            if (idCorpus.indexOf("/Document-type/") > -1) {
                countParagraphMin = 5;
                queryCorpus += "?paragraph  skos:broader ?chapter ."
                queryCorpus += "?chapter  skos:broader ?document ."
                queryCorpus += "?document   skos:broader <" + idCorpus + ">."
            }
            if (idCorpus.indexOf("/Document/") > -1) {
                countParagraphMin = 2;
                queryCorpus += "?paragraph  skos:broader ?chapter ."
                queryCorpus += "?chapter   skos:broader <" + idCorpus + ">."
            }
            if (idCorpus.indexOf("/Chapter/") > -1) {
                countParagraphMin = 1;
                queryCorpus += "?paragraph  skos:broader <" + idCorpus + ">."
            }

            if (idConcepts) {
                var entityIdsStr = ""
                idConcepts.forEach(function (id, index) {
                    if (index > 0)
                        entityIdsStr += ","
                    entityIdsStr += "<" + id + ">"
                })
                queryConcept += " filter (?entity1 in(\" + entityIdsStr + \"))"
            }


        }
        var url = sparql.source.sparql_url + "?default-graph-uri=&query=";// + query + queryOptions
        var query = "   PREFIX terms:<http://purl.org/dc/terms/>" +
            "        PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#>" +
            "        PREFIX rdfsyn:<https://www.w3.org/1999/02/22-rdf-syntax-ns#>" +
            "PREFIX mime:<http://purl.org/dc/dcmitype/> " +
            "" +
            "        select *" +
            "        where{ "

        idConcepts.forEach(function (id, index) {
            if (index >= options.minManadatoryEntities)
                query += "OPTIONAL {"
            query +=
                "  ?paragraph terms:subject ?entity" + index + " . " +
                "    FILTER (?entity" + index + " in(<" + id + ">))" +
                "  ?entity" + index + " rdfs:label ?entity" + index + "Label . " +
                "  FILTER (lang(?entity" + index + "Label)=\"en\") " +
                "  ?entity" + index + " rdfsyn:type ?entity" + index + "Type .  " +
                "    "

            if (index >= options.minManadatoryEntities)
                query += "}"

        })
        query += "?paragraph terms:subject ?entity22 .  ?entity22 rdfsyn:type ?entity22Type . ?entity22 rdfs:label ?entity22Label . filter (?entity22!=?entity1  && ?entity22!=?entity0)";

        query += queryCorpus
        query += "    } limit 1000"


        var queryOptions = "&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=5000&debug=on"
        sparql.querySPARQL_GET_proxy(url, query, queryOptions, null, function (err, result) {
            if (err) {
                return callback(err);
            }
            var bindings = [];
            var ids = [];
            return callback(null, result.results.bindings);


        })

    }

    self.drawEntitiesParagraphsGraph = function (selectedEntities, data) {
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

        data.forEach(function (item, indexLine) {


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


            // entities level 2 linked to paragraphs
            if (uniqueNodeIds.indexOf(item.entity22.value) < 0) {
                uniqueNodeIds.push(item.entity22.value)
                var type = item.entity22Type.value.substring(item.entity22Type.value.lastIndexOf("/") + 1)
                var node = {
                    label: item.entity22Label.value,
                    id: item.entity22.value,
                    color: ontograph.entityTypeColors[type],
                    data: {type: type},
                    shape: "box",

                }
                visjsData.nodes.push(node)
            }
            var edgeId = paragraphId + "_" + item.entity22.value
            if (uniqueEdgesIds.indexOf(edgeId) < 0) {
                uniqueEdgesIds.push(edgeId)
                var edge = {
                    from: paragraphId,
                    to: item.entity22.value,
                    id: edgeId,

                }
                visjsData.edges.push(edge)
            }


            {
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
            ontograph.getParagraphsDetails(slice, function (err, result) {
                if (err)
                    return callbackEach(err);
                callbackEach();
            })
        })
        //  $("#graphDiv").width($(window).width() - 20)
        visjsGraph.draw("graphDiv", visjsData, {
            onclickFn: ontograph.onNodeClick,
            onHoverNodeFn: ontograph.onNodeHover,
            afterDrawing: function () {
                $("#waitImg").css("display", "none")
            }
        })

    }


    return self;


})();
