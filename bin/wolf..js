/**
 * https://publications.europa.eu/en/web/eu-vocabularies/th-dataset/-/resource/dataset/eurovoc/version-20181220-0
 */


//http://blog.onyme.com/wordnet-libre-du-francais-1-0-beta/


var fs = require('fs');
var async = require('async');
var request = require('request');
var neoRestProxy = require("./neoRestProxy.")

var wolf = {


    xmlToJson: function (sourcePath, callback) {
        var synsetsMap = {};
        var nouns = {}
        var currentTag = null;
        var currentSynset = null;
        var currentAttrTag = null;
        var strict = true; // set to false for html-mode
        var saxStream = require("sax").createStream(strict)
        saxStream.on("error", function (e) {
            // unhandled errors will throw, since this is a proper node
            // event emitter.
            console.error("error!", e)
            // clear the error
            this._parser.error = null
            this._parser.resume()
        })
        saxStream.on("opentag", function (node) {
            currentTag = node;
            // console.log(node.name)
            if (currentTag.name == "SYNSET") {
                currentSynset = {
                    id: "",
                    hyperonymIds: [],
                    hyperonyms: [],
                    ancestors: [],
                    pos: "",
                    def: "",
                    usage: ""

                }
            }
            if (currentTag.name == "SYNONYM") {
                currentSynset.synonyms = [];
            }

        })

        saxStream.on("text", function (text) {
            if (text == "\n")
                return;

            if (!currentTag) {
                return;
            }
            if (currentTag.name == "ID") {
                currentSynset.id = text;
            }
            if (currentTag.name == "ILR") {
                var type = currentTag.attributes["type"];
                if (type == "hypernym") {
                    currentSynset.hyperonymIds.push(text)
                }
                if (type == "instance_hypernym")// on ne prend pas les noms propo
                    currentSynset.nomPropre = true
            } else if (currentSynset.synonyms && currentTag.name == "LITERAL") {
                var lnote = currentTag.attributes["lnote"];
                if (text != "_EMPTY_") {
                    currentSynset.synonyms.push({literal: text, lnote: lnote});
                    if (currentSynset.nomPropre !== true) {
                        if (!nouns[text])
                            nouns[text] = {synsets: []};
                        nouns[text].synsets.push({synsetId: currentSynset.id, hyperonyms: currentSynset.hyperonymIds})
                    }
                }

            } else if (currentTag.name == "POS") {
                currentSynset.pos = text;
            } else if (currentTag.name == "DEF") {
                currentSynset.def = text;
            } else if (currentTag.name == "USAGE") {
                currentSynset.def = text;
            }
        })
        saxStream.on("closetag", function (nodeName) {
            if (nodeName == "SYNSET") {
                if (currentSynset.pos == "n" && currentSynset.synonyms.length > 0)
                    if (currentSynset.nomPropre !== true)
                        synsetsMap[currentSynset.id] = currentSynset;
                //  console.log(JSON.stringify(currentSynset))
            }
        })
        saxStream.on("end", function (node) {

            var nounsArray = Object.keys(nouns);
            nounsArray.sort();
            console.log(nounsArray.length)
            return callback(null, {synsets: synsetsMap, nouns: nouns});
        })
        fs.createReadStream(sourcePath)
            .pipe(saxStream)
    },

    generateGraph: function (synsets, nouns, subGraph, callback) {
        var neoNodePath = "/db/data/transaction/commit";
        var neoRelpath = "/db/data/batch";

        async.series([

            // synsets nodes
            function (callbackSeries) {
                if (true)
                    return callbackSeries()
                var statements = [];
                for (var key in synsets) {
                    var synset = synsets[key];
                    var properties = {subGraph: subGraph, id: key, name: key, def: synset.def, usage: synset.usage, synonyms: ""};
                    synset.synonyms.forEach(function (synonym, indexSyn) {
                        if (indexSyn > 0)
                            properties.synonyms += ","
                        properties.synonyms += (synonym.literal)
                    })
                    var properties = JSON.stringify(properties).replace(/"(\w+)"\s*:/g, '$1:');
                    var statementSynset = {statement: "CREATE (n:synset" + properties + ")  RETURN n.id"};

                    statements.push(statementSynset);

                }
                var payload = {statements: statements}
                neoRestProxy.cypher(neoNodePath, payload, function (err, result) {
                    callbackSeries(err);
                })
            }
            //hyperonyms rels
            , function (callbackSeries) {
                if (false)
                    return callbackSeries()
                var statement = {statement:"match (n:synset) where n.subGraph=\"" + subGraph + "\"  return n.id as sourceId, id(n) as neoId; "}
                var payload = {statements: [statement]};
                var neoIdsMap = {};
                neoRestProxy.cypher(neoNodePath, payload, function (err, result) {
                    if(err)
                       return callbackSeries(err)
                    var neoSynsets=result.results[0].data;

                    neoSynsets.forEach(function (line) {
                        neoIdsMap[line.row[0]] = line.row[1]
                    })


                    var statements = [];
                    for (var key in synsets) {
                        var synset = synsets[key];
                        synset.hyperonymIds.forEach(function (hyperonymId, indexSynset) {
                                if(neoIdsMap[hyperonymId]) {
                                    var synsetPayload = {
                                        method: "POST",
                                        to: "/node/" + neoIdsMap[synset.id] + "/relationships",
                                        id: 3,
                                        body: {
                                            to: "" + neoIdsMap[hyperonymId],
                                            type: "hasHyperonym"
                                        }
                                    }
                                }
                                statements.push(synsetPayload);

                        })
                    }
                    console.log(statements[0]);
                 //   var payload = {statements: statements}
                    neoRestProxy.cypher(neoRelpath, statements, function (err, result) {
                        callbackSeries(err);
                    })
                })
            }


            // nouns nodes
            , function (callbackSeries) {
                if (true)
                    return callbackSeries()
                var statements = [];
                for (var key in nouns) {
                    var noun = nouns[key];
                    var properties = {subGraph: subGraph, id: key, name: key};
                    var properties = JSON.stringify(properties).replace(/"(\w+)"\s*:/g, '$1:');
                    var statementWord = {statement: "CREATE (n:noun" + properties + ")  RETURN n.id"};
                    statements.push(statementWord);
                }
                    var payload = {statements: statements}
                    neoRestProxy.cypher(neoNodePath, payload, function (err, result) {
                        callbackSeries(err);
                    })

            }


            // noun synset rel
            , function (callbackSeries) {


                    var statement = {statement:"match (n)  where labels(n)[0] in ['synset','noun']  and n.subGraph=\"" + subGraph + "\"  return n.id as sourceId, id(n) as neoId; "};
                    var payload = {statements: [statement]};
                    var neoIdsMap = {};
                    neoRestProxy.cypher(neoNodePath, payload, function (err, result) {
                        if(err)
                            return callbackSeries(err)
                        var neoNouns=result.results[0].data;

                        neoNouns.forEach(function (line) {
                            neoIdsMap[line.row[0]] = line.row[1];
                        })


                        var statements = [];
                        for (var key in nouns) {
                            var noun = nouns[key];
                            noun.synsets.forEach(function (synset, indexnoun) {
                                if(neoIdsMap[synset.synsetId]) {
                                    var synsetPayload = {
                                        method: "POST",
                                        to: "/node/" + neoIdsMap[key] + "/relationships",
                                        id: 3,
                                        body: {
                                            to: "" + neoIdsMap[synset.synsetId],
                                            type: "inSynset"
                                        }
                                    }
                                }
                                statements.push(synsetPayload);

                            })
                        }
                        console.log(statements[0]);
                        //   var payload = {statements: statements}
                        neoRestProxy.cypher(neoRelpath, statements, function (err, result) {
                            callbackSeries(err);
                        })
                    })
                }


        ], function (err) {
            if (err)
                return console.log(err);
            return ("ALL DONE")
        })
        var statements = [];


    },


    setAncestors: function (map, callback) {
        for (var key in map) {
            function recurse(synset, level) {
                synset.hyperonymIds.forEach(function (hyperonymId) {
                    var hyperonym = map[hyperonymId];
                    if (hyperonym) {
                        map[key].ancestors.push(hyperonym.synonyms[0].literal);
                        hyperonym.hyperonymIds.forEach(function (parentHyperonymId) {
                            var parentHyperonym = map[parentHyperonymId];
                            if (parentHyperonym && level < 5 && parentHyperonym.hyperonymIds)
                                recurse(parentHyperonym, level + 1)
                            else {
                                var ww = 1;
                            }
                        })
                    }
                })
            }

            recurse(map[key], 0)
            var x = map[key];

        }
        // console.log(JSON.stringify(x))
        return callback(null, map)

    }

    ,


    deleteIndex: function (index, callback) {
        var options = {
            method: 'DELETE',
            headers: {
                'content-type': 'application/json'
            },
            url: "http://localhost:9200/" + index
        };
        request(options, function (error, response, body) {
            if (error)
                return callback(error);
            callback();
        })
    }
    ,

    indexElastic: function (map, index, callback) {


        var str = "";
        for (var key in map) {
            var id = key;
            var synset = map[key];
            str += JSON.stringify({index: {"_index": index, _type: index, "_id": id}}) + "\r\n";
            str += JSON.stringify({synonyms: synset.synonyms, ancestors: synset.ancestors, def: synset.def, hyperonymIds: synset.hyperonymIds}) + "\r\n";
        }

        var options = {
            method: 'POST',
            body: str,
            encoding: null,
            headers: {
                'content-type': 'application/json'
            },
            url: "http://localhost:9200/_bulk"
        };

        request(options, function (error, response, body) {

            if (error)
                return callback(err);
            var json = JSON.parse(response.body);
            return callback(null, json);
        })
    }


}

module.exports = wolf;


if (true) {
    var xmlPath = "D:\\NLP\\wolf-1.0b4.xml";
    var synsets = {};
    var nouns = {};
    async.series([
        function (callbackSeries) {
            console.log("xmlToJson")
            wolf.xmlToJson(xmlPath, function (err, result) {
                console.log("xmlToJson done")
                synsets = result.synsets;
                nouns = result.nouns;
                return callbackSeries(err);
            })

        },

        function (callbackSeries) {
            if (false)
                return callbackSeries();
            console.log("generateGraph")
            wolf.generateGraph(synsets, nouns, "wolf", function (err, result) {
                console.log("generateGraph done")
                return callbackSeries(err);
            })
        },
        function (callbackSeries) {
            if (true)
                return callbackSeries();
            console.log("setAncestors")
            wolf.setAncestors(synsets, function (err, result) {
                console.log("setAncestors done")

                return callbackSeries(err);
            })
        },
        function (callbackSeries) {
            if (true)
                return callbackSeries();
            console.log("delete elasticIndex ")
            wolf.deleteIndex("wolf", function (err, result) {
                console.log("delete elasticIndex  done")
                return callbackSeries(err);
            })
        },

        function (callbackSeries) {
            console.log("indexElastic ")
            wolf.indexElastic(synsets, "wolf", function (err, result) {
                console.log("indexElastic done")
                return callbackSeries(err);
            })
        }


    ], function (err) {
        if (err)
            return console.log(err);
        return console.log("DONE")
    })

}

if (false) {

}
