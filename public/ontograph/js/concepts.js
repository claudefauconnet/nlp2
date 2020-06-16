var Concepts = (function () {
    var self = {}


    var rootUris = {}


    self.searchConcept = function (word) {

        var ancestorDepth = 6;
        sparql_facade.searchConceptAndAncestors(word, ancestorDepth, {}, function (err, result) {

            if (err)
                return common.message(err)

            var ancestorDepth = 6;
            var nodes = {}
            result.forEach(function (item) {
                var conceptId = item.concept.value
                if (!nodes[conceptId]) {
                    nodes[conceptId] = {id: item.concept.value, text: item.conceptLabel.value, parent: "#"};
                    for (var i = 1; i < ancestorDepth; i++) {

                        if (typeof (item["broader" + i]) != "undefined") {
                            var broaderId = item["broader" + i].value
                            if (i == 1) {
                                nodes[conceptId].parent = broaderId;
                            }

                            if (!nodes[broaderId]) {
                                var broaderLabel = item["broaderLabel" + i].value
                                nodes[broaderId] = {id: broaderId, text: broaderLabel, parent: "#"};
                                var broaderParent = item["broader" + (i + 1)];
                                if (broaderParent)
                                    nodes[broaderId].parent = broaderParent.value;
                            }
                        }
                    }
                }


            })
            var jstreeData = [];
            var uniqueIds = []
            for (var id in nodes) {
                var item = nodes[id];
                if (uniqueIds.indexOf(id) < 0) {
                    uniqueIds.push(id)
                    jstreeData.push(item)
                }

            }


            //     console.log(JSON.stringify(jstreeData, null, 2))
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
        sparql_facade.getTopConcepts(function (err, result) {
            var jstreeData = [];
            var uniqueIds = []
            result.forEach(function (item) {

                if (item.scheme && uniqueIds.indexOf(item.scheme.value) < 0) {
                    uniqueIds.push(item.scheme.value);
                    var schemeLabel = item.schemeLabel.value
                    jstreeData.push({text: schemeLabel, id: item.scheme.value, parent: "#"})
                }
                if (uniqueIds.indexOf(item.concept.value) < 0) {
                    uniqueIds.push(item.concept.value);
                    var scheme = "#"
                    if (item.scheme)
                        scheme = item.scheme.value;
                    jstreeData.push({text: item.conceptLabel.value, id: item.concept.value, parent: scheme})
                }
            })


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
        })


    }


    self.getConceptDescendants = function (options, callback) {
        var conceptsSelected = Concepts.currentConceptsSelection
        if (!conceptsSelected || conceptsSelected.length == 0 || conceptsSelected[0].length == 0)
            return callback(null, [])

        var conceptsSets = [];


        async.eachSeries(conceptsSelected, function (conceptSet, callbackEach) {//

            Concepts.sparql_geConceptDescendants(conceptSet, options, function (err, result) {
                if (err)
                    return callbackEach(err);
                conceptsSets.push(result)
                callbackEach();
            })
        }, function (err) {
            callback(err, conceptsSets);


        })
    }

    self.sparql_geConceptDescendants = function (conceptSet, options, callback) {
        if (!options) {
            options = {lang: "en"}
        }
        if (!options.lang)
            options.lang = "en"
        if (!Array.isArray(conceptSet))
            conceptSet = [conceptSet]


// in concept set concat id in filter concept
        var conceptIdsStr = ""
        var thesaurusLevel = 0;
        conceptSet.forEach(function (concept, index) {
            thesaurusLevel = Math.max(thesaurusLevel, concept.level)
            if (index > 0)
                conceptIdsStr += ","
            conceptIdsStr += "<" + concept.id + ">"
        })


        var query = "PREFIX skos:<http://www.w3.org/2004/02/skos/core#>" +
            "select distinct *" + //+"?concept" + thesaurusLevel+
            " where{ ?concept" + thesaurusLevel + " skos:prefLabel ?conceptLabel" + thesaurusLevel + "." +
            "FILTER (lang(?conceptLabel" + thesaurusLevel + ")='" + options.lang + "')" +
            "filter (?concept" + thesaurusLevel + " in(" + conceptIdsStr + "))";


        for (var i = thesaurusLevel; i < 7; i++) {

            query += " OPTIONAL{ ?concept" + (i + 1) + " skos:broader ?concept" + i + ". "
            if (options.selectLabels) {
                query += "?concept" + (i + 1) + " skos:prefLabel ?conceptLabel" + (i + 1) + ". " +
                    "FILTER (lang(?conceptLabel" + (i + 1) + ")='" + options.lang + "')"
            }

        }
        for (var i = thesaurusLevel; i < 7; i++) {
            query += "}"
        }
        query += "  }";
        query += "limit 1000 "


        var conceptsGraphUri = app_config.ontologies[app_config.currentOntology].conceptsGraphUri
        var url = app_config.sparql_url + "?default-graph-uri=" + encodeURIComponent(conceptsGraphUri) + "&query=";// + query + queryOptions
        var queryOptions = "&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=20000&debug=off"
        sparql.querySPARQL_GET_proxy(url, query, queryOptions, null, function (err, result) {
            if (err) {
                return common.message(err)
            }


            if (options.rawData) {

                return callback(null, result.results.bindings);

            } else {

                var descendantsIds = [];
                var descendantsLabels = [];
                result.results.bindings.forEach(function (item) {
                    for (var i = 1; i < 7; i++) {
                        var concept = item["concept" + i]
                        if (typeof concept !== "undefined") {
                            if (descendantsIds.indexOf(concept.value) < 0) {
                                descendantsIds.push(concept.value);
                                if (options.selectLabels) {
                                    descendantsLabels.push(item["conceptLabel" + i].value);
                                }
                            }
                        }
                    }

                })

                callback(null, {ids: descendantsIds, labels: descendantsLabels, thesaurusLevel: thesaurusLevel})
            }
        })
    }

    self.loadChildrenInConceptJstree = function (conceptId, depth) {
        sparql_facade.getNodeChildren(conceptId, depth, function (err, result) {
            if (err)
                return common.message(err)
            var jstreeData = [];
            var existingNodes = $('#jstreeConceptDiv').jstree(true).get_json('#', {flat: true});
            var uniqueIds = [];
            var existingNodeIds = [];
            existingNodes.forEach(function (node) {
                existingNodeIds.push(node.id)
            })

            result.forEach(function (item) {

                for (var i = 1; i <= depth; i++) {
                    var childConceptId = item["child" + i]
                    if (typeof childConceptId !== "undefined") {
                        childConceptId = childConceptId.value;
                        if (childConceptId == conceptId)
                            return;
                        if (existingNodeIds.indexOf(childConceptId) > -1)//to avoid duplicate existing nodes
                            childConceptId = "!!" + childConceptId

                        if (uniqueIds.indexOf(childConceptId) < 0) {

                            uniqueIds.push(childConceptId);
                            var parent = item.concept.value
                            if (i > 1)
                                parent = item["child" + (i - 1)].value
                            $("#jstreeConceptDiv").jstree(true).create_node(parent, {text: item["childLabel" + i].value, id: childConceptId}, "last")


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
        if (!options) {
            options = {lang: "en"}
        }
        if (!options.lang)
            options.lang = "en"
        var conceptIdsStr = ""
        conceptIds.forEach(function (id, index) {
            if (index > 0)
                conceptIdsStr += ","
            conceptIdsStr += "<" + id + ">"
        })

        var conceptsGraphUri = app_config.ontologies[app_config.currentOntology].conceptsGraphUri
        var url = app_config.sparql_url + "?default-graph-uri=" + encodeURIComponent(conceptsGraphUri) + "&query=";// + query + queryOptions
        var query = "PREFIX skos: <http://www.w3.org/2004/02/skos/core#>" +
            "SELECT DISTINCT *" +
            "WHERE {" +
            "?concept skos:prefLabel ?conceptPrefLabel ;" +

            "skos:broader ?broaderId1 . " +
            "  ?broaderId1 skos:prefLabel ?broader1 ." +
            "filter (?concept in(" + conceptIdsStr + "))" +
            "FILTER (lang(?conceptPrefLabel) ='" + options.lang + "')" +
            "FILTER (lang(?broader1) ='" + options.lang + "')"


        query +=
            "OPTIONAL {" +
            "    ?broaderId1 skos:broader ?broaderId2 ." +
            "    ?broaderId2 skos:prefLabel ?broader2 ." +
            "FILTER (lang(?broader2) = '" + options.lang + "')" +
            "     OPTIONAL {" +
            "   " +
            "       ?broaderId2 skos:broader ?broaderId3 ." +
            "    ?broaderId3 skos:prefLabel ?broader3 ." +
            "FILTER (lang(?broader3) = '" + options.lang + "')" +
            "       OPTIONAL {" +
            "       ?broaderId3 skos:broader ?broaderId4 ." +
            "    ?broaderId4 skos:prefLabel ?broader4 ." +
            "FILTER (lang(?broader4) = '" + options.lang + "')" +
            "           OPTIONAL {" +
            "       ?broaderId4 skos:broader ?broaderId5 ." +
            "    ?broaderId5 skos:prefLabel ?broader5 ." +
            "FILTER (lang(?broader5) = '" + options.lang + "')" +
            "         OPTIONAL {   " +
            "       ?broaderId5 skos:broader ?broaderId6 ." +
            "    ?broaderId6 skos:prefLabel ?broader6 ." +
            "FILTER (lang(?broader6) = '" + options.lang + "')" +
            "               OPTIONAL {   " +
            "       ?broaderId6 skos:broader ?broaderId7 ." +
            "    ?broaderId7 skos:prefLabel ?broader7 ." +
            "FILTER (lang(?broader7) = '" + options.lang + "')" +
            "                 OPTIONAL {   " +
            "       ?broaderId7 skos:broader ?broaderId8 ." +
            "    ?broaderId8 skos:prefLabel ?broader8 ." +
            "FILTER (lang(?broader8) = '" + options.lang + "')" +
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
        //  console.log(query)


        var queryOptions = "&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=20000&debug=off"

        sparql.querySPARQL_GET_proxy(url, query, queryOptions, null, function (err, result) {
            if (err) {
                return callback(err);
            }
            callback(null, result.results.bindings)

        })
    }

    self.getConceptsInfos = function (conceptIds, options, callback) {
        if (!conceptIds || conceptIds.length == 0)
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


            var conceptsGraphUri = app_config.ontologies[app_config.currentOntology].conceptsGraphUri
            var url = app_config.sparql_url + "?default-graph-uri=" + encodeURIComponent(conceptsGraphUri) + "&query=";// + query + queryOptions

            var query = "PREFIX skos: <http://www.w3.org/2004/02/skos/core#>" +
                "PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#>" +
                "PREFIX rdfsyn:<http://www.w3.org/1999/02/22-rdf-syntax-ns#>" +
                "SELECT DISTINCT *" +
                "WHERE {" +
                "?concept skos:prefLabel ?conceptLabel ." +
                " filter (?concept in(" + conceptIdsStr + "))"

            if (!options.onlyAncestors) {
                query += "OPTIONAL {?concept skos:exactMatch ?exactMatch .}" +
                    "OPTIONAL {?concept skos:definition ?definition .}"
            }
            if (!options.noAncestors) {
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
                    "  }"
            }
            query += "  }" +
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


        /*  var ontologyDesc = app_config.ontologies[app_config.currentOntology]
          if (ontologyDesc.isExternal) {
              if (obj.event.ctrlKey) {
                  return eval(app_config.currentOntology + ".showConceptInfos('"+obj.node.id+"')")

              }
              if (node.children.length > 0)
                  return;
              return eval(app_config.currentOntology + ".loadConceptsJsTree('"+obj.node.id+"',{level:"+obj.node.parents.length+"})")
          }*/


        if (obj.event.ctrlKey) {

            Infos.concepts.showConceptInfos(obj.node.id);
        }
        if (node.children.length > 0)
            return;
        self.loadChildrenInConceptJstree(obj.node.id, 1)

    }


    self.onNodeChecked = function (evt, obj) {
        var level = obj.node.parents.length - 1;

        if (obj.event.ctrlKey && self.currentConceptsSelection) {
            obj.type = "concept";
            self.currentConceptsSelection.push([{id: obj.node.id, level: level, label: obj.node.text}]);
            Selection.onJsTreeSelectionCBXchecked(obj, "AND")

        } else {

            if (!self.currentConceptsSelection)
                self.currentConceptsSelection = [[]];
            obj.type = "concept";
            self.currentConceptsSelection[self.currentConceptsSelection.length - 1].push({id: obj.node.id, level: level, label: obj.node.text});
            Selection.onJsTreeSelectionCBXchecked(obj, "OR")
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

    self.conceptTreeToTable = function () {
        var jsonNodes = $('#jstreeConceptDiv').jstree(true).get_json('#', {flat: true});
        var nodesMap = {};
        nodesMap["#"] = "";
        jsonNodes.forEach(function (node) {
            nodesMap[node.id] = {text: node.text, parent: node.parent, ancestors: [node.parent]};
        })

        //setAncestors
        function recurseAncestors(nodeId) {
            var parentNode = nodesMap[nodesMap[nodeId].parent];
            if (parentNode) {
                if (nodesMap[nodeId].ancestors.indexOf(parentNode.parent) < 0) {
                    if (parentNode.parent) {
                        nodesMap[nodeId].ancestors.push(parentNode.parent)
                        recurseAncestors(parentNode.parent)
                    }
                }
            }

        }

        jsonNodes.forEach(function (node) {
            recurseAncestors(node.id)
        })


        var dataArray = [];
        var maxCols = 0;


        for (var key in nodesMap) {
            var node = nodesMap[key]
            var line = [node.text];
            if (node.ancestors) {
                node.ancestors.forEach(function (parent) {
                    line.push(nodesMap[parent].text)

                })
            }
            maxCols = Math.max(maxCols, line.length)
            dataArray.push(line)
        }

        dataArray.forEach(function (line) {

            for (var i = line.length; i < maxCols; i++) {
                line.push("")
            }

        })
        var colnames = []
        for (var i = 0; i < maxCols; i++) {
            colnames.push({title: "col" + i})
        }
        $('#graphDiv').html("<table id='dataTableDiv'></table>");

        $('#dataTableDiv').DataTable({
            data: dataArray,
            columns: colnames,
            // async: false,
            dom: 'Bfrtip',
            buttons: [
                'copy', 'csv', 'excel', 'pdf', 'print'
            ]


        });


    }


    return self;

})
()


/*

insert{

?a <http://www.w3.org/2004/02/skos/core#prefLabel> ?labelEN.

}


 where {


?a skos:prefLabel ?label.
filter (lang(?label)!="en")

bind(strlang(?label,"en") as ?labelEN)

}
limit 10000






 */
