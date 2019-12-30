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
        var tokenEntities = {};
        var allShouldEntityHits = []

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

                                    tokenEntities[hit._source.internal_id] = hit._source
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
                        docScores[key].forEach(function (entity_internal_id) {
                            tokenEntities[entity_internal_id].score = docScores[key].length
                        })

                    }
                    callbackSeries();

                },

                // query corpus with all entities matching tokens
                function (callbackSeries) {
                    var entityIdShoulds = []
                    for (var key in tokenEntities) {
                        var entity = tokenEntities[key];

                        entityIdShoulds.push({
                          //  match: {"entities_thesaurus_ctg.id": {query: entity.internal_id, boost: entity.score}}
                            match: {"entities_thesaurus_ctg.id": {query: entity.internal_id}}
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
                        allShouldEntityHits = hits

                        return callbackSeries();

                    })

                },

            // for each hit set questionEntities (more they are better will be the doc
                function(callbackSeries){
            var questionEntities=Object.keys(tokenEntities);
                    allShouldEntityHits.forEach(function(hit){
                        hit._source.matchingEntities=[]
                       hit._source.entities_thesaurus_ctg.forEach(function(entity){

                           if(questionEntities.indexOf(entity.id)>-1)
                               hit._source.matchingEntities.push(entity)

                       })

                    })
                    return callbackSeries();
                },
                // aggregate hits with chapter and doc
                function(callbackSeries){

                    var paragraphIds={};
                    var chapterIds={};
                    var docIds={};
                    allShouldEntityHits.forEach(function(hit){
                        paragraphIds[hit._source.paragraphId]=hit._source;
                        chapterIds[hit._source.chapterId]=hit._source;
                        docIds[hit._source.docId]=hit._source;
                    })

                    var aggregatedHits=[];
                    allShouldEntityHits.forEach(function(hit){
                        source=hit._source
                        var obj={}
                        if(source.paragraphId){
                            var chapterObj=chapterIds[source.chapterId]
                            var docObj=docIds[source.docId];
                            var previousParagraphObj=null;
                            if( paragraphIds[hit._source.paragraphId-1] && paragraphIds[hit._source.paragraphId-1].chapterId==source.docId)
                                previousParagraphObj=paragraphIds[source.paragraphId-1]
                            var nextParagraphObj=null;
                            if(paragraphIds[hit._source.paragraphId+1] && paragraphIds[hit._source.paragraphId+1].chapterId==source.docId)
                                nextParagraphObj=paragraphIds[source.paragraphId+1]

                            var totalMatchingEntities=source.matchingEntities.length+chapterObj.matchingEntities.length+docObj.matchingEntities.length

                            obj={text:source.text ,chapter:chapterObj.chapter,doc:docObj.docTitle, matchingEntities:totalMatchingEntities}
                            aggregatedHits.push(obj);

                        }

                    })
                    aggregatedHits.sort(function(a,b){
                        if(a.matchingEntities>b.matchingEntities)
                            return -1;
                        if(a.matchingEntities<b.matchingEntities)
                            return 1;
                        return 0;

                    })


                    console.log(JSON.stringify(aggregatedHits,null,2))

                    return callbackSeries();
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
