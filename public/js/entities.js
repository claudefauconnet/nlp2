var Entities = (function () {
    var self = {}
    self.thesauri = {}
    self.jsTreeNodesMap = {}


    self.showThesaurusEntities = function (hits, callback) {
        self.thesauri = {}

        async.series([
            function (callbackSeries) {

                // consolidate docs entities by thesaurus
                hits.forEach(function (hit) {
                    for (var key in hit._source) {
                        var p;
                        if ((p = key.indexOf("entities_")) == 0) {
                            var thesaurusName = key.substring(p + 9);
                            if (!self.thesauri[thesaurusName])
                                self.thesauri[thesaurusName] = {allEntities: [], foundEntities: []};

                            var entities = hit._source[key];
                            entities.forEach(function (entity) {
                                if (self.thesauri[thesaurusName].foundEntities.indexOf(entity) < 0)
                                    self.thesauri[thesaurusName].foundEntities.push(entity)
                            })

                        }


                    }
                })
                return callbackSeries();
            },


            // load all entities from thesaurus index
            function (callbackSeries) {
                return callbackSeries()
                for (var thesaurusName in self.thesauri) {
                    if (self.thesauri[thesaurusName].allEntities.length == 0) {
                        var query = {
                            "query": {
                                "match_all": {}
                            },
                            "size": 9000
                        }
                    }
                    Search.queryElastic(query, [thesaurusName], function (err, result) {
                        if (err)
                            return callbackSeries(err)
                        result.hits.hits.forEach(function (hit) {
                            console.log(JSON.stringify(hit._source))
                            self.thesauri[thesaurusName].allEntities.push(hit._source)
                        })
                        return callbackSeries();
                    })

                }
            }
            ,
            // get ancestors from entities in docs
            function (callbackSeries) {
                for (var thesaurusName in self.thesauri) {
                    var entities = self.thesauri[thesaurusName].foundEntities;
                    entities.sort();

                    var map = {};
                    entities.forEach(function (entity, indexEntities) {
                        var ancestors = entity.split("-");
                        var id = "";
                        var parent = ""
                        ancestors.forEach(function (ancestor, indexAncestor) {
                            parent = id;
                            if (indexAncestor > 0)
                                id += "-"
                            id += ancestor
                            if (!map[id]) {
                                var node = {text: ancestor, id: id, count: 1, data: {thesaurusName: thesaurusName, descendants: []}}
                                if (indexAncestor > 0) {
                                    node.parent = parent
                                } else {
                                    node.parent = "#"
                                }

                                map[id] = node
                            } else {
                                map[id].count += 1
                            }

                        })

                    })
                    self.jsTreeNodesMap = map;


                }
                return callbackSeries();
            },
            // setDescendants
            function (callbackSeries) {
                var keys = Object.keys(self.jsTreeNodesMap);
                for (var key1 in self.jsTreeNodesMap) {

                    keys.forEach(function (key2) {
                        if(key2!=key1) {
                            var p = key2.indexOf(key1 + "-");
                            if (p > -1)
                                self.jsTreeNodesMap[key1].data.descendants.push(key2)

                        }
                    })


                }
                return callbackSeries();
            },

            // draw tree
            function (callbackSeries) {
                var jsTreeArray = [];
                for (var key in self.jsTreeNodesMap) {
                    var obj = self.jsTreeNodesMap[key];
                    obj.text += " " + obj.count
                    jsTreeArray.push(self.jsTreeNodesMap[key])
                }
                $("#entitiesWrapperDiv").css("visibility", "visible");
                Entities.drawJsTree("jstreeDiv", jsTreeArray)
                return callbackSeries();
            }

        ], function (err) {
            if (err)
                return callback(err);


        })
    }


    self.showAssociatedWords = function (aggregation) {

        var tokens = {};
        var html = "<ul>"

        aggregation.buckets.forEach(function (bucket) {
            if (!tokens[bucket.key])
                tokens[bucket.key] = bucket;
        })


        var keys = Object.keys(tokens);
        var words = [];
        keys.forEach(function (key) {
            if (!isNaN(key))
                return;
            if (stopWords_fr.indexOf(key) < 0)
                words.push(key)
        })


        words.sort(function (a, b) {
            return a.score - b.score
        })
        html += "<li><span class='ui_title'>Mots associés</span></li></li></li>";
        words.forEach(function (key) {
            var word = key
            var p = key.indexOf("'");
            if (p > -1)
                word = key.substring(p + 1)

            var doc_count = tokens[key].doc_count;
            html += "<li onclick=mainController.addAssciatedWordToQuestion('" + word + "')>(" + doc_count + " ) " + word + "</li>";


        })
        html += "</ul>";

        $("#associatedWordsDiv").html(html);
    }

    self.showAssociatedWordsWolf = function (_associatedWords) {
        var associatedWords = _associatedWords;
        var ndjsonStr = ""

        var words = [];
        associatedWords.buckets.forEach(function (bucket) {
            var word = bucket.key;
            var p = word.indexOf("'")
            if (p > -1)
                word = word.substring(p + 1)
            if (!isNaN(word))
                return;
            if (stopWords_fr.indexOf(word) < 0)
                words.push(word);

        })

        // should :associated words match
        words.forEach(function (word) {
            var query = {
                bool: {
                    must: []
                }
            }
            query.bool.must.push({term: {"synonyms.literal": word}})


            ndjsonStr += JSON.stringify({_index: "wolf"}) + "\r\n"
            ndjsonStr += JSON.stringify({query: query}) + "\r\n"


        })

        //  console.log(ndjsonStr)


        Search.executeMsearch(ndjsonStr, function (err, responses) {
            if (err)
                return callback(err);
            var jsTreeMap = {};
            responses.forEach(function (response, responseIndex) {

                var hits = response.hits.hits;

                var word = words[responseIndex]
                hits.forEach(function (hit, hitIndex) {
                    var entitiesArray = hit._source.ancestors;
                    var wordId = word + "_" + Math.round(Math.random() * 10000);
                    entitiesArray.splice(0, 0, "*" + word)
                    entitiesArray.forEach(function (entity, entityIndex) {
                        if (!jsTreeMap[entity]) {
                            jsTreeMap[entity] = {id: entity, text: entity, parent: "#"};


                        }
                        if (entityIndex < entitiesArray.length - 1)
                            jsTreeMap[entity].parent = entitiesArray[entityIndex + 1]
                    })


                })
            })
            var jstreeArray = [];
            for (var key in jsTreeMap) {

                jstreeArray.push(jsTreeMap[key])
            }

            Entities.drawJsTree("jstreeDiv", jstreeArray)


        })


    }


    self.showAssociatedWordsWordnetEntitiesInJsTree = function (_associatedWords) {
        var associatedWords = _associatedWords;
        var ndjsonStr = ""


        // should :associated words match
        associatedWords.buckets.forEach(function (bucket) {
            var word = bucket.key;
            var query = {
                bool: {
                    should: [],
                    must: []
                }
            }
            // query.bool.should.push({wildcard: {"data.synonyms": word + "*"}})
            query.bool.must.push({match: {"content.synonyms": word}})
            //must : only on ids retreived by question query
            //    query.bool.must.push({terms: {"data.documents.id": docIds}})


            ndjsonStr += JSON.stringify({_index: "wordnet_fr"}) + "\r\n"
            ndjsonStr += JSON.stringify({query: query}) + "\r\n"

            //   serialize.write({"_index": index, "_id": id})
            //   serialize.write({title: docTitle, path: docPath, page: (pageIndex + 1), content: page})

        })

        console.log(ndjsonStr)


        Search.executeMsearch(ndjsonStr, function (err, responses) {
            if (err)
                return callback(err);
            var entities = [];
            responses.forEach(function (response, responseIndex) {

                var hits = response.hits.hits;

                var associatedWordsBuckets = associatedWords.buckets;
                hits.forEach(function (hit, hitIndex) {
                    entities.push({
                            count: associatedWordsBuckets[responseIndex].doc_count,
                            word: associatedWordsBuckets[responseIndex].key,
                            entity_name: hit._source.content.synonyms
                        }
                    )
                })
            })


            entities.sort(function (a, b) {
                return a.count - b.count
            })
            var html = ""
            entities.forEach(function (entity) {
                var word = entity.word

                var doc_count = entity.count;
                var entity_name = entity.entity_name
                html += "<li onclick=mainController.addAssciatedWordToQuestion('" + word + "')>(" + doc_count + " ) " + entity_name + " :" + word;


            })
            html += "</li>";

            $("#associatedWordsEntitiesDiv").html(html);
        })


    }

    self.showAssociatedWordsEntitiesInJsTree = function (_associatedWords, hits) {
        var associatedWords = _associatedWords;
        var ndjsonStr = ""
        var docIds = [];

        hits.forEach(function (hit) {
            docIds.push(hit._id);
        })


        // should :associated words match
        associatedWords.buckets.forEach(function (bucket) {
            var word = bucket.key;
            var query = {
                bool: {
                    should: [],
                    must: []
                }
            }
            // query.bool.should.push({wildcard: {"data.synonyms": word + "*"}})
            query.bool.should.push({match: {"data.synonyms": word}})
            //must : only on ids retreived by question query
            query.bool.must.push({terms: {"data.documents.id": docIds}})


            ndjsonStr += JSON.stringify({_index: "eurovoc_entities"}) + "\r\n"
            ndjsonStr += JSON.stringify({query: query}) + "\r\n"

            //   serialize.write({"_index": index, "_id": id})
            //   serialize.write({title: docTitle, path: docPath, page: (pageIndex + 1), content: page})

        })

        console.log(ndjsonStr)


        Search.executeMsearch(ndjsonStr, function (err, responses) {
            if (err)
                return callback(err);
            var entities = [];
            responses.forEach(function (response, responseIndex) {

                var hits = response.hits.hits;

                var associatedWordsBuckets = associatedWords.buckets;
                hits.forEach(function (hit, hitIndex) {
                    entities.push({
                            count: associatedWordsBuckets[responseIndex].doc_count,
                            word: associatedWordsBuckets[responseIndex].key,
                            entity_name: hit._source.text
                        }
                    )
                })
            })


            entities.sort(function (a, b) {
                return a.count - b.count
            })
            var html = ""
            entities.forEach(function (entity) {
                var word = entity.word

                var doc_count = entity.count;
                var entity_name = entity.entity_name
                html += "<li onclick=mainController.addAssciatedWordToQuestion('" + word + "')>(" + doc_count + " ) " + entity_name + " :" + word;


            })
            html += "</li>";

            $("#associatedWordsEntitiesDiv").html(html);
        })


    }


    self.getQuestionEntities = function (query, callback) {

        Search.queryElastic({

            _source: {"excludes": ["data"]},
            from: 0,
            size: 5000,
            query: query,

        }, null, function (err, result) {
            if (err) {
                return $("#resultDiv").html(err);
            }
            if (result.hits.hits.length == 0)
                return $("#resultDiv").html("pas de résultats");
            var docIds = [];
            result.hits.hits.forEach(function (hit) {
                docIds.push(hit._id);


            })
            var payload = config.hitsEntitiesQuery;
            payload.query.terms["data.documents.id"] = docIds
            var entities = [];
            Search.queryElastic(payload, "eurovoc_entities", function (err, result) {
                if (err)
                    return callback(err);
                entities = result.hits.hits;
                //   console.log(JSON.stringify(entities, null, 2))
                if (true) {//getParent entities
                    var parentEntities = [];
                    result.hits.hits.forEach(function (entity) {

                        parentEntities.push(entity._source.parent)
                    })
                    var payloadParents = {
                        from: 0,
                        size: 5000,
                        query: {

                            "terms": {
                                "source_id": parentEntities
                            }

                        }
                    }
                    Search.queryElastic(payloadParents, "eurovoc_entities", function (err, result2) {
                        if (err)
                            return callback(err);
                        parentEntities = result2.hits.hits;
                        result2.hits.hits.forEach(function (entity) {
                            entities.push(entity)
                        })

                        callback(null, entities)
                    })
                } else

                    callback(null, entities.hits.hits)

            })


        })
    }

    self.showQuestionEntitiesInJsTree = function (query, callback) {
        self.getQuestionEntities(query, function (err, entities) {
            if (err)
                return $("#resultDiv").html(err);

            function formatResult(entities) {
                var conceptsMap = {};
                entities.forEach(function (line) {
                    var concept = line._source;

                    conceptsMap[concept.id] = concept;
                })
                for (var key in conceptsMap) {
                    concept = conceptsMap[key];

                    function recurse(conceptId, chilDocumentCount) {
                        if (!concept.documents)
                            concept.documents = [];


                        if (!conceptsMap[conceptId].data.docsCount)
                            conceptsMap[conceptId].data.docsCount = chilDocumentCount;
                        conceptsMap[conceptId].data.docsCount += concept.documents.length;
                        if (conceptsMap[conceptId].parent && conceptsMap[conceptId].parent != "#")
                            if (conceptsMap[conceptId].parent) {
                                conceptsMap[conceptId].parent = "#"
                            } else {
                                recurse(conceptsMap[conceptId].parent, conceptsMap[conceptId].data.docsCount)
                            }


                    }

                    recurse(concept.id, 0)


                }
                var entitiesAnnotated = []

                for (var key in conceptsMap) {
                    var concept = conceptsMap[key];

                    if (concept.data.docsCount) {
                        concept.text = "*" + concept.data.docsCount + "* " + concept.text
                    }

                    entitiesAnnotated.push(concept)


                }
                return entitiesAnnotated;
            }


            showNodeInfos = function (node) {

            }


            var jstreeArray = formatResult(entities);

            Entities.drawJsTree("jstreeDiv", jstreeArray)


        })

    }

    self.drawJsTree = function (treeDiv, jsTreeData) {

        var plugins = [];
        plugins.push("search");

        plugins.push("sort");
        /*   plugins.push("types");
           plugins.push("contextmenu");*/

        if ($('#' + treeDiv).jstree)
            $('#' + treeDiv).jstree("destroy")

        $('#' + treeDiv).jstree({
            'core': {
                'check_callback': true,
                'data': jsTreeData,


            }
            , 'contextmenu': {
                'items': null
            },
            'plugins': plugins,
            "search": {
                "case_sensitive": false,
                "show_only_matches": true
            }
        }).on("select_node.jstree",
            function (evt, obj) {
                var x = obj;
                Entities.runEntityQuery(obj.node);
                //   $("#dataDiv").html(JSON.stringify(obj.node.data,null,2))
            })
    }

    self.runEntityQuery = function (node) {
        if (!context.filteredEntities)
            context.filteredEntities = {}

        if (node) {

            var leafChildrenEntities = [];

            self.thesauri[node.data.thesaurusName].foundEntities.forEach(function (entity) {
                // take only leaf children entities
                self.jsTreeNodesMap[node.id].data.descendants.forEach(function (descendant) {
                    if(self.jsTreeNodesMap[descendant].data.descendants.length==0)
                        leafChildrenEntities.push(descendant)
                })
                //if node is leaf add it to query
                if(self.jsTreeNodesMap[node.id].data.descendants.length==0)
                    leafChildrenEntities.push(node.id)


            })
            context.filteredEntities[node.id] = {name: node.id, thesaurus: node.data.thesaurusName, childrenEntities: leafChildrenEntities};
        }


        var str = "";
        var html = ""

        for (var key in context.filteredEntities) {
            html += "<div class='selectedEntity' onclick='Entities.deleteEntityFilter(\"" + key + "\")'>" + key + "</div>";
        }


        // html+="<button onclick='graphController.showGraph()'>Graph...</button>"
        $("#selectedEntitiesDiv").html(html)
        var options = {}

        var mustQueries = [];
        for (var key in context.filteredEntities) {
            var childrenMust = []
            context.filteredEntities[key].childrenEntities.forEach(function (entity) {
                childrenMust.push(entity)
            })
            mustQueries.push({"terms": {["entities_thesaurus_ctg"]: childrenMust}})
        }

        if (mustQueries.length > 0) {
            options = {mustQueries: mustQueries}

            Search.searchPlainText(options, function (err, result) {


            })
        }
    }

    self.deleteEntityFilter = function (entity) {
        delete context.filteredEntities[entity];
        Entities.runEntityQuery()

    }


    return self;


})()
