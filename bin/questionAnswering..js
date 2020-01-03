var request = require('request');
var fs = require('fs');
var async = require('async');
var path = require('path');
var elasticRestProxy = require("./elasticRestProxy.")


var measurementEntitiesMapping = {

    "Characterisation-Time": ["time-day", "time-sec"]
}
var prepositionEntitiesMapping = {

    "Characterisation-Time": ["time"],

}


var loadPrepositions = function () {
    var prepositionsPath = path.resolve("./config/elastic/regex/prepositions.json")
    var prepositions = fs.readFileSync(prepositionsPath)
    prepositions = JSON.parse("" + prepositions);
    return prepositions;
}
var questionAnswering = {
 //   prepositions: loadPrepositions(),
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

    processQuestion: function (question, globalOptions, callback) {
        if (!globalOptions.elasticUrl)
            globalOptions.elasticUrl = elasticRestProxy.elasticUrl;

        if (!globalOptions.thesaurusIndex) {
            callback("no thesaurusIndex in options");
        }
        if (!globalOptions.corpusIndex) {
            callback("no corpus in options");
        }
        if (globalOptions.questionsIndex) {
            globalOptions.questionsIndex = "question_en";
        }


        var docs = [];
        var tokens = [];
        var tokenWords=[]
        var tokenEntities = {};
        var allShouldEntityHits = [];
        var aggregatedHits = [];
        ;
        var measurementEntities = []

        async.series([

                // tokenize question with elastic _analyze
                function (callbackSeries) {
                    var json = {
                        "analyzer": "question_analyzer_en",
                        "text": question
                    }
                    var options = {
                        method: 'POST',
                        url: globalOptions.elasticUrl + globalOptions.questionsIndex + "/_analyze",
                        json: json
                    };
                    request(options, function (error, response, body) {
                        if (error)
                            return callbackSeries(error);
                        if (body.error)
                            return callbackSeries(body.error);
                        tokens = body.tokens;
                        tokens.forEach(function(tokenObj){
                            tokenWords.push(tokenObj.token)
                        })
                        return callbackSeries();
                    })
                },


      //find entities containing tokens in their synonyms
                function (callbackSeries) {
                    var i = 0;
                    var queryString=""
                   tokens.forEach( function (tokenObj) {
                       if(queryString.length>0)
                           queryString+=" ";
                       queryString+=tokenObj.token

                   })

                            var query = {
                                "query": {
                                    "query_string": {
                                        "query": queryString,
                                        "default_operator": "OR",
                                        "fields": ["synonyms"],

                                    }
                                }

                            }
                            var options = {
                                method: 'POST',
                                url: globalOptions.elasticUrl + globalOptions.thesaurusIndex + "/_search",
                                json: query
                            };
                            request(options, function (error, response, body) {
                                if (error)
                                    return callbackSeries(error);
                                if (body.error)
                                    return callbackSeries(body.error);
                                var hits = body.hits.hits;

                             //  var  entityDocs={}
                                hits.forEach(function (hit) {
                                    if(!tokenEntities[hit._source.internal_id])
                                        tokenEntities[hit._source.internal_id]={internal_id:hit._source.internal_id,documents:[],countEntityWords:0};
                                  var countEntityWords=0;
                                    hit._source.documents.forEach(function(document){

                                        document.entityOffsets.forEach(function(offset){
                                            if(tokenWords.indexOf(offset.syn)>0)
                                               countEntityWords+=1;
                                        })
                                      if( countEntityWords>0)
                                          tokenEntities[hit._source.internal_id].documents.push(document.id)


                                    })


                                    if (measurementEntitiesMapping[hit._source.internal_id]) {
                                        measurementEntities = measurementEntities.concat(measurementEntitiesMapping[hit._source.internal_id])
                                    }
                                })
                                i++;
                                return callbackSeries()

                            })




                },




                // query corpus with all documents matching entities with tokens
            //matching also mesaurment units boosted
           // and tokens with no entities as plain text search
                function (callbackSeries) {
                    var entityIdShoulds = []
                    measurementEntities.forEach(function (measurementEntity) {
                        entityIdShoulds.push({
                            match: {"entities_measurement_units.id": {query: measurementEntity, boost: 3}}
                        })

                    })
                    for (var key in tokenEntities) {
                        var entity = tokenEntities[key];
                        var documents=entity.documents;
                        entityIdShoulds.push({

                            //  match: {"entities_thesaurus_ctg.id": {query: entity.internal_id, boost: entity.score}}
                          //  match: {"entities_thesaurus_ctg.id": {query: entity.internal_id}}
                            terms:{"_id":documents}

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
                        url: globalOptions.elasticUrl + globalOptions.corpusIndex + "/_search",
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
                function (callbackSeries) {
                    var questionEntities = Object.keys(tokenEntities);
                    allShouldEntityHits.forEach(function (hit) {
                        hit._source.matchingEntities = [];
                        hit._source.matchingMeasurementEntities = [];

                        hit._source.entities_thesaurus_ctg.forEach(function (entity) {

                            if (questionEntities.indexOf(entity.id) > -1)
                                hit._source.matchingEntities.push(entity)

                        })
                        if (hit._source.entities_measurement_units) {
                            hit._source.entities_measurement_units.forEach(function (entity) {

                                if (measurementEntities.indexOf(entity.id) > -1)
                                    hit._source.matchingMeasurementEntities.push(entity)

                            })
                        }

                    })
                    return callbackSeries();
                },
                // aggregate hits with chapter and doc
                function (callbackSeries) {


                    function extractPrepositions(matchingEntities, text) {
                        var extractedPrepositions = []
                        if (false) {
                            matchingEntities.forEach(function (entity) {
                                if (prepositionEntitiesMapping[entity.id]) {
                                    prepositionEntitiesMapping[entity.id].forEach(function (type) {
                                        var regexStr = questionAnswering.prepositions[type];
                                        var regex = new RegExp(regexStr, "gmi")
                                        var array = [];
                                        entity.offsets.forEach(function (offset) {
                                            var text2 = text.substring(offset.start - 10, offset.start + offset.syn.length + 10);
                                            if (text2.length > 20) {
                                                while ((array = regex.exec(text2)) != null) {
                                                    if (array.length == 2)
                                                        extractedPrepositions.push({"word": array[1], start: regex.lastIndex - array[1].length})
                                                }
                                            }
                                        })
                                    })
                                }
                            })
                        }
                        return extractedPrepositions;
                    }


                    var paragraphIds = {};
                    var chapterIds = {};
                    var docIds = {};
                    allShouldEntityHits.forEach(function (hit) {
                        paragraphIds[hit._source.paragraphId] = hit._source;
                        chapterIds[hit._source.chapterId] = hit._source;
                        docIds[hit._source.docId] = hit._source;
                    })


                    allShouldEntityHits.forEach(function (hit) {
                        source = hit._source
                        var obj = {}
                        if (source.paragraphId) {
                            var chapterObj = chapterIds[source.chapterId]
                            var docObj = docIds[source.docId];
                            var previousParagraphObj = null;
                            if (paragraphIds[hit._source.paragraphId - 1] && paragraphIds[hit._source.paragraphId - 1].chapterId == source.docId)
                                previousParagraphObj = paragraphIds[source.paragraphId - 1]
                            var nextParagraphObj = null;
                            if (paragraphIds[hit._source.paragraphId + 1] && paragraphIds[hit._source.paragraphId + 1].chapterId == source.docId)
                                nextParagraphObj = paragraphIds[source.paragraphId + 1]

                            var totalMatchingEntities = source.matchingEntities.concat(chapterObj.matchingEntities).concat(docObj.matchingEntities)
                            var totalMeasurementEntities = source.matchingMeasurementEntities

                            totalMeasurementUnitsScore=(totalMeasurementEntities.length==0?0:(2 * Math.log(totalMeasurementEntities.length)))
                            var score = totalMatchingEntities.length + totalMeasurementUnitsScore;

                            var prepositions = extractPrepositions(source.matchingEntities, source.text);
                            score += 3 * prepositions.length


                            obj = {
                                score: score,
                                text: source.text,
                                chapter: chapterObj.chapter,
                                docTitle: docObj.docTitle,
                                matchingPrepositions: prepositions.length,
                                matchingEntities: totalMatchingEntities,
                                totalMeasurementEntities: totalMeasurementEntities
                            }
                            aggregatedHits.push(obj);

                        }

                    })
                    aggregatedHits.sort(function (a, b) {

                        if ((a.score) > b.score)

                            return -1;
                        if (a.score < b.score)
                            return 1;
                        return 0;

                    })


                    return callbackSeries();
                }


            ],

            function (err) {
                if (err)
                    return callback(err);

                var obj = {question: question, responses: aggregatedHits}
                return callback(null, obj)
            }
        )
    }


}

module.exports = questionAnswering


if (false) {


    var options = {
        questionsIndex: "question_en",
        corpusIndex: "gmec_par",
        thesaurusIndex: "thesaurus_ctg",

    }
    question = "What is the maximum response time of an anti surge system";
    //  question = "What is the class balancing of a fan";

    questionAnswering.processQuestion(question, options, function (err, result) {
        console.log(JSON.stringify(result, null, 2))

    })
}
