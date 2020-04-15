var paragraphs = (function () {

    var self = {};
    self.currentGraphInfos = {}

    self.drawParagraphsEntitiesGraphAggr = function (data, conceptsInfosMap, options) {
        if (!options) {
            options = {
                conceptLevelAggr: 0,
                corpusLevelAggr: "paragraph",
            }

        }
        self.currentGraphInfos = {}
        var allCorpusIds = [];
        var uniqueNodeIds = []
        var uniqueEdgeIds = []
        var visjsData = {nodes: [], edges: []}

        data.forEach(function (item, indexLine) {
                var corpusId;
                var corpusLabel;
                if (options.corpusLevelAggr == "paragraph") {
                    corpusId = item.paragraph.value;
                    corpusLabel = corpusId.substring(corpusId.lastIndexOf("/" + 1));
                } else {
                    if (!item[options.corpusLevelAggr])
                        return;
                    corpusId = item[options.corpusLevelAggr].value
                    corpusLabel = item[options.corpusLevelAggr + "Label"].value
                }

                allCorpusIds.push(corpusId)


                if (uniqueNodeIds.indexOf(corpusId) < 0) {
                    uniqueNodeIds.push(corpusId)

                    var node = {
                        label: corpusLabel,
                        id: corpusId,
                        color: ontograph.entityTypeColors["paragraph"],
                        data: item,
                        shape: "ellipse",


                    }
                    visjsData.nodes.push(node)
                }

                function setEntityNode(entityName) {
                    //  var ancestors = Concepts.getAncestorsFromJstree(item.entity.value);
                    var ancestors = conceptsInfosMap[item[entityName].value].ancestors
                    var concept;
                    if (options.nodeIdFilter && item.id != options.nodeIdFilter)
                        concept = ancestors[0]
                    if (options.conceptLevelAggr > ancestors.length - 1)//si pas d'ancetre de ce noveau on prend le noeud lui meme
                        concept = ancestors[ancestors.length - 1]
                    else
                        concept = ancestors[options.conceptLevelAggr]


                    if (uniqueNodeIds.indexOf(concept.id) < 0) {


                        uniqueNodeIds.push(concept.id)
                        var type = "anyEntity"
                        if (item[entityName + "Type"])
                            type = item[entityName + "Type"].value.substring(item.entityType.value.lastIndexOf("/") + 1)
                        var node = {
                            label: concept.label,
                            id: concept.id,
                            color: ontograph.entityTypeColors[type],
                            data: {ancestors: ancestors},
                            shape: "box",
                            //  font: {size: 18, color: "white"}


                        }
                        visjsData.nodes.push(node)
                    }


                    var edgeId = corpusId + "_" + concept.id
                    if (uniqueEdgeIds.indexOf(edgeId) < 0) {
                        uniqueEdgeIds.push(edgeId)
                        var edge = {
                            from: corpusId,
                            to: concept.id,
                            id: edgeId,

                        }
                        visjsData.edges.push(edge)
                    }
                }

                setEntityNode("entity")
                if (typeof item["entity2"] !== "undefined" && item["entity2"]) {
                    if (conceptsInfosMap[item.entity2.value])
                        setEntityNode("entity2")
                }

                if (options.resourcesShowParentResources) {

                    if (options.resourcesShowParentResources == "document") {


                        if (uniqueNodeIds.indexOf(item.document.value) < 0) {
                            uniqueNodeIds.push(item.document.value)
                            var node = {
                                id: item.document.value,
                                label: item.documentLabel.value,
                                color: ontograph.entityTypeColors["document"],
                                shape: "dot",
                                //  font: {size: 18, color: "white"}


                            }
                            visjsData.nodes.push(node)
                        }

                        var edgeId = paragraphId + "_" + item.document.value
                        if (uniqueEdgeIds.indexOf(edgeId) < 0) {
                            uniqueEdgeIds.push(edgeId)
                            var edge = {
                                from: paragraphId,
                                to: item.document.value,
                                id: edgeId,

                            }
                            visjsData.edges.push(edge)
                        }
                    } else {
                        var x = 3
                    }

                }


            }
        )
        ontograph.drawGraph(visjsData, {
            onclickFn: paragraphs.onNodeClick,
            onHoverNodeFn: paragraphs.onNodeHover,
            afterDrawing: function () {
                common.message("")
                $("#waitImg").css("display", "none")
            }
        })


    }

    self.onNodeClick = function (node, point) {

        if (node.id.indexOf("/resource/vocabulary/") > -1) {
            var html = " <span class='popupMenuItem' onclick='projection.graphActions.expandResourceConcepts();'> Expand concepts</span>" +
                " <span class='popupMenuItem' onclick='projection.graphActions.collapseResourceConcepts();'> Collapse concepts</span>" +
                " <span class='popupMenuItem' onclick='projection.graphActions.showLinked();'> show Relations</span>"

            $("#graphPopupDiv").html(html)
            point.x+=$("#selectionDiv").width();
            projection.graphActions.showPopup(point)

        }

        return;


        /*  var conceptLevelAggr = parseInt($("#conceptAggrLevelSlider").slider("option", "value"));
          var corpusLevelAggr = $("#corpusAggrLevelSelect").val();
          paragraphs.drawParagraphsEntitiesGraphAggr(projection.currentProjection.paragraphs, projection.currentProjection.conceptsInfos, {
              conceptLevelAggr: conceptLevelAggr,
              corpusLevelAggr: corpusLevelAggr,
              nodeIdFilter: node.id
          })*/

        if (node.id.indexOf("/resource/vocabulary/") > -1) {
            var ancestors = node.data.ancestors;
            var ancestorsMap = projection.currentProjection.conceptsInfos
            var uniqueNodes = visjsGraph.data.nodes.getIds();
            var uniqueEdges = visjsGraph.data.edges.getIds();
            var visjsNewData = {nodes: [], edges: []}
            for (var key in ancestorsMap) {
                var ancestors = ancestorsMap[key].ancestors
                ancestors.forEach(function (ancestor, index) {
                    if (ancestor.id == (node.id) && index > 0) {
                        var child = ancestors[index - 1];
                        if (uniqueNodes.indexOf(child.id) < 0) {
                            uniqueNodes.push(child.id);
                            visjsNewData.nodes.push({id: child.id, label: child.label, shape: "box", color: node.color, data: node.data})
                        }
                        var edgeId = child.id + "_" + node.id
                        if (uniqueEdges.indexOf(edgeId) < 0) {
                            uniqueEdges.push(edgeId);
                            visjsNewData.edges.push({id: edgeId, from: child.id, to: node.id})
                        }


                    }
                })
            }

        }
        ontograph.drawGraph(visjsNewData, {addToGraph: true})


    }
    self.onNodeHover = function (obj, point) {

        if (obj.id.indexOf("/Paragraph/") > -1) {

            async.series([
                function (callbackSeries) {
                    if (!self.currentGraphInfos[obj.id]) {
                        self.getParagraphsInfos([obj.id], null, function (err, result) {
                            if (err)
                                return common.message(err)
                            result.forEach(function (item) {
                                if (!self.currentGraphInfos[obj.id])
                                    self.currentGraphInfos[obj.id] = {paragraph: item.paragraph, paragraphText: item.paragraphText, offsets: []};
                                self.currentGraphInfos[obj.id].offsets.push(item.offset)
                            })
                            callbackSeries();
                        })


                    } else
                        callbackSeries();

                },
                function (callbackSeries) {
                    $("#messageDiv").html("");

                    var html = ""

                    var infos = self.currentGraphInfos[obj.id];
                    var nodeData = obj.data;
                    var text = infos.paragraphText.value
                    var textRich = self.getEntichedParagraphText(infos);
                    html += "<span class='paragraph-docTitle'>" + nodeData.documentLabel.value + "</span>&nbsp;";
                    html += "<span class='paragraph-chapter'>" + nodeData.chapterLabel.value + "</span>&nbsp;";


                    html += "<span class='text'>" + textRich + "</span>&nbsp;";
                    //    html += "<span style='font-weight:bold'>" + text + "</span>&nbsp;";
                    if (text)
                        $("#paragraphTextDiv").html(html);
                    callbackSeries();

                }


            ])

        } else if (obj.id.indexOf("/resource/vocabulary/") > -1) {
            async.series([
                function (callbackSeries) {
                    if (!self.currentGraphInfos[obj.id]) {
                        Concepts.getConceptsInfos([obj.id], null, function (err, result) {
                            self.currentGraphInfos[obj.id] = result[0];
                            callbackSeries();
                        })
                    } else
                        callbackSeries();
                },
                function (callbackSeries) {
                    $("#messageDiv").html("");

                    var html = ""

                    var infos = self.currentGraphInfos[obj.id];

                    html += "<span class='paragraph-docTitle'>" + infos.conceptLabel.value + "</span>&nbsp;";
                    for (var i = 1; i < 8; i++) {
                        var broader = infos["broader" + i]
                        if (typeof broader !== "undefined") {
                            html += "<span class='paragraph-chapter'>" + "/" + broader.value + "</span>&nbsp;";
                        }
                    }
                    var definition = infos["definition"]
                    if (typeof definition !== "undefined") {
                        html += "<span class='paragraph-chapter'>definition:</span>&nbsp;" + definition;
                    }
                    var exactMatch = infos["exactMatch"]
                    if (typeof exactMatch !== "undefined") {
                        html += "<span class='paragraph-chapter'>Quantum exact match:</span>&nbsp;" + exactMatch;
                    }


                    $("#paragraphTextDiv").html(html);
                    callbackSeries();

                }


            ])


        }
    }


    self.getParagraphsInfos = function (paragraphs, options, callback) {

        if (!options)
            options = {};
        var slicedParagraphs = common.sliceArray(paragraphs, 5);
        if (slicedParagraphs.length == 0)
            return callback(null, [])

        var allParaGraphsInfos = []
        async.eachSeries(slicedParagraphs, function (paragraphs, callbackEach) {


            var pargagraphsIdsStr = "";
            paragraphs.forEach(function (id, index) {
                if (index > 0)
                    pargagraphsIdsStr += ","
                pargagraphsIdsStr += "<" + id + ">"
            })

            var url = sparql.source.sparql_url + "?default-graph-uri=&query=";// + query + queryOptions

            var query = "PREFIX terms:<http://purl.org/dc/terms/>" +
                "PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#>" +
                "PREFIX rdfsyn:<https://www.w3.org/1999/02/22-rdf-syntax-ns#>" +
                "PREFIX mime:<http://purl.org/dc/dcmitype/> " +
                "PREFIX skos:<http://www.w3.org/2004/02/skos/core#>" +
                "select distinct *" +
                //   "select ?paragraph ?paragraphText  ?chapter ?document ?documentType ?branch ?domain  ?chapterLabel ?documentLabel ?documentTypeLabel ?branchLabel ?domainLabel (sql:GROUP_CONCAT(REPLACE(?offset,'http://data.total.com/resource/vocabulary/',''), ' ; ') as ?offsets) " +
                "where{" +
                "?paragraph mime:Text ?paragraphText ." +
                " filter (?paragraph in(" + pargagraphsIdsStr + "))"

            query += "?paragraph <http://open.vocab.org/terms/hasOffset> ?offset ."


            query += "} limit 10000"


            var queryOptions = "&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=5000&debug=on"
            sparql.querySPARQL_GET_proxy(url, query, queryOptions, null, function (err, result) {
                if (err) {
                    console.log(query)
                    return callbackEach(err);
                }
                allParaGraphsInfos = allParaGraphsInfos.concat(result.results.bindings)
                callbackEach()


            })
        }, function (err) {
            if (err)
                return callback(err);
            return callback(null, allParaGraphsInfos)
        })

    }

    self.getEntichedParagraphText = function (paragraphInfos) {
        var allOffsets = []
        var allUniqueOffsets = []
        paragraphInfos.offsets.forEach(function (offset) {
            var offsetArray = offset.value.split("|");
            if (allUniqueOffsets.indexOf(offsetArray[2] + "_" + offsetArray[3]) < 0) {
                allUniqueOffsets.push(offsetArray[2] + "_" + offsetArray[3])
                var type = offsetArray[0];
                //   type=type.substring(type.lastIndexOf("/")+1)
                allOffsets.push({type: type, start: parseInt(offsetArray[3]), end: parseInt(offsetArray[4])})
            }

        })

        var previousOffset = 0
        var chunks = [];

        //   obj.text=obj.text.replace(/\  /g,"")
        allOffsets.forEach(function (offset, index) {
            chunks.push(paragraphInfos.paragraphText.value.substring(previousOffset, offset.start))

            var color = ontograph.entityTypeColors[offset.type]
            var newText = "<span style='background-color:" + color + "'>" + paragraphInfos.paragraphText.value.substring(offset.start, offset.end) + "</span>"
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


    self.sparql_getEntitiesParagraphs = function (idCorpus, parentConcepts, depth, options, callback) {

        var totalConcepts = 0;

        var allResults = [];


        if (!options)
            options = {minManadatoryEntities: 2}
        var queryCorpus = ""
        var queryConcept = ""
        var countParagraphMin = 20;

        var isQuantumConceptsQuery = false;
        if (parentConcepts && parentConcepts.length > 0 && parentConcepts[0].id.indexOf("/quantum/") > 1)
            isQuantumConceptsQuery = true;


        if (idCorpus) {
            if (idCorpus.indexOf("/Domain/") > -1) {
                queryCorpus += "?branch   skos:broader <" + idCorpus + ">."
            }
            if (idCorpus.indexOf("/Branch/") > -1) {
                queryCorpus += "?document_type   skos:broader <" + idCorpus + ">."
            }
            if (idCorpus.indexOf("/Document-type/") > -1) {
                queryCorpus += "?document   skos:broader <" + idCorpus + ">."
            }
            if (idCorpus.indexOf("/Document/") > -1) {
                queryCorpus += "?chapter   skos:broader <" + idCorpus + ">."
            }
            if (idCorpus.indexOf("/Chapter/") > -1) {
                queryCorpus += "?paragraph  skos:broader <" + idCorpus + ">."
            }
        }


        var url = sparql.source.sparql_url + "?default-graph-uri=&query=";// + query + queryOptions


        var query = "PREFIX rdfsyn:<https://www.w3.org/1999/02/22-rdf-syntax-ns#> PREFIX mime:<http://purl.org/dc/dcmitype/> PREFIX terms:<http://purl.org/dc/terms/>   PREFIX skos:<http://www.w3.org/2004/02/skos/core#>" +
            " select distinct * " +
            "from <http://data.total.com/resource/thesaurus/ctg/>  " +
            "from <http://data.total.com/resource/ontology/ctg/>  " +
            "from <http://data.total.com/resource/ontology/quantum/>  " +
            "from <http://data.total.com/resource/corpus-description/ctg/>" +
            " where{  " +
            "  "
        if (parentConcepts) {
            var parentConceptIdsStr = ""
            parentConcepts.forEach(function (parentConcept, index) {
                if (index > 0)
                    parentConceptIdsStr += ","
                parentConceptIdsStr += "<" + parentConcept.id + ">"
            })

            var childStr1 = "";
            var childStr2 = "filter (?entity in (?concept";
            var childStr3 = "";

            for (var i = 1; i <= depth; i++) {
                if (i == 1)
                    childStr1 += "OPTIONAL {?child1 skos:broader ?concept. ";
                if (i < depth)
                    childStr1 += "OPTIONAL { ?child" + (i + 1) + " skos:broader ?child" + i + ". ";

                childStr2 += ",?child" + i + "  ";
                childStr3 += "Optional{?child" + i + " skos:prefLabel ?childLabel" + i + ".}  ";

            }
            for (var i = 1; i <= depth; i++) {
                childStr1 += "} "
            }
            childStr2 += "))  "

            query += " ?concept skos:prefLabel ?prefLabel. filter (?concept in(" + parentConceptIdsStr + "))"
            query += childStr1;
            query += childStr2;
            query += childStr3;
            query += "?paragraph terms:subject ?entity. "


            /*   query += " ?concept skos:prefLabel ?prefLabel. filter (?concept in(" + parentConceptIdsStr + "))" +
               "" +
               "OPTIONAL {?child1 skos:broader ?concept.  OPTIONAL { ?child2 skos:broader ?child1.  OPTIONAL { ?child3 skos:broader ?child2.OPTIONAL { ?child4 skos:broader ?child3.OPTIONAL { ?child5 skos:broader ?child4.OPTIONAL { ?child6 skos:broader ?child5.}}}}}}  " +
               "  " +
               "  " +
               "Optional{?child1 skos:prefLabel ?childLabel1.}  " +
               "Optional{?child2 skos:prefLabel ?childLabel2.}  " +
               "Optional{?child3 skos:prefLabel ?childLabel3.}  " +
               "Optional{?child4 skos:prefLabel ?childLabel4.}  " +
               "Optional{?child5 skos:prefLabel ?childLabel5.}  " +
               "Optional{?child6 skos:prefLabel ?childLabel6.}  " +
               "  " +
               "  " +
               "  " +
               "  " +
               "?paragraph terms:subject ?entity." +
               " filter (?entity in (?concept,?child1,?child2,?child2,?child3,?child4,?child5,?child6))  "*/
        }
        query += "  " +
            " ?paragraph  skos:broader ?chapter .?chapter  skos:broader ?document .?document  skos:broader ?document_type .?document_type  skos:broader ?branch. ?branch skos:broader ?domain.  " +
            "  " +
            "  ?chapter skos:prefLabel ?chapterLabel.  ?document skos:prefLabel ?documentLabel. ?document_type skos:prefLabel ?document_typeLabel.  ?branch skos:prefLabel ?branchLabel.  ?domain skos:prefLabel ?domainLabel."
        // "  ?entity rdfsyn:type ?entityType .  " +
        "  "
        if (queryCorpus != "") {
            query += "  ?entity rdfsyn:type ?entityType .  "//requete plante quand il ya pas de corpus ??? bizarre
            query += queryCorpus
        }

        query += "  }limit 1000"


        var queryOptions = "&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=5000&debug=on"

        sparql.querySPARQL_GET_proxy(url, query, queryOptions, null, function (err, result) {
            if (err) {
                console.log(query)
                return callback(err);
            }

            allResults = allResults.concat(result.results.bindings);
            return callback(null, allResults);


        })


    }

    self.sparql_getEntitiesParagraphsX = function (idCorpus, conceptsIds, options, callback) {

        var totalConcepts = 0;
        var slicedConceptsIds = common.sliceArray(conceptsIds, projection.sliceZize);
        if (slicedConceptsIds.length == 0)
            slicedConceptsIds = [[]]
        var allResults = [];
        async.eachSeries(slicedConceptsIds, function (concepts, callbackEach) {
                totalConcepts += concepts.length
                common.message("selecting concepts :" + totalConcepts)
                if (!options)
                    options = {minManadatoryEntities: 2}
                var queryCorpus = ""
                var queryConcept = ""
                var countParagraphMin = 20;

                var isQuantumConceptsQuery = false;
                if (concepts && concepts.length > 0 && concepts[0].indexOf("/quantum/") > 1)
                    isQuantumConceptsQuery = true;


                if (idCorpus) {
                    var corpusIdsStr = "";
                    if (Array.isArray(idCorpus)) {
                        var corpusIdsStr = "";
                        idCorpus.forEach(function (id, index) {
                            if (index > 0)
                                corpusIdsStr += ","
                            corpusIdsStr += "<" + id + ">"
                        })
                    }


                    if (idCorpus.indexOf("/Domain/") > -1) {
                        queryCorpus += "?paragraph  skos:broader ?chapter ."
                        queryCorpus += "?chapter  skos:broader ?document ."
                        queryCorpus += "?document  skos:broader ?document_type ."
                        queryCorpus += "?document_type  skos:broader ?branch."
                        queryCorpus += "?branch   skos:broader <" + idCorpus + ">."
                    }
                    if (idCorpus.indexOf("/Branch/") > -1) {
                        queryCorpus += "?paragraph  skos:broader ?chapter ."
                        queryCorpus += "?chapter  skos:broader ?document ."
                        queryCorpus += "?document  skos:broader ?document_type ."
                        queryCorpus += "?document_type   skos:broader <" + idCorpus + ">."
                    }
                    if (idCorpus.indexOf("/Document-type/") > -1) {
                        queryCorpus += "?paragraph  skos:broader ?chapter ."
                        queryCorpus += "?chapter  skos:broader ?document ."
                        queryCorpus += "?document   skos:broader <" + idCorpus + ">."
                    }
                    if (idCorpus.indexOf("/Document/") > -1) {
                        queryCorpus += "?paragraph  skos:broader ?chapter ."
                        queryCorpus += "?chapter   skos:broader <" + idCorpus + ">."
                    }
                    if (idCorpus.indexOf("/Chapter/") > -1) {
                        queryCorpus += "?paragraph  skos:broader <" + idCorpus + ">."
                    }
                    if (idCorpus.indexOf("/Paragraph/") > -1 || idCorpus[0].indexOf("/Paragraph/") > -1) {
                        queryCorpus += "?paragraph skos:broader ?xx. filter(?paragraph "
                        if (Array.isArray(idCorpus))
                            queryCorpus += " in (" + corpusIdsStr + "))"
                        else
                            queryCorpus += " =<" + idCorpus + ">) "
                    }
                }


                var url = sparql.source.sparql_url + "?default-graph-uri=&query=";// + query + queryOptions
                var query = "   PREFIX terms:<http://purl.org/dc/terms/>" +
                    "        PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#>" +
                    "        PREFIX rdfsyn:<https://www.w3.org/1999/02/22-rdf-syntax-ns#>" +
                    "PREFIX mime:<http://purl.org/dc/dcmitype/> " +
                    "PREFIX mime:<http://www.w3.org/2004/02/skos/core#> " +
                    "" +
                    "        select *" +
                    "        where "

                var whereQuery = "{?paragraph terms:subject ?entity. ?entity rdfs:label ?entityLabel . " +
                    "  FILTER (lang(?entityLabel)=\"en\") " +
                    "  ?entity rdfsyn:type ?entityType .  " +
                    "?paragraph  skos:broader ?chapter." +
                    "?chapter  skos:prefLabel ?chapterLabel." +
                    "?chapter  skos:broader ?document." +
                    "?document  skos:prefLabel ?documentLabel." +
                    "?document  skos:broader ?documentType." +
                    "?documentType  skos:prefLabel ?documentTypeLabel." +
                    "?documentType skos:broader ?branch." +
                    "?branch  skos:prefLabel ?branchLabel." +
                    "?branch skos:broader ?domain." +
                    "?domain  skos:prefLabel ?domainLabel."


                var whereConceptQuery = ""
                if (concepts && concepts.length > 0) {
                    if (options.booleanQuery == "OR" && self.previousConceptsFilter) {
                        concepts = concepts.concat(self.previousConceptsFilter)
                    }
                    self.previousConceptsFilter = concepts;
                    var entityIdsStr = "";
                    concepts.forEach(function (id, index) {
                        if (index > 0)
                            entityIdsStr += ","
                        entityIdsStr += "<" + id + ">"
                    })


                    if (self.previousWhereConceptQuery && options.booleanQuery == "AND") {
                        whereConceptQuery += self.previousWhereConceptQuery + "  "
                        if (isQuantumConceptsQuery)
                            whereConceptQuery += "  ?paragraph terms:subject ?entity2 . ?entity2 rdfsyn:type  ?entity2Type . " + "?entity2 skos:exactMatch ?quantumConcept2" + " filter (?quantumConcept2 in(" + entityIdsStr + "))"
                        else
                            whereConceptQuery += "  ?paragraph terms:subject ?entity2 . ?entity2 rdfsyn:type  ?entity2Type . " + " filter (?entity2 in(" + entityIdsStr + "))"


                    } else {
                        if (isQuantumConceptsQuery)
                            whereConceptQuery += "  ?paragraph terms:subject ?entity . " + "?entity skos:exactMatch ?quantumConcept" + " filter (?quantumConcept in(" + entityIdsStr + "))"
                        else
                            whereConceptQuery += "  ?paragraph terms:subject ?entity . " + " filter (?entity in(" + entityIdsStr + "))"

                    }


                    self.previousWhereConceptQuery = whereConceptQuery
                }


                query += whereQuery + whereConceptQuery
                query += queryCorpus;
                query += "    }"
                query += " limit 1000"


                var queryOptions = "&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=5000&debug=on"

                sparql.querySPARQL_GET_proxy(url, query, queryOptions, null, function (err, result) {
                    if (err) {
                        console.log(query)
                        return callback(err);
                    }

                    allResults = allResults.concat(result.results.bindings);
                    return callbackEach();


                })

            }, function (err) {
                if (err)
                    return callback(err);
                return callback(null, allResults)
            }
        )

    }

    self.drawEntitiesParagraphsGraph = function (selectedEntities, data, options) {
        if (!options)
            options = {}
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
            if (options.getParagraphEntities) {
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


})
();
