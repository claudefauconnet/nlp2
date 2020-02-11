var fs = require('fs');
var sax = require("sax");
const csv = require('csv-parser');
const async = require('async');
var skosReader = require('../backoffice/skosReader.')
var locskos = {


    //http://id.loc.gov/authorities/subjects/sh85052724.html

    //Research--Equipment and supplies

    //http://id.loc.gov/authorities/subjects/sh00006584.html machinery

    //http://id.loc.gov/authorities/subjects/sh85019928.html capillarity


    //science   http://id.loc.gov/authorities/subjects/sh00007934.html


    locArray: null,

    parseRdfXml: function (sourcePath, options, callback) {
        var saxStream = sax.createStream(true)

        if (!options) {
            options = {extractedLangages: "en"};
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
                    if (text == "Donges")
                        var x = 3

                    currentConcept[array[0]][array[1]] = text;
                } else if (currentTagName.indexOf("altLabels_") == 0) {
                    var array = currentTagName.split("_")
                    if (!currentConcept[array[0]][array[1]])
                        currentConcept[array[0]][array[1]] = [];
                    currentConcept[array[0]][array[1]].push(text)


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
                    if (Object.keys(currentConcept.prefLabels).length > 0)
                        conceptsMap[currentConcept.id] = currentConcept;

            }
            if (countConceptsEnd > 500) {
                var x = 3
            }

        })
        saxStream.on("end", function (node) {

            callback(null, conceptsMap)

        })

        if (fs.existsSync(sourcePath)) {
            fs.createReadStream(sourcePath)
                .pipe(saxStream)
        } else {
            callback("No such File " + sourcePath);
        }


    },


    readCsv: function (filePath, lines, separator, callback) {


        var jsonData = [];
        var startId = 100000;
        var strOut = 'concept\tid\tparents\n';
        var lastLine = ""
        var count = 0;
        fs.createReadStream(filePath)


            .on('data', function (data) {
                var str = data.toString();
                //     console.log(data.toString());

                var lines = str.split("\n");
                lines[0] = lastLine + lines[0];
                lastLine = lines[lines.length - 1];


                lines.forEach(function (line, lineIndex) {
                    if (lineIndex < lines.length - 1) {
                        ;


                        count += 1
                        line = line.replace(/http:\/\/id.loc.gov\/authorities\/subjects\//g, "")
                        var json

                        /*   if(line.indexOf("sh85146057")>-1 )
                               console.log(line)
                               if(line.indexOf("sh85146057")>-1){
                              xx=5
                           }*/

                        try {
                            json = JSON.parse(line)
                        } catch (e) {
                            console.log(lineIndex + "  " + line)
                            return;
                        }
                        //   console.log(JSON.stringify(json, null, 2))
                        var distinctConcepts = [];
                        json["@graph"].forEach(function (node) {
                            if (node["@type"] == "skos:Concept") {


                                var id = node["@id"];
                                if (!id)
                                    return;
                                if (id == "sh85063336")
                                    var x = 3;

                                var parents = node["skos:broader"];
                                var parentIds = "";

                                if (parents) {

                                    if (!Array.isArray(parents))
                                        parents = [parents];

                                    parents.forEach(function (parent, index) {
                                        if (index > 0)
                                            parentIds += ","
                                        parentIds += (parent["@id"])
                                    })
                                }
                                parents = parentIds;


                                var children = node["skos:narrower"];
                                if (!children)
                                    ;//return
                                if (distinctConcepts.indexOf(id) < 0) {
                                    distinctConcepts.push(id);


                                    /*        delete node["skos:changeNote"];
                                            delete node["@type"];
                                            delete node["skos:editorial"];
                                            delete node["skos:altLabel"];
                                            delete node["skos:related"];*/

                                    if (node["skos:prefLabel"]) {
                                        // jsonData.push(node["skos:prefLabel"]["@value"]+"\t"+node["@id"]+"\n")
                                        strOut += node["skos:prefLabel"]["@value"] + "\t" + node["@id"] + "\t" + parentIds + "\n"
                                    }
                                }
                            }

                        })

                    }

                })


                if (jsonData.length > 1000000)
                    var x = 3;
            })
            .on('end', function () {

                var x = count;
                fs.writeFileSync("D:\\NLP\\LOCtopNodesAll.txt", strOut)

            })


    },
    compareWithThesaurus: function (th1, th2, callback) {
        var lines = 1000000;
        var separator = "\t"

        var conceptsIdsMap = {};
        var conceptsMap = {};
        var commonConcepts = [];

        var orphanParentConcepts = [];

        function csvToMap(filePath, callback) {


            var jsonData = [];
            var startId = 100000;
            var strOut = '';
            var lastLine = ""
            var count = 0;
            var conceptsMap = {};

            fs.createReadStream(filePath)
                .pipe(csv(
                    {
                        separator: separator,
                    })


                    .on('data', function (data) {

                        var id = data.id;
                        if (id == "sh85146057")
                            var x = 3
                        var conceptName = data.concept.toLowerCase()
                        if (!conceptsMap[conceptName]) {
                            conceptsMap[conceptName] = data;
                            conceptsIdsMap[id] = data;
                        } else {
                            if (data.parents) {
                                if (!conceptsMap[conceptName].parents) {
                                    conceptsMap[conceptName].parents = data.parents
                                    //  conceptsIdsMap[id].parents = data.parents
                                } else {
                                    conceptsMap[conceptName].parents += "," + data.parents

                                    // conceptsIdsMap[id].parents = data.parents
                                }
                            }
                        }


                    }).on('end', function () {
                        callback(null, conceptsMap)
                    })
                );


        }

        csvToMap(th1, function (err, conceptsMap) {
            var xx = conceptsMap;

            // set parentName with parentIds
            /*   for (var key in conceptsMap) {
                   conceptsMap[key].parentConcepts = [];
                   if (conceptsMap[key].parents) {
                       var parentIds = conceptsMap[key].parents.split(",")

                       parentIds.forEach(function (parent) {
                           var parentConcept = conceptsIdsMap[parent];
                           if (parentConcept)
                               conceptsMap[key].parentConcepts.push(parentConcept.concept)
                           else {
                               orphanParentConcepts.push(key);
                           }

                       })
                   }


               }*/


            skosReader.parseRdfXml(th2, null, function (err, skosMap) {


                for (var key in skosMap) {
                    var concept = skosMap[key];
                    if (concept.prefLabels && concept.prefLabels["en"]) {
                        var name = concept.prefLabels["en"].toLowerCase();
                        var altLabels = [name];

                        if (concept.altLabels) {
                            for (var key in concept.altLabels) {
                                concept.altLabels[key].forEach(function (altLabel) {
                                    altLabels.push(altLabel.toLowerCase());
                                })
                            }
                        }

                        altLabels.forEach(function (altLabel) {
                            var locConcept = conceptsMap[altLabel];
                            if (locConcept)
                                commonConcepts.push({locConceptId: locConcept.id, ctgConcept: concept})

                        })


                    }
                }


                var locCtgSkos = [];
                var uniqueConcepts = [];

                function recurseParents(conceptId) {
                    if (uniqueConcepts.indexOf(conceptId) < 0) {
                        uniqueConcepts.push(conceptId)
                        var concept = conceptsIdsMap[conceptId];
                        if (!concept)
                            return console.log(conceptId)
                        var parentIds = [];
                        if (concept.parents) {
                            parentIds = concept.parents.split(",")
                            if (parentIds.length > 0) {
                                // parentIds=[parentIds[0]]
                                // concept.id
                            }

                        }

                        locCtgSkos.push({
                            id: concept.id,
                            prefLabels: [{lang: "en", value: concept.concept}],
                            altLabels: [],
                            broaders: parentIds,
                            relateds: [],
                        })

                        parentIds.forEach(function (parentId, index) {

                            recurseParents(parentId)
                        })
                    }

                }


                commonConcepts.forEach(function (item) {
                    if (item.locConceptId == "sh85003955")
                        var x = 4
                    recurseParents(item.locConceptId)


                })

                callback(null, {locConceptsMap: conceptsMap, locConceptsIdsMap: conceptsIdsMap, locCtgSkos: locCtgSkos});


            })


        })


    },


    readFastNt: function (filePath) {


    }
    ,
    getCommonConceptsFromLOCindex: function (rfdPath) {
        var thesaurusConcepts = [];
        var locArray = [];
        var commonConcepts = [];
        async.series([

            function (callbackSeries) {
                skosReader.rdfToEditor(rfdPath, null, function (err, result) {
                    if (err)
                        return console.log(err)

                    result.forEach(function (concept) {
                        if (concept.data.prefLabels) {
                            concept.data.prefLabels.forEach(function (label) {
                                if (label.lang == "en")
                                    thesaurusConcepts.push(label.value)
                            })
                        }

                    })
                    callbackSeries();
                })
            },
            function (callbackSeries) {
                var csvCrawler = require('../backoffice/_csvCrawler.')
                csvCrawler.readCsv({filePath: "D:\\NLP\\LOCtopNodesAll.txt"}, 100000, function (err, result) {
                    locArray = result;
                    callbackSeries();
                })

            },
            function (callbackSeries) {
                locArray.data.forEach(function (locFetch, index) {
                    console.log("" + (index * locFetch.length))
                    locFetch.forEach(function (locItem) {
                        thesaurusConcepts.forEach(function (thesaurusConcept) {
                            if (locItem.concept.toLowerCase() == thesaurusConcept.toLowerCase()) {
                                commonConcepts.push(locItem)
                            }
                        })
                    })

                })
                callbackSeries()
            }

        ], function (err) {

            fs.writeFileSync("D:\\NLP\\LOCcommonCTG.txt", JSON.stringify(commonConcepts, null, 2))
        })

    }
    ,
    getCommonConceptsLOCparents: function (jsonPath, level, callback) {
        var allCommonConcepts = [];
        var uniqueConcepts = []
        var conceptsWithParents = [];
        var locArray = []
        var newParentConcepts = []
        async.series([

            function (callbackSeries) {
                var str = fs.readFileSync(jsonPath);
                allCommonConcepts = JSON.parse("" + str);

                allCommonConcepts.forEach(function (concept) {

                    if (uniqueConcepts.indexOf(concept.id) < 0) {
                        uniqueConcepts.push(concept.id)
                        if (!Array.isArray(concept.parents))
                            concept.parents = concept.parents.split(",")
                        if (!Array.isArray(concept.parents))
                            concept.parents = [concept.parents]
                        conceptsWithParents.push(concept)

                    }
                })
                var x = uniqueConcepts.length;
                callbackSeries();
            },
            function (callbackSeries) {
                var csvCrawler = require('../backoffice/_csvCrawler.')
                csvCrawler.readCsv({filePath: "D:\\NLP\\LOCtopNodesUniques.txt"}, 100000, function (err, result) {
                    if (err)
                        callbackSeries(err);
                    locArray = result;
                    callbackSeries();
                })

            },
            function (callbackSeries) {
                var uniqueConcepts2 = []
                conceptsWithParents.forEach(function (parentConcept, index3) {
                    //  console.log("" + (index3 ))
                    parentConcept.parents.forEach(function (parent) {
                        if (parent == "")
                            return;
                        var found = false;
                        locArray.data.forEach(function (locFetch, index) {

                            locFetch.forEach(function (locItem, index2) {


                                if (locItem.id == parent) {
                                    if (uniqueConcepts2.indexOf(locItem.id) < 0) {
                                        uniqueConcepts2.push(locItem.id)
                                        newParentConcepts.push(locItem)

                                    }
                                    found = true;
                                }
                                // console.log("--" + (index2))

                            })
                        })
                        if (!found)
                            console.log(parent + " not found")
                    })

                })
                callbackSeries()
            }
        ], function (err) {
            //  allCommonConcepts=allCommonConcepts.concat(newParentConcepts)
            console.log(level + " : " + newParentConcepts.length)
            fs.writeFileSync("D:\\NLP\\LOCcommonCTG_" + level + ".txt", JSON.stringify(newParentConcepts, null, 2))
            callback();
        })


    },


    getLOCchildren: function (conceptId, maxLevels, callback) {
        var childConcepts = [];
        var skosArray = [];
        async.series([

            function (callbackSeries) {
                if (locskos.locArray)
                   return callbackSeries()

                var csvCrawler = require('../backoffice/_csvCrawler.')
                csvCrawler.readCsv({filePath: "D:\\NLP\\LOCtopNodesUniques.txt"}, 100000, function (err, result) {
                    if (err)
                        callbackSeries(err);
                    locskos.locArray = result;
                    callbackSeries();
                })

            },
            function (callbackSeries) {

                function recurseChildren(conceptId, level) {
                    locskos.locArray.data.forEach(function (fetch) {
                        fetch.forEach(function (concept) {
                            if (concept.parents.indexOf(conceptId) > -1) {
                                concept.parents = conceptId;
                                childConcepts.push(concept)
                                if (level <= maxLevels) {
                                    if (level == maxLevels)
                                        var x = 3
                                    recurseChildren(concept.id, level + 1)
                                }
                            }
                        })
                    })
                }

                recurseChildren(conceptId, maxLevels)
                console.log(maxLevels + " : " + childConcepts.length)
                skosArray = locskos.locArrayToSkos(childConcepts);
                callbackSeries();
            }], function (err) {

            return callback(err, skosArray);
        })
    },

    buildTreeFromTopConcepts: function (callback) {
        var topConcepts = [{
            "concept": "Science",
            id: "sh00007934"
        }]
        var topConcepts = [{
            "concept": "Physics",
            id: "sh85101653"
        }, {
            "concept": "Chemistry",
            id: "sh85022986"
        },
            {
                "concept": "Engineering",
                id: "sh85043176"
            },
            {
                "concept": "Geology",
                id: "sh85054037"
            },
            {
                "concept": "GeoPhysics",
                id: "sh85054185"
            },
            {
                "concept": "GeoChemistry",
                id: "sh85053960"
            },

        ]

        var maxLevels = 2
        var locArray = [];
        var childConcepts = [];
            async.eachSeries(topConcepts,function(concept,callbackEach){
            childConcepts = [];
            childConcepts.push(concept)
            locskos.getLOCchildren(concept.id, maxLevels, function (err, result) {
                if (err)
                    return console.log(err);
                skosArray = result;
                skosReader.skosEditorToRdf("D:\\NLP\\LOCcommonCTG_" + concept.concept + "_" + maxLevels + ".rdf", skosArray)
                callbackEach();

            })
        })
    }
    ,
    locArrayToSkos: function (locArray) {

        var skosArray = [];
        locArray.forEach(function (concept) {
            var broaders = [];
            if (Array.isArray(concept.parents)) {
                concept.parents.forEach(function (parent) {
                    broaders.push(parent)
                })

            } else if (concept.parents != "" && concept.parents) {
                broaders = concept.parents.split(",")
            } else {
                ;
            }
            var skosObj = {

                id: concept.id,
                prefLabels: [{lang: "en", value: concept.concept}],
                altLabels: [],
                broaders: broaders,
                relateds: [],


            }
            skosArray.push(skosObj)


        })

        return skosArray
    }
}


module.exports = locskos

// set LOCtopNodesAll uniques withParents
if (false) {
    var csvCrawler = require('../backoffice/_csvCrawler.')
    csvCrawler.readCsv({filePath: "D:\\NLP\\LOCtopNodesAll.txt"}, 100000, function (err, result) {
        var locArray = result.data;

        var locMap = {}
        locArray.forEach(function (locFetch) {
            locFetch.forEach(function (item) {

                if (!locMap[item.id])
                    locMap[item.id] = item;
                else if (item.parents.length > locMap[item.id].parents.length)
                    locMap[item.id].parents = item.parents;
            })
        })
        var loc2 = "concept\tid\tparents\n"
        for (var key in locMap) {
            var concept = locMap[key];
            loc2 += concept.concept + "\t" + concept.id + "\t" + concept.parents + "\n"
        }

        fs.writeFileSync("D:\\NLP\\LOCtopNodesUniques.txt", loc2)

    })


}


// extract commonConcepts
if (false) {
    locskos.getCommonConceptsFromLOCindex("D:\\NLP\\thesaurusCTG-02-20.rdf")
}
// extract parents
if (false) {
    var array = []
    for (var i = 1; i < 20; i++) {
        array.push(i)
    }
    async.eachSeries(array, function (level, callbackEach) {
        var level2 = level + 1
        locskos.getCommonConceptsLOCparents("D:\\NLP\\LOCcommonCTG_" + level + ".txt", level2, function (err, result) {
            callbackEach();
        })

    })


}
//concat all levels
if (false) {
    var allConcepts = []
    var uniqueConcepts = [];
    for (var i = 1; i < 20; i++) {
        var str = "" + fs.readFileSync("D:\\NLP\\LOCcommonCTG_" + i + ".txt")
        var json = JSON.parse(str);
        json.forEach(function (concept, index) {
            var p;
            if ((p = uniqueConcepts.indexOf(concept.id)) < 0) {
                uniqueConcepts.push(concept.id)
                allConcepts.push(concept)
            } else {
                if (concept.parents.length > allConcepts[p].parents.length)
                    allConcepts[p].parents = concept.parents.length;
            }
        })

    }
    fs.writeFileSync("D:\\NLP\\LOCcommonCTG_ALL.json", JSON.stringify(allConcepts, null, 2))
}

//build skos

if (false) {

    var str = "" + fs.readFileSync("D:\\NLP\\LOCcommonCTG_ALL.json")
    var json = JSON.parse(str);
    var skosArray = locskos.locArrayToSkos(json);
    skosReader.skosEditorToRdf("D:\\NLP\\LOCcommonCTG.rdf", skosArray, {})

}
if (true) {

    locskos.buildTreeFromTopConcepts(function (err, result) {
    })

}

if (false) {
    locskos.readCsv("D:\\NLP\\lcsh.skos.ndjson");
    //  locskos.readCsv("D:\\NLP\\lcsh.madsrdf.ndjson");

}
if (false) {

    var thesaurus = "thesaurus_CTG_Product"
    locskos.compareWithThesaurus("D:\\NLP\\LOCtopNodesAll.txt", "D:\\NLP\\" + thesaurus + ".rdf", function (err, result) {
        if (err)
            return console.log(err);

        if (true) {
            skosReader.skosEditorToRdf("D:\\NLP\\commonConceptsLocCtg_" + thesaurus + ".rdf", result.locCtgSkos, {}, function (err, result) {
                var xxx = 3;
            })
            return;
            fs.writeFileSync("D:\\NLP\\commonConceptsLocCtg.json", JSON.stringify(commonConcepts, null, 2))
        }
        if (false) {
            var topLocCtgConcepts = []
            var locConceptsIdsMap = result.locConceptsIdsMap;
            result.locCtgSkos.forEach(function (item) {
                if (item.broaders.length == 0)
                    topLocCtgConcepts.push(item.id);
            })

            var tree = {}

            function recurse(node, concept) {

                for (var id in locConceptsIdsMap) {
                    var child = locConceptsIdsMap[id];

                    if (child.parent[concept.id]) {
                        if (false) ;
                    }

                }

            }

            topLocCtgConcepts.forEach(function (topConcept) {
                recurse(topConcept)
            })

        }


    })
}

