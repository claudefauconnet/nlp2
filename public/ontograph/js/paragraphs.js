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


                if (corpusLabel.length > app_config.visjsGraph.maxLabelLength)
                    corpusLabel = corpusLabel.substring(0, app_config.visjsGraph.maxLabelLength) + "..."

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
        Corpus.currentResourceIds = []
        data.forEach(function (item, indexLine) {
                var corpusId;
                var corpusLabel;

                if (!item[options.corpusLevelAggr])
                    return;
                corpusId = item[options.corpusLevelAggr].value;
                Corpus.currentResourceIds.push(corpusId);
                if (corpusId.indexOf("Paragraph") > -1)
                    corpusLabel = corpusId.substring(corpusId.lastIndexOf("/") + 1)
                else
                    corpusLabel = item[options.corpusLevelAggr + "Label"].value
                /*  if (options.corpusLevelAggr == "documentType")
                      corpusLabel = item.domainLabel.value + "_" + item.branchLabel.value + "_" + item[options.corpusLevelAggr + "Label"].value
                  else if (options.corpusLevelAggr == "branch")
                      corpusLabel = item.domainLabel.value + "_" + item[options.corpusLevelAggr + "Label"].value
                  else
                      corpusLabel = item[options.corpusLevelAggr + "Label"].value*/


                if (corpusLabel.length > app_config.visjsGraph.maxLabelLength)
                    corpusLabel = corpusLabel.substring(0, app_config.visjsGraph.maxLabelLength) + "..."

                allCorpusIds.push(corpusId)

                item.type = "resource";
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

        if (!node) {
            $("#graphPopupDiv").css("display", "none")
            Infos.setInfosDivHeight(5);
            return;
        }


        var graphPos = $("#graphDiv").position()
        point.x += graphPos.left
        point.y += graphPos.top
        filterGraph.selectedGraphNode = node
        if (node.id.indexOf("/resource/vocabulary/") > -1) {
            /*  var html = " <span class='popupMenuItem' onclick='Selection.graphActions.expandResourceConcepts();'> Expand concepts</span>" +
                  " <span class='popupMenuItem' onclick='Selection.graphActions.collapseResourceConcepts();'> Collapse concepts</span>" +
                  " <span class='popupMenuItem' onclick='Selection.graphActions.showLinked();'> show Relations</span>"

              $("#graphPopupDiv").html(html)*/
            var html = ""
            html += "<div class='popupMenuItem' onclick='filterGraph.alterGraph.conceptInfos(\"" + node.id + "\");'>Infos</div>"
            html += "<div class='popupMenuItem' onclick='filterGraph.alterGraph.hideConcept(\"" + node.id + "\");'>Hide</div>"
            html += "<div class='popupMenuItem' onclick='filterGraph.alterGraph.expandConcept(\"" + node.id + "\");'> Expand</div>"
            // html += "<span class='popupMenuItem' onclick='Selection.graphActions.showResourceConcepts(\"" + node.id + "\",true);'> node concepts and relations</span><br>"

            $("#graphPopupDiv").html(html)

            Selection.graphActions.showPopup(point)
            Infos.showInfos(node.id);

        } else {

            var html = ""
            html += "<div class='popupMenuItem' onclick='filterGraph.alterGraph.resourceInfos(\"" + node.id + "\");'>Infos</div>"
            html += "<div class='popupMenuItem' onclick='filterGraph.alterGraph.hideResource(\"" + node.id + "\");'>Hide</div>"
            html += "<div class='popupMenuItem' onclick='filterGraph.alterGraph.showResourceParents(\"" + node.id + "\");'>Show parent</div>"
            html += "<div class='popupMenuItem' onclick='filterGraph.alterGraph.expandResource(\"" + node.id + "\");'>Expand</div>"


            $("#graphPopupDiv").html(html)

            Selection.graphActions.showPopup(point)
            Infos.showInfos(node.id);

        }


        return;


    }
    self.onNodeHover = function (obj, point) {

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


        var okSelectAncestors = false;
        var parent;
        corpusLevels.forEach(function (item, index) {
            child = "?" + item.label;
            if (index > 0) {
                var parent = "?" + corpusLevels[index - 1].label;

                whereCorpusQuery += child + "  skos:broader " + parent + "."
                whereCorpusQuery += parent + "  skos:prefLabel " + parent + "Label.";
                // whereCorpusQuery += parent + "  skos:prefLabel " + parent + "Label.";
            } else {

            }

            if (item.label == options.corpusLevelAggr || okSelectAncestors) {
                distinctSelectStr += "?" + item.label + " ?" + item.label + "Label "
                okSelectAncestors = true;
            }


        })
        whereCorpusQuery += child + "  skos:prefLabel " + child + "Label.";


        if (idCorpus) {

            var idCorpusTreelevel
            var corpusIdsStr = "";
            if (!Array.isArray(idCorpus))
                idCorpus = [idCorpus]
            var corpusIdsStr = "";
            var resourceName = ""
            idCorpus.forEach(function (id, index) {
                var jstreeNode = $("#jstreeCorpusDiv").jstree(true).get_node(id)
                idCorpusTreelevel = jstreeNode.parents.length - 1
                if (index == 0) {
                    corpusLevels.forEach(function (item) {
                        if (id.indexOf(item.value) > -1)
                            resourceName = item.label
                    })


                    resourceName = corpusLevels[idCorpusTreelevel].label


                } else
                    corpusIdsStr += ","
                corpusIdsStr += "<" + id + ">"
            })
            whereCorpusQuery += "filter (?" + resourceName + " in(" + corpusIdsStr + ")) "
        }


        var whereConceptQuery = ""
        if (conceptSets && conceptSets.length > 0) {

            conceptSets.forEach(function (conceptSet, indexSet) {

                if (indexSet > 0)
                    whereConceptQuery += " MINUS "

                var entityIdsStr = "";

                conceptSet.ids.forEach(function (id, index) {
                    if (index > 0)
                        entityIdsStr += ","
                    entityIdsStr += "<" + id + ">"
                })
                whereConceptQuery += "{"
                var linkedResourceName = corpusLevels[corpusLevels.length - 1].label;
                if (isQuantumConceptsQuery) {
                    whereConceptQuery += "  ?" + linkedResourceName + " terms:subject ?entity" + indexSet + " . ?entity" + indexSet + " rdfsyn:type  ?entity" + indexSet + "Type . " + "?entity" + indexSet + " skos:exactMatch ?quantumConcept" + indexSet + ""
                    if (entityIdsStr.length > 0)
                        whereConceptQuery += " filter (?quantumConcept" + indexSet + " in(" + entityIdsStr + "))"
                } else {
                    whereConceptQuery += "  ?" + linkedResourceName + " terms:subject ?entity" + indexSet + " . ?entity" + indexSet + " rdfsyn:type  ?entity" + indexSet + "Type ."
                    if (entityIdsStr.length > 0)
                        whereConceptQuery += " filter (?entity" + indexSet + " in(" + entityIdsStr + "))"
                }


                distinctSelectStr += " ?entity" + indexSet + " ?entity" + indexSet + "Type\ ";
                whereConceptQuery += "}"

            })


            self.previousWhereConceptQuery = whereConceptQuery
        }


        var fromStr = "from <" + app_config.ontologies[app_config.currentOntology].corpusGraphUri + "> ";
        if (app_config.ontologies[app_config.currentOntology].corpusGraphUri != app_config.ontologies[app_config.currentOntology].conceptsGraphUri)
            fromStr += "from <" + app_config.ontologies[app_config.currentOntology].conceptsGraphUri + "> ";
        var url = app_config.sparql_url + "?default-graph-uri=&query=";// + query + queryOptions
        var query = "   PREFIX terms:<http://purl.org/dc/terms/>" +
            "        PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#>" +
            "        PREFIX rdfsyn:<http://www.w3.org/1999/02/22-rdf-syntax-ns#>" +
            "PREFIX mime:<http://purl.org/dc/dcmitype/> " +
            "PREFIX mime:<http://www.w3.org/2004/02/skos/core#> " +

            "        select distinct " + distinctSelectStr + fromStr + " where {" + whereCorpusQuery + whereConceptQuery + "}"
        //    query += "GROUP BY " + distinctSelectStr;

        query += " limit " + self.sparql_limit
        Selection.currentSelectionQuery.select = distinctSelectStr;
        Selection.currentSelectionQuery.from = fromStr;
        Selection.currentSelectionQuery.whereConcepts = whereConceptQuery;
        Selection.currentSelectionQuery.whereCorpus = whereCorpusQuery


        var queryOptions = "&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=20000&debug=off"
        console.log(query)
        sparql.querySPARQL_GET_proxy(url, query, queryOptions, null, function (err, result) {
            if (err) {
                console.log(query)
                return callback(err);
            }

            return callback(null, result.results.bindings);


        })


    }

    self.getResourcesCooccurences = function (concepts, options, callback) {
        if (!options)
            options = {};
        var fromStr = "from <" + app_config.ontologies[app_config.currentOntology].corpusGraphUri + "> ";
        if (app_config.ontologies[app_config.currentOntology].corpusGraphUri != app_config.ontologies[app_config.currentOntology].conceptsGraphUri)
            fromStr += "from <" + app_config.ontologies[app_config.currentOntology].conceptsGraphUri + "> ";


        var query = "  PREFIX terms:<http://purl.org/dc/terms/>        PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#>        PREFIX rdfsyn:<http://www.w3.org/1999/02/22-rdf-syntax-ns#>PREFIX mime:<http://purl.org/dc/dcmitype/> PREFIX mime:<http://www.w3.org/2004/02/skos/core#>  " +
            "       select distinct * " +
            fromStr +
            " where {  "
        concepts.forEach(function (conceptId, conceptIndex) {
            query += "?paragraph terms:subject ?conceptX" + conceptIndex + ".?conceptX" + conceptIndex + " skos:broader* ?concept" + conceptIndex + ". filter(?concept" + conceptIndex + "=<" + conceptId + ">) ?concept" + conceptIndex + "  skos:prefLabel ?conceptLabel" + conceptIndex + " filter (lang(?conceptLabel" + conceptIndex + ")='en') "

        })

        var whereCorpus = Selection.currentSelectionQuery.whereCorpus
        if (whereCorpus && whereCorpus != "")
            query += " " + whereCorpus
        query += "} order by ?paragraph limit 10000"
        var url = app_config.sparql_url + "?default-graph-uri=&query=";// + query + queryOptions
        var queryOptions = "&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=20000&debug=off"
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
