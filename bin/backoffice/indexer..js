var async = require('async');
var ndjson = require('ndjson');
var request = require('request');
var path = require('path');
var socket = require('../../routes/socket.js');
var fs = require('fs');
var configLoader = require('../configLoader.')


var documentCrawler = require("./_documentCrawler.");
var bookCrawler = require("./_bookCrawler.");
var sqlCrawler = require("./_sqlCrawler.");
var csvCrawler = require("./_csvCrawler.");
var imapCrawler = require("./_imapCrawler.");
var indexer = {

    runIndexation: function (config, callback) {
        var index = config.general.indexName;
        var elasticUrl = config.indexation.elasticUrl;
        var connector = config.connector;

        var indexExists = false;

        async.series([


                //******check config *************
                function (callbackSeries) {
                    if (!index)
                        return callbackSeries("no index field in config ");
                    if (!elasticUrl)
                        return callbackSeries("no elasticUrl field in config ");
                    if (!connector)
                        return callbackSeries("no connector field in config ");
                    if (elasticUrl.charAt(elasticUrl.length - 1) != "/")
                        elasticUrl += "/";
                    callbackSeries()
                },

                function (callbackSeries) {
                    var message = "strarting indexation index :" + index
                    socket.message(message);
                    callbackSeries();
                },

                //******check if index exist*************
                function (callbackSeries) {
                    var options = {
                        method: 'HEAD',
                        headers: {
                            'content-type': 'application/json'
                        },
                        url: elasticUrl + index
                    };
                    request(options, function (error, response, body) {
                        if (error)
                            return callbackSeries(error);
                        if (response.statusCode == 200)
                            indexExists = true;
                        callbackSeries();
                    })
                },


                //******deleteIndex*************
                function (callbackSeries) {
                    if (!indexExists || !config.indexation.deleteOldIndex)
                        return callbackSeries();


                    var options = {
                        method: 'DELETE',
                        headers: {
                            'content-type': 'application/json'
                        },
                        url: "http://localhost:9200/" + index
                    };
                    request(options, function (error, response, body) {
                        if (error)
                            return callbackSeries(error);
                        var message = "delete index :" + index
                        socket.message(message);
                        callbackSeries();
                    })
                },

                // ******** load settings related contentField if mappings******************

                function (callbackSeries) {
                    if (!config.schema || !config.schema.mappings)
                        return callbackSeries();

                    configLoader.getTemplates(function (err, models) {
                        if (err)
                            return callbackSeries(err);
                        var contentField = config.schema.contentField;

                        config.analyzerObject = models.analyzers[config.schema.analyzer];
                        callbackSeries();
                    })


                },


                //******create Index*************
                function (callbackSeries) {
                    if (!config.indexation.deleteOldIndex)
                        return callbackSeries();

                    var json = {}
                    var indexSchema = config.schema;


                    if (indexSchema) {
                        //settings
                        if (indexSchema.analyzer) {
                            var obj = config.analyzerObject
                            json.settings = {
                                "analysis": obj
                            }
                        }


                        //mappings
                        if (indexSchema.mappings)
                            json.mappings = {[index]: {properties: indexSchema.mappings}};

                        if (indexSchema.contentField) {

                            json.mappings[index].properties[indexSchema.contentField] = {
                                "type": "text",
                                "index_options": "offsets",
                                "analyzer": config.schema.analyzer,
                                "fielddata": true,
                                "fields": {
                                    "raw": {

                                        "type": "keyword",
                                        "ignore_above": 256,
                                    }
                                }
                            }
                        }
                    }


                    //updateRecordId  used for incremental update
                    json.mappings[index].properties.incrementRecordId = {"type": "keyword"};

                    var options = {
                        method: 'PUT',
                        description: "create index",
                        url: elasticUrl + index + "/",
                        json: json
                    };

                    request(options, function (error, response, body) {
                        if (error)
                            return callbackSeries(error);
                        if (body.error)
                            return callbackSeries(body.error);
                        var message = "index " + index + " created"
                        socket.message(message);
                        return callbackSeries();

                    })
                }
                ,


                //******get existing documents  incrementRecordIds for incremental update*************
                function (callbackSeries) {
                    config.incrementRecordIds = [];
                    if (!config.indexation.deleteOldIndex)
                        return callbackSeries();


                    var incrementRecordIds = [];

                    var fecthSize = 2000;
                    var resultSize = fecthSize;
                    var offset = 0;
                    async.whilst(
                        function (callbackTest) {//test
                            return callbackTest(null, resultSize >= fecthSize);
                        },
                        function (callbackWhilst) {//iterate
                            if (config.indexation.deleteOldIndex || !indexExists)
                                return callbackSeries();
                            var query = {
                                size: fecthSize,
                                from: offset,
                                _source: "incrementRecordId",
                                filter: {"match_all": {}}
                            }
                            var options = {
                                method: 'POST',
                                json: query,
                                url: elasticUrl + index + "/_search"
                            };


                            request(options, function (error, response, body) {
                                if (error)
                                    return callbackSeries(error);
                                if (body.error && body.error.reason)
                                    return callbackSeries(body.error.reason)
                                var hits = body.hits.hits;
                                resultSize = hits.length;
                                offset += resultSize;

                                hits.forEach(function (hit) {
                                    incrementRecordIds.push(hit._source.incrementRecordId);
                                })


                                return callbackWhilst();
                            })


                        }, function (err) {
                            config.incrementRecordIds = incrementRecordIds;
                            return callbackSeries(err);
                        })
                }

                ,


                //******crawl source and index *************
                function (callbackSeries) {


                    if (connector.type == "fs") {
                        documentCrawler.indexSource(config, function (err, result) {
                            return callbackSeries(err, result);
                        })
                    } else if (connector.type == "sql") {
                        sqlCrawler.indexSource(config, function (err, result) {
                            return callbackSeries(err, result);
                        })
                    } else if (connector.type == "csv") {
                        csvCrawler.indexSource(config, function (err, result) {
                            return callbackSeries(err, result);
                        })
                    } else if (connector.type == "imap") {
                        imapCrawler.indexSource(config, function (err, result) {
                            return callbackSeries(err, result);
                        })
                    } else if (connector.type == "book") {
                        bookCrawler.indexSource(config, function (err, result) {
                            return callbackSeries(err, result);
                        })
                    } else
                        return callbackSeries("no valid connector type declared");


                }

            ],

            function (err) {
                callback(err)
            }
        )

    },

}

module.exports = indexer;

if (false) {
    var path = "D:\\GitHub\\nlp2\\config\\elastic\\sources\\testdocs.json";
    var config = "" + fs.readFileSync(path);
    config = JSON.parse(config);
    config.run = {elasticUrl: "http://localhost:9200/"}
    indexer.index(config, function (err, result) {
        if (err)
            return console.log(err);
        return console.log("DONE");
    });
}

if (false) {
    var path = "D:\\GitHub\\nlp2\\config\\elastic\\sources\\testsql4.json";
    var config = "" + fs.readFileSync(path);
    config = JSON.parse(config);
    config.indexation= {
        "deleteOldIndex": true,
            "elasticUrl": "http://localhost:9200/"
    }
    //config.indexation = {elasticUrl: "http://localhost:9200/"}
    indexer.runIndexation(config, function (err, result) {
        if (err)
            return console.log(err);
        return console.log("DONE");
    });
}

