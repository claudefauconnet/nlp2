var request = require('request');
var fs = require('fs');
var async = require('async');

var questionAnswering = {

    createQuestionIndex: function (elasticUrl, indexName, callback) {
        var filePath = "D:\\GitHub\\nlp2\\config\\elastic\\templates\\question_index_settings.json"
        var settings = JSON.parse("" + fs.readFileSync(filePath));
        var options = {
            method: 'PUT',
            description: "create index",
            url: elasticUrl + indexName + "/",
            json: settings
        };

        request(options, function (error, response, body) {
            if (error)
                return callback(error);
            if (body.error)
                return callback(body.error);
            var message = "index " + index + " created"
            // socket.message(message);
            return callback();

        })
    },

    processQuestion: function (elasticUrl, questionIndex, thesaurusIndex, corpusIndex, question, callback) {
        var docs = [];
        var tokens = [];
        var tokenEntities ={};

        async.series([

                // tokenize question with elastic _analyze
                function (callbackSeries) {
                    var json = {
                        "analyzer": "question_analyzer_en",
                        "text": question
                    }
                    var options = {
                        method: 'POST',
                        url: elasticUrl + questionIndex + "/_analyze",
                        json: json
                    };
                    request(options, function (error, response, body) {
                        if (error)
                            return callbackSeries(error);
                        if (body.error)
                            return callbackSeries(body.error);
                        tokens = body.tokens;
                        return callbackSeries();
                    })
                },


                // search entities with synonyms matching tokens
                function (callbackSeries) {
                    async.eachSeries(tokens, function (tokenObj, callbackEach) {

                            var query = {
                                query: {
                                    match: {synonyms: tokenObj.token}
                                }


                            }
                            var options = {
                                method: 'POST',
                                url: elasticUrl + thesaurusIndex + "/_search",
                                json: query
                            };
                            request(options, function (error, response, body) {
                                if (error)
                                    return callbackSeries(error);
                                if (body.error)
                                    return callbackSeries(body.error);
                                var hits = body.hits.hits;
                                hits.forEach(function (hit) {
                                    hit._source._id = hit._id;
                                    hit._source._score = hit._score
                                    hit._source._token = tokenObj.token

                                    tokenEntities[hit._source.internal_id]=hit._source
                                })

                                return callbackEach()

                            })


                        }, function (err) {
                            if (err)
                                return callbackSeries(err);

                            return callbackSeries();
                        }
                    )
                },
                //calculate boost with commmon documents
                function (callbackSeries) {
                    var docScores = {}
                    for (var key in tokenEntities) {


                        tokenEntities[key].documents.forEach(function (doc) {
                                if (!docScores[doc.id])
                                    docScores[doc.id] = [];
                                docScores[doc.id].push(tokenEntities[key].internal_id)
                            })


                    }

                    for (var key in docScores) {
                        docScores[key].forEach(function(entity_internal_id){
                            tokenEntities[entity_internal_id].score= docScores[key].length
                        })

                    }
                    callbackSeries();

                },

                // query corpus with all entities matching tokens
                function (callbackSeries) {
                    var entityIdShoulds = []
                    for (var key in tokenEntities) {
var entity=tokenEntities[key];

                            entityIdShoulds.push({
                                match: {"entities_thesaurus_ctg.id":{query: entity.internal_id,boost:entity.score}}
                            })

                    }

                    var query = {
                        query: {
                            bool: {
                                should: entityIdShoulds
                            }
                        },
                        size: 100,
                    }
                    var options = {
                        method: 'POST',
                        url: elasticUrl + corpusIndex + "/_search",
                        json: query
                    };
                    request(options, function (error, response, body) {
                        if (error)
                            return callbackSeries(error);
                        if (body.error)
                            return callbackSeries(body.error);
                        var hits = body.hits.hits;
                        hits.forEach(function (hit) {
                            console.log(hit._source["attachment.content"])
                        })
                        return callbackSeries();

                    })

                }


            ],

            function (err) {
                if (err)
                    return callback(err);
                return callaback(null, docs)
            }
        )
    }


}

module.exports = questionAnswering

var questionIndex = "question_en";
var corpusIndex = "gmec_par";
var thesaurusIndex = "thesaurus_ctg";
var elasticUrl = "http://localhost:9200/";
question = "What is the maximum response time of an anti surge system"
questionAnswering.processQuestion(elasticUrl, questionIndex, thesaurusIndex, corpusIndex, question, function (err, result) {

})
