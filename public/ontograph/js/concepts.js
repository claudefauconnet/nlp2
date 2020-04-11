var Concepts = (function () {
    var self = {}


    var rootUris = {}

    self.searchConcept = function (word) {

        sparql.listThesaurusConcepts(word, {}, function (err, result) {

            if (err)
                return common.message(err)

            var jstreeData = [];
            var conceptBroadersMap = {};
            var uniqueIds = []

            result.forEach(function (item) {
                var id = item.concept.value;
                for (var i = 1; i < 5; i++) {
                    var broader = item["broader" + i];
                    if (broader) {
                        broader = broader.value


                        var node = {id: broader, text: item["broaderLabel" + i].value};
                        var broader2 = null;
                        broader2 = item["broader" + (i + 1)]
                        if (typeof broader2 === "undefined") {
                            node.parent = broader.substring(0, broader.lastIndexOf("/"));
                            var topNode = {id: node.parent, parent: "#", text: node.parent.substring(node.parent.lastIndexOf("/") + 1)}
                            conceptBroadersMap[topNode.id] = topNode;

                        } else {
                            node.parent = broader2.value;
                        }

                        conceptBroadersMap[broader] = node;
                    }
                }

            })

            for (var id in conceptBroadersMap) {
                var item = conceptBroadersMap[id];
                if (uniqueIds.indexOf(id) < 0) {
                    uniqueIds.push(id)
                    jstreeData.push(item)
                }

            }
            result.forEach(function (item) {
                var id = item.concept.value;
                if (uniqueIds.indexOf(id) < 0) {
                    uniqueIds.push(id)
                    var node = {id: id, text: item.prefLabel.value}
                    if (conceptBroadersMap[item.broader1.value]) {
                        node.parent = item.broader1.value;
                        jstreeData.push(node)
                    }

                }

            })


            //  console.log(JSON.stringify(jstreeData,null,2))
            common.loadJsTree("jstreeConceptDiv", jstreeData, {withCheckboxes: 1, selectDescendants: 1,openAll:true})


        })
    }
    self.loadThesaurusTopConceptsTree = function () {
        $("#currentConceptsSpan").html("");
        var jstreeData = [];
        var uniqueIds = []
        async.series([
            function (callbackSeries) {
                var url = sparql.source.sparql_url + "?default-graph-uri=http://data.total.com/resource/thesaurus/ctg/&query=";// + query + queryOptions
                var query = "PREFIX terms:<http://purl.org/dc/terms/>PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#>PREFIX rdfsyn:<https://www.w3.org/1999/02/22-rdf-syntax-ns#>PREFIX skos:<http://www.w3.org/2004/02/skos/core#>" +

                    "select distinct * " +
                    "where{" +

                    "?concept skos:topConceptOf ?scheme." +
                    "?concept skos:prefLabel ?conceptLabel."
                query += "  }ORDER BY ?conceptLabel ";
                query += "limit 500 "
                var queryOptions = "&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=5000&debug=on"
                sparql.querySPARQL_GET_proxy(url, query, queryOptions, null, function (err, result) {
                    if (err) {
                        return common.message(err)
                    }


                    jstreeData.push({text: "thesaurusCTG", id: "CTG", parent: "#"})
                    result.results.bindings.forEach(function (item) {

                        if (uniqueIds.indexOf(item.scheme.value) < 0) {
                            uniqueIds.push(item.scheme.value);
                            var schemeLabel = item.scheme.value
                            schemeLabel = schemeLabel.substring(0, schemeLabel.length - 1)
                            schemeLabel = schemeLabel.substring(schemeLabel.lastIndexOf("/") + 1)
                            jstreeData.push({text: schemeLabel, id: item.scheme.value, parent: "CTG"})
                        }
                        if (uniqueIds.indexOf(item.concept.value) < 0) {
                            uniqueIds.push(item.concept.value);
                            jstreeData.push({text: item.conceptLabel.value, id: item.concept.value, parent: item.scheme.value})
                        }
                    })
                    return callbackSeries();


                });
            },
            function (callbackSeries) {


                var url = sparql.source.sparql_url + "?default-graph-uri=http://data.total.com/resource/ontology/quantum/&query=";// + query + queryOptions
                var query = "PREFIX skos: <http://www.w3.org/2004/02/skos/core#>PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#>PREFIX rdfsyn:<https://www.w3.org/1999/02/22-rdf-syntax-ns#>   PREFIX skos:<http://www.w3.org/2004/02/skos/core#> SELECT DISTINCT *WHERE {{?concept skos:broader  ?broader. ?concept skos:prefLabel  ?conceptLabel.  FILTER NOT EXISTS{?broader skos:broader  ?broader2. }FILTER contains(str(?concept),\"quantum/P\")}" +
                    "UNION{" +
                    " ?concept skos:prefLabel ?conceptLabel ." +
                    " FILTER (?concept=<http://data.total.com/resource/ontology/quantum/Attributes>)" +
                    " " +
                    "}"
                query += "  }ORDER BY ?conceptLabel ";
                query += "limit 500 "
                var queryOptions = "&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=5000&debug=on"
                sparql.querySPARQL_GET_proxy(url, query, queryOptions, null, function (err, result) {
                    if (err) {
                        return common.message(err)
                    }


                    jstreeData.push({text: "Quantum", id: "QUANTUM", parent: "#"})
                    result.results.bindings.forEach(function (item) {
                        if (uniqueIds.indexOf(item.concept.value) < 0) {
                            uniqueIds.push(item.concept.value);
                            jstreeData.push({text: item.conceptLabel.value, id: item.concept.value, parent: "QUANTUM"})
                        }
                    })
                    return callbackSeries();
                });

            },
            function (callbackSeries) {

                common.loadJsTree("jstreeConceptDiv", jstreeData, {
                    withCheckboxes: 0, selectDescendants: 1, selectNodeFn: function (evt, obj) {
                        Concepts.onNodeSelect(evt, obj);
                    }
                })
                return callbackSeries();
            }


        ])


    }


    self.getSelectedConceptDescendants = function (callback) {
        var selectedConcepts = null;
        var allDescendantConcepts = [];
        var selectedConcepts = $("#jstreeConceptDiv").jstree(true).get_selected()
        if (selectedConcepts.length == 0)
            return callback(null, []);
        var slicedSelectedConcepts = common.sliceArray(selectedConcepts,  projection.sliceZize);
        async.eachSeries(slicedSelectedConcepts, function (concepts, callbackEach) {

            Concepts.sparql_geConceptDescendants(concepts, function (err, result) {
                if (err)
                    return callbackEach(err);
                allDescendantConcepts = allDescendantConcepts.concat(result);
                callbackEach();
            })
        }, function (err) {
            Concepts.currentSelectedConcepts = allDescendantConcepts;
            callback(err, allDescendantConcepts);

        })
    }

    self.sparql_geConceptDescendants = function (conceptIds, callback) {
        var depth = 7;
        var defaultIri = "http://data.total.com/resource/thesaurus/ctg/"
        defaultIri = ""
        var url = sparql.source.sparql_url + "?default-graph-uri=" + defaultIri + "&query=";// + query + queryOptions

        var conceptIdsStr = ""
        conceptIds.forEach(function (id, index) {
            if (index > 0)
                conceptIdsStr += ","
            conceptIdsStr += "<" + id + ">"
        })


        var query = "PREFIX skos:<http://www.w3.org/2004/02/skos/core#>" +
            "select distinct * " +
            "where{ ?child1 skos:broader ?concept."
            + "filter (?concept in(" + conceptIdsStr + "))"


        for (var i = 1; i < depth; i++) {

            query += "OPTIONAL { ?child" + (i + 1) + " skos:broader ?child" + i + "."

        }
        for (var i = 1; i < depth; i++) {
            query += "}"
        }
        query += "  }";
        query += "limit 1000 "
        var queryOptions = "&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=5000&debug=on"
        sparql.querySPARQL_GET_proxy(url, query, queryOptions, null, function (err, result) {
            if (err) {
                return common.message(err)
            }

            var descendantsIds = conceptIds;
            var uniqueIds = []
            result.results.bindings.forEach(function (item) {
                for (var i = 1; i < 7; i++) {
                    var concept = item["child" + i]
                    if (typeof concept !== "undefined") {
                        if (descendantsIds.indexOf(concept.value) < 0) {
                            descendantsIds.push(concept.value);
                        }
                    }
                }

            })
            callback(null, descendantsIds)
        })
    }

    self.loadChildrenInConceptJstree = function (conceptId, depth) {
        var graphIri = "http://data.total.com/resource/thesaurus/ctg/";
        if (conceptId.indexOf("/quantum/") > -1)
            graphIri = "http://data.total.com/resource/ontology/quantum/"

        var url = sparql.source.sparql_url + "?default-graph-uri=" + graphIri + "&query=";// + query + queryOptions
        var query = "PREFIX terms:<http://purl.org/dc/terms/>PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#>PREFIX rdfsyn:<https://www.w3.org/1999/02/22-rdf-syntax-ns#>PREFIX skos:<http://www.w3.org/2004/02/skos/core#>" +

            "select distinct *" +
            "where{ ?child1 skos:broader ?concept."
            + " filter (?concept=<" + conceptId + ">) "
            + "?child1 skos:prefLabel ?childLabel1 ."


        for (var i = 1; i < depth; i++) {

            query += "OPTIONAL { ?child" + (i + 1) + " skos:broader ?child" + i + "." +
                "?child" + (i + 1) + " skos:prefLabel ?childLabel" + (i + 1) + "." +
                "filter( lang(?childLabel" + (i + 1) + ")=\"en\")"
        }
        for (var i = 1; i < depth; i++) {
            query += "}"
        }
        query += "  }ORDER BY ?childLabel1 ";
        query += "limit 1000 "

        var queryOptions = "&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=5000&debug=on"
        sparql.querySPARQL_GET_proxy(url, query, queryOptions, null, function (err, result) {
            if (err) {
                return common.message(err)
            }

            var jstreeData = [];
            var uniqueIds = []
            result.results.bindings.forEach(function (item) {

                for (var i = 1; i < 7; i++) {
                    var concept = item["child" + i]
                    if (typeof concept !== "undefined") {
                        if (uniqueIds.indexOf(concept.value) < 0) {
                            uniqueIds.push(concept.value);
                            jstreeData.push({text: item["childLabel" + i].value, id: concept.value})
                        }
                    }
                }
            })
            if (jstreeData.length > 0)
                common.addNodesToJstree("jstreeConceptDiv", conceptId, jstreeData);
        });


    }

    self.getSelectedConceptAncestors = function (conceptIds, options, callback) {

        var slicedConceptIds = common.sliceArray(conceptIds,  projection.sliceZize);
        async.eachSeries(slicedConceptIds, function (concepts, callbackEach) {

            Concepts.sparql_getAncestors(concepts, function (err, result) {
                if (err)
                    return callbackEach(err);
                allAncestors = allAncestors.concat(result);
                callbackEach();
            })
        }, function (err) {
            callback(err, allAncestors);

        })

    }

    self.sparql_getAncestors = function (conceptIds, options, callback) {

        var conceptIdsStr = ""
        conceptIds.forEach(function (id, index) {
            if (index > 0)
                conceptIdsStr += ","
            conceptIdsStr += "<" + id + ">"
        })


        var url = sparql.source.sparql_url + "?default-graph-uri=" + encodeURIComponent(sparql.source.graphIRI) + "&query=";// + query + queryOptions

        var query = "PREFIX skos: <http://www.w3.org/2004/02/skos/core#>" +
            "SELECT DISTINCT *" +
            "WHERE {" +
            "?concept skos:prefLabel ?conceptPrefLabel ;" +
            "skos:broader ?broaderId1 . " +
            "  ?broaderId1 skos:prefLabel ?broader1 ." +
            "filter (?concept in(" + conceptIdsStr + "))"


        query +=
            "OPTIONAL {" +
            "    ?broaderId1 skos:broader ?broaderId2 ." +
            "    ?broaderId2 skos:prefLabel ?broader2 ." +
            "     OPTIONAL {" +
            "   " +
            "       ?broaderId2 skos:broader ?broaderId3 ." +
            "    ?broaderId3 skos:prefLabel ?broader3 ." +
            "       OPTIONAL {" +
            "       ?broaderId3 skos:broader ?broaderId4 ." +
            "    ?broaderId4 skos:prefLabel ?broader4 ." +
            "           OPTIONAL {" +
            "       ?broaderId4 skos:broader ?broaderId5 ." +
            "    ?broaderId5 skos:prefLabel ?broader5 ." +
            "         OPTIONAL {   " +
            "       ?broaderId5 skos:broader ?broaderId6 ." +
            "    ?broaderId6 skos:prefLabel ?broader6 ." +
            "               OPTIONAL {   " +
            "       ?broaderId6 skos:broader ?broaderId7 ." +
            "    ?broaderId7 skos:prefLabel ?broader7 ." +
            "                 OPTIONAL {   " +
            "       ?broaderId7 skos:broader ?broaderId8 ." +
            "    ?broaderId8 skos:prefLabel ?broader8 ." +
            "              }" +
            "            }" +
            "        }" +
            "        }" +
            "     " +
            "    }" +
            "    }" +
            " " +
            "  }" +
            "  }" +
            "ORDER BY ASC(?broaderId1)" +
            "LIMIT 1000"
        console.log(query)


        var queryOptions = "&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=5000&debug=on"

        sparql.querySPARQL_GET_proxy(url, query, queryOptions, null, function (err, result) {
            if (err) {
                return callback(err);
            }
            callback(null, result.results.bindings)

        })
    }

    self.getConceptsInfos = function (conceptIds, options, callback) {
        if (!options) {
            options = {}
        }
        var allInfos = [];
        var slices = common.sliceArray(conceptIds,  projection.sliceZize)
        async.eachSeries(slices, function (slice, callbackEach) {

            var conceptIdsStr = "";
            slice.forEach(function (id, index) {
                if (index > 0)
                    conceptIdsStr += ","
                conceptIdsStr += "<" + id + ">"
            })


            var url = sparql.source.sparql_url + "?default-graph-uri=&query=";// + query + queryOptions

            var query = "PREFIX skos: <http://www.w3.org/2004/02/skos/core#>" +
                "PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#>" +
                "PREFIX rdfsyn:<https://www.w3.org/1999/02/22-rdf-syntax-ns#>" +
                "SELECT DISTINCT *" +
                "WHERE {" +
                "?concept skos:prefLabel ?conceptLabel ."+
            " filter (?concept in(" + conceptIdsStr + "))"

            if (!options.onlyAncestors) {
                query += "OPTIONAL {?concept skos:exactMatch ?exactMatch .}" +
                    "OPTIONAL {?concept skos:definition ?definition .}"
            }

            query += "OPTIONAL {" +
                "   ?concept skos:broader ?broaderId1 ." +
                "  ?broaderId1 skos:prefLabel ?broader1 ." +
                "     OPTIONAL {" +
                "    ?broaderId1 skos:broader ?broaderId2 ." +
                "    ?broaderId2 skos:prefLabel ?broader2 ." +
                "     OPTIONAL {" +

                "       ?broaderId2 skos:broader ?broaderId3 ." +
                "    ?broaderId3 skos:prefLabel ?broader3 ." +
                "       OPTIONAL {" +
                "       ?broaderId3 skos:broader ?broaderId4 ." +
                "    ?broaderId4 skos:prefLabel ?broader4 ." +
                "           OPTIONAL {" +
                "       ?broaderId4 skos:broader ?broaderId5 ." +
                "    ?broaderId5 skos:prefLabel ?broader5 ." +
                "         OPTIONAL {   " +
                "       ?broaderId5 skos:broader ?broaderId6 ." +
                "    ?broaderId6 skos:prefLabel ?broader6 ." +
                "               OPTIONAL {   " +
                "       ?broaderId6 skos:broader ?broaderId7 ." +
                "    ?broaderId7 skos:prefLabel ?broader7 ." +
                "                 OPTIONAL {   " +
                "       ?broaderId7 skos:broader ?broaderId8 ." +
                "    ?broaderId8 skos:prefLabel ?broader8 ." +
                "              }" +
                "            }" +
                "        }" +
                "        }" +
                "      }" +
                "    }" +
                "    }" +
                " " +
                "  }" +
                "  }" +
                "ORDER BY ASC(?broaderId1)" +
                "LIMIT 1000"



            var queryOptions = "&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=5000&debug=on"

            sparql.querySPARQL_GET_proxy(url, query, queryOptions, null, function (err, result) {
                if (err) {
                    return callbackEach(err);
                }
                allInfos = allInfos.concat(result.results.bindings)
                callbackEach()

            })
        }, function (err) {
            return callback(null, allInfos)
        })


    }


    self.onNodeSelect = function (evt, obj) {

        var node = obj.node
        var text = obj.node.text + "<br><span style='font-size: 12px'>"
        node.parents.forEach(function (parent, index) {
            var parentLabel = $("#jstreeConceptDiv").jstree(true).get_node(parent)
            if (index < node.parents.length - 1)
                text += "/" + parentLabel.text
        })
        text += "</span>"
        $("#currentConceptsSpan").html(" : " + text);
        if (obj.event.ctrlKey) {
            return $("#accordion").accordion({active: 2});
        }
        if (node.children.length > 0)
            return;

        self.loadChildrenInConceptJstree(obj.node.id, 1)

    }

    self.getAncestorsFromJstree = function (conceptId) {
        var node = $("#jstreeConceptDiv").jstree(true).get_node(conceptId)
        var ancestors = []
        var parents = node.parents
        if (parents) {
            //     parents.splice(0, 0, conceptId);

            parents.forEach(function (parent) {
                if (parent != "#") {
                    var parentNode = $("#jstreeConceptDiv").jstree(true).get_node(parent)
                    ancestors.push({id: parent, label: parentNode.text});
                }
            })
        }

        return ancestors;
    }


    return self;

})
()
