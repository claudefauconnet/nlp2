/**
 * https://publications.europa.eu/en/web/eu-vocabularies/th-dataset/-/resource/dataset/eurovoc/version-20181220-0
 */

var fs = require('fs');
var async = require('async');
var request = require('request');
var ndjson = require('ndjson');
const socket = require('../../routes/socket.js');
const elasticRestProxy = require('../elasticRestProxy..js')

var skosIntegrator = {


    rdfToJsTree: function (sourcePath, options, callback) {
        if (!options)
            options = {
                outputLangage: "fr",
                uri_candidates: "http://eurovoc.europa.eu/candidates",
                uri_domains: "http://eurovoc.europa.eu/domains"
            }

        function processMap(conceptsMap) {

            var treeMap = {};
            var schemesMap = {};
            var ancestorsMap = {};
            var domains = {};
            for (var key in conceptsMap) {

                var concept = conceptsMap[key];

                var obj = {
                    text: concept.prefLabels[options.outputLangage || "en"],
                    id: concept.id,
                    synonyms: [],
                    ancestors: [],
                    parent: "#"

                }

                if (options.uri_candidates && concept.id.indexOf(options.uri_candidates) == 0)
                    obj.text = "CANDIDATES"

                for (var key2 in concept.prefLabels) {
                    if (Array.isArray(concept.prefLabels[key2])) {
                        concept.prefLabels[key2].forEach(function (str) {
                            obj.synonyms.push(str);
                        })
                    } else {
                        obj.synonyms.push(concept.prefLabels[key2]);
                    }

                }

                concept.altLabels.forEach(function (str) {
                    obj.synonyms.push(str);
                })


// indentification des domaines
                if (options.uri_domains && concept.schemes.length == 1 && concept.schemes.indexOf(options.uri_domains) > -1) {
                    var domainKey = concept.prefLabels[options.outputLangage].substring(0, 2);
                    domains[domainKey] = concept.id
                }


                if (concept.topConcepts.length > 0) {// && concept.topConcepts.indexOf("http://eurovoc.europa.eu/candidates")<0) {
                    obj.parent = concept.topConcepts[concept.topConcepts.length - 1];
                    obj.ancestors = concept.topConcepts;
                } else if (concept.schemes.length > 0) {// && concept.topConcepts.indexOf("http://eurovoc.europa.eu/candidates")<0) {
                    obj.parent = concept.schemes[concept.schemes.length - 1];
                    obj.ancestors = concept.schemes;
                } else {
                    if (concept.broaders.length > 0) {
                        obj.parent = concept.broaders[concept.broaders.length - 1];
                        obj.ancestors = concept.broaders;
                    }
                }
                treeMap[concept.id] = obj
            }

// gestion de la hierarchie des parents
            for (var key in treeMap) {

                concept = treeMap[key];
                if (concept.ancestors) {
                    concept.ancestors.forEach(function (ancestor, index) {
                        if (index < concept.ancestors.length && treeMap[ancestor] && treeMap[ancestor].parent == "#")
                            treeMap[ancestor].parent = concept.ancestors[index + 1];
                    })
                }
            }
// rattachemenet aux domaines (premier niveau)
            var regex = /[0-9]{2}/
            for (var key in treeMap) {
                if (!treeMap[key].parent || treeMap[key].parent == "#") {
                    //  console.log( treeMap[key].text)
                    if (treeMap[key].text) {
                        var str = treeMap[key].text.substring(0, 2)
                        if (regex.test(str)) {
                            var domainId = domains[str];
                            treeMap[key].parent = domainId
                            treeMap[key].ancestors.push(treeMap[key].parent)
                        }
                    }
                }
            }
            var conceptsArray = []
            for (var key in treeMap) {
                if (!treeMap[key].parent)
                    treeMap[key].parent = "#"
                conceptsArray.push(treeMap[key])
            }
            return conceptsArray;

        }

        var conceptsMap = {}
        var currentConcept = null;
        var currentTagName = null;
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
            var x = node;


            if (node.name == "rdf:Description" || node.name == "skos:Concept") {
                currentConcept = {};
                var id = node.attributes["rdf:about"];
                currentConcept.id = id;
                currentConcept.prefLabels = {};
                currentConcept.altLabels = [];
                currentConcept.schemes = [];
                currentConcept.relateds = [];
                currentConcept.narrowers = [];
                currentConcept.broaders = [];
                currentConcept.topConcepts = [];

            }
            if (node.name == "skos:prefLabel") {

                var lang = node.attributes["xml:lang"];
                if (options.extractedLangages.indexOf(lang) > -1) {
                    currentTagName = "prefLabels_" + lang
                }

            }
            if (node.name == "skos:altLabel") {
                var lang = node.attributes["xml:lang"];
                if (options.extractedLangages.indexOf(lang) > -1) {
                    currentTagName = "altLabels_" + lang
                }

            }

            if (node.name == "skos:topConceptOf") {
                var type = node.attributes["rdf:resource"]
                currentConcept.topConcepts.push(type);
            } else if (node.name == "rdf:type") {
                var type = node.attributes["rdf:resource"]
                if (type.indexOf("ConceptScheme") > -1) {
                    currentConcept.isConceptScheme = true;
                }
            } else if (node.name == "skos:inScheme") {
                currentConcept.schemes.push(node.attributes["rdf:resource"]);
            } else if (node.name == "skos:broader") {
                currentConcept.broaders.push(node.attributes["rdf:resource"]);
            } else if (node.name == "skos:narrower") {
                currentConcept.narrowers.push(node.attributes["rdf:resource"]);
            } else if (node.name == "skos:related") {
                currentConcept.relateds.push(node.attributes["rdf:resource"]);

            }

        })

        saxStream.on("text", function (text) {

            if (currentTagName) {
                if (currentTagName.indexOf("prefLabels_") == 0) {
                    var array = currentTagName.split("_")
                    currentConcept[array[0]] = {[array[1]]: text};
                } else if (currentTagName.indexOf("altLabels_") == 0) {
                    currentConcept.altLabels.push(text)
                }
            }

            currentTagName = null;
        })


        saxStream.on("closetag", function (node) {
            if (node == "rdf:Description" || node == "skos:Concept") {
                conceptsMap[currentConcept.id] = currentConcept;
            }
        })
        saxStream.on("end", function (node) {

            var conceptsArray = processMap(conceptsMap);
            callback(null, conceptsArray)
        })

        fs.createReadStream(sourcePath)
            .pipe(saxStream)
    },


    /**********************************************************************************************************************************************
     *
     * @param entities

     * @param globalOptions
     */
    annotateCorpus: function (entities, globalOptions, callback) {
        globalOptions.indexEntities = true;
        if (globalOptions.maxEntities)
            globalOptions.maxEntities = 10000;
        if (!globalOptions.thesaurusIndex)
            return callback("No thesaurus name")
        if (!globalOptions.corpusIndex)
            return callback("No corpus Index")
        if (!globalOptions.elasticUrl)
            return callback("No Elastic URL")
        if (globalOptions.elasticUrl.charAt(globalOptions.elasticUrl.length - 1) != "/")
            globalOptions.elasticUrl += "/";
        if (!globalOptions.searchField)
            globalOptions.searchField = "attachment.content"


        if (/[A-Z]+/.test(globalOptions.thesaurusIndex))
            return callback("No Uppercase in Elastic index names")


        var documentsEntitiesMap = {};
        var corpusIndexTextFields = [];

        async.series([

                //set corpusIndexTextMappings
                function (callbackSeries) {
                    return callbackSeries();
                    var options = {
                        method: 'GET',
                        headers: {
                            'content-type': 'application/json'
                        },

                        url: globalOptions.elasticUrl + globalOptions.corpusIndex + "/_mappings"
                    };

                    request(options, function (error, response, body) {
                        var mappings = JSON.parse(body);
                        var textFields = []
                        var recurse = function (obj, parent) {
                            if (typeof obj == "object") {
                                for (var key in obj) {
                                    if (parent && parent != "content" && key == "type" && obj[key] == "text") {
                                        textFields.push(parent)
                                    } else {
                                        parent = key
                                        recurse(obj[key], parent)
                                    }
                                }

                            }

                        }
                        recurse(mappings);
                        corpusIndexTextFields = textFields;
                        callbackSeries();
                    })


                },

                function (callbackSeries) {
                    if (!globalOptions.excludeEntitiesPrefixs)
                        return callbackSeries();
                    var filteredEntitiesMap = {};
                    entities.forEach(function (entity, entityIndex) {
                        var ok = true;
                        globalOptions.excludeEntitiesPrefixs.forEach(function (prefix) {
                            if (entity.id.indexOf("#" + prefix) > -1)
                                ok = false;

                        })
                        if (ok)
                            filteredEntitiesMap[entity.id] = (entity);

                    })
                    entities = [];
                    for (var key in filteredEntitiesMap) {
                        entities.push(filteredEntitiesMap[key]);
                    }

                    callbackSeries();
                },

                // match entities on each doc of corpus index (all fields)
                function (callbackSeries) {


                    var message = "extractingEntities in docs " + entities.length
                    console.log(message)
                    socket.message(message)


                    // verifie que synonym est la valeur composée la plus longue de tous les synonymes
                    function acceptSynonym(synonym, synonyms) {
                        if (synonyms.indexOf(synonym + " ") > -1)
                            return false;
                        return true;
                    }


                    entities.forEach(function (entity, entityIndex) {
                        entities[entityIndex].source_id = entities[entityIndex].id

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
                                /*  var highligthFields={};
                                  corpusIndexTextFields.forEach(function(field){
                                      highligthFields[field]={ "number_of_fragments": 0};
                                  })*/
                                entities[entityIndex].elasticQuery = {


                                    "query": {
                                        "query_string": {
                                            "query": queryString,
                                            "fields": [globalOptions.searchField],

                                        }
                                    }

                                    ,
                                    "from": 0,
                                    "size": 1000,
                                    "_source": "_id",
                                    "highlight": {
                                        "number_of_fragments": 0,
                                        "fragment_size": 0,
                                        "fields": {"attachment.content": {}}
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

                    var queriedEntities = [];
                    entities.forEach(function (entity, entityIndex) {
                        if (entity.elasticQuery) {
                            if (entity.id == "http://www.proxem.com/onto/concept#Component-SurgeSystem")
                                var x = 3
                            queriedEntities.push(entityIndex)
                            serialize.write({index: globalOptions.corpusIndex})
                            serialize.write(entity.elasticQuery)
                        }
                    })
                    serialize.end();
                    //   console.log(ndjsonStr)
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
                            return callbackSeries(err);
                        var json = JSON.parse(response.body);
                        var responses = json.responses;
                        var totalAnnotations = 0
                        responses.forEach(function (response, responseIndex) {
                            entities[queriedEntities[responseIndex]].documents = [];
                            if (response.error) {
                                console.log(JSON.stringify(response.error.root_cause))
                                socket.message(JSON.stringify(response.error.root_cause))
                                return;
                            }
                            var hits = response.hits.hits;
                            if (responseIndex == 74)
                                var xx = 3;

                            var splitFieldContentRegEx = /\[#([^\].]*)\]([^\[\\.]*)/gm
                            var highlightRegEx = /<em[^\/]*?>([^<]*)<\/em>/gm;

                            hits.forEach(function (hit) {
                                var document = {id: hit._id, index: hit._index, score: hit._score};


                                entities[queriedEntities[responseIndex]].documents.push(document);
                                totalAnnotations += 1;
                                var offsets = [];


                                if (hit.highlight) {//&& hit.highlight[globalOptions.searchField]) {
                                    hit.highlight[globalOptions.searchField].forEach(function (highlight) {
                                        var array = [];


                                        var fieldContents = {};

                                        while ((array = splitFieldContentRegEx.exec(highlight)) != null) {
                                            fieldContents[array[1]] = array[2]
                                        }
                                        for (var field in fieldContents) {
                                            var array = [];
                                            while ((array = highlightRegEx.exec(fieldContents[field])) != null) {

                                                var end = highlightRegEx.lastIndex - 5
                                                var offset = {field: field, syn: array[1], start: end - (array[1].length)}
                                                offsets.push(offset)

                                            }
                                        }


                                    })
                                }
                                document.entityOffsets = offsets;

                            })
                        })
                        console.log("total Annotations " + totalAnnotations + " on " + entities.length + " entities ");
                        callbackSeries();
                    })
                },

                function (callbackSeries) {// set map of entities for eachDocument

                    entities.forEach(function (entity) {
                        if (entity.id == "http://www.proxem.com/onto/concept#Component-SurgeSystem")
                            var xx = 3
                        if (!entity.documents)
                            return;
                        entity.documents.forEach(function (doc) {

                            if (!documentsEntitiesMap[doc.id])
                                documentsEntitiesMap[doc.id] = []

                            var entityId = entity.id.substring(entity.id.indexOf("#") + 1)
                            documentsEntitiesMap[doc.id].push({id: entityId, offsets: doc.entityOffsets})

                        })
                    })

                    callbackSeries();
                },

                // remove entities contained in others  entities forEachDoc to be finished
                function (callbackSeries) {
                    //   return callbackSeries();


                    for (var docId in documentsEntitiesMap) {
                        var entities = documentsEntitiesMap[docId];
                        var fileteredEntities = []
                        entities.sort(function (a, b) {
                            if (a.id > b.id)
                                return 1;
                            if (a.id < b.id)
                                return -1;
                            return 0;
                        });

                        entities.forEach(function (entity, index) {
                            if (index < entities.length - 1) {
                                if (entities[index + 1].id.indexOf(entity.id) < 0)
                                    fileteredEntities.push(entity);
                            } else {
                                fileteredEntities.push(entity);
                            }

                        })
                        documentsEntitiesMap[docId] = fileteredEntities;
                    }


                    callbackSeries();
                },


                function (callbackSeries) {//delete thesaurus field in corpus index
                    var script = {
                        "script": "ctx._source.remove('" + "entities_" + globalOptions.thesaurusIndex + "')",
                        "query": {
                            "exists": {"field": "entities_" + globalOptions.thesaurusIndex}
                        }
                    }

                    var options = {
                        method: 'POST',
                        json: script,
                        headers: {
                            'content-type': 'application/json'
                        },
                        url: globalOptions.elasticUrl + globalOptions.corpusIndex + "/_update_by_query?conflicts=proceed"
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
                },

                function (callbackSeries) {// create /update mappings for entity field
                    var json = {
                        [globalOptions.corpusIndex]: {
                            "properties": {
                                ["entities_" + globalOptions.thesaurusIndex]: {
                                    //   "type": "keyword"
                                    "properties": {
                                        id: {type: "keyword"},
                                        offsets: {
                                            "properties": {
                                                start: {type: "integer"},
                                                end: {type: "integer"}
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
                                var message = "indexed " + result.length + " records ";
                                socket.message(message)
                                return callbackSeries()

                            })
                        }
                    )


                },
                function (callbackSeries) {// update corpus index with entities
                    if (!globalOptions.indexEntities)
                        return callbackSeries();

                    var ndjsonStr = ""
                    var serialize = ndjson.serialize();
                    serialize.on('data', function (line) {
                        ndjsonStr += line; // line is a line of stringified JSON with a newline delimiter at the end
                    })

                    for (var docId in documentsEntitiesMap) {

                        var entities = documentsEntitiesMap[docId];
                        var queryString = "";


                        queryString = JSON.stringify(entities);
                        queryString = entities;
                        var elasticQuery = {
                            "doc": {
                                ["entities_" + globalOptions.thesaurusIndex]: queryString
                            }
                        }

                        serialize.write({update: {_id: docId, _index: globalOptions.corpusIndex, _type: globalOptions.corpusIndex}})
                        serialize.write(elasticQuery)


                    }
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
                //******delete  old thesaurus index if exists*************
                function (callbackSeries) {
                    if (!globalOptions.thesaurusIndex)
                        return callbackSeries();
                    var options = {
                        method: 'HEAD',
                        headers: {
                            'content-type': 'application/json'
                        },
                        url: globalOptions.elasticUrl + globalOptions.thesaurusIndex
                    };
                    request(options, function (error, response, body) {
                        if (error)
                            return callbackSeries(error);
                        if (response.statusCode != 200)
                            callbackSeries();
                        else {
                            var options = {
                                method: 'DELETE',
                                headers: {
                                    'content-type': 'application/json'
                                },
                                url: globalOptions.elasticUrl + globalOptions.thesaurusIndex
                            };
                            request(options, function (error, response, body) {
                                if (error)
                                    return callbackSeries(error);
                                var message = "delete index :" + globalOptions.thesaurusIndex;
                                console.log(message);
                                socket.message(message);
                                callbackSeries();
                            })
                        }
                    })
                },

                // create thesaurus index
                function (callbackSeries) {
                    if (!globalOptions.thesaurusIndex)
                        return callbackSeries();

                    var json = {
                        "mappings": {
                            [globalOptions.thesaurusIndex]: {
                                "properties": {
                                    "internal_id": {
                                        "type": "keyword"
                                    },
                                    "id": {
                                        "type": "keyword"
                                    },
                                    "documents": {
                                        "properties": {
                                            "id": {
                                                "type": "keyword"
                                            },
                                            "score": {
                                                "type": "float"
                                            },
                                            "index": {
                                                "type": "keyword"
                                            }
                                        }
                                    }
                                },

                            }
                        }
                    }

                    var options = {
                        json: json,
                        method: 'PUT',
                        headers: {
                            'content-type': 'application/json'
                        },
                        url: globalOptions.elasticUrl + globalOptions.thesaurusIndex
                    };
                    request(options, function (error, response, body) {
                        if (error)
                            return callbackSeries(error);
                        console.log("index thesaurus_" + globalOptions.thesaurusIndex + " created")
                        socket.message("index thesaurus_" + globalOptions.thesaurusIndex + " created")
                        callbackSeries();
                    })
                }
                ,


                function (callbackSeries) {  // indexEntities

                    if (!globalOptions.indexEntities)
                        return callbackSeries();

                    console.log("indexing entities ");
                    socket.message("indexing entities");
                    var ndJson = ""
                    var serialize = ndjson.serialize();
                    serialize.on('data', function (line) {
                        ndJson += line; // line is a line of stringified JSON with a newline delimiter at the end
                    })

                    entities.forEach(function (entity) {
                        var array = entity.id.split("#");
                        if (array.length == 2)
                            entity.internal_id = array[1]
                        var newElasticId = Math.round(Math.random() * 10000000)
                        serialize.write({"index": {"_index": globalOptions.thesaurusIndex, "_type": globalOptions.thesaurusIndex, "_id": newElasticId}})
                        serialize.write(entity)
                    })
                    serialize.end();
                    var options = {
                        method: 'POST',
                        body: ndJson,
                        headers: {
                            'content-type': 'application/json'
                        },
                        url: globalOptions.elasticUrl + "/_bulk"
                    };
                    request(options, function (error, response, body) {
                        if (error)
                            return callbackSeries(error);
                        var json = JSON.parse(response.body);
                        callbackSeries();


                    })
                }
            ],

            // at the end
            function (err) {
                if (err) {
                    console.log(err);
                    return callback(err)
                }
                console.log("Done");
                return callback(null, "DONE")
            }
        )


    },


    getDocumentsEntitiesHierarchy: function (elasticUrl, thesaurusIndex, selectedentities, callback) {

        var query = {
            "query": {
                "terms": {internal_id: selectedentities}
            },
            "size": 9000
        }
        var options = {
            method: 'POST',
            json: query,
            headers: {
                'content-type': 'application/json'
            },
            url: elasticUrl + thesaurusIndex + "/_search"
        };
        request(options, function (error, response, body) {
            if (error)
                return callbackSeries(error);
            var json = response.body;
            if (json.error) {
                callback(json.error)
            }
            callback(body);
        })
    }


}

module.exports = skosIntegrator;


var rdfXmlPath = "C:\\Users\\claud\\Downloads\\eurovoc_in_skos_core_concepts.rdf";
var rdfXmlPath = "D:\\NLP\\eurovoc_in_skos_core_concepts.rdf";

var jstreeJsonPath = "D:\\GitHub\\souslesensGraph\\souslesensGraph\\public\\semanticWeb\\eurovocFr.json"
var jstreeJsonPath = "D:\\NLP\\eurovoc_in_skos_core_concepts.json";
var jstreeJsonPathAnnotated = "D:\\GitHub\\souslesensGraph\\souslesensGraph\\public\\semanticWeb\\eurovocFrAnnotated.json"


if (false) {
    var entities = ["Component-Valve-AntiSurgeValve"]
    skosIntegrator.getDocumentsEntitiesHierarchy("http://localhost:9200/", "thesaurus_ctg", entities, function (err, result) {

    })

}

if (true) {
    var options = {
        // corpusIndex: "testxx",
        //  corpusIndex: "total_gm_mec",
        corpusIndex: "gmec_par",
        thesaurusIndex: "thesaurus_ctg",
        elasticUrl: "http://localhost:9200/",
        excludeEntitiesPrefixs: ["SemanticTools", "PISTE", "Structure"]
        // generateThesaurusTreeMap: false,
        //  generateThesaurusJstreeWithDocuments: false

    }
    var jstreeJsonPath = "D:\\NLP\\Thesaurus_CTG.json";
    //  var jstreeJsonPath = "D:\\NLP\\testTh.json";
    var data = JSON.parse("" + fs.readFileSync(jstreeJsonPath));

    skosIntegrator.annotateCorpus(data, options, function (err, result) {
        if (err)
            return console.log("ERROR :" + err)
        console.log("Done")
    })

}

if (false) {
    options = {
        outputLangage: "en",
        extractedLangages: ["en", "fr", "sp"],
        uri_candidates: "http://eurovoc.europa.eu/candidates",
        uri_domains: "http://eurovoc.europa.eu/domains"
    }
    var rdfXmlPath = "D:\\NLP\\total2019_spans20191210.skos";
    var rdfXmlPath = "D:\\NLP\\Thesaurus_CTG_Skos_V1.6_201905.xml"
    var jstreeJsonPath = "D:\\NLP\\Thesaurus_CTG.json";


    options = {

        outputLangage: "en",
        extractedLangages: ["en"],

    }


    skosIntegrator.rdfToJsTree(rdfXmlPath, options, function (err, result) {
        var str = JSON.stringify(result, null, 2);
        fs.writeFileSync(jstreeJsonPath, str);
    })
}
