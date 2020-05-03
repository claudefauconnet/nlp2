var paragraphs = (function () {

    var self = {};
    self.currentGraphInfos = {}
    self.sparql_limit = 10000
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
                    corpusLabel = corpusId.substring(corpusId.lastIndexOf("/") + 1);
                } else {
                    if (!item[options.corpusLevelAggr])
                        return;
                    corpusId = item[options.corpusLevelAggr].value;
                    if (options.corpusLevelAggr == "documentType")
                        corpusLabel = item.domainLabel.value + "_" + item.branchLabel.value + "_" + item[options.corpusLevelAggr + "Label"].value
                    else if (options.corpusLevelAggr == "branch")
                        corpusLabel = item.domainLabel.value + "_" + item[options.corpusLevelAggr + "Label"].value
                    else
                        corpusLabel = item[options.corpusLevelAggr + "Label"].value
                }


                if (corpusLabel.length > 12)
                    corpusLabel = corpusLabel.substring(0, 12) + "..."

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
                    if (options.conceptLevelAggr > ancestors.length - 1)//si pas d'ancetre de ce niveau on prend le noeud lui meme
                        concept = ancestors[ancestors.length - 1]
                    else
                        concept = ancestors[options.conceptLevelAggr]


                    if (uniqueNodeIds.indexOf(concept.id) < 0) {


                        uniqueNodeIds.push(concept.id)
                        var type = "anyEntity"
                        if (item[entityName + "Type"])
                            type = item[entityName + "Type"].value.substring(item[entityName + "Type"].value.lastIndexOf("/") + 1)
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
                            arrows: "from",

                        }
                        visjsData.edges.push(edge)
                    }

                }

                for (var i = 0; i < 10; i++) {
                    if (typeof item["entity" + i] !== "undefined" && item["entity" + i]) {
                        setEntityNode("entity" + i)
                    }
                }
                /*   setEntityNode("entity")
                 if (typeof item["entity2"] !== "undefined" && item["entity2"]) {
                      if (conceptsInfosMap[item.entity2.value])
                          setEntityNode("entity2")
                  }*/

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

    self.drawParagraphsEntitiesGraphSimple = function (data, conceptsInfosMap, options) {
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

                if (!item[options.corpusLevelAggr])
                    return;
                corpusId = item[options.corpusLevelAggr].value;
                if (corpusId.indexOf("Paragraph") > -1)
                    corpusLabel = corpusId
                else
                    corpusLabel = item[options.corpusLevelAggr + "Label"].value
                /*  if (options.corpusLevelAggr == "documentType")
                      corpusLabel = item.domainLabel.value + "_" + item.branchLabel.value + "_" + item[options.corpusLevelAggr + "Label"].value
                  else if (options.corpusLevelAggr == "branch")
                      corpusLabel = item.domainLabel.value + "_" + item[options.corpusLevelAggr + "Label"].value
                  else
                      corpusLabel = item[options.corpusLevelAggr + "Label"].value*/


                if (corpusLabel.length > 12)
                    corpusLabel = corpusLabel.substring(0, 12) + "..."

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
                    if (options.conceptLevelAggr > ancestors.length - 1)//si pas d'ancetre de ce niveau on prend le noeud lui meme
                        concept = ancestors[ancestors.length - 1]
                    else
                        concept = ancestors[options.conceptLevelAggr]


                    if (uniqueNodeIds.indexOf(concept.id) < 0) {


                        uniqueNodeIds.push(concept.id)
                        var type = "anyEntity"
                        if (item[entityName + "Type"])
                            type = item[entityName + "Type"].value.substring(item[entityName + "Type"].value.lastIndexOf("/") + 1)
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
                            arrows: "from",

                        }
                        visjsData.edges.push(edge)
                    }

                }

                for (var i = 0; i < 10; i++) {
                    if (typeof item["entity" + i] !== "undefined" && item["entity" + i]) {
                        setEntityNode("entity" + i)
                    }
                }
                /*   setEntityNode("entity")
                 if (typeof item["entity2"] !== "undefined" && item["entity2"]) {
                      if (conceptsInfosMap[item.entity2.value])
                          setEntityNode("entity2")
                  }*/

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
        filterGraph.selectedGraphNode = node
        if (node.id.indexOf("/resource/vocabulary/") > -1) {
            /*  var html = " <span class='popupMenuItem' onclick='Selection.graphActions.expandResourceConcepts();'> Expand concepts</span>" +
                  " <span class='popupMenuItem' onclick='Selection.graphActions.collapseResourceConcepts();'> Collapse concepts</span>" +
                  " <span class='popupMenuItem' onclick='Selection.graphActions.showLinked();'> show Relations</span>"

              $("#graphPopupDiv").html(html)*/
            var html = ""
            html += "<div class='popupMenuItem' onclick='filterGraph.alterGraph.conceptInfos(\"" + node.id + "\");'>Hide</div>"
            html += "<div class='popupMenuItem' onclick='filterGraph.alterGraph.hideConcept(\"" + node.id + "\");'>Hide</div>"
            html += "<div class='popupMenuItem' onclick='filterGraph.alterGraph.expandConcept(\"" + node.id + "\");'> Expand</div>"
            // html += "<span class='popupMenuItem' onclick='Selection.graphActions.showResourceConcepts(\"" + node.id + "\",true);'> node concepts and relations</span><br>"

            $("#graphPopupDiv").html(html)
            point.x += $("#tabs-Projection").width();
            Selection.graphActions.showPopup(point)


        } else {

            var html = ""
            html += "<div class='popupMenuItem' onclick='filterGraph.alterGraph.resourceInfos(\"" + node.id + "\");'>Hide</div>"
            html += "<div class='popupMenuItem' onclick='filterGraph.alterGraph.showResourceParents(\"" + node.id + "\");'>Show parent</div>"
            html += "<div class='popupMenuItem' onclick='filterGraph.alterGraph.showResourceChildren(\"" + node.id + "\");'>Show children</div>"
            html += "<div class='popupMenuItem' onclick='filterGraph.alterGraph.expandResource(\"" + node.id + "\");'>Expand</div>"
            html += "<div class='popupMenuItem' onclick='filterGraph.alterGraph.showResourceConcepts(\"" + node.id + "\");'> Show concepts</div><br>"

            $("#graphPopupDiv").html(html)
            point.x += $("#tabs-Projection").width();
            Selection.graphActions.showPopup(point)

        }


        return;


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
                    var text
                    if (infos && infos.paragraphText)
                        text = infos.paragraphText.value;
                    else
                        text = "??"
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
                        html += "<span class='paragraph-chapter'>definition:</span>&nbsp;" + definition.value;
                    }
                    var exactMatch = infos["exactMatch"]
                    if (typeof exactMatch !== "undefined") {
                        html += "<br>"
                        html += "<span class='paragraph-chapter'>Quantum exact match:</span>&nbsp;" + exactMatch.value;
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


            query += "} limit " + self.sparql_limit


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


    self.sparql_getEntitiesParagraphs = function (idCorpus, conceptSets, options, callback) {


        var totalConcepts = 0;

        var allResults = [];


        if (!options)
            options = {minManadatoryEntities: 2}


        var isQuantumConceptsQuery = false;
        /*    if (concepts && concepts.length > 0 && concepts[0].indexOf("/quantum/") > 1)
              isQuantumConceptsQuery = true;*/


        var corpusLevels = app_config.ontologies[app_config.currentOntology].resourceLevels;

        var whereCorpusQuery = ""
        var distinctSelectStr = ""


        var okDistinctSelect = true;
        corpusLevels.forEach(function (item, index) {
            if (index > 0) {
                var child = "?" + corpusLevels[index - 1].label;
                var parent = "?" + item.label;
                whereCorpusQuery += child + "  skos:broader " + parent + "."
                whereCorpusQuery += child + "  skos:prefLabel " + child + "Label.";
                whereCorpusQuery += parent + "  skos:prefLabel " + parent + "Label.";
            }


            if (okDistinctSelect) {
                distinctSelectStr += "?" + item.label + " ?" + item.label + "Label "

                if (options.corpusLevelAggr == item.label) {
                    okDistinctSelect = false;
                }
            }

        })


        /*
                whereCorpusQuery += "?paragraph  skos:broader ?chapter ."
                whereCorpusQuery += "?chapter  skos:prefLabel ?chapterLabel.";
                whereCorpusQuery += "?chapter  skos:broader ?document ."
                whereCorpusQuery += "?document skos:prefLabel ?documentLabel.";
                whereCorpusQuery += "?document  skos:broader ?documentType ."
                whereCorpusQuery += "?documentType  skos:prefLabel ?documentTypeLabel.";
                whereCorpusQuery += "?documentType  skos:broader ?branch."
                whereCorpusQuery += "?branch  skos:prefLabel ?branchLabel.";
                whereCorpusQuery += "?documentType  skos:broader ?domain. "
                whereCorpusQuery += "?domain  skos:prefLabel ?domainLabel.";*/

  /*      if (options.corpusLevelAggr == "domain") {//(idCorpus[0].indexOf("/Domain/") > -1) {
            distinctSelectStr += "?domain ?domainLabel"
        }
        if (options.corpusLevelAggr == "branch") {//(idCorpus[0].indexOf("/Domain/") > -1) {
            distinctSelectStr += " ?domain ?domainLabel" + " ?branch ?branchLabel"
        } else if (options.corpusLevelAggr == "documentType") {//(idCorpus[0].indexOf("/Branch/") > -1) {
            distinctSelectStr += " ?domain ?domainLabel" + " ?branch ?branchLabel" + " ?documentType ?documentTypeLabel"
        } else if (options.corpusLevelAggr == "document") {//(idCorpus[0].indexOf("/Document-type/") > -1) {
            distinctSelectStr += " ?domain ?domainLabel" + " ?branch ?branchLabel" + " ?documentType ?documentTypeLabel" + " ?document ?documentLabel"
        } else if (options.corpusLevelAggr == "chapter") {//(idCorpus[0].indexOf("/Document/") > -1) {

            distinctSelectStr += "?domain ?domainLabel" + "?branch ?branchLabel" + " ?documentType ?documentTypeLabel" + " ?document ?documentLabel" + " ?chapter ?chapterLabel"
        } else if (options.corpusLevelAggr == "paragraph") {//(idCorpus[0].indexOf("/Paragraph/") > -1 || idCorpus[0].indexOf("/Paragraph/") > -1) {
            distinctSelectStr += "?domain ?domainLabel" + " ?branch ?branchLabel" + " ?documentType ?documentTypeLabel" + " ?document ?documentLabel" + " ?chapter ?chapterLabel" + " ?paragraph "
        }*/


        if (idCorpus) {
            var corpusIdsStr = "";
            if (!Array.isArray(idCorpus))
                idCorpus = [idCorpus]
            var corpusIdsStr = "";
            var resourceName = ""
            idCorpus.forEach(function (id, index) {
                if (index == 0) {
                    corpusLevels.forEach(function(item){
                        if (id.indexOf(item.value) > -1)
                            resourceName = item.label
                    })
                  /*  for (var key in corpusLevelMap) {
                        if (id.indexOf(key) > -1)
                            resourceName = corpusLevelMap[key]
                    }*/

                } else
                    corpusIdsStr += ","
                corpusIdsStr += "<" + id + ">"
            })
            whereCorpusQuery += "filter (?" + resourceName + " in(" + corpusIdsStr + ")) "
        }


        /*  var whereQuery = "{?paragraph terms:subject ?entity. ?entity rdfs:label ?entityLabel . " +
              "  FILTER (lang(?entityLabel)=\"en\") " +
              "  ?entity rdfsyn:type ?entityType .  " +*/
        /*  var whereQuery = "{?paragraph  skos:broader ?chapter." +

              "?chapter  skos:broader ?document." +
              "?document  skos:prefLabel ?documentLabel." +
              "?document  skos:broader ?documentType." +
              "?documentType  skos:prefLabel ?documentTypeLabel." +
              "?documentType skos:broader ?branch." +
              "?branch  skos:prefLabel ?branchLabel." +
              "?branch skos:broader ?domain." +
              "?domain  skos:prefLabel ?domainLabel."*/


        var whereConceptQuery = ""
        if (conceptSets && conceptSets.length > 0) {

            conceptSets.forEach(function (conceptSet, indexSet) {

                var entityIdsStr = "";

                conceptSet.ids.forEach(function (id, index) {
                    if (index > 0)
                        entityIdsStr += ","
                    entityIdsStr += "<" + id + ">"
                })

                var linkedResourceName=corpusLevels[0].label;
                if (isQuantumConceptsQuery) {
                    whereConceptQuery += "  ?"+linkedResourceName+" terms:subject ?entity" + indexSet + " . ?entity" + indexSet + " rdfsyn:type  ?entity" + indexSet + "Type . " + "?entity" + indexSet + " skos:exactMatch ?quantumConcept" + indexSet + ""
                    if (entityIdsStr.length > 0)
                        whereConceptQuery += " filter (?quantumConcept" + indexSet + " in(" + entityIdsStr + "))"
                } else {
                    whereConceptQuery += "  ?"+linkedResourceName+" terms:subject ?entity" + indexSet + " . ?entity" + indexSet + " rdfsyn:type  ?entity" + indexSet + "Type ."
                    if (entityIdsStr.length > 0)
                        whereConceptQuery += " filter (?entity" + indexSet + " in(" + entityIdsStr + "))"
                }


                distinctSelectStr += " ?entity" + indexSet + " ";
                /*   var i;
                   for(var i=indexSet;i<=options.conceptLevelAggr;i++){

                       whereConceptQuery += " ?entity"+i+" skos:broader ?entity"+(i+1)+". "
                   }
                   distinctSelectStr += "?entity" + i + " ?entity" + i + "Type "*/


            })


            //  distinctSelectStr = " * "


            self.previousWhereConceptQuery = whereConceptQuery
        }

        var url = sparql.source.sparql_url + "?default-graph-uri=&query=";// + query + queryOptions
        var query = "   PREFIX terms:<http://purl.org/dc/terms/>" +
            "        PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#>" +
            "        PREFIX rdfsyn:<https://www.w3.org/1999/02/22-rdf-syntax-ns#>" +
            "PREFIX mime:<http://purl.org/dc/dcmitype/> " +
            "PREFIX mime:<http://www.w3.org/2004/02/skos/core#> " +

            "        select distinct " + distinctSelectStr + " where {" + whereCorpusQuery + whereConceptQuery + "}"
        query += "GROUP BY " + distinctSelectStr;

        query += " limit " + self.sparql_limit


        var queryOptions = "&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=5000&debug=on"
        console.log(query)
        sparql.querySPARQL_GET_proxy(url, query, queryOptions, null, function (err, result) {
            if (err) {
                console.log(query)
                return callback(err);
            }

            return callback(null, result.results.bindings);


        })


    }


    return self;


})
();
