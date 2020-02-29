var fs = require('fs');
const async = require('async');


var crawler_LOC = {


    readCsv: function (filePath, lines, separator, callback) {

        var jsonData = [];
        var startId = 100000;

        var lastLine = ""
        var count = 0;
        var countConcepts = 0
        var distinctConcepts = {};
        fs.createReadStream(filePath).on('data', function (data) {
            var str = data.toString();
            var lines = str.split("\n");
            lines[0] = lastLine + lines[0];
            lastLine = lines[lines.length - 1];


            lines.forEach(function (line, lineIndex) {
                if (lineIndex < lines.length - 1) {
                    ;
                    count += 1
                    line = line.replace(/http:\/\/id.loc.gov\/authorities\/subjects\//g, "")
                    var json

                    try {
                        json = JSON.parse(line)
                    } catch (e) {
                        console.log(lineIndex + "  " + line)
                        return;
                    }


                    json["@graph"].forEach(function (node) {
                        if (node["@type"] == "skos:Concept") {


                            var id = node["@id"];
                            if (!id)
                                return;


                            var parents = node["skos:broader"];
                            var parentIds = "";

                            if (parents) {

                                if (!Array.isArray(parents))
                                    parents = [parents];

                                parents.forEach(function (parent, index) {
                                    if (index > 0)
                                        parentIds += ","
                                    parentIds += parent["@id"]
                                })
                            }


                            var children = node["skos:narrower"];
                            var childrenIds = "";

                            if (children) {

                                if (children.length > 20)
                                    var x = 3
                                if (!Array.isArray(children))
                                    children = [children];


                                children.forEach(function (child, index) {
                                    if (index > 0)
                                        childrenIds += ","
                                    childrenIds += child["@id"]
                                })

                            }

                            if (node["skos:definition"]) {
                                ;
                            }
                            if (node["skos:related"]) {
                                ;
                            }
                            if (node["skos:note"]) {
                                ;
                            }

                            if (node["skos:prefLabel"]) {

                                var concept = {
                                    id: id,
                                    name: node["skos:prefLabel"]["@value"],
                                    parents: parentIds,
                                    children: childrenIds
                                }
                                if (!distinctConcepts[id]) {
                                    distinctConcepts[id] = concept;
                                    countConcepts += 1
                                    if (countConcepts % 1000 == 0)
                                        console.log(countConcepts)


                                } else {
                                    if (parentIds.length > distinctConcepts[id].parents.length) {
                                        distinctConcepts[id].parents = parentIds;
                                    }
                                    if (childrenIds.length > distinctConcepts[id].children.length) {
                                        distinctConcepts[id].children = childrenIds;
                                    }
                                }


                                //node["skos:prefLabel"]["@value"] + "\t" + node["@id"] + "\t" + parentIds + "\t" + childrenIds + "\n"

                            }
                        }

                    })

                }

            })


            if (jsonData.length > 1000000)
                var x = 3;
        })
            .on('end', function () {


                var strOut = 'name\tid\tparents\tchildren\n';
                for (var key in distinctConcepts) {
                    var concept = distinctConcepts[key];
                    strOut += concept.name + "\t" + concept.id + "\t" + concept.parents + "\t" + concept.children + "\n"

                }


                var x = count;
                fs.writeFileSync("D:\\NLP\\LOC\\LOC_raw.txt", strOut)

            })


    },

    writeCommonConcepts_CSV: function () {

        var commonConcepts = JSON.parse("" + fs.readFileSync("D:\\NLP\\LOC\\commonConcepts_LOC_CTG.json"));


        function getLocMap() {
            // set LOC map
            var LOC_raw = "" + fs.readFileSync("D:\\NLP\\LOC\\LOC_raw.txt");
            var locMap = {}
            var lines = LOC_raw.split("\n");
            lines.forEach(function (line) {
                var cols = line.split("\t");
                if (!locMap[cols[1]])
                    locMap[cols[1]] = {id: cols[1], name: cols[0], parents: cols[2], children: cols[3]}

            })
            return locMap;
        }


        function setAncestors(locMap) {
            var newItems = [];
            var newItemIds = [];
            var newParentsMap = {};

            function recurseParents(item) {
                if (!item.parents)
                    return;//console.log(item.name);
                var itemParents = item.parents.split(",");

                //on prend chaque parent
                itemParents.forEach(function (parentId) {
                    var itemParent = locMap[parentId]
                    // on regarde si le parent a des parents : grands parents
                    if (itemParent && itemParent.parents) {// si il y a des grands parents
                        var grandParentIds = itemParent.parents.split(",")
                        grandParentIds.forEach(function (grandParentId) {
                            var grandParent = locMap[grandParentId]
                            if (item.parents.indexOf(grandParentId) < 0) {
                                if (!newParentsMap[item.id])
                                    newParentsMap[item.id] = item.parents;
                                if (newParentsMap[item.id].indexOf(grandParentId) < 0)
                                    newParentsMap[item.id] = newParentsMap[item.id].replace(parentId, parentId + "," + grandParentId);
                                recurseParents(grandParent)
                            }
                        })
                    }
                })


            }


            commonConcepts.forEach(function (item) {
                recurseParents(item.LOC)
            })
            var countNewParents = Object.keys(newParentsMap).length
            for (var key in locMap) {
                if (newParentsMap[key]) {
                    locMap[key].parents = newParentsMap[key]
                }

            }
            return locMap;
        }


        function setIdsValues(locMap) {
            for (var key in locMap) {
                var item = locMap[key]
                item.parentNames = "";
                item.childrenNames = ""
                if (item.parents) {
                    var parentIds = item.parents.split(",");
                    parentIds.forEach(function (parentId) {
                        if (!locMap[parentId])
                            return;
                        if (item.parentNames != "")
                            item.parentNames += ","
                        item.parentNames += locMap[parentId].name;
                    })
                }
                if (item.children) {
                    var childrenIds = item.children.split(",");
                    childrenIds.forEach(function (childrenId) {
                        if (!locMap[childrenId])
                            return;
                        if (item.childrenNames != "")
                            item.childrenNames += ","
                        item.childrenNames += locMap[childrenId].name;
                    })
                }
                locMap[key] = item;
            }
            return locMap;
        }

        function printLocMap(locMap) {
            var str = "";
            commonConcepts.forEach(function (item) {
                item.LOC.forEach(function (locItem_) {
                    var locId = locItem_.id;
                    var locItem = locMap[locId];
                    if (!locItem)
                        return;

                    var target = item.CTG
                    var targetId = "";
                    if (target.pathIds && target.pathIds.length > 0)
                        targetId = target.pathIds[0];


                    var str2 = target.prefLabel + "\t" + targetId + "\t" + locItem.name + "\t" + locItem.id + "\t" + locItem.parentNames + "\t" + locItem.childrenNames + "\n"
                    if (str.indexOf(str2) < 0)
                        str += str2

                })


            })
            fs.writeFileSync("D:\\NLP\\LOC\\commonConcepts_LOC_CTG.csv", str)

        }


        var locMap = getLocMap();
        locMap = setAncestors(locMap);
        locMap = setIdsValues(locMap);
        printLocMap(locMap)


        return;


    }

    , setCommonConcepts_LOC_CTG: function () {

        function getLocMap() {
            // set LOC map
            var LOC_raw = "" + fs.readFileSync("D:\\NLP\\LOC\\LOC_raw.txt");
            var locMap = {}
            var lines = LOC_raw.split("\n");
            lines.forEach(function (line) {
                var cols = line.split("\t");
                if (!locMap[cols[0]])
                    locMap[cols[0].toLowerCase()] = {id: cols[1], name: cols[0], parents: cols[2], children: cols[3]}

            })
            return locMap;

        }

        function isSame(a, b) {
            if (a.length > 3 && b.length > 3 && Math.abs(a.length - b.length) < 2 && isNaN(a) && isNaN(b)) {
                if (a.indexOf(b) > -1 || b.indexOf(a) > -1)
                    return true;
            }
            return false;
        }


        var skosReader = require("../../backoffice/skosReader.")
        skosReader.rdfToFlat("D:\\NLP\\thesaurusCTG-02-20.rdf", {}, function (err, ctgArray) {
            var ctgMap = {};
            ctgArray.forEach(function (concept) {
                ctgMap[concept.prefLabel.toLowerCase()] = concept
            })

            var locMap = getLocMap();
            var ctgCount = 0
            var commonConcepts = [];
            for (var ctgKey in ctgMap) {
                ctgCount += 1
                var ctgTokens = ctgKey.split(/[\s-_;.]/g);
                if (Array.isArray(ctgTokens)) {
                    for (var locKey in locMap) {

                        var locTokens = locKey.split(/[\s-_;.]/g);
                        if (ctgTokens.length == 1 && locTokens.length == 1) {
                            if (isSame(ctgKey, locKey)) {
                                commonConcepts.push({ctg: ctgMap[ctgKey], loc: locMap[locKey]})

                            } else {//composé
                                if (Array.isArray(locTokens)) {
                                    var nSame = 0;
                                    ctgTokens.forEach(function (ctgToken) {
                                        locTokens.forEach(function (locToken) {
                                            if (isSame(ctgToken, locToken)) {
                                                nSame += 1
                                            }
                                        })

                                    })
                                    if (nSame > 2)
                                        commonConcepts.push({ctg: ctgMap[ctgKey], loc: locMap[locKey]})
                                }
                            }
                        }
                    }
                }
                if (ctgCount % 10 == 0)
                    console.log(ctgCount + " / " + commonConcepts.length)

            }

            var xx = commonConcepts;
        })


    }
    , setElasticCommonConcepts_LOC_CTG: function () {
        var request = require('request');
        var skosReader = require("../../backoffice/skosReader.");
        var ndjson = require('ndjson')
        var ctgFecthArray = [];
        var tempArray = [];
        skosReader.rdfToFlat("D:\\NLP\\thesaurusCTG-02-20.rdf", {}, function (err, ctgArray) {
            ctgArray.forEach(function (item) {
                tempArray.push(item);
                if (tempArray.length > 500) {
                    ctgFecthArray.push(tempArray);
                    tempArray = [];
                }
            })
            ctgFecthArray.push(tempArray);

            var commonConcepts = [];
            async.eachSeries(ctgFecthArray, function (ctgArray, callbackEach) {

                    var ndjsonStr = ""
                    var serialize = ndjson.serialize();
                    serialize.on('data', function (line) {
                        ndjsonStr += line; // line is a line of stringified JSON with a newline delimiter at the end
                    })
                    ctgArray.forEach(function (item, index) {
                        var label = item.prefLabel;
                        var elasticQuery = {
                            "query": {
                                "bool": {
                                    "must": [
                                        {
                                            "query_string": {
                                                "query": "\\\"" + label + "\\\"",
                                                "default_operator": "AND",
                                                "default_field": "name",
                                            }
                                        }
                                    ]
                                }
                            },
                            "from": 0,
                            "size": 25
                        }
                        serialize.write({index: "libraryofcongress"})
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
                            return callbackEach(error);
                        var json = JSON.parse(response.body);
                        if (json.error) {
                            return callbackEach(json.error);
                        }
                        var responses = json.responses;

                        if (!responses || !responses.forEach)
                            var x = 3

                        responses.forEach(function (response, responseIndex) {
                            if (response.error) {
                                commonConcepts.push({CTG: ctgArray[responseIndex], LOC: ["error"]})
                                return;//  return callbackSeries(response.error.root_cause)
                            }
                            var ctgNameArray = ctgArray[responseIndex].prefLabel.split(" ")
                            var locArray = []
                            response.hits.hits.forEach(function (hit) {
                                if (ctgNameArray.length > 1)
                                    locArray.push(hit._source)
                                else {

                                    var locName = hit._source.name;
                                    var locArrayName = locName.split(/[\s\-\)\(]/)
                                    if (locArrayName.length == 1)
                                        locArray.push(hit._source)
                                }
                            })
                            if (locArray.length > 0)
                                commonConcepts.push({CTG: ctgArray[responseIndex], LOC: locArray})


                        });
                        console.log(commonConcepts.length)
                        callbackEach();

                    })
                },
                function (err) {
                    if (err)
                        return console.log(err)
                    fs.writeFileSync("D:\\NLP\\LOC\\commonConcepts_LOC_CTG.json", JSON.stringify(commonConcepts, null, 2));
                }
            )
        })
    }


}


module.exports = crawler_LOC

if (false) {
    crawler_LOC.readCsv("D:\\NLP\\LOC\\lcsh.skos.ndjson");
}
if (false) {
    crawler_LOC.setElasticCommonConcepts_LOC_CTG();
}
if (true) {
    crawler_LOC.writeCommonConcepts_CSV();
}


