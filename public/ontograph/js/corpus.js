var Corpus = (function () {
        var self = {};

        self.searchResources = function (word) {
            self.showJstreeResources(word, null, null, 6);

        }
        self.loadCorpusJsTree = function () {
            var corpusScheme = app_config.ontologies[app_config.currentOntology].corpusScheme
            self.showJstreeResources(null, null, corpusScheme, 2);
        }
        self.loadResourceLevelsSelect = function () {
            var levels = app_config.ontologies[app_config.currentOntology].resourceLevels;
            var defaultLevel = app_config.ontologies[app_config.currentOntology].resourceDefaultLevel;
            common.fillSelectOptions("corpusAggrLevelSelect", levels, true, "label", "label")
            $("#corpusAggrLevelSelect").val(defaultLevel);


        }


        self.getSelectedResource = function () {
            var idCorpus = null;
            var selectedCorpusResources = $("#jstreeCorpusDiv").jstree(true).get_checked()
            if (selectedCorpusResources.length > 0)
                idCorpus = selectedCorpusResources;
            return idCorpus
        }


        self.showJstreeResources = function (word, id, scheme, depth, addToNode) {

            self.sparql_searchResource(word, id, scheme, depth, function (err, result) {
                if (err)
                    return common.message(err)

                var jstreeData = [];
                var conceptBroadersMap = {};
                var uniqueIds = []


                var uniqueIds = [];
                result.forEach(function (item) {
                    if (addToNode) {
                        var previousParent = item.resource.value
                        for (var i = 1; i < 6; i++) {
                            var child = item["child" + i]
                            if (typeof child !== "undefined") {
                                var childLabel = item["childLabel" + i]
                                if (uniqueIds.indexOf(child.value) < 0) {
                                    uniqueIds.push(child.value);
                                    jstreeData.push({id: child.value, text: childLabel.value, parent: previousParent})
                                }
                                previousParent = child.value
                            }

                        }

                    } else {
                        var docId = item.resource.value
                        var docText = item.resourceLabel.value
                        var parent = "#";
                        if (uniqueIds.indexOf(docId) < 0) {
                            uniqueIds.push(docId);
                            jstreeData.push({id: docId, text: docText, parent: parent})
                        }

                        var previousParent = docId
                        for (var i = 1; i < 6; i++) {
                            var child = item["child" + i]
                            if (typeof child !== "undefined") {
                                var childLabel = item["childLabel" + i]
                                if (uniqueIds.indexOf(child.value) < 0) {
                                    uniqueIds.push(child.value);
                                    jstreeData.push({id: child.value, text: childLabel.value, parent: previousParent})
                                }
                                previousParent = child.value
                            }

                        }
                    }
                })

                if (addToNode) {
                    if (jstreeData.length > 0)
                        common.addNodesToJstree("jstreeCorpusDiv", addToNode, jstreeData);

                } else {
                    common.loadJsTree("jstreeCorpusDiv", jstreeData,
                        {
                            withCheckboxes: 1,
                            openAll: true,
                            three_state: false,
                            cascade: "undetermined",
                            selectNodeFn: function (evt, obj) {
                                Corpus.onJstreeSelectNode(evt, obj);
                            }, onCheckNodeFn: function (evt, obj) {
                                Corpus.onNodeChecked(evt, obj);
                            },

                        })
                }
            })
        }


        self.sparql_searchResource = function (word, id, scheme, depth, callback) {

//callback(null,[])

            var query = "PREFIX skos:<http://www.w3.org/2004/02/skos/core#>" +
                "select *  where{   " +
                "" +
                "?resource skos:prefLabel ?resourceLabel ."
            if (scheme) {
                query += "?resource <http://www.w3.org/2004/02/skos/core#inScheme> <" + scheme + ">"
            }
            if (word) {
                query += " FILTER contains(lcase(str(?resourceLabel )),\"" + word.toLowerCase() + "\") "
            }
            if (id) {
                query += " FILTER (?resource=<" + id + ">) "
            }
            if (depth > 0) {


                for (var i = 0; i < depth; i++) {
                    if (i == 0) {
                        query += "OPTIONAL {" +
                            "?child1 skos:broader ?resource ." +
                            "?child1 skos:prefLabel ?childLabel1 ."

                    } else {
                        query += "optional {" +
                            "?child" + (i + 1) + " skos:broader ?child" + (i) + " ." +
                            "?child" + (i + 1) + " skos:prefLabel ?childLabel" + (i + 1) + " ."
                    }

                }
                for (var i = 0; i < depth; i++) {
                    query += "}"
                }
            }


            query += " } ORDER BY ?resourceLabel limit 2000"

            var corpusGraphUri = app_config.ontologies[app_config.currentOntology].corpusGraphUri
            var url = sparql.source.sparql_url + "?default-graph-uri=" + encodeURIComponent(corpusGraphUri) + "&query=";// + query + queryOptions
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

        self.onJstreeSelectNode = function (evt, obj) {


            var node = obj.node
            if (node.children.length > 0)
                return;
            var childType = "";
            if (node.id.indexOf("/Domain/") > -1)
                childType = "Branch"
            if (node.id.indexOf("/Branch/") > -1)
                childType = "Document-type"
            if (node.id.indexOf("/Document-type/") > -1)
                childType = "Document";
            if (node.id.indexOf("/Document/") > -1)
                childType = "Chapter";
            if (node.id.indexOf("/Chapter/") > -1)
                childType = "Paragraph";
            self.showJstreeResources(null, node.id, null, 1, node.id)


        }

        self.resetSelection = function () {
            $("#currentCorpusSpan").html("");
            self.loadCorpusJsTree();

        }

        self.onNodeChecked = function (evt, obj) {

            if (obj.event.ctrlKey && self.currentCorpusSelection) {
                obj.type = "corpus";
                self.currentCorpusSelection.push([obj.node.id]);
                Selection.onJsTreeSelectionCBXchecked(obj, "AND")

            } else {
                if (!self.currentCorpusSelection)
                    self.currentCorpusSelection = [[]];
                var xx = self.currentCorpusSelection[self.currentCorpusSelection.length - 1]
                self.currentCorpusSelection[self.currentCorpusSelection.length - 1].push(obj.node.id);
                obj.type = "corpus";
                Selection.onJsTreeSelectionCBXchecked(obj, "OR")
            }
        }


        return self;


    }
)()
