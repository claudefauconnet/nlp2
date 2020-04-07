var thesaurus = (function () {
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
            common.loadJsTree("jstreeConceptDiv", jstreeData, {withCheckboxes: 1, selectDescendants: 1})


        })
    }
    self.loadThesaurusTopConceptsTree = function () {
        $("#currentConceptsSpan").html("");
        var url = sparql.source.sparql_url + "?default-graph-uri=http://data.total.com/resource/thesaurus/ctg/&query=";// + query + queryOptions
        var query = "PREFIX terms:<http://purl.org/dc/terms/>PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#>PREFIX rdfsyn:<https://www.w3.org/1999/02/22-rdf-syntax-ns#>PREFIX skos:<http://www.w3.org/2004/02/skos/core#>" +

            "select distinct * " +
            "where{" +

            "?concept skos:topConceptOf ?scheme." +
            "?concept skos:prefLabel ?concepLabel." +
            "} limit 100"
        var queryOptions = "&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=5000&debug=on"
        sparql.querySPARQL_GET_proxy(url, query, queryOptions, null, function (err, result) {
            if (err) {
                return common.message(err)
            }

            var jstreeData = [];
            var uniqueIds = []
            result.results.bindings.forEach(function (item) {

                if (uniqueIds.indexOf(item.scheme.value) < 0) {
                    uniqueIds.push(item.scheme.value);
                    var schemeLabel = item.scheme.value
                    schemeLabel = schemeLabel.substring(0, schemeLabel.length - 1)
                    schemeLabel = schemeLabel.substring(schemeLabel.lastIndexOf("/") + 1)
                    jstreeData.push({text: schemeLabel, id: item.scheme.value, parent: "#"})
                }
                if (uniqueIds.indexOf(item.concept.value) < 0) {
                    uniqueIds.push(item.concept.value);
                    jstreeData.push({text: item.concepLabel.value, id: item.concept.value, parent: item.scheme.value})
                }
            })
            common.loadJsTree("jstreeConceptDiv", jstreeData, {
                withCheckboxes: 1, selectDescendants: 1, selectNodeFn: function (evt, obj) {
                    thesaurus.onNodeSelect(evt, obj);
                }
            })

        });


    }
    self.getSelectedConceptDescendants = function (callback) {
        var selectedConcepts = null;
        var allDescendantConcepts = [];
        var selectedConcepts = $("#jstreeConceptDiv").jstree(true).get_checked()
        if (selectedConcepts.length == 0)
            return callback(null, []);
        var slicedSelectedConcepts = common.sliceArray(selectedConcepts, 25);
        async.eachSeries(slicedSelectedConcepts, function (concepts, callbackEach) {

            thesaurus.sparql_geConceptDescendants(concepts, function (err, result) {
                if (err)
                    return callbackEach(err);
                allDescendantConcepts = allDescendantConcepts.concat(result);
                callbackEach();
            })
        }, function (err) {
            thesaurus.currentSelectedConcepts = allDescendantConcepts;
            callback(err, allDescendantConcepts);

        })
    }

    self.sparql_geConceptDescendants = function (conceptIds, callback) {
        var depth = 7
        var url = sparql.source.sparql_url + "?default-graph-uri=http://data.total.com/resource/thesaurus/ctg/&query=";// + query + queryOptions

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
        query += "}limit 1000"
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

        var url = sparql.source.sparql_url + "?default-graph-uri=http://data.total.com/resource/thesaurus/ctg/&query=";// + query + queryOptions
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
        query += "}limit 1000"
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

        var slicedConceptIds = common.sliceArray(conceptIds, 25);
        async.eachSeries(slicedConceptIds, function (concepts, callbackEach) {

            thesaurus.sparql_getAncestors(concepts, function (err, result) {
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


    self.onNodeSelect = function (evt, obj) {
        var node = obj.node
        $("#currentConceptsSpan").html(" : " + obj.node.text);
        if (node.children.length > 0)
            return;

        self.loadChildrenInConceptJstree(obj.node.id, 1)

    }


    return self;

})()
