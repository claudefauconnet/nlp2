var Search = (function () {
        var self = {};

        self.queryElastic = function (query, indexes, callback) {

            if (!indexes)
                indexes = context.curentSearchIndexes;


            console.log(JSON.stringify(indexes, null, 2))
            console.log(JSON.stringify(query, null, 2))


            var strQuery = JSON.stringify(query);
            var payload = {
                executeQuery: strQuery,
                indexes: JSON.stringify(indexes)

            }
            $.ajax({
                type: "POST",
                url: appConfig.elasticUrl,
                data: payload,
                dataType: "json",
                success: function (data, textStatus, jqXHR) {
                    var xx = data;
                    callback(null, data)

                }
                , error: function (err) {

                    console.log(err.responseText)
                    if (callback) {
                        return callback(err)
                    }
                    return (err);
                }

            });


        }

        self.executeMsearch = function (ndjson, callback) {
            var payload = {
                executeMsearch: 1,
                ndjson: ndjson

            }
            $.ajax({
                type: "POST",
                url: appConfig.elasticUrl,
                data: payload,
                dataType: "json",
                success: function (data, textStatus, jqXHR) {
                    var xx = data;
                    callback(null, data)

                }
                , error: function (err) {

                    console.log(err.responseText)
                    if (callback) {
                        return callback(err)
                    }
                    return (err);
                }

            });

        }


        self.searchPlainText = function (options, callback) {

            if (!options)
                options = {};
            var question = options.question || $("#questionInput").val();

            //gestion de la pagination
            {
                var size = options.size || context.elasticQuery.size
                var from = options.from || (options.page ? (size * options.page) : null) || context.elasticQuery.from;
                if (options.page)
                    context.currentPage = (options.page < 0 ? 0 : options.page);
                else
                    context.currentPage = 0;
            }
            $("#entitiesWrapperDiv").css("visibility", "hidden");
            $("#thumbnailsDiv").css("display", "none");


            $("#resultDiv").html("");
            $(".indexDocCount").html("")
            $("#paginationDiv").html("")
            $("#associatedWordsDiv").html("");

            if (!question || question.length < 3)
                return $("#resultDiv").html("entrer une question (au moins 3 lettres)");

            if (context.curentSearchIndexes.length == 0)
                return $("#resultDiv").html("selectionner au moins une source");

            self.analyzeQuestion(question, function (err, query) {
                    $("#queryTA").val(JSON.stringify(query, null, 2))

                    var must = [query]
                    if (options.mustQueries)
                        must = must.concat(options.mustQueries)
                    else
                        context.filteredEntities = {}

                    query = {bool: {must: must}}

                    var aggregations = {

                        "associatedWords": {
                            "significant_terms": {
                                "size": 30,
                                "field": appConfig.contentField
                            }
                        },

                        "indexesCountDocs": {
                            "terms": {"field": "_index"}
                        }
                    }
                   for(var thesaurus in context.thesauri) {
                        aggregations["entities_" + thesaurus] = {"terms": {"field": "entities_" + thesaurus+".id", "size": 50, "order": {"_count": "desc"}}};
                    }


                    Search.queryElastic({
                            query: query,
                            from: from,
                            size: size,
                            _source: context.elasticQuery.source,
                            highlight: context.elasticQuery.highlight,
                            aggregations: aggregations


                        }


                        , null, function (err, result) {
                            if (err) {
                                $("#resultDiv").html(err);
                                if (callback)
                                    return callback(err);
                                return;
                            }
                            if (result.hits.hits.length == 0) {
                                return $("#resultDiv").html("pas de résultats");
                                if (callback)
                                    return callback("pas de résultats");
                                return;
                            }


                            Entities.showAssociatedWords(result.aggregations.associatedWords)


                            self.setResultsCountByIndex(result.aggregations.indexesCountDocs);

                            self.thesauri = {}
                           for(var thesaurus in context.thesauri) {
                                Entities.showThesaurusEntities(thesaurus, result.aggregations["entities_" + thesaurus]);
                            }


                            context.currentHits = result.hits.hits;
                            if ($("#indexesCbxes_all").prop("checked"))
                                $("#indexDocCount_all").html("(" + result.hits.total + ")");
                            else
                                $("#indexDocCount_all").html("");
                            mainController.showPageControls(result.hits.total);

                            $("#thumbnailsDiv").css("display", "flex");
                            //   indexes. self.uncheckAllIndexes()
                            if (callback)
                                callback();
                            return ui.showResultList(result.hits.hits);

                        })

                }
            )


        }

        self.setResultsCountByIndex = function (aggregation) {
            aggregation.buckets.forEach(function (bucket) {
                $("#indexDocCount_" + bucket.key).html("(" + bucket.doc_count + " docs)")

            })

        }

        self.searchHitDetails = function (hitId) {

            // on ajoute la question + l'id pour avoir les highlight
            self.analyzeQuestion(context.question, function (err, query) {


                if (!query.bool)
                    query = {bool: {must: []}};
                //   query={bool:{must:[query]}};

                query.bool.must.push({
                    "term": {
                        "_id": hitId
                    }
                })


                Search.queryElastic({
                        query: query,
                        // _source: context.elasticQuery.source,
                        highlight: {
                            tags_schema: "styled",
                            fragment_size: 0,
                            number_of_fragments: 0,
                            fields: {[appConfig.contentField]: {}}

                        },

                    }, null

                    , function (err, result) {
                        if (err) {
                            return $("#resultDiv").html(err);
                        }
                        if (result.hits.hits.length == 0)
                            return $("#resultDiv").html("pas de résultats");

                        return ui.showHitDetails(result.hits.hits[0])


                    })
            })


        }
        self.analyzeQuestion = function (question, callback) {
            var queryString = "";


            var query = {
                "query_string": {
                    "query": question,
                    "default_field": "attachment.content",
                    "default_operator": "AND"
                }
            }
//prosess phrases
            if (question.indexOf("\"") > -1) {
                var p = question.lastIndexOf("\"")
                var suffix = question.substring(p + 1)
                var array = suffix.split(" ")
                var slop = array[0];

                if (slop) {

                    question = question.substring(0, p + 1)
                    query.query_string.phrase_slop = slop
                }
                if (array.length > 1) {
                    for (var i = 1; i < array.length; i++) {
                        question += " " + array[i];
                    }
                }
                //process not phrases
            }
            if (true) {
                question = question.replace(/(\w*\*?)\/(\w*\*?)/g, function (matched, $1, $2) {

                    return "(" + $1 + " OR " + $2 + ")";
                });
            }

            query.query_string.query = question;

            return callback(null, query);
        }

        self.analyzeQuestionOld = function (question, callback) {
            question = question.replace(/\*/g, "%") //wildcard * does not split correctly
            if (true || question.indexOf("\"") > -1) {

                question = question.replace(/(\w*%?)\/(\w*\%?)/g, function (matched, $1, $2) {

                    return "(" + $1 + " | " + $2 + ")";
                });
                question = question.replace(/%/g, "*");
                query = {

                    "simple_query_string": {
                        "query": question,
                        "fields": [appConfig.contentField],
                        "default_operator": "and"

                    }


                }

                return callback(null, query);


            }


            question = question.replace(/\*/g, "%") //wildcard * does not split correctly
            var query = {}

            //match phrase
            var regexPhrase = /"(.*)"([0-9]*)/gm;
            var array = regexPhrase.exec(question);
            if (array && array.length > 1) {// on enleve les "
                var slop = 2;
                if (array.length == 3 && array[2] != "")
                    try {
                        slop = parseInt(array[2])
                    } catch (e) {
                        $("#resultDiv").html("la distance doit etre un nombre")
                    }
                question = array[1];
                /*  if(question.match(/[%///]+/)){



                  }*/

                if (false) {
                    query = {
                        "match_phrase": {
                            [appConfig.contentField]: {
                                "query": array[1],
                                "slop": slop
                            }

                        }
                    }
                }


                return callback(null, query);
            }

// other than match phrase

            var regexSplit = /[.*^\s]\s*/gm
            var words = question.trim().split(regexSplit);
            var shouldArray = [];
            var mustArray = [];


            var getWordQuery = function (word) {
                if (word.indexOf("%") > 0) {// wildcard * does not split correctly
                    return {
                        "wildcard": {
                            [appConfig.contentField]: {
                                "value": word.replace(/%/g, "*"),
                            }
                        }
                    }
                } else {
                    return {
                        "match": {
                            [appConfig.contentField]: word
                        }
                    }
                }


            }


            words.forEach(function (word) {
                if (word.indexOf("/") > 0) {// or
                    var array = word.split("/");
                    array.forEach(function (orWord) {
                        shouldArray.push(getWordQuery(orWord))
                    })

                } else { // normal and  : boolean must
                    mustArray.push(getWordQuery(word))

                }
            })
            if (mustArray.length + shouldArray.length > 0) {
                query = {
                    "bool": {
                        "must": mustArray,
                        "should": shouldArray,
                    }
                }
            }

            return callback(null, query)


        }


        return self;


    }
)
()
