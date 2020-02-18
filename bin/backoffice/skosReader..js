var fs = require('fs');
var sax = require("sax");
var skosReader = {
    editingSkosFiles: [],


    rdfToAnnotator: function (sourcePath, options, callback) {
        if (!options)
            options = {
                outputLangage: "en",
                extractedLangages: "en",

            }


        skosReader.parseRdfXml(sourcePath, options, function (err, conceptsMap) {
            if (err)
                return callback(err);
            var conceptsArray = skosReader.mapToAnnotator(conceptsMap, options);
            return callback(null, conceptsArray);
        })

    },

    rdfToEditor: function (sourcePath, options, callback) {


        if (!options)
            options = {
                outputLangage: "en",
                extractedLangages: "en,fr,sp",

            }
        var mode = null;
        if (options.checkModifications) {
            var fileAlreadyOpen = skosReader.editingSkosFiles.indexOf(sourcePath);
            if (fileAlreadyOpen > -1) {
                mode = "readOnly"
            } else {

                options.saveCopy = true;
                skosReader.editingSkosFiles.push(sourcePath);
            }
        }


        skosReader.parseRdfXml(sourcePath, options, function (err, conceptsMap) {
            if (err)
                return callback(err);

            var conceptsArray = skosReader.mapToSkosEditor(conceptsMap, options);
            /*   var chmod=fs.statSync(sourcePath).mode
               if(chmod==33060)
                   conceptsArray.mode="readOnly"

             //  fs.chmodSync(sourcePath,"444")//read only*/


            return callback(null, {skos: conceptsArray, mode: mode});
        })

    },
    rdfToFlat: function (sourcePath, options, callback) {

        //  var sourcePath = "D:\\NLP\\thesaurus_CTG_Product.rdf"
        var thesaurusName = sourcePath.substring(sourcePath.lastIndexOf("\\") + 1)
        thesaurusName = thesaurusName.substring(0, thesaurusName.indexOf("."))
        if (!options) {
            options = {
                outputLangage: "en",
                extractedLangages: "en,fr,sp",
                thesaurusName: thesaurusName
            }
        }


        skosReader.parseRdfXml(sourcePath, options, function (err, conceptsMap) {
            if (err)
                return callback(err);
            var visjsArray = skosReader.rdfToFlat(conceptsMap, options);
            callback(null, flatConceptsArray)
        })

    },

    rdfToVisjsGraph: function (sourcePath, options, callback) {

        //  var sourcePath = "D:\\NLP\\thesaurus_CTG_Product.rdf"
        var thesaurusName = sourcePath.substring(sourcePath.lastIndexOf("\\") + 1)
        thesaurusName = thesaurusName.substring(0, thesaurusName.indexOf("."))
        if (!options) {
            options = {
                outputLangage: "en",
                extractedLangages: "en,fr,sp",
                thesaurusName: thesaurusName
            }
        }
        skosReader.parseRdfXml(sourcePath, options, function (err, conceptsMap) {
            if (err)
                return callback(err);
            var visjsArray = skosReader.mapToVisjGraph(conceptsMap, options);
            callback(null, visjsArray)
        })
    },


    parseRdfXml: function (sourcePath, options, callback) {
        var saxStream = sax.createStream(true)
        if (!options) {
            options = {extractedLangages: "en", outputLangage: "en"}
        }

        var conceptTagNames = ["rdf:Description", "skos:ConceptScheme", "skos:Concept", "iso-thes:ConceptGroup"]
        var conceptsMap = {}
        var currentConcept = null;
        var currentTagName = null;
        var currentParentTagName = "";
        var stop = false;
        var countConcepts = 0;
        var countConceptsEnd = 0;
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


            if (node.name == "skos:Collection")
                stop = true;
            if (conceptTagNames.indexOf(node.name) > -1) {

                countConcepts += 1
                currentConcept = {};
                var id = node.attributes["rdf:about"];
                // console.log(id);

                if (!id) {
                    currentConcept = null;
                    return;
                }
                currentConcept.id = id;
                currentConcept.prefLabels = {};
                currentConcept.altLabels = {};
                currentConcept.schemes = [];
                currentConcept.relateds = [];
                currentConcept.narrowers = [];
                currentConcept.broaders = [];
                currentConcept.topConcepts = [];
                currentConcept.definitions = [];
                currentConcept.notes = [];
            }
            if (currentConcept) {
                if (node.name == "skos:prefLabel") {

                    var lang = node.attributes["xml:lang"];
                    if (!lang) {
                        currentTagName = "prefLabels_" + "X"
                    }
                    if (options.extractedLangages.indexOf(lang) > -1) {
                        currentTagName = "prefLabels_" + lang
                    }

                }
                if (node.name == "skos:definition") {
                    currentTagName = "definition"
                }
                if (node.name == "skos:note") {
                    currentTagName = "note"
                }
                if (node.name == "skos:altLabel") {
                    var lang = node.attributes["xml:lang"];
                    if (!lang) {
                        currentTagName = "altLabels_" + "X"
                    }

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

            }
        })

        saxStream.on("text", function (text) {

            if (!currentConcept)
                return;
            if (currentTagName) {
                if (currentTagName.indexOf("prefLabels_") == 0) {
                    var array = currentTagName.split("_")
                    if (!currentConcept[array[0]][array[1]])
                        currentConcept[array[0]][array[1]] = [];
                    currentConcept[array[0]][array[1]].push(text)
                } else if (currentTagName.indexOf("altLabels_") == 0) {
                    var array = currentTagName.split("_")
                    if (!currentConcept[array[0]][array[1]])
                        currentConcept[array[0]][array[1]] = [];
                    currentConcept[array[0]][array[1]].push(text)
                } else if (currentTagName.indexOf("definition") == 0) {
                    currentConcept.definitions.push(text);
                } else if (currentTagName.indexOf("note") == 0) {
                    currentConcept.notes.push(text);
                }
            }

            currentTagName = null;
        })


        saxStream.on("closetag", function (node) {
            if (!currentConcept)
                return;
            if (conceptTagNames.indexOf(node) > -1) {
                countConceptsEnd += 1

                if (!stop)
                    if (true || Object.keys(currentConcept.prefLabels).length > 0)
                        conceptsMap[currentConcept.id] = currentConcept;


            }
        })
        saxStream.on("end", function (node) {

            callback(null, conceptsMap)

        })

        if (fs.existsSync(sourcePath)) {
            if (options.saveCopy) {
                fs.readFile(sourcePath, null, function (err, data) {
                    if (err)
                        return callback(err)
                    fs.writeFileSync(sourcePath + "-copy", "" + data);
                })

            }

            fs.createReadStream(sourcePath)
                .pipe(saxStream)
        } else {
            callback("No such File " + sourcePath);
        }


    },

    mapToAnnotator: function (conceptsMap, options) {
        var xmlnsRootLength = -1
        var treeMap = {};
        var schemesMap = {};
        var ancestorsMap = {};
        var domains = {};
        var i = 0;

        for (var key in conceptsMap) {
            if (Object.keys(conceptsMap[key].prefLabels).length > 0) {
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
                } else {
                    if (xmlnsRootLength == -1)
                        return callback("Cannot determine xmlnsRootLength")
                }
            }

            var concept = conceptsMap[key];


            var obj = {
                text: (concept.prefLabels[options.outputLangage] || concept.prefLabels["en"]),
                id: concept.id,
                synonyms: [],
                ancestors: [],
                parent: "#",
                schemes: concept.schemes

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
                concept.altLabels[key2].forEach(function (item) {
                    obj.synonyms.push(item);
                })

            }


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
                    obj.ancestors = concept.topConcepts;
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

            recurseAncestors(concept)

            var str = "";
            var allAncestors = concept.ancestors;
            allAncestors.splice(0, 0, key)
            allAncestors.forEach(function (ancestorId, index) {


                if (!treeMap[ancestorId])
                    return;
                var ancestorName = treeMap[ancestorId].text
                if (ancestorName == "?")
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
    },

    getNodeLabel: function (prefLabels, lang) {
        var label = null;
        if (!prefLabels)
            return "";
        prefLabels.forEach(function (prefLabel) {
            if (prefLabel.lang == lang && !label) {
                label = prefLabel.value;
            }
        })
        if (!label && prefLabels && prefLabels.length > 0)
            label = prefLabels[0].value
        if (!label)
            label = "?";
        return label;
    }
    ,
    mapToSkosEditor: function (conceptsMap, options) {

        var conceptsArray = []

        for (var id in conceptsMap) {


            var obj = {data: {}}
            var concept = conceptsMap[id];


            if (concept.broaders.length > 0) {
                if (options.lastBroader)
                    obj.parent = concept.broaders[concept.broaders.length - 1];
                else
                    obj.parent = concept.broaders[0];

            } else {
                obj.parent = "#"

            }


            var lang = options.outputLangage || "en" || "X"
            if (!lang || !concept.prefLabels[lang] || concept.prefLabels[lang].length == 0)
                obj.text = "?"
            else
                obj.text = concept.prefLabels[lang][0]
            obj.id = concept.id;

            var prefLabelsArray = [];
            for (var key in concept.prefLabels) {
                concept.prefLabels[key].forEach(function (item) {
                    prefLabelsArray.push({
                        lang: key,
                        value: item
                    })
                })
            }

            obj.text = skosReader.getNodeLabel(prefLabelsArray, options.outputLangage)


            var altLabelsArray = [];
            for (var key in concept.altLabels) {
                concept.altLabels[key].forEach(function (item) {
                    altLabelsArray.push({
                        lang: key,
                        value: item
                    })
                })
            }

            if (concept.relateds.length > 0)
                var x = 3

            obj.data.prefLabels = prefLabelsArray;
            obj.data.altLabels = altLabelsArray;
            obj.data.definitions = concept.definitions;
            obj.data.notes = concept.notes;
            obj.data.relateds = concept.relateds;
            obj.data.broaders = concept.broaders;
            obj.data.id = concept.id;
            if (obj.parent != "#" && !conceptsMap[obj.parent])
                var x = 2;
            else
                conceptsArray.push(obj)

        }

        return conceptsArray;
    }
    ,

    skosEditorToRdf: function (rdfPath, conceptsArray, options, callback) {

        var p = skosReader.editingSkosFiles.indexOf(rdfPath);
        if (p > -1)
            skosReader.editingSkosFiles.splice(p, 1)


        if (!options)
            options = {};
        var uriRoot = ""// "http://PetroleumAbstractsThesaurus/"
        var str = "";
        str += "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n" +
            "<rdf:RDF xmlns:skos=\"http://www.w3.org/2004/02/skos/core#\"  xmlns:rdf=\"http://www.w3.org/1999/02/22-rdf-syntax-ns#\">"


        var js2xmlparser = require("js2xmlparser");
        conceptsArray.forEach(function (concept, index) {
            var objArray = [];

            if (concept.prefLabels) {
                concept.prefLabels.forEach(function (prefLabel, index2) {
                    objArray.push({
                            "skos:prefLabel": {
                                "@": {
                                    "xml:lang": prefLabel.lang
                                },
                                "#": prefLabel.value
                            }
                        }
                    )
                })
            }

            if (concept.altLabels) {
                concept.altLabels.forEach(function (altLabel) {
                    objArray.push({
                        "skos:altLabel": {
                            "@": {
                                "xml:lang": altLabel.lang
                            },
                            "#": altLabel.value
                        }
                    })
                })

            }
            if (concept.broaders) {
                concept.broaders.forEach(function (broader, index2) {
                    objArray.push({
                            "skos:broader": {
                                "@":
                                    {
                                        "rdf:resource":
                                            uriRoot + broader
                                    }
                            }
                        }
                    )
                })
            }
            if (concept.definitions) {
                concept.definitions.forEach(function (definition, index2) {
                    objArray.push({
                            "skos:definition": {
                                "#": definition
                            }
                        }
                    )
                })
            }
            if (concept.notes) {
                concept.notes.forEach(function (note, index2) {
                    objArray.push({
                            "skos:note": {
                                "#": note
                            }
                        }
                    )
                })
            }

            if (concept.relateds) {
                concept.relateds.forEach(function (related) {
                    objArray.push({
                        "skos:related": {
                            "@":
                                {
                                    "rdf:resource":
                                        uriRoot + related
                                }
                        }
                    })
                })
            }


            var obj = {

                "@": {
                    "rdf:about": uriRoot + concept.id
                }, objArray
            }
            var xml = js2xmlparser.parse("skos:Concept", obj).substring(22) + "\n";
            str += xml
        })

        str = str.replace(/<objArray>\n/gm, "").replace(/<\/objArray>\n/gm, "")
        str += "</rdf:RDF>"

        fs.writeFileSync(rdfPath, str)
        if (callback)
            return callback(null, "done " + rdfPath)

    }
    , mapToVisjGraph: function (conceptsMap, options) {
        if (!options) {
            options = {}
        }
        var maxDepth = 15;
        if (options.maxDepth)
            maxDepth = options.maxDepth;
        var lang = "en";
        if (options.lang)
            lang = options.lang;


        var topNodeIds = [];

        var palette = ["#a6f1ff",
            "#007aa4",
            "#584f99",
            "#cd4850",
            "#005d96",
            "#ffc6ff",
            '#007DFF',
        ]
        var nodes = [];
        var edges = [];
        var uniqueNodeIds = [];
        var uniqueEdgesIds = [];
        var topNodeIds = [];


        function recurseBroaders(conceptId) {

            var concept = conceptsMap[conceptId];
            if (!concept)
                return;

            concept.broaders.forEach(function (broaderId, index) {

                var broader = conceptsMap[broaderId];
                if (!broader)
                    return;

                if (!broader.children)
                    broader.children = [];
                if (broader.children.indexOf(concept.id) < 0)
                    broader.children.push(concept.id);
                if (broader.broaders && broader.broaders[0] != "#") {
                    recurseBroaders(broaderId)


                } else if (topNodeIds.indexOf(broader.id) < 0) {
                    topNodeIds.push(broader.id)
                }

            })


        }


        function recurseChildren(conceptId, level) {
            var concept = conceptsMap[conceptId];
            if (!concept)
                return;
            var color = palette[level];
            var prefLabelsArray = [];
            var label = "";
            if (concept.prefLabels) {
                for (var key in concept.prefLabels) {
                    concept.prefLabels[key].forEach(function (item) {
                        prefLabelsArray.push({
                            lang: key,
                            value: item
                        })
                    })
                }
                label = skosReader.getNodeLabel(prefLabelsArray, lang)
            }

            if (uniqueNodeIds.indexOf(concept.id) < 0) {
                uniqueNodeIds.push(concept.id)
                var visjNode = {
                    id: concept.id,
                    label: label,
                    color: color,
                    shape: "dot",
                    data: concept,
                }
                nodes.push(visjNode)
            }
            if (concept.children) {
                concept.children.forEach(function (childId, index) {
                    var key = concept.id + "-" + childId;
                    if (uniqueEdgesIds.indexOf(key) < 0) {
                        uniqueEdgesIds.push(key)
                        edges.push({
                            from: concept.id,
                            to: childId,
                            type: "parent"
                        })
                        if (level <= maxDepth) {

                                recurseChildren(childId, level + 1)
                        }
                    }

                })
            }

        }

        for (var id in conceptsMap) {
            recurseBroaders(id)
        }

        topNodeIds.forEach(function (id) {
            recurseChildren(id, 0)
        })
        return {nodes: nodes, edges: edges};
    }

    ,
    mapToFlat: function (conceptsMap, options) {

        function recurseConceptStr(concept, str, level) {
            if (concept.id == "TE.16026")
                var x = 3
            if (concept.broaders && concept.broaders.length > 0) {
                if (str !== "")
                    str += "|";// concept separator
                concept.broaders.forEach(function (broader, index) {
                    if (str.indexOf(broader) > -1 || broader == concept.id)
                        return str;
                    if (concept.broaders.length > 1)
                        str += "*";// branch separator
                    str += broader;
                    var broaderConcept = conceptsMap[broader]
                    if (broaderConcept) {
                        try {
                            return recurseConceptStr(broaderConcept, str, level++)
                        } catch (e) {
                            console.log(str)
                        }
                    }
                })

            }
            // console.log(str);
            return str;

        }


        // set longuest paths  even if multiple broaders

        var pathStrs = []
        for (var id in conceptsMap) {
            var concept = conceptsMap[id];

            var str = concept.id;

            str = recurseConceptStr(concept, str, 0);

            if (str.indexOf("*") > -1)
                var x = 3

            var found = false;


            //take the longuest path only
            pathStrs.forEach(function (path, index) {

                if (str.indexOf(path) > -1) {
                    pathStrs[index] = str
                    found = true;
                }
            })
            if (!found)
                pathStrs.push(str)


        }


        var leaves = []
        pathStrs.forEach(function (leafId) {
            var ids = leafId.split(/[|*]/)
            var path = "";
            var synonyms = ""
            ids.forEach(function (id, index) {

                if (conceptsMap[id]) {

                    for (var lang in conceptsMap[id].prefLabels) {
                        if (conceptsMap[id].prefLabels && conceptsMap[id].prefLabels[lang] && conceptsMap[id].prefLabels[lang].forEach) {
                            conceptsMap[id].prefLabels[lang].forEach(function (value) {
                                if (path != "")
                                    path += "|"
                                path += value;
                            })

                        }
                    }

                    for (var lang in conceptsMap[id].altLabels) {
                        if (conceptsMap[id].altLabels && conceptsMap[id].altLabels[lang] && conceptsMap[id].altLabels[lang].forEach) {
                            conceptsMap[id].altLabels[lang].forEach(function (value) {
                                if (synonyms != "")
                                    synonyms += "|"
                                synonyms += value;
                            })

                        }
                    }
                } else
                    path += "?"
            })
            leaves.push({thesaurus: options.thesaurusName, path: path, pathIds: ids, synonyms: synonyms})
        })

        return leaves;
    }

}
/*
skosReader.rdfToAnnotator("D:\\NLP\\cgi\\eventprocess.rdf", {outputLangage: "en", extractedLangages: "en"}, function (err, result) {
    if (err)
        return console.log(err);
    fs.writeFileSync("D:\\NLP\\cgi\\eventprocess.json", JSON.stringify(result, null, 2))
})
*/


module.exports = skosReader

if (false) {

    var sourcePath = "D:\\NLP\\thesaurus_CTG_Product.rdf";
    var sourcePath = "D:\\NLP\\termScience\\termScience_Chemistry.rdf";

    skosReader.rdfToFlat(sourcePath, null, function (err, result) {
        //   fs.writeFileSync(sourcePath.replace(".rdf", "_flat.json"), JSON.stringify(result, null, 2))

    })


}

var str = "TE.13668|*TE.10210*TE.15439|TE.10210|*TE.15439*TE.10210*TE.15439"

var array = str.split("*")
var strs = []
array.forEach(function (item, index) {
    var str2 = "";
    if (index > 0)
        str2 = strs[index - 1]

    strs.push(str2 + "|" + item)

})
var x = strs
