var fs = require('fs')
var async = require('async')
var request = require('request')
var skosReader = require('../backoffice/skosReader.')

var ndjson = require('ndjson');
var skosToElastic = {

    load: function (thesaurusPaths, callback) {

        async.eachSeries(thesaurusList, function (thesaurusPath, callbackEach) {
            skosReader.rdfToFlat(thesaurusPath, null, function (err, json) {
                skosToElastic.flatToElastic(json, function (err, result) {
                    if (err) {
                        return callbackEach(err)
                    }
                    console.log("indexed" + thesaurusPath + " :  " + result)
                    callbackEach();
                })
            })


        }, function (err) {
            if (err) {
                return callback(err)
                callback();
            }
        })

    },
    flatToElastic: function (flatJson, callback) {
        var indexName = "flat_thesaurus"
        var bulkStr = "";
        var elasticUrl = "http://localhost:9200/"
        flatJson.forEach(function (record, indexedLine) {
            var id = record.thesaurus + "_" + (indexedLine)

            bulkStr += JSON.stringify({index: {_index: indexName, _type: indexName, _id: id}}) + "\r\n"
            bulkStr += JSON.stringify(record) + "\r\n";

        })

        var options = {
            method: 'POST',
            body: bulkStr,
            encoding: null,
            headers: {
                'content-type': 'application/json'
            },
            url: elasticUrl + "_bulk?refresh=wait_for"
        };

        request(options, function (error, response, body) {
            if (error) {
                return callback(error)

            }


            if (Buffer.isBuffer(body))
                body = JSON.parse(body.toString());
            else
                body = body;
            var errors = [];
            if (body.error) {
                if (body.error.reason)
                    return callback(body.error.reason)
                return callback(body.error)
            }

            if (!body.items)
                return callback(null, "done");
            body.items.forEach(function (item) {
                if (item.index && item.index.error)
                    errors.push(item.index.error);
                else if (item.update && item.update.error)
                    errors.push(item.update.error);
                else if (item.delete && item.delete.error)
                    errors.push(item.delete.error);
            })

            if (errors.length > 0) {
                errors = errors.slice(0, 20);
                return callback(errors);
            }
            return callback(null, body.items.length);


        })

    },


    getCommonConcepts: function (hitsIndexSource, indexTarget, callback) {
        var commonConcepts=[]
        var hitsIndexTarget = [];
        async.series([
            //query first thersaurus
            function (callbackSeries) {
                var ndjsonStr = ""
                var serialize = ndjson.serialize();
                serialize.on('data', function (line) {
                    ndjsonStr += line; // line is a line of stringified JSON with a newline delimiter at the end
                })


                hitsIndexSource.forEach(function (item, index) {


                 //   var label = item._source.concept;
                  var label = item._source.name;


                    var elasticQuery = {
                        "query": {
                            "bool": {
                                "must": [
                                    {
                                        "query_string": {
                                            "query": "\\\"" + label + "\\\"",
                                            "default_operator": "AND",
                                            "default_field": "prefLabel",
                                        }
                                    }
                                ]
                            }
                        },
                        "from": 0,
                        "size": 25
                    }
//console.log(JSON.stringify(elasticQuery,null,2))
                    serialize.write({index: indexTarget})
                    serialize.write(elasticQuery)

                })

                serialize.end();
                var options = {
                    method: 'POST',
                    body: ndjsonStr,
                    headers: {
                        'content-type': 'application/json'
                    },

                    url: "http://localhost:9200/" + "_msearch"
                };

                request(options, function (error, response, body) {
                    if (error)
                        return callbackSeries(error);
                    var json = JSON.parse(response.body);
                    if (json.error) {
                        return callbackSeries(json.error);
                    }
                    var responses = json.responses;

                    if (!responses || !responses.forEach)
                        var x = 3

                    responses.forEach(function (response, responseIndex) {
                        if (response.error) {
                            hitsIndexTarget.push({_source: {}})
                            return;//  return callbackSeries(response.error.root_cause)
                        }
                        hitsIndexTarget.push(response.hits.hits);


                    });
                    callbackSeries();
                })
            }

            ,
            //process common
            function (callbackSeries) {
                var targetHitsIds = [];
                hitsIndexTarget.forEach(function (hits, index) {
                    if (hits.length > 0) {
                        commonConcepts.push({source: hitsIndexSource[index], target: hitsIndexTarget[index]})
                        var targetIds = [];
                        //    console.log(hitsIndexSource[index]._source.concept+"  "+hitsIndexTarget[index]._source.path)
                        /*    hits.forEach(function (hit) {
                                targetIds.push({
                                    source_name: hitsIndexSource[index]._source.concept,
                                    source_id: hitsIndexSource[index]._source.id,
                                    taregt_name: hit._source.prefLabel,
                                    target_id: hit._source.pathIds[0]
                                })
                            })
                            targetHitsIds.push(targetIds)*/

                    }
                })
                callbackSeries();

            }], function (err) {
            if (err)
                return callback(err);
            return callback(null, commonConcepts)

        })
    },


    compareThesaurus: function (indexSource, indexTarget, callback) {
        var hitsIndexSource = [];
        var hitsIndexTarget = [];
        var commonConcepts = [];
        var totalHits=0
        var scroll_id = "";
        async.series([
                //query first thersaurus
                function (callbackSeries) {
                    var payload = {
                        "query":
                            {
                               "match_all": {}
                              //  "match":{"concept":"corrosion"}
                            }
                        ,
                        // "from": 4800,
                        "size": 5000,
                    }
                    var options = {
                        method: 'POST',
                        json: payload,
                        headers: {
                            'content-type': 'application/json'
                        },

                        url: "http://localhost:9200/" + indexSource + "/_search?scroll=1m"
                    };

                    request(options, function (error, response, body) {
                        if (error)
                            return callbackSeries(error);
                        var json = response.body;
                        if (json.error) {
                            return callbackSeries(json.error);
                        }

                        hitsIndexSource = body.hits.hits;
                        scroll_id = body._scroll_id;

                        var scrollSize = 10000;


                        async.whilst(
                            function test(cb) {
                                cb(null, scrollSize > 0);
                            },
                            function iter(callbackWhilst) {
                                var options = {
                                    method: 'POST',
                                    json: {
                                        "scroll": "1m",
                                        "scroll_id": scroll_id
                                    },
                                    headers: {
                                        'content-type': 'application/json'
                                    },

                                    url: "http://localhost:9200/_search/scroll"
                                };

                                request(options, function (error, response, body) {
                                    if (error)
                                        return callbackWhilst(error);
                                    var json = response.body;
                                    if (json.error) {
                                        return callbackWhilst(json.error);
                                    }
                                    scroll_id = body._scroll_id;
                                    scrollSize = body.hits.hits.length;
                                    hitsIndexSource = hitsIndexSource.concat(body.hits.hits);
                                    totalHits+=body.hits.hits.length;
                                    skosToElastic.getCommonConcepts(hitsIndexSource, indexTarget, function (err, result) {
                                        if (err)
                                            return callbackWhilst(err);
                                        console.log(result.length+" /"+ totalHits)
                                        commonConcepts=commonConcepts.concat(result)
                                        callbackWhilst();

                                    })


                                })
                            },
                            function (err, n) {
                                if(err)
                                   return callbackSeries(err);
                                fs.writeFileSync("D:\\NLP\\LOC\\commonConcepts_" + indexTarget + ".json", JSON.stringify(commonConcepts, null, 2))
                                callbackSeries();
                            })
                    })
                },
                //search common
                function (callbackSeries) {


                    fs.writeFileSync("D:\\NLP\\commonConcepts_" + indexTarget + ".json", JSON.stringify(commonConcepts, null, 2))
                    callbackSeries()

                }
            ],

            function (err) {
                if (err)
                    return callback(err);
                callback(null, commonConcepts)
            }
        )
    }
}

module.exports = skosToElastic


function getThesaurusListFromNlp2App() {
    var listPath = "D:\\GitHub\\nlp2\\public\\skosEditor\\js\\theaususList.js";
    var str = "" + fs.readFileSync(listPath)


    var list = [];
    var lines = str.split("\n")
    lines.forEach(function (line) {
        if (line.indexOf("D:") > -1) {
            list.push(line.replace(",", "").replace(/"/g, "").trim());
        }

    })
    return list;
}


if (true) {

    var thesaurusList = getThesaurusListFromNlp2App();


 //   thesaursusList = ["D:\\NLP\\thesaurusCTG-02-20.rdf"]

    var thesaurusList = [
        "D:\\NLP\\thesaurusCTG-02-20.rdf",
        "D:\\NLP\\quantum_F_all.rdf",
        "D:\\NLP\\Tulsa_all.rdf",
        "D:\\NLP\\Tulsa_COMMON ATTRIBUTE.rdf",
        "D:\\NLP\\Tulsa_EARTH AND SPACE CONCEPTS.rdf",
        "D:\\NLP\\Tulsa_ECONOMIC FACTOR.rdf",
        "D:\\NLP\\Tulsa_EQUIPMENT.rdf",
        "D:\\NLP\\Tulsa_LIFE FORM.rdf",
        "D:\\NLP\\Tulsa_MATERIAL.rdf",
        "D:\\NLP\\Tulsa_OPERATING CONDITION.rdf",
        "D:\\NLP\\Tulsa_PHENOMENON.rdf",
        "D:\\NLP\\Tulsa_PROCESS.rdf",
        "D:\\NLP\\Tulsa_PROPERTY.rdf",
        "D:\\NLP\\unesco.rdf",
        "D:\\NLP\\thesaurusIngenieur.rdf",
    ];

    var thesaurusList = ["D:\\NLP\\unesco.rdf"]
    skosToElastic.load(thesaurusList, function (err, result) {
        if (err)
            return console.log(err);
        return console.log("done")
    })
}
if (false) {


  skosToElastic.compareThesaurus("libraryofcongress", "flat_thesaurus", function (err, result) {
      //  skosToElastic.compareThesaurus("termscience_all", "flat_thesaurus", function (err, result) {
        var x = result;
    })
}



