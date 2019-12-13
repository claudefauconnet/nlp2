/**
 * https://publications.europa.eu/en/web/eu-vocabularies/th-dataset/-/resource/dataset/eurovoc/version-20181220-0
 */

var fs = require('fs');
var async = require('async');
var request = require('request');
var ndjson = require('ndjson');
const socket = require('../../routes/socket.js');

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

                for (var key2 in concept.altLabels) {
                    if (Array.isArray(concept.altLabels[key2])) {
                        concept.altLabels[key2].forEach(function (str) {
                            obj.synonyms += str + ";"
                        })
                    } else {
                        obj.synonyms.push(concept.altLabels[key2]);
                    }

                }
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
                currentConcept.altLabels = {};

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
                /*    if (lang == "fr")
                        currentTagName = "prefLabelFr";
                    if (lang == "en")
                        currentTagName = "prefLabelEn";
                    if (lang == "es")
                        currentTagName = "prefLabelEs";*/

            }
            if (node.name == "skos:altLabel") {
                var lang = node.attributes["xml:lang"];
                if (options.extractedLangages.indexOf(lang) > -1) {
                    currentTagName = "altLabels_" + lang
                }

                /*   if (lang == "fr")
                       currentTagName = "altLabelFr";
                   if (lang == "en")
                       currentTagName = "altLabelEn";
                   if (lang == "es")
                       currentTagName = "altLabelEs";*/

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

            if (currentTagName && (currentTagName.indexOf("prefLabels_") == 0 || currentTagName.indexOf("altLabels_") == 0)) {
                var array = currentTagName.split("_")
                currentConcept[array[0]] = {[array[1]]: text};
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


    annotateCorpus: function (entities, corpusIndexes, conceptsIndexName, globalOptions) {
        if (globalOptions.maxEntities)
            globalOptions.maxEntities = 10000
        async.series([


                function (callbackSeries) {   // annotate docs

                    var message = "extractingEntities in docs " + entities.length
                    socket.message(message)
                    entities.forEach(function (concept, conceptIndex) {
                        entities[conceptIndex].source_id = entities[conceptIndex].id

                        if (conceptIndex > globalOptions.maxEntities)
                            return;

                        var synonyms = [];
                        if (concept.synonyms) {
                            var queryString = ""
                            concept.synonyms.forEach(function (synonym, indexSynonym) {
                                if (synonym != "") {

                                    synonym=synonym.replace(/\(\)\//g, function(a,b){
                                        return a;
                                    })
                                    if (indexSynonym > 0)
                                        queryString += " "


                                    queryString += "\\\"" + synonym + "\\\""
                                }
                                // synonymsMust.push({term: {content: synonym}})
                            })
                            if (queryString!="") {
                                entities[conceptIndex].elasticQuery = {
                                    "query": {
                                        "query_string": {
                                            "query": queryString,
                                            "default_operator": "OR"
                                        }
                                    },
                                    "from": 0,
                                    "size": 1000,
                                    "_source": "_id"

                                }
                                //   entities[conceptIndex].elasticQuery = ({query: {bool: {must: synonymsMust}}, size: 10000, _source: "attachment.content"});

                            }

                        }


                    })
                    var ndjsonStr = ""
                    var serialize = ndjson.serialize();
                    serialize.on('data', function (line) {
                        ndjsonStr += line; // line is a line of stringified JSON with a newline delimiter at the end
                    })
                    entities.forEach(function (concept) {
                        if (concept.elasticQuery) {
                            serialize.write({index: corpusIndexes})
                            serialize.write(concept.elasticQuery)
                        }
                    })
                    serialize.end();
                    var options = {
                        method: 'POST',
                        body: ndjsonStr,
                        headers: {
                            'content-type': 'application/json'
                        },

                        url: "http://localhost:9200/_msearch"
                    };

                    request(options, function (error, response, body) {
                        if (error)
                            return callbackSeries(err);
                        var json = JSON.parse(response.body);
                        var responses = json.responses;
                        var totalDocsAnnotated = 0
                        responses.forEach(function (response, responseIndex) {
                            entities[responseIndex].documents = [];
                            if(response.error) {
                              return  console.log(JSON.stringify(response.error.root_cause))
                            }
                            var hits = response.hits.hits;
                            hits.forEach(function (hit) {
                                var document = {id: hit._id, index: hit._index, title: hit._source.title};
                                entities[responseIndex].documents.push(document);
                                totalDocsAnnotated += 1
                            })
                        })
                        console.log("totalDocsAnnotated " + totalDocsAnnotated)
                        callbackSeries();
                    })
                },


                function (callbackSeries) {// delete index
                    if (!globalOptions.indexEntities)
                        return callbackSeries();
                    var options = {
                        method: 'DELETE',
                        headers: {
                            'content-type': 'application/json'
                        },
                        url: "http://localhost:9200/" + conceptsIndexName
                    };
                    request(options, function (error, response, body) {
                        if (error)
                            return callbackSeries(error);
                        console.log("index " + conceptsIndexName + " deleted")
                        var json = JSON.parse(response.body);
                        callbackSeries();
                    })
                }
                ,


                function (callbackSeries) {//create index and mappings
                    if (!globalOptions.indexEntities)
                        return callbackSeries();


                    var json = {mappings: {}}
                    json.mappings[conceptsIndexName] = {
                        "properties": {
                            "source_id": {
                                "type": "keyword"
                            },
                            "parent": {
                                "type": "keyword"
                            },

                        }
                    }
                    var options = {
                        json: json,
                        method: 'PUT',
                        headers: {
                            'content-type': 'application/json'
                        },
                        url: "http://localhost:9200/" + conceptsIndexName
                    };
                    request(options, function (error, response, body) {
                        if (error)
                            return callbackSeries(error);
                        console.log("index " + conceptsIndexName + " created")
                        callbackSeries();
                    })
                }
                ,


                function (callbackSeries) {  // indexEntities

                    if (!globalOptions.indexEntities)
                        return callbackSeries();
                    console.log("indexing entities")
                    var conceptsNdjsonWithDocs = ""
                    var serialize = ndjson.serialize();
                    serialize.on('data', function (line) {
                        conceptsNdjsonWithDocs += line; // line is a line of stringified JSON with a newline delimiter at the end
                    })

                    entities.forEach(function (concept) {
                        if (concept.elasticQuery && concept.documents.length > 0) {
                            var newElasticId = Math.round(Math.random() * 10000000)
                            serialize.write({"index": {"_index": conceptsIndexName, "_type": conceptsIndexName, "_id": newElasticId}})
                            delete concept.elasticQuery
                            serialize.write(concept)
                        }

                    })
                    serialize.end();
                    var options = {
                        method: 'POST',
                        body: conceptsNdjsonWithDocs,
                        headers: {
                            'content-type': 'application/json'
                        },
                        url: "http://localhost:9200/_bulk"
                    };
                    request(options, function (error, response, body) {
                        if (error)
                            return callbackSeries(error);
                        var json = JSON.parse(response.body);
                        callbackSeries();


                    })
                },


                function (callbackSeries) {   //generateThesaurusTreeMap
                    if (!globalOptions.generateThesaurusTreeMap)
                        return callbackSeries()

                    console.log("generateThesaurusTreeMap")
                    var conceptsMap = {};
                    entities.forEach(function (concept) {
                        concept.children = [];
                        conceptsMap[concept.id] = concept;
                    })
// set Children
                    entities.forEach(function (concept, index) {
                        if (concept.parent && concept.parent != "#")
                            conceptsMap[concept.parent].children.push(concept)

                    })

                    function recurse(parentTreeNode, obj) {
                        var childTreeNode = {
                            key: obj.text,
                        }
                        parentTreeNode.values.push(childTreeNode)
                        if (obj.children.length == 0) {
                            childTreeNode.value = obj.documents ? obj.documents.length : 0
                            childTreeNode.data = {
                                documents: obj.documents,
                                synonyms: obj.synonyms
                            }
                        } else {
                            childTreeNode.values = [];
                            obj.children.forEach(function (child, index) {
                                if (child.children.length > 0 || child.documents.length > 0)

                                    recurse(childTreeNode, child)

                            })
                        }


                    }

                    // set tree
                    var tree = {key: "root", values: []};
                    entities.forEach(function (concept, index) {
                        if (concept.parent && concept.parent == "#")
                            recurse(tree, concept)

                    })
// only top domains
                    tree = tree.values[2].values

                    fs.writeFileSync(jstreeJsonPathAnnotated.replace(".json", "Tree.json"), JSON.stringify(tree, null, 2))
                    var x = tree;
                    callbackSeries();


                }


                , function (callbackSeries) { //generateThesaurusJstreeWithDocuments
                    if (!globalOptions.generateThesaurusJstreeWithDocuments)
                        return callbackSeries()
                    console.log("generateThesaurusJstreeWithDocuments")
                    var conceptsMap = {};
                    entities.forEach(function (concept) {

                        conceptsMap[concept.id] = concept;
                    })

                    entities.forEach(function (concept, indexConcept) {
                        //  if (concept.documents) {//} && concept.documents.length > 0)

                        function recurse(conceptId, chilDocumentCount) {
                            if (!concept.documents)
                                concept.documents = [];
                            if (!conceptsMap[conceptId].docsCount)
                                conceptsMap[conceptId].docsCount = chilDocumentCount;
                            conceptsMap[conceptId].docsCount += concept.documents.length;
                            if (conceptsMap[conceptId].parent && conceptsMap[conceptId].parent != "#")
                                recurse(conceptsMap[conceptId].parent, conceptsMap[conceptId].docsCount)
                        }

                        recurse(concept.id, 0)
                    })
                    var entitiesAnnotated = []

                    for (var key in conceptsMap) {
                        var concept = conceptsMap[key];
                        if (concept.docsCount) {
                            concept.text = "*" + concept.docsCount + "* " + concept.text
                        }
                        delete concept.elasticQuery;
                        entitiesAnnotated.push(concept)
                    }
                    fs.writeFileSync(jstreeJsonPathAnnotated, JSON.stringify(entitiesAnnotated, null, 2))
                    callbackSeries();
                }


            ],

            // at the end
            function (err) {
                if (err) {
                    return console.log(err);
                }
                return console.log("Done");
            })


    },


}

module.exports = skosIntegrator;


var rdfXmlPath = "C:\\Users\\claud\\Downloads\\eurovoc_in_skos_core_concepts.rdf";
var rdfXmlPath = "D:\\NLP\\eurovoc_in_skos_core_concepts.rdf";

var jstreeJsonPath = "D:\\GitHub\\souslesensGraph\\souslesensGraph\\public\\semanticWeb\\eurovocFr.json"
var jstreeJsonPath = "D:\\NLP\\eurovoc_in_skos_core_concepts.json";
var jstreeJsonPathAnnotated = "D:\\GitHub\\souslesensGraph\\souslesensGraph\\public\\semanticWeb\\eurovocFrAnnotated.json"


if (true) {
    var options = {
        indexEntities: false,
        generateThesaurusTreeMap: false,
        generateThesaurusJstreeWithDocuments: false

    }
    var jstreeJsonPath = "D:\\NLP\\Thesaurus_CTG.json";
    var data = JSON.parse("" + fs.readFileSync(jstreeJsonPath));
    skosIntegrator.annotateCorpus(data, ["total_gm_mec"],
        "eurovoc_entities"
        , options)
    return;
    skosIntegrator.annotateCorpus(jstreeJsonPath, ["artotheque", "phototheque", "videotheque", "audiotheque", "ocr", "bordereaux"],
        "eurovoc_entities"
        , options)
}

if (false) {
    options = {
        outputLangage: "fr",
        extractedLangages: ["en", "fr", "sp"],
        uri_candidates: "http://eurovoc.europa.eu/candidates",
        uri_domains: "http://eurovoc.europa.eu/domains"
    }
    var rdfXmlPath = "D:\\NLP\\Thesaurus_CTG_Skos_V1.6_201905.xml";
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
