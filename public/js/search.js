var Search = (function () {
    var self = {};


    self.searchPlainText = function (question, callback) {
        self.analyzeQuestion(question, function (err, query) {
            $("#queryTA").val(JSON.stringify(query, null, 2))

            mainController.queryElastic({
                query: query,
                from: context.elasticQuery.from,
                size: context.elasticQuery.size,
                _source: context.elasticQuery.source,
                highlight:context.elasticQuery.highlight

            },null,function(err,result){
                if(err){
                    return $("#resultDiv").html(err);
                }
                if(result.hits.hits.length==0)
                    return $("#resultDiv").html("pas de résultats");
                entities.getQuestionEntities();
                return ui.showResults(result.hits.hits);

            })

        })


    }

    self.searchHitDetails=function(hitId){

    // on ajoute la question + l'id pour avoir les highlight
        self.analyzeQuestion( context.question, function (err, query) {

            query.bool.must.push( {
                "term": {
                    "_id": hitId
                }
            })
            mainController.queryElastic({
                    query:query,
                    _source: context.elasticQuery.source,
                highlight: {
                  tags_schema: "styled",
                    fragment_size: 500,
                    number_of_fragments: 0,
                    fields: {
                        "content": {},

                    }
                }

                },null

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
            var slop = 0;
            if (array.length == 3)
                slop = array[2];
            question = array[1];
            query = {
                "match_phrase": {
                    "content": question,
                    "slop": slop
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
