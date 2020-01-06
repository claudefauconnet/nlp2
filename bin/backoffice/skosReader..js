var fs = require('fs');
var saxStream = require("sax").createStream(true)
var skosReader={
    rdfToJsTree: function (sourcePath, options, callback) {
        var xmlnsRootLength = -1
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
            var i = 0;
            for (var key in conceptsMap) {
                if(Object.keys(conceptsMap[key].prefLabels).length>0) {
                    //identitification of xmlnsRootLength (position of # or last / in the uri)
                    if (i++ < 5) {
                        var p = key.indexOf("#");
                        if (p < 0)
                            p = key.lastIndexOf("/")
                        if (p < 0)
                            return callback("Cannot analyze concept uri :" + key)
                        if (xmlnsRootLength == -1)
                            xmlnsRootLength = p + 1
                        else if (xmlnsRootLength != (p + 1))
                            return callback("Cannot continue uri has not the same xmlns:" + key)
                    }
                    else {
                        if (xmlnsRootLength == -1)
                            return callback("Cannot determine xmlnsRootLength")
                    }
                }

                var concept = conceptsMap[key];

                if (concept.id.indexOf("C00131") > -1)
                    var x = 3;
                var obj = {
                    text: (concept.prefLabels[options.outputLangage] || concept.prefLabels["en"]),
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

                if (concept.broaders.length > 0) {
                    obj.parent = concept.broaders[concept.broaders.length - 1];
                    obj.ancestors = concept.broaders;
                }
                if (concept.topConcepts.length > 0) {
                    if (concept.broaders.length == 0) {

                        obj.parent = concept.topConcepts[concept.topConcepts.length - 1];
                        obj.ancestors=concept.topConcepts;
                    }
                } else if (concept.schemes.length > 0) {// && concept.topConcepts.indexOf("http://eurovoc.europa.eu/candidates")<0) {
                    if (concept.broaders.length == 0) {
                        obj.parent = concept.schemes[concept.schemes.length - 1];
                        obj.ancestors = concept.schemes;
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

                if (!concept.text) {
                    concept.text = "?"
                }
                if (key.indexOf("Surge System") > -1)
                    var x = 3
                recurseAncestors(concept)

                var str = "";
                var allAncestors = concept.ancestors;
                allAncestors.splice(0, 0, key)
                allAncestors.forEach(function (ancestorId, index) {


                    if (!treeMap[ancestorId])
                        return;
                    var ancestorName = treeMap[ancestorId].text
                    if(ancestorName=="?")
                        return;
                    if (str.indexOf(ancestorName) == 0)
                        return;//cf thesaurus-ctg ids


                    if (str != "")
                        ancestorName += "-"
                    str = ancestorName + str;
                })


                concept.internal_id = str;

            }


            var conceptsArray = []
            for (var key in treeMap) {
                if (!treeMap[key].parent)
                    treeMap[key].parent = "#"

                conceptsArray.push(treeMap[key])
            }
            return conceptsArray;
        }

        var conceptTagNames = ["rdf:Description", "skos:ConceptScheme", "skos:Concept", "iso-thes:ConceptGroup"]
        var conceptsMap = {}
        var currentConcept = null;
        var currentTagName = null;


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


            if (conceptTagNames.indexOf(node.name) > -1) {
                currentConcept = {};
                var id = node.attributes["rdf:about"];
                if (id.indexOf("COL001") > -1)
                    var x = 3
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
            /*   if (node.name == "iso-thes:superGroup") {
                   currentConcept.broaders.push(node.attributes["rdf:resource"]);
               }*/


        })

        saxStream.on("text", function (text) {
            if (!currentConcept)
                return;
            if (currentTagName) {
                if (currentTagName.indexOf("prefLabels_") == 0) {
                    var array = currentTagName.split("_")

                    currentConcept[array[0]][array[1]] = text;
                } else if (currentTagName.indexOf("altLabels_") == 0) {
                    currentConcept.altLabels.push(text)
                }
            }

            currentTagName = null;
        })


        saxStream.on("closetag", function (node) {
            if (!currentConcept)
                return;
            if (conceptTagNames.indexOf(node) > -1) {
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





}

module.exports=skosReader
