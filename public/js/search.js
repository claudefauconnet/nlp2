var Search = (function () {
    var self = {};

    self.queryElastic = function (query, indexes, callback) {

        if (!indexes)
            indexes = context.indexes;


        console.log(JSON.stringify(indexes, null, 2))
        console.log(JSON.stringify(query, null, 2))

        var payload = {
            executeQuery: JSON.stringify(query),
            indexes: JSON.stringify(indexes)

        }
        $.ajax({
            type: "POST",
            url: config.elasticUrl,
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
        $("#resultDiv").html("");
        $(".indexDocCount").html("")
        $("#paginationDiv").html("")
        $("#associatedWordsDiv").html("")

        if (!question || question.length < 4)
            return $("#resultDiv").html("entrer une question (au moins 4 lettres");

        if (context.indexes.length == 0)
            return $("#resultDiv").html("selectionner au moins un index");

        self.analyzeQuestion(question, function (err, query) {
            $("#queryTA").val(JSON.stringify(query, null, 2))

            Search.queryElastic({
                query: query,
                from: from,
                size: size,
                _source: context.elasticQuery.source,
                highlight: context.elasticQuery.highlight,
                "aggregations": {
                    "associatedWords": {
                        "significant_terms": {
                            "size": 20,
                            "field": "content"
                        }
                    },
                    /*   "associatedWords1":
                           {
                               "significant_text":

                                   {
                                       "size": 20,
                                       "field":
                                           "content"
                                   }
                           },*/


                    "indexesCountDocs": {
                        "terms": {"field": "_index"}
                    }


                }

            }, null, function (err, result) {
                if (err) {
                    return $("#resultDiv").html(err);
                }
                if (result.hits.hits.length == 0)
                    return $("#resultDiv").html("pas de résultats");
                // Entities.showQuestionEntitiesInJsTree(query);
                Entities.showAssociatedWords(result.aggregations.associatedWords)
                self.setResultsCountByIndex(result.aggregations.indexesCountDocs)
                $("#indexDocCount_all").html("(" + result.hits.total + ")");
                mainController.showPageControls(result.hits.total);
                return ui.showResults(result.hits.hits);

            })

        })


    }

    self.setResultsCountByIndex = function (aggregation) {
        aggregation.buckets.forEach(function (bucket) {
            $("#indexDocCount_" + bucket.key).html("(" + bucket.doc_count + " docs)")

        })

    }

    self.searchHitDetails = function (hitId) {

        // on ajoute la question + l'id pour avoir les highlight
        self.analyzeQuestion(context.question, function (err, query) {

            if(!query.bool)
               query={bool:{must:[query]}};

            query.bool.must.push({
                "term": {
                    "_id": hitId
                }
            })
            Search.queryElastic({
                    query: query,
                    _source: context.elasticQuery.source,
                    highlight: {
                        tags_schema: "styled",
                        fragment_size: 500,
                        number_of_fragments: 0,
                        fields: {
                            "content": {},

                        }
                    }

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
        var query = {}
// other than match phrase
        var regexPhrase = /"(.*)"([0-9]*)/gm;
        var array = regexPhrase.exec(question);
        if (array && array.length > 1) {// on enleve les "
            var slop = 2;
            if (array.length == 3 && array[2]!="")
                try{
                slop = parseInt(array[2])
                }catch(e){
                $("#resultDiv").html("la distance doit etre un nombre")
                }
            question = array[1];
            query = {
                "match_phrase": {
                    "content": {
                        "query": array[1],
                        "slop": slop
                    }

                }
            }

            return callback(null, query);
        }

// other than match phrase
        question = question.replace(/\*/g, "%") //wildcard * does not split correctly
        var regexSplit = /[.*^\s]\s*/gm
        var words = question.trim().split(regexSplit);
        var shouldArray = [];
        var mustArray = [];


        var getWordQuery = function (word) {
            if (word.indexOf("%") > 0) {// wildcard * does not split correctly
                return {
                    "wildcard": {
                        "content": {
                            "value": word.replace(/%/g, "*"),
                        }
                    }
                }
            } else {
                return {
                    "match": {
                        "content": word
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


})()
