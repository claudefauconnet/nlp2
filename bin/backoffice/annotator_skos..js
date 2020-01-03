/**
 * https://publications.europa.eu/en/web/eu-vocabularies/th-dataset/-/resource/dataset/eurovoc/version-20181220-0
 */

var fs = require('fs');
var async = require('async');
var request = require('request');
var ndjson = require('ndjson');
const socket = require('../../routes/socket.js');
const elasticRestProxy = require('../elasticRestProxy..js')

var annotator_skos = {


    rdfToJsTree: function (sourcePath, options, callback) {
        var xmlnsRootLength=-1
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
            var i=0;
            for (var key in conceptsMap) {
                //identitification of xmlnsRootLength (position of # or last / in the uri)
                if(i++<5){
                    var p=key.indexOf("#");
                    if(p<0)
                        p=key.lastIndexOf("/")
                   if(p<0)
                      return callback("Cannot analyze concept uri :"+key)
                    if(xmlnsRootLength==-1)
                        xmlnsRootLength=p+1
                    else if( xmlnsRootLength!=(p+1))
                       return  callback("Cannot continue uri has not the same xmlns:"+key)
                }

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


            function recurseAncestors(node) {
                if (node.parent) {
                    //  node.ancestors.splice(0, 0, node.parent);
                    if (treeMap[node.parent] && treeMap[node.parent].parent) {
                        node.ancestors.push(treeMap[node.parent].parent);
                        recurseAncestors(treeMap[node.parent].parent)
                    }

                }

            }

            for (var key in treeMap) {
                var concept = treeMap[key];
                if (!concept.text)
                    concept.text = "?"

                if (key.indexOf("Surge System") > -1)
                    var x = 3
                recurseAncestors(concept)

                var str = "";
                var allAncestors = concept.ancestors;
                allAncestors.splice(0,0,key)
                allAncestors.forEach(function (ancestorId, index) {


                  
                        var name = ancestorId.substring(xmlnsRootLength);
                    if (str.indexOf(name) == 0)
                        return;//cf thesaurus-ctg ids


                    if (str != "")
                        name += "-"
                    str = name + str;
                })


                concept.internal_id = str;

            }

            /*     var regex = /[0-9]{2}/
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
                 // set internal_id as concat of all ancestors separated by "-"
                 for (var key in treeMap) {
                     var concept = treeMap[key];
                     var str = "";

                     if (concept.ancestors) {

                         concept.ancestors.forEach(function (ancestorId, index) {
                             var ancestor = treeMap[ancestorId];

                             if (ancestor && ancestor.parent && ancestor.parent != "#") {
                                 if (str != "")
                                     str += "-";
                                 str += ancestor.text;

                             }
                         })
                         if (!concept.text)
                             concept.text = "?"

                         if (str != "")
                             treeMap[key].internal_id = str + "-" + concept.text;
                         else
                             treeMap[key].internal_id = concept.text;

                     }
                 }*/


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
if(!currentConcept)
    return;
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
            if(!currentConcept)
                return;
            if (node == "rdf:Description" || node == "skos:Concept") {
                conceptsMap[currentConcept.id] = currentConcept;
            }
        })
        saxStream.on("end", function (node) {

            var conceptsArray = processMap(conceptsMap);
            callback(null, conceptsArray)
        })

        if (fs.existsSync(sourcePath)) {
            fs.createReadStream(sourcePath)
                .pipe(saxStream)
        } else {
            callback("No such File " + sourcePath);
        }


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

        if  (!globalOptions.sourceFields )
            globalOptions.highlightFields = ["text","docTitle","chapter"]

       if(globalOptions.highlightFields){
           globalOptions.highlightFieldsMap={}
           globalOptions.searchField= globalOptions.highlightFields
           globalOptions.highlightFields.forEach(function(field){
               globalOptions.highlightFieldsMap[field]={};
           })
       }



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
                        entities[entityIndex].internal_id = entities[entityIndex].internal_id

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
                                        "pre_tags" : ["|"],
                                        "post_tags" : ["|"]


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

                                queriedEntities.push(entityIndex)
                                serialize.write({index: globalOptions.corpusIndex})
                                serialize.write(entity.elasticQuery)

                        }
                    })
                    serialize.end();

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
                        var responses = json.responses;
                        var totalAnnotations = 0
                        responses.forEach(function s(response, responseIndex) {
                            entities[queriedEntities[responseIndex]].documents = [];
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


                                entities[queriedEntities[responseIndex]].documents.push(document);
                                totalAnnotations += 1;
                                var offsets = [];


                                if (hit.highlight) {//&& hit.highlight[globalOptions.searchField]) {
                                    globalOptions.searchField.forEach(function(field){
                                        if( hit.highlight[field]) {
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
                                offsets.sort(function(a,b){
                                    if(a.start>b.start)
                                        return -1;
                                    if(b.start>a.start)
                                        return 1;
                                    return 0;


                                })
                                document.entityOffsets = offsets;

                            })
                        })
                        console.log("total Annotations " + totalAnnotations + " on " + entities.length + " entities ");
                        callbackSeries();
                    })
                },

                function (callbackSeries) {// set map of entities for eachDocument

                    entities.forEach(function (entity) {

                        if (!entity.documents)
                            return;
                        entity.documents.forEach(function (doc) {

                            if (!documentsEntitiesMap[doc.id])
                                documentsEntitiesMap[doc.id] = []
                            if (entity.internal_id.indexOf("Component-Surge") > -1)
                                var x = 3
                            //  var entityId = entity.id.substring(entity.id.indexOf("#") + 1)
                            documentsEntitiesMap[doc.id].push({id: entity.internal_id, offsets: doc.entityOffsets})

                        })
                    })

                    callbackSeries();
                },

                // remove entities contained in others  entities forEachDoc to be finished
                function (callbackSeries) {
                    return callbackSeries();


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
                    if (!globalOptions.append)
                        return callbackSeries();
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
                                 var message = "mappings updated "+globalOptions.corpusIndex;
                                socket.message(message)
                                return callbackSeries()

                            })
                        }
                    )
                },

                function (callbackSeries) {// create /update mappings for entity field
                    if (globalOptions.append)
                        return callbackSeries();
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
                                var message = "mappings updated "+globalOptions.corpusIndex;
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
                    if (globalOptions.append)
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
                    if (globalOptions.append)
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
                                    "synonyms": {
                                        "type": "text"
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
    annotateCorpusFromRDFfile: function (thesaurusConfig, index, elasticUrl, callback) {
        var thesaurusIndexName = thesaurusConfig.name.toLowerCase()
        socket.message("Parsing  thesaurus " + thesaurusIndexName + " from file " + thesaurusConfig.skosXmlPath)
        annotator_skos.rdfToJsTree(thesaurusConfig.skosXmlPath, thesaurusConfig, function (err, result) {
            if (err)
                return callback(err);
            var entities = result;
            socket.message("extracted " + entities.length + "entities  from thesaurus from file " + thesaurusConfig.skosXmlPath)
            var fetchSize = 1500
            var options = {
                corpusIndex: index,
                thesaurusIndex:  thesaurusIndexName,
                elasticUrl: elasticUrl
            }


            var slicedData = [];
            var p = 0;
            var q = 0;
            do {
                q = p + fetchSize;
                slicedData.push(entities.slice(p, q));
                p = q;

            } while (p < entities.length)


            var i = 0;
            socket.message("Starting annotation of index " + options.corpusIndex + "with thesaurus " + options.thesaurusIndex)
            async.eachSeries(slicedData, function (slice, callbackEach) {
                    if (i > 0)
                        options.append = true
                    annotator_skos.annotateCorpus(slice, options, function (err, result) {
                        if (err) {
                            console.log("ERROR :" + err)
                            return callbackEach(err);
                        }
                        i++;
                        socket.message("extracted  entities  from " + fetchSize * i + " documents")

                        return callbackEach();
                    })
                }, function (err) {
                    if (err)
                        return callback(err);
                    socket.message("Finished annotation of index " + options.corpusIndex + "with thesaurus " + options.thesaurusIndex)
                    callback(null, "ALL DONE")
                }
            )


        })
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

module.exports = annotator_skos;


var rdfXmlPath = "C:\\Users\\claud\\Downloads\\eurovoc_in_skos_core_concepts.rdf";
var rdfXmlPath = "D:\\NLP\\eurovoc_in_skos_core_concepts.rdf";

var jstreeJsonPath = "D:\\GitHub\\souslesensGraph\\souslesensGraph\\public\\semanticWeb\\eurovocFr.json"
var jstreeJsonPath = "D:\\NLP\\eurovoc_in_skos_core_concepts.json";
var jstreeJsonPathAnnotated = "D:\\GitHub\\souslesensGraph\\souslesensGraph\\public\\semanticWeb\\eurovocFrAnnotated.json"


if (false) {
    var entities = ["Component-Valve-AntiSurgeValve"]
    annotator_skos.getDocumentsEntitiesHierarchy("http://localhost:9200/", "thesaurus_ctg", entities, function (err, result) {

    })

}

if (false) {
    var options = {
        // corpusIndex: "testxx",
        //  corpusIndex: "total_gm_mec",
        corpusIndex: "bordereaux",
        // corpusIndex: "gmec_par",
        thesaurusIndex: "thesaurus_eurovoc",
        elasticUrl: "http://localhost:9200/",
        //  excludeEntitiesPrefixs: ["SemanticTools", "PISTE", "Structure"]
        // generateThesaurusTreeMap: false,
        //  generateThesaurusJstreeWithDocuments: false

    }
    var jstreeJsonPath = "D:\\NLP\\Thesaurus_CTG.json";
    var jstreeJsonPath = "D:\\NLP\\eurovoc_in_skos_core_concepts.json";
    //  var jstreeJsonPath = "D:\\NLP\\testTh.json";
    var data = JSON.parse("" + fs.readFileSync(jstreeJsonPath));

    if (data.length < 1500) {
        annotator_skos.annotateCorpus(data, options, function (err, result) {
            if (err)
                return console.log("ERROR :" + err)
            console.log("Done")
        })
    } else {

        var slicedData = [];
        var p = 0;
        var q = 0;
        do {
            q = p + 1000;
            slicedData.push(data.slice(p, q));
            p = q;

        } while (p < data.length)
        var i = 0;
        async.eachSeries(slicedData, function (slice, callbackEach) {
                if (i > 0)
                    options.append = true
                annotator_skos.annotateCorpus(slice, options, function (err, result) {
                    if (err) {
                        console.log("ERROR :" + err)
                        return callbackEach(err);
                    }
                    i++;
                    console.log("Done " + 1000 * i)
                    return callbackEach();
                })
            }, function (err) {
                if (err)
                    return console.log(err);
                return console.log("ALL DONE")
            }
        )


    }

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

    //  var rdfXmlPath = "D:\\NLP\\eurovoc_in_skos_core_concepts.rdf";
    //   var jstreeJsonPath = "D:\\NLP\\eurovoc_in_skos_core_concepts.json";
    options = {
        outputLangage: "en",
        extractedLangages: ["en", "fr", "sp"],
        uri_candidates: "http://eurovoc.europa.eu/candidates",
        uri_domains: "http://eurovoc.europa.eu/domains"
    }
    /*   options = {

           outputLangage: "en",
           extractedLangages: ["en"],

       }*/
    var rdfXmlPath = "D:\\NLP\\measurement-unit-skos.rdf"
    var jstreeJsonPath = "D:\\NLP\\Tmeasurement-unit-skos.json";

    //  var rdfXmlPath = "D:\\NLP\\eurovoc_in_skos_core_concepts.rdf";
    //   var jstreeJsonPath = "D:\\NLP\\eurovoc_in_skos_core_concepts.json";
    options = {
        outputLangage: "en",
        extractedLangages: ["en", "fr", "sp"],

    }


    annotator_skos.rdfToJsTree(rdfXmlPath, options, function (err, result) {
        var str = JSON.stringify(result, null, 2);
        fs.writeFileSync(jstreeJsonPath, str);
    })
}

if( false){

    var content="This recommendation shall be applicable for all new machines installed at the opportunity of re-rates, |plant| expansion projects or new |plants|."


var splitArray=content.split("|");
    var offsets=[];
    var str=""
    var start;
    var end;
    splitArray.forEach(function (chunk,index){
     str+=chunk;

     if(index%2==0) {
         start = str.length;
     }
     else{
         end = str.length;
         offsets.push({start:start,end:end})
     }


    })


    var p=-1;
    var offsets=[]
    while((p=content.search(highlightRegEx))>-1){
     var q=p
    }


    var xxx=content.replace(highlightRegEx,function(a,b,c,d){
        var x=a
    })



}
