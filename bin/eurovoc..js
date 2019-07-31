/**
 * https://publications.europa.eu/en/web/eu-vocabularies/th-dataset/-/resource/dataset/eurovoc/version-20181220-0
 */

var fs = require('fs');
var async = require('async');
var request = require('request');
var ndjson = require('ndjson')

var eurovoc = {


    annotateCorpus: function (thesaurusPath, corpusIndexes, conceptsIndexName) {

        var thesaurusConcepts = JSON.parse("" + fs.readFileSync(thesaurusPath));
        var conceptQueries = [];
        thesaurusConcepts.forEach(function (concept, conceptIndex) {
            if (conceptIndex > 10000)
                return;
            var synonymsShould = [];
            if (concept.data.synonyms) {
                var synonyms = concept.data.synonyms.split(";")
                synonyms.forEach(function (synonym, indexSynonym) {
                    if (synonym != "")
                        synonymsShould.push({term: {content: synonym}})
                })
                if (synonymsShould.length > 0) {
                    thesaurusConcepts[conceptIndex].elasticQuery = ({query: {bool: {should: synonymsShould}}, size: 10000, _source: "title"});

                }

            }


        })
        var ndjsonStr = ""
        var serialize = ndjson.serialize();
        serialize.on('data', function (line) {
            ndjsonStr += line; // line is a line of stringified JSON with a newline delimiter at the end
        })

        thesaurusConcepts.forEach(function (concept) {
            if (concept.elasticQuery) {

                serialize.write({index: corpusIndexes})
                serialize.write(concept.elasticQuery)
            }

        })


        serialize.end();
        var xx = ndjsonStr;


        //  conceptQueries+="\n"

        // console.log(ndjsonStr);
        var options = {
            method: 'POST',
            body: ndjsonStr,
            headers: {
                'content-type': 'application/json'
            },

            url: "http://localhost:9200/_msearch"
        };
        request(options, function (error, response, body) {
            var json = JSON.parse(response.body);
            var responses = json.responses;
            responses.forEach(function (response, responseIndex) {
                thesaurusConcepts[responseIndex].data.documents = [];
                var hits = response.hits.hits;
                hits.forEach(function (hit) {
                    var document = {id: hit._id, index: hit._index, title: hit._source.title};

                    thesaurusConcepts[responseIndex].data.documents.push(document);


                })

            })


            function generateThesaurusJstreeWithDocuments() {
                var conceptsMap = {};
                thesaurusConcepts.forEach(function (concept) {

                    conceptsMap[concept.id] = concept;
                })

                thesaurusConcepts.forEach(function (concept, indexConcept) {
                    //  if (concept.data.documents) {//} && concept.data.documents.length > 0)

                    function recurse(conceptId, chilDocumentCount) {
                        if (!concept.data.documents)
                            concept.data.documents = [];
                        if (!conceptsMap[conceptId].data.docsCount)
                            conceptsMap[conceptId].data.docsCount = chilDocumentCount;
                        conceptsMap[conceptId].data.docsCount += concept.data.documents.length;
                        if (conceptsMap[conceptId].parent && conceptsMap[conceptId].parent != "#")
                            recurse(conceptsMap[conceptId].parent, conceptsMap[conceptId].data.docsCount)


                    }

                    recurse(concept.id, 0)


                })
                var thesaurusConceptsAnnotated = []

                for (var key in conceptsMap) {
                    var concept = conceptsMap[key];

                    if (concept.data.docsCount) {
                        concept.text = "*" + concept.data.docsCount + "* " + concept.text
                    }
                    delete concept.elasticQuery;
                    thesaurusConceptsAnnotated.push(concept)


                }
                fs.writeFileSync(jstreeJsonPathAnnotated, JSON.stringify(thesaurusConceptsAnnotated, null, 2))


            }

            function generateThesaurusTreeMap() {
                var conceptsMap = {};
                thesaurusConcepts.forEach(function (concept) {
                    concept.children = [];
                    conceptsMap[concept.id] = concept;
                })
// set Children
                thesaurusConcepts.forEach(function (concept,index) {
                    if (concept.parent && concept.parent != "#")
                        conceptsMap[concept.parent].children.push(concept)

                })





                function recurse(parentTreeNode,obj){
                   var childTreeNode={
                       key:obj.text,
                   }
                    parentTreeNode.values.push(childTreeNode)
                   if(   obj.children.length==0) {
                       childTreeNode.value = obj.data.documents?obj.data.documents.length:0
                       childTreeNode.data={
                           documents:obj.data.documents,
                           synonyms:obj.data.synonyms
                       }
                   }
                    else
                    {
                        childTreeNode.values = [];
                        obj.children.forEach(function (child, index) {
                           if(child.children.length>0 || child.data.documents.length>0)

                            recurse(childTreeNode, child)

                        })
                    }


                }
                // set tree
                var tree={key: "root",values:[]};
                thesaurusConcepts.forEach(function (concept,index) {
                    if (concept.parent && concept.parent == "#")
                        recurse(tree,concept)

                })
// only top domains
                tree=tree.values[2].values

                fs.writeFileSync(jstreeJsonPathAnnotated.replace(".json","Tree.json"), JSON.stringify(tree, null, 2))
                   var x=tree;


            }


            function indexEntities() {
                // write concepts and docs in new Index
                var conceptsNdjsonWithDocs = ""


                var serialize = ndjson.serialize();
                serialize.on('data', function (line) {
                    conceptsNdjsonWithDocs += line; // line is a line of stringified JSON with a newline delimiter at the end
                })

                thesaurusConcepts.forEach(function (concept) {
                    if (concept.elasticQuery && concept.data.documents.length > 0) {
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
                    var json = JSON.parse(response.body);


                })
            }

        //    indexEntities();
          //  generateThesaurusJstreeWithDocuments()
            generateThesaurusTreeMap()

        })


        // console.log(JSON.stringify(thesaurusConcepts,null,2))
    },


    rdfToJsTree: function (sourcePath, targetPath) {

        function processMap(conceptsMap) {

            var treeMap = {};
            var schemesMap = {};
            var ancestorsMap = {};
            var domains = {};
            for (var key in conceptsMap) {

                var concept = conceptsMap[key];

                var obj = {
                    text: concept.prefLabels["fr"],
                    id: concept.id,
                    data: {synonyms: "", ancestors: []},
                    parent: "#"

                }

                if (concept.id.indexOf("http://eurovoc.europa.eu/candidates") == 0)
                    obj.text = "CANDIDATS"

                for (var key2 in concept.prefLabels) {
                    if (Array.isArray(concept.prefLabels[key2])) {
                        concept.prefLabels[key2].forEach(function (str) {
                            obj.data.synonyms += str + ";"
                        })
                    }
                    else {
                        obj.data.synonyms += concept.prefLabels[key2] + ";"
                    }

                }

                for (var key2 in concept.altLabels) {
                    if (Array.isArray(concept.altLabels[key2])) {
                        concept.altLabels[key2].forEach(function (str) {
                            obj.data.synonyms += str + ";"
                        })
                    }
                    else {
                        obj.data.synonyms += concept.altLabels[key2] + ";"
                    }

                }


// indentification des domaines

                if (concept.schemes.length == 1 && concept.schemes.indexOf("http://eurovoc.europa.eu/domains") > -1) {
                    var domainKey = concept.prefLabels["fr"].substring(0, 2);
                    domains[domainKey] = concept.id
                }


                if (concept.topConcepts.length > 0) {// && concept.topConcepts.indexOf("http://eurovoc.europa.eu/candidates")<0) {
                    obj.parent = concept.topConcepts[concept.topConcepts.length - 1];
                    obj.data.ancestors = concept.topConcepts;
                }

                else if (concept.schemes.length > 0) {// && concept.topConcepts.indexOf("http://eurovoc.europa.eu/candidates")<0) {
                    obj.parent = concept.schemes[concept.schemes.length - 1];
                    obj.data.ancestors = concept.schemes;
                }
                else {
                    if (concept.broaders.length > 0) {
                        obj.parent = concept.broaders[concept.broaders.length - 1];
                        obj.data.ancestors = concept.broaders;
                    }
                }

// console.log(concept.id)
                treeMap[concept.id] = obj


            }


// gestion de la hierarchie des parents
            for (var key in treeMap) {

                concept = treeMap[key];
                if (concept.data.ancestors) {
                    concept.data.ancestors.forEach(function (ancestor, index) {
                        if (index < concept.data.ancestors.length && treeMap[ancestor].parent == "#")
                            treeMap[ancestor].parent = concept.data.ancestors[index + 1];

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
                            treeMap[key].data.ancestors.push(treeMap[key].parent)
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


            var str = JSON.stringify(conceptsArray, null, 2);
            fs.writeFileSync("./eurovocFr.json", str)
            fs.writeFileSync(targetPath, str)


//console.log(JSON.stringify(schemesMap,null,2));


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

            if (node.name == "rdf:Description") {
                currentConcept = {}
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
                if (lang == "fr")
                    currentTagName = "prefLabelFr";
                if (lang == "en")
                    currentTagName = "prefLabelEn";
                if (lang == "es")
                    currentTagName = "prefLabelEs";

            }
            if (node.name == "skos:altLabel") {

                var lang = node.attributes["xml:lang"];
                if (lang == "fr")
                    currentTagName = "altLabelFr";
                if (lang == "en")
                    currentTagName = "altLabelEn";
                if (lang == "es")
                    currentTagName = "altLabelEs";

            }


            if (node.name == "skos:topConceptOf") {
                var type = node.attributes["rdf:resource"]
                currentConcept.topConcepts.push(type);
            }

            if (node.name == "rdf:type") {
                var type = node.attributes["rdf:resource"]
                if (type.indexOf("ConceptScheme") > -1) {
                    currentConcept.isConceptScheme = true;
                }
            }

            if (node.name == "skos:inScheme") {

                currentConcept.schemes.push(node.attributes["rdf:resource"]);

            }
            if (node.name == "skos:broader") {

                currentConcept.broaders.push(node.attributes["rdf:resource"]);

            }
            if (node.name == "skos:narrower") {

                currentConcept.narrowers.push(node.attributes["rdf:resource"]);

            }
            if (node.name == "skos:related") {

                currentConcept.relateds.push(node.attributes["rdf:resource"]);

            }
        })

        saxStream.on("text", function (text) {
            if (currentTagName == "prefLabelFr")
                currentConcept.prefLabels.fr = text;
            if (currentTagName == "prefLabelEn")
                currentConcept.prefLabels.en = text;
            if (currentTagName == "prefLabelEs")
                currentConcept.prefLabels.es = text;

            if (currentTagName == "altLabelFr")
                currentConcept.altLabels.fr = text;
            if (currentTagName == "altLabelEn")
                currentConcept.altLabels.en = text;
            if (currentTagName == "altLabelEs")
                currentConcept.altLabels.es = text;

            currentTagName = null;
        })


        saxStream.on("closetag", function (node) {
            if (node == "rdf:Description") {

                conceptsMap[currentConcept.id] = currentConcept;
            }
        })
        saxStream.on("end", function (node) {
            var x = conceptsMap;

            processMap(conceptsMap)


        })


// pipe is supported, and it's readable/writable
// same chunks coming in also go out.
        fs.createReadStream(sourcePath)
            .pipe(saxStream)
//   .pipe(fs.createWriteStream("file-copy.xml"))


    }

}

module.exports = eurovoc;


var rdfXmlPath = "C:\\Users\\claud\\Downloads\\eurovoc_in_skos_core_concepts.rdf";
var jstreeJsonPath = "D:\\GitHub\\souslesensGraph\\souslesensGraph\\public\\semanticWeb\\eurovocFr.json"
var jstreeJsonPathAnnotated = "D:\\GitHub\\souslesensGraph\\souslesensGraph\\public\\semanticWeb\\eurovocFrAnnotated.json"


if (true) {
    eurovoc.annotateCorpus(jstreeJsonPath, ["artotheque","phototheque","videotheque" ,"audiotheque","ocr","bordereaux"], "eurovoc_entities")
}

if (false) {
    eurovoc.rdfToJsTree(rdfXmlPath, jstreeJsonPath)
}