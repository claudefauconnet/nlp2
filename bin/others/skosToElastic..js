var fs = require('fs')
var async = require('async')
var request = require('request')
var skosReader = require('../backoffice/skosReader.')
var skosToElastic = {

    load: function (thesaurusPaths,callback) {

        async.eachSeries(thesaursusList, function (thesaurusPath, callbackEach) {
            skosReader.rdfToFlat(thesaurusPath, null, function (err, json) {
                skosToElastic.flatToElastic(json,function(err, result){
                    if(err) {
                        return callbackEach(err)
                    }
                    console.log( "indexed" +thesaurusPath+ " :  "+result)
                        callbackEach();
                })
            })


        },function(err){
            if(err){
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

    compareThesaurus :function(index1,index2){






      entities.forEach(function (entity, entityIndex) {


        if (entityIndex > globalOptions.maxEntities)
            return callbackSeries();

        var synonyms = [];

        if (entity.synonyms) {
            var synonyms = entity.synonyms.toString().toLowerCase()
            var queryString = "";
            var shouldQuery = [];
            entity.synonyms.forEach(function (synonym, indexSynonym) {

                if (synonym != "") {
                    if (indexSynonym > 0)
                        queryString += " OR "

                    queryString += "\\\\\"" + synonym + "\\\\\"";


                }
            })
            if (queryString.length > 0) {

                entities[entityIndex].elasticQuery = {


                    "query": {
                        "query_string": {
                            "query": queryString,
                            "fields": globalOptions.searchField,

                        }
                    }

                    ,
                    "from": 0,
                    "size": 1000,
                    "_source": "_id",
                    "highlight": {
                        "number_of_fragments": 0,
                        "fragment_size": 0,
                        "fields": globalOptions.highlightFieldsMap,
                        "pre_tags": ["|"],
                        "post_tags": ["|"]


                    }
                }

            }
        }
    })
    var ndjsonStr = ""
    var serialize = ndjson.serialize();
serialize.on('data', function (line) {
    ndjsonStr += line; // line is a line of stringified JSON with a newline delimiter at the end
})
var nElasticQueries = 0
var queriedEntities = [];
if (entities.length == 0)
    return callback(null, entities);
entities.forEach(function (entity, entityIndex) {
    if (entity.elasticQuery) {

        queriedEntities.push(entityIndex)
        serialize.write({index: globalOptions.corpusIndex})
        serialize.write(entity.elasticQuery)
        nElasticQueries += 1


    }
})
serialize.end();

if (nElasticQueries == 0)
    return callback(null, []);
var options = {
    method: 'POST',
    body: ndjsonStr,
    headers: {
        'content-type': 'application/json'
    },

    url: globalOptions.elasticUrl + "_msearch"
};

request(options, function (error, response, body) {
    if (error)
        return callbackSeries(error);
    var json = JSON.parse(response.body);
    if (json.error) {
        var x = str;
        return callback(json.error);
    }
    var responses = json.responses;

    if (!responses || !responses.forEach)
        var x = 3

    responses.forEach(function s(response, responseIndex) {
        entities[queriedEntities[responseIndex]].documentsMap = {};
        if (response.error) {
            console.log(JSON.stringify(response.error.root_cause))
            socket.message(JSON.stringify(response.error.root_cause))
            return;
        }
        var hits = response.hits.hits;


        //   var splitFieldContentRegEx = /\[#([^\].]*)\]([^\[\\.]*)/gm
        var highlightRegEx = /(<em[^\/]*?>([^<]*)<\/em>)/gm;

        hits.forEach(function (hit) {
            var document = {id: hit._id, index: hit._index, score: hit._score};

            if (!entities[queriedEntities[responseIndex]].documentsMap[document.id])
                entities[queriedEntities[responseIndex]].documentsMap[document.id] = document;
            totalAnnotations += 1;
            var offsets = [];


            if (hit.highlight) {//&& hit.highlight[globalOptions.searchField]) {
                globalOptions.searchField.forEach(function (field) {
                    if (hit.highlight[field]) {
                        hit.highlight[field].forEach(function (highlight) {
                            var splitArray = highlight.split("|");

                            var str = ""
                            var start;
                            var end;
                            splitArray.forEach(function (chunk, index) {
                                str += chunk;

                                if (index % 2 == 0) {
                                    start = str.length;
                                } else {
                                    end = str.length;
                                    var offset = {field: field, syn: chunk, end: end, start: start}
                                    offsets.push(offset)
                                }

                            })

                        })
                    }
                })


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

var thesaursusList = getThesaurusListFromNlp2App();
var x = thesaursusList;

skosToElastic.load(thesaursusList, function (err, result) {
    if (err)
        return console.log(err);
    return console.log("done")
})



