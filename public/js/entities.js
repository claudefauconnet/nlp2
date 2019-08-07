var Entities = (function () {
    var self = {}


    self.showAssociatedWords = function (aggregation) {

        var tokens = {};
        var html = "<ul>"

            aggregation.buckets.forEach(function (bucket) {
                if (!tokens[bucket.key])
                    tokens[bucket.key] = bucket;
            })

        var keys = Object.keys(tokens);
        keys.sort(function (a, b) {
            return a.score - b.score
        })
        keys.forEach(function (key) {
            var word=key
         var p=key.indexOf("'");
            if(p>-1)
             word=key.substring(p+1)

            var doc_count = tokens[key].doc_count;
            html += "<li onclick=mainController.addAssciatedWordToQuestion('"+word+"')>(" + doc_count + " ) " + word;


        })
        html += "</li>";

        $("#associatedWordsDiv").html(html);
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


            function drawJsTree(treeDiv, jsTreeData) {

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
                        showNodeInfos(obj.node);
                        //   $("#dataDiv").html(JSON.stringify(obj.node.data,null,2))
                    })
            }

            showNodeInfos = function (node) {

            }


            var jstreeArray = formatResult(entities);
            drawJsTree("jstreeDiv", jstreeArray)


        })

    }


    return self;


})()
