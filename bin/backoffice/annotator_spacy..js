
//https://www.bp.com/content/dam/bp/country-sites/en_az/azerbaijan/home/pdfs/esias/sd/sd2/units_and_abbreviations.pdf
//https://www.spe.org/authors/docs/symbols.pdf

var fs = require('fs');
var async = require('async');
var request = require('request');
var ndjson = require('ndjson');
const socket = require('../../routes/socket.js');
const elasticRestProxy = require('../elasticRestProxy..js')


var annotator_spacy = {


    annotateCorpus: function (globalOptions, callback) {
        var count = 0;
        var i = 0;
        var fetchSize = 10;
        var from = 0;
        var docEntities = [];
        var extractedEntities = {};
        var allUnits = []



        if (!globalOptions.highlightFields)
            globalOptions.highlightFields = ["attachment.content"];


        if (globalOptions.highlightFields) {

            globalOptions.highlightFieldsMap = {}
            globalOptions.searchField = globalOptions.highlightFields
            globalOptions.highlightFields.forEach(function (field) {
                globalOptions.highlightFieldsMap[field] = {};
            })
        }

        async.whilst(
            function test(cb) {
                cb(null, count > 0 || (i++) == 0)
            },
            function iter(callbackIter) {
                var query = {
                    query: {match_all: {}},
                    size: fetchSize,
                    from: from
                }
                from += fetchSize;

                var options = {
                    method: 'POST',
                    json: query,
                    headers: {
                        'content-type': 'application/json'
                    },

                    url: globalOptions.elasticUrl + globalOptions.corpusIndex + "/_search"
                };

                request(options, function (error, response, body) {
                    if (error)
                        return callbackIter(error);
                    var hits = body.hits.hits;


                    var annotatedHits = [];
                    async.series([

                        //extract regex arrays
                        function (callbackSeries) {
                            annotator_spacy.extractSpacyEntities(hits, globalOptions, function (err, result) {
                                if (err)
                                    return callbackSeries(err);
                                for (var key in result) {
                                    if (!extractedEntities[key])
                                        extractedEntities[key] = {documents: []}
                                    extractedEntities[key].documents = extractedEntities[key].documents.concat(result[key].documents);
                                }
                                return callbackSeries()
                            })
                        },




                        // create /update mappings for entity field
                        function (callbackSeries) {
                            if (globalOptions.append)
                                return callbackSeries();
                            var json = {
                                [globalOptions.corpusIndex]: {
                                    "properties": {
                                        ["entities_" + globalOptions.regexEntitiesFieldName]: {

                                            "properties": {

                                                id: {type: "keyword"},
                                                offsets: {
                                                    "properties": {
                                                        start: {type: "integer"},
                                                        end: {type: "integer"},
                                                        value: {type: globalOptions.valueMappingType},
                                                        field: {type: "keyword"},


                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            var options = {
                                method: 'POST',
                                json: json,
                                headers: {
                                    'content-type': 'application/json'
                                },
                                url: globalOptions.elasticUrl + globalOptions.corpusIndex + "/" + globalOptions.corpusIndex + "/_mappings"
                            };
                            request(options, function (error, response, body) {
                                    if (error)
                                        return callbackSeries(error);
                                    const indexer = require('./indexer..js')
                                    elasticRestProxy.checkBulkQueryResponse(body, function (err, result) {
                                        if (err)
                                            return callbackSeries(err);
                                        var message = "mappings updated " + globalOptions.corpusIndex;
                                        socket.message(message)
                                        return callbackSeries()

                                    })
                                }
                            )


                        },


                        function (callbackSeries) {// set document entities

                            var docEntitiesMap = {}
                            for (var key in extractedEntities) {

                                extractedEntities[key].documents.forEach(function (doc) {
                                    if (!docEntitiesMap[doc.id]) {
                                        docEntitiesMap[doc.id] = {id: doc.id, entities: [], entityNames: []}

                                    }
                                    var p = -1
                                    if (docEntitiesMap[doc.id].entityNames.indexOf(key) < 0) {
                                        docEntitiesMap[doc.id].entityNames.push(key);
                                        docEntitiesMap[doc.id].entities.push({id: key, offsets: []})
                                        p = 0;
                                    } else {
                                        p = docEntitiesMap[doc.id].entityNames.indexOf(key);
                                    }


                                    var offset={
                                        start: doc.start,
                                        end: doc.end,
                                        value: doc.value,

                                        field: doc.field
                                    };
                                    if(doc.unit)
                                        doc.unit=doc.unit;
                                    if(doc.normalizedValue)
                                        doc.normalizedValue=doc.normalizedValue;

                                    docEntitiesMap[doc.id].entities[p].offsets.push(offset);
                                })


                            }
                            docEntities = []
                            for (var key in docEntitiesMap) {
                                delete docEntitiesMap[key].entityNames;
                                docEntities.push(docEntitiesMap[key])
                            }
                            callbackSeries();
                        },


                        function (callbackSeries) {// update corpus index with entities

                            if (docEntities.length == 0)
                                return callbackSeries();

                            var ndjsonStr = ""
                            var serialize = ndjson.serialize();
                            serialize.on('data', function (line) {
                                ndjsonStr += line; // line is a line of stringified JSON with a newline delimiter at the end
                            })


                            docEntities.forEach(function (item) {

                                // var queryString = JSON.stringify(item.entities);
                                var elasticQuery = {
                                    "doc": {
                                        ["entities_" + globalOptions.regexEntitiesFieldName]: item.entities
                                    }
                                }

                                serialize.write({update: {_id: item.id, _index: globalOptions.corpusIndex, _type: globalOptions.corpusIndex}})
                                serialize.write(elasticQuery)
                            })


                            serialize.end();

                            var options = {
                                method: 'POST',
                                body: ndjsonStr,
                                headers: {
                                    'content-type': 'application/json'
                                },
                                url: globalOptions.elasticUrl + "_bulk"
                            };

                            request(options, function (error, response, body) {
                                    if (error)
                                        return callbackSeries(error);
                                    const indexer = require('./indexer..js')
                                    elasticRestProxy.checkBulkQueryResponse(body, function (err, result) {
                                        if (err)
                                            return callbackSeries(err);
                                        var message = "indexed " + result.length + " records ";
                                        socket.message(message)
                                        return callbackSeries()

                                    })
                                }
                            )
                        }
                        ,

                        function (callbackSeries) {
                            return callbackSeries();
                        },
                    ], function (err) {
                        if (err)
                            return callbackIter(err);
                        count = hits.length;
                        return callbackIter()

                    })

                })


            },
            function (err, n) {
                if (err)
                    return callback(err);

                var y = extractedEntities;
                return callback(null, "Done")
            }
        );

    }
    , extractSpacyEntities: function (hits, globalOptions, callback) {



        async.forEach(hits,function(hit,callbackEach){
    var text=hit._source["text"];
    if(text && text !="") {
        var options = {
            method: 'POST',
            json: {"rawtext": text},
            headers: {
                'content-type': 'application/json'
            },
            url: globalOptions.spacyServerUrl
        };
        request(options, function (error, response, body) {
            if (error)
                return callbackEach(error);
           var pos=JSON.parse(body);
           console.log(JSON.pre(pos))
            callbackEach();
        })

    }
    else{
        callbackEach();
    }
        },function(err){
            if(err)
                return callback(err);
            return callback();
        })
    }



}


module.exports = annotator_spacy;


const path = require('path');


async.series([
    function (callbackSeries) {



        var options = {
            elasticUrl: "http://localhost:9200/",
            spacyServerUrl: "http://localhost:5000/pos",
            corpusIndex: "gmec_par",
            highlightFields: ["text"]
        }
        annotator_spacy.annotateCorpus(options, function (err, result) {
            var x = result;
            callbackSeries();
        })
    },



], function (err) {
    if (err)
        return console.log(err);
    return console.log("DONE")
})













