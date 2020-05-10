var Concepts = (function () {
    var self = {}


    var rootUris = {}

    self.searchConcept = function (word) {

        self.listThesaurusConcepts(word, {}, function (err, result) {

            if (err)
                return common.message(err)

            var jstreeData = [];
            var conceptBroadersMap = {};
            var uniqueIds = []


            result.forEach(function (item) {
                var uniqueBroaderIds = []
                var id = item.concept.value;
                for (var i = 1; i < 6; i++) {
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
                            if(uniqueBroaderIds.indexOf(broader2.value)<0) {
                                node.parent = broader2.value;
                            }
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

                    var node = {id: id, text: item.prefLabel.value}
                    for (var i = 0; i < 6; i++) {
                        if (typeof (item["broader" + i]) != "undefined") {


                                if (conceptBroadersMap[item["broader" + i].value]) {
                                    node.parent = item["broader" + i].value;
                                    if (uniqueIds.indexOf(id) < 0) {
                                        uniqueIds.push(id)
                                        jstreeData.push(node)
                                    }

                            }
                        }
                    }



            })


            //  console.log(JSON.stringify(jstreeData,null,2))
            common.loadJsTree("jstreeConceptDiv", jstreeData, {
                withCheckboxes: 1,
                openAll: true,

                selectNodeFn: function (evt, obj) {
                    Concepts.onNodeSelect(evt, obj);
                },
                onCheckNodeFn: function (evt, obj) {
                    Concepts.onNodeChecked(evt, obj);
                },
                onUncheckNodeFn: function (evt, obj) {
                    Concepts.onNodeUnchecked(evt, obj);

                }
            })


        })
    }
    self.loadConceptsJsTree = function () {
        $("#currentConceptsSpan").html("");
        var jstreeData = [];
        var uniqueIds = []
        async.series([
            function (callbackSeries) {
                var conceptsGraphUri=app_config.ontologies[app_config.currentOntology].conceptsGraphUri
                var url = sparql.source.sparql_url + "?default-graph-uri=" + encodeURIComponent(conceptsGraphUri) + "&query=";// + query + queryOptions
                var query = "PREFIX terms:<http://purl.org/dc/terms/>PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#>PREFIX rdfsyn:<https://www.w3.org/1999/02/22-rdf-syntax-ns#>PREFIX skos:<http://www.w3.org/2004/02/skos/core#>" +

                    "select distinct * " +
                    "where{" +

                    "?concept skos:topConceptOf ?scheme." +
                    "?concept skos:prefLabel ?conceptLabel."
                query += "  }ORDER BY ?conceptLabel ";
                query += "limit 5000 "
                var queryOptions = "&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=20000&debug=off"
                sparql.querySPARQL_GET_proxy(url, query, queryOptions, null, function (err, result) {
                    if (err) {
                        return common.message(err)
                    }


                //    jstreeData.push({text: "thesaurusCTG", id: "CTG", parent: "#"})
                    result.results.bindings.forEach(function (item) {

                        if (uniqueIds.indexOf(item.scheme.value) < 0) {
                            uniqueIds.push(item.scheme.value);
                            var schemeLabel = item.scheme.value
                            schemeLabel = schemeLabel.substring(0, schemeLabel.length - 1)
                            schemeLabel = schemeLabel.substring(schemeLabel.lastIndexOf("/") + 1)
                        //    jstreeData.push({text: schemeLabel, id: item.scheme.value, parent: "CTG"})
                            jstreeData.push({text: schemeLabel, id: item.scheme.value, parent: "#"})
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

                var conceptsGraphUri=app_config.ontologies[app_config.currentOntology].conceptsGraphUri
                var url = sparql.source.sparql_url + "?default-graph-uri=" + encodeURIComponent(conceptsGraphUri) + "&query=";// + query + queryOptions

                var query = "PREFIX skos: <http://www.w3.org/2004/02/skos/core#>PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#>PREFIX rdfsyn:<https://www.w3.org/1999/02/22-rdf-syntax-ns#>   PREFIX skos:<http://www.w3.org/2004/02/skos/core#> SELECT DISTINCT *WHERE {{?concept skos:broader  ?broader. ?concept skos:prefLabel  ?conceptLabel.  FILTER NOT EXISTS{?broader skos:broader  ?broader2. }FILTER contains(str(?concept),\"quantum/P\")}" +
                    "UNION{" +
                    " ?concept skos:prefLabel ?conceptLabel ." +
                    " FILTER (?concept=<http://data.total.com/resource/ontology/quantum/Attributes>)" +
                    " " +
                    "}"
                query += "  }ORDER BY ?conceptLabel ";
                query += "limit 500 "
                var queryOptions = "&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=20000&debug=off"
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
                    withCheckboxes: 1,
                    // openAll:true,
                    selectNodeFn: function (evt, obj) {
                        Concepts.onNodeSelect(evt, obj);
                    },
                    onCheckNodeFn: function (evt, obj) {
                        Concepts.onNodeChecked(evt, obj);
                    },
                    onUncheckNodeFn: function (evt, obj) {
                        Concepts.onNodeUnchecked(evt, obj);

                    }
                })
                return callbackSeries();
            }


        ])


    }

    self.listThesaurusConcepts = function (word, options, callback) {
        var conceptsGraphUri=app_config.ontologies[app_config.currentOntology].conceptsGraphUri
        var url = sparql.source.sparql_url + "?default-graph-uri=" + encodeURIComponent(conceptsGraphUri) + "&query=";// + query + queryOptions
        var query = "PREFIX skos:<http://www.w3.org/2004/02/skos/core#>" +
            "" +
            "SELECT *" +
            "WHERE {" +
            "  ?concept skos:prefLabel ?prefLabel ." +
            "filter contains(lcase(str(?prefLabel )),\"" + word.toLowerCase() + "\")" +
          //  "filter (lang(?prefLabel)=\"en\")" +
            "" +
            "OPTIONAL {" +
            "?concept skos:broader ?broader1 ." +
            "?broader1 skos:prefLabel ?broaderLabel1 ." +
           // "filter (lang(?broaderLabel1 )=\"en\")" +
            "OPTIONAL {" +
            "?broader1 skos:broader ?broader2 ." +
            "?broader2 skos:prefLabel ?broaderLabel2 ." +
           // "filter (lang(?broaderLabel2)=\"en\")" +
            "" +
            "OPTIONAL {" +
            "?broader2 skos:broader ?broader3 ." +
            "?broader3 skos:prefLabel ?broaderLabel3 ." +
           // "filter (lang(?broaderLabel3)=\"en\")" +
            "OPTIONAL {" +
            "?broader3 skos:broader ?broader4 ." +
            "?broader4 skos:prefLabel ?broaderLabel4 ." +
          //  "filter (lang(?broaderLabel4)=\"en\")" +
            "OPTIONAL {" +
            "?broader4 skos:broader ?broader5 ." +
            "?broader5 skos:prefLabel ?broaderLabel5 ." +
          //  "filter (lang(?broaderLabel5)=\"en\")" +
            "OPTIONAL {" +
            "?broader5 skos:broader ?broader6 ." +
            "?broader6 skos:prefLabel ?broaderLabel6 ." +
        //    "filter (lang(?broaderLabel6)=\"en\")" +
            "" +
            "}" +
            "}" +
            "" +
            "}" +
            "" +
            "}" +
            "}" +
            "}" +
            "" +
            "" +
            "}" +
            "LIMIT 2000"

        var queryOptions = "&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=20000&debug=off"
        sparql.querySPARQL_GET_proxy(url, query, queryOptions, null, function (err, result) {
            if (err) {
                return callback(err);
            }
            var bindings = [];
            var ids = [];
            return callback(null, result.results.bindings);
        })


    }


    self.getSelectedConceptDescendants = function (options,callback) {
        var conceptsSelected = Concepts.currentConceptsSelection
        if (!conceptsSelected || conceptsSelected.length==0 || conceptsSelected[0].length==0)
            return callback(null, [])

        var conceptsSets = [];



        async.eachSeries(conceptsSelected, function (conceptSet, callbackEach) {//

            Concepts.sparql_geConceptDescendants(conceptSet, options,function (err, result) {
                if (err)
                    return callbackEach(err);
                conceptsSets.push(result)
                callbackEach();
            })
        }, function (err) {
            callback(err, conceptsSets);


        })
    }

    self.sparql_geConceptDescendants = function (conceptSet, options,callback) {

        if (!Array.isArray(conceptSet))
            conceptSet = [conceptSet]


// in concept set concat id in filter concept
        var conceptIdsStr = ""
        var thesaurusLevel=0;
        conceptSet.forEach(function (concept, index) {
            thesaurusLevel=Math.max(thesaurusLevel,concept.level)
            if (index > 0)
                conceptIdsStr += ","
            conceptIdsStr += "<" + concept.id + ">"
        })



        var query = "PREFIX skos:<http://www.w3.org/2004/02/skos/core#>" +
            "select distinct *" + //+"?concept" + thesaurusLevel+
            " where{ ?concept"+ thesaurusLevel+" skos:prefLabel ?conceptLabel."
            + "filter (?concept"+thesaurusLevel+" in(" + conceptIdsStr + "))"





        for (var i = thesaurusLevel; i < 7; i++) {

            query += " OPTIONAL{ ?concept" + (i + 1) + " skos:broader ?concept"+i+". "

        }
        for (var i = thesaurusLevel; i < 7; i++) {
            query += "}"
        }
        query += "  }";
        query += "limit 1000 "


        var conceptsGraphUri=app_config.ontologies[app_config.currentOntology].conceptsGraphUri
        var url = sparql.source.sparql_url + "?default-graph-uri=" + encodeURIComponent(conceptsGraphUri) + "&query=";// + query + queryOptions
        var queryOptions = "&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=20000&debug=off"
        sparql.querySPARQL_GET_proxy(url, query, queryOptions, null, function (err, result) {
            if (err) {
                return common.message(err)
            }

            var descendantsIds = [];

            result.results.bindings.forEach(function (item) {
                for (var i = 1; i < 7; i++) {
                    var concept = item["concept" + i]
                    if (typeof concept !== "undefined") {
                        if (descendantsIds.indexOf(concept.value) < 0) {
                            descendantsIds.push(concept.value);
                        }
                    }
                }

            })
            callback(null, {ids:descendantsIds,thesaurusLevel:thesaurusLevel})
        })
    }

    self.loadChildrenInConceptJstree = function (conceptId, depth) {
        var conceptsGraphUri=app_config.ontologies[app_config.currentOntology].conceptsGraphUri
        var url = sparql.source.sparql_url + "?default-graph-uri=" + encodeURIComponent(conceptsGraphUri) + "&query=";// + query + queryOptions
        var query = "PREFIX terms:<http://purl.org/dc/terms/>PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#>PREFIX rdfsyn:<https://www.w3.org/1999/02/22-rdf-syntax-ns#>PREFIX skos:<http://www.w3.org/2004/02/skos/core#>" +

            "select distinct *" +
            "where{ ?child1 skos:broader ?concept."
            + " filter (?concept=<" + conceptId + ">) "
            + "?child1 skos:prefLabel ?childLabel1 ."


        for (var i = 1; i < 7; i++) {

            query += "OPTIONAL { ?child" + (i + 1) + " skos:broader ?child" + i + "." +
                "?child" + (i + 1) + " skos:prefLabel ?childLabel" + (i + 1) + "." +
                "filter( lang(?childLabel" + (i + 1) + ")=\"en\")"
        }
        for (var i = 1; i < 7; i++) {
            query += "}"
        }
        query += "  }ORDER BY ?childLabel1 ";
        query += "limit 1000 "

        var queryOptions = "&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=20000&debug=off"
        sparql.querySPARQL_GET_proxy(url, query, queryOptions, null, function (err, result) {
            if (err) {
                return common.message(err)
            }

            var jstreeData = [];
            var uniqueIds = []
            result.results.bindings.forEach(function (item) {

                for (var i = 1; i < 7; i++) {
                    var childConceptId = item["child" + i]
                    if (typeof childConceptId !== "undefined") {
                        if (uniqueIds.indexOf(childConceptId.value) < 0) {
                            uniqueIds.push(childConceptId.value);
                            var parent=item.concept.value
                            if( i>1)
                                parent=item["child" + (i-1)].value
                            $("#jstreeConceptDiv").jstree(true).create_node(parent, {text: item["childLabel" + i].value, id: childConceptId.value}, "last")



                             //   common.addNodesToJstree("jstreeConceptDiv", parent, {text: item["childLabel" + i].value, id: childConceptId.value});
                        //    jstreeData.push({text: item["childLabel" + i].value, id: childConceptId.value,parent:parent})
                        }
                    }
                }
            })
            $("#jstreeConceptDiv").jstree(true).open_node(conceptId)
          /*  if (jstreeData.length > 0)
                common.addNodesToJstree("jstreeConceptDiv", conceptId, jstreeData);*/
        });


    }

    self.getSelectedConceptAncestors = function (conceptIds, options, callback) {

        var slicedConceptIds = common.sliceArray(conceptIds, Selection.sliceZize);
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

        var conceptsGraphUri=app_config.ontologies[app_config.currentOntology].conceptsGraphUri
        var url = sparql.source.sparql_url + "?default-graph-uri=" + encodeURIComponent(conceptsGraphUri) + "&query=";// + query + queryOptions
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


        var queryOptions = "&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=20000&debug=off"

        sparql.querySPARQL_GET_proxy(url, query, queryOptions, null, function (err, result) {
            if (err) {
                return callback(err);
            }
            callback(null, result.results.bindings)

        })
    }

    self.getConceptsInfos = function (conceptIds, options, callback) {
        if (!conceptIds || conceptIds.length==0)
            return callback(null, [])


        if (!options) {
            options = {}
        }
        var allInfos = [];
        var slices = common.sliceArray(conceptIds, Selection.sliceZize)
        async.eachSeries(slices, function (slice, callbackEach) {

            var conceptIdsStr = "";
            slice.forEach(function (id, index) {
                if (index > 0)
                    conceptIdsStr += ","
                conceptIdsStr += "<" + id + ">"
            })


            var conceptsGraphUri=app_config.ontologies[app_config.currentOntology].conceptsGraphUri
            var url = sparql.source.sparql_url + "?default-graph-uri=" + encodeURIComponent(conceptsGraphUri) + "&query=";// + query + queryOptions

            var query = "PREFIX skos: <http://www.w3.org/2004/02/skos/core#>" +
                "PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#>" +
                "PREFIX rdfsyn:<https://www.w3.org/1999/02/22-rdf-syntax-ns#>" +
                "SELECT DISTINCT *" +
                "WHERE {" +
                "?concept skos:prefLabel ?conceptLabel ." +
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


            var queryOptions = "&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=20000&debug=off"

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

        if (node.children.length > 0)
            return;

        self.loadChildrenInConceptJstree(obj.node.id, 1)

    }


    self.onNodeChecked = function (evt, obj) {
var level=obj.node.parents.length-1;

        if (obj.event.ctrlKey && self.currentConceptsSelection) {

            self.currentConceptsSelection.push([{id:obj.node.id,level:level}]);
            Selection.setConceptSelectedCBX(obj, "AND")

        } else {
            if (!self.currentConceptsSelection)
                self.currentConceptsSelection = [[]];

            self.currentConceptsSelection[self.currentConceptsSelection.length - 1].push({id:obj.node.id,level:level});
            Selection.setConceptSelectedCBX(obj, "OR")
        }


    }

    self.onNodeUnchecked = function (evt, obj) {
        self.currentConceptsSelection = null;

    }


    self.getSelectedConcepts = function () {
        var selection = [];
        $(".selectedConceptCBX").each(function () {
            if ($(this).prop("checked")) {
                selection.push($(this).val())
            }
        })
        return selection;


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
