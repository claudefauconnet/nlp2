var fs = require('fs');
const async = require('async');
const request = require('request')
const sax = require("sax");
var DOMParser = require('xmldom').DOMParser;

var crawler_termSciences = {


    xmlToSkosConcept: function (xmlStr) {
        var xml = new DOMParser().parseFromString(xmlStr, 'text/xml');
        var doc = xml.documentElement;
        var concepts = [];
        var obj = {
            id: "",
            prefLabels: [],
            altLabels: [],
            definitions: [],
            broaders: [],
            relateds: [],
            narrowers: []

        }

        var features = doc.getElementsByTagName("feat");

        for (var i = 0; i < features.length; i++) {
            var feature = features.item(i);
            var type = feature.getAttribute("type");

            if (!feature.childNodes || feature.childNodes.length == 0)
                continue;
            var value = feature.childNodes[0].nodeValue;
            if (!value)
                continue;

            if (type == "conceptIdentifier")
                obj.id = value;

            if (type == "definition")
                obj.definitions.push(value);

            if (type == "broaderConceptGeneric") {
                var target = feature.getAttribute("target")
                //  obj.broaders.push({id: target.substring(1), name: value})
                obj.broaders.push(target.substring(1))

            }
            if (type == "specificConcept") {
                var target = feature.getAttribute("target")
                // obj.narrowers.push({id: target.substring(1), name: value})
                obj.narrowers.push(target.substring(1))

            }


        }


        var structs = doc.getElementsByTagName("struct");
        for (var i = 0; i < structs.length; i++) {
            var struct = structs.item(i);
            var type = struct.getAttribute("type");

            if (type == "languageSection") {
                var lang = ""
                var childrenFeatures = struct.getElementsByTagName("feat");
                for (var j = 0; j < childrenFeatures.length; j++) {

                    var childFeature = childrenFeatures.item(j);
                    if (childFeature.childNodes && childFeature.childNodes.length > 0) {
                        var childValue = childFeature.childNodes[0].nodeValue;
                        var childType = childFeature.getAttribute("type");
                        if (childType == "languageIdentifier") {
                            lang = childValue
                        }
                        if (childType == "term") {
                            if (obj.prefLabels.length == 0 || obj.prefLabels[0].lang != "en")
                                obj.prefLabels.push({lang: lang, value: childValue})
                            else
                                obj.altLabels.push({lang: lang, value: childValue})
                        }
                    }
                }

            }
        }


        return obj
    }


    , queryTermScience: function (conceptId, callback) {

        var url = "http://www.termsciences.fr/-/Fenetre/Fiche/XML/?idt=" + conceptId + "&lng=en"

        var options = {
            method: 'GET',
            url: url,
            headers: {
                'Content-Type': 'text/xml; charset=utf-8',
            }

        };


        function decodeXml(string) {
            var escaped_one_to_xml_special_map = {
                '&amp;': '&',
                '&quot;': '"',
                '&lt;': '<',
                '&gt;': '>'
            };
            return string.replace(/(&quot;|&lt;|&gt;|&amp;)/g,
                function (str, item) {
                    return escaped_one_to_xml_special_map[item];
                });
        }

        request(options, function (error, response, body) {
            if (error)
                return callback(error);
            if (body.error)
                return callback(body.error);


            var p = body.indexOf("<textarea")
            p = body.indexOf(">", p)
            var q = body.indexOf("</textarea")
            var xml = body.substring(p + 1, q)
            xml = decodeXml(xml);
            xml = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n" +
                "<termSienceRoot>\n" +
                xml +
                "</termSienceRoot>\n";
            callback(null, xml)

        })


    },
    buildHierarchy: function () {

        function getPrefLabelEN(prefLabels) {
            var prefLabelStr = null;
            if (prefLabels == null)
                return "?"
            if (!Array.isArray(prefLabels))
                prefLabels = [prefLabels]
            if (prefLabels.length == 0)
                return "?"
            prefLabels.forEach(function (prefLabel, index) {
                if (prefLabelStr == null && prefLabel.lang == "en")
                    prefLabelStr = prefLabels[index].value
            })
            if (prefLabelStr == null) {

                prefLabelStr = prefLabels[0].value

            }

            return prefLabelStr
        }

        var rootTermId = "TE.192836" //domaines techniques
        var filter = ["Mathematics",
            "Physics",
            "Energy",
            "Civil service",
            "Chemistry",
            "Building industry",
            "Industrial Entreprises",
            "Information",
            "Computer science",
            "Spare-time activities"]

        var domains =
            [


                {
                    "name": "Chemistry",
                    "id": "TE.15428",
                    "children": []
                },

                {
                    "name": "Energy",
                    "id": "TE.29455",
                    "children": []
                },


                {
                    "name": "Spare-time activities",
                    "id": "TE.156452",
                    "children": []
                },
                {
                    "name": "Mathematics",
                    "id": "TE.48512",
                    "children": []
                },

                {
                    "name": "Physics",
                    "id": "TE.60624",
                    "children": []
                },

            ]

        var hierarchy = {name: "domaines techniques", id: rootTermId, children: []}
        /*   crawler_termSciences.queryTermScience(rootTermId, function (err, result) {
             if (err)
                 return console.log(err);
             var rootTermConcept = crawler_termSciences.xmlToSkosConcept(result);

                async.eachSeries( rootTermConcept.narrowers,function(narrower1, callbackEach1){*/

        async.eachSeries(domains, function (narrower1, callbackEach1) {


            crawler_termSciences.queryTermScience(narrower1.id, function (err, result1) {
                if (err)
                    return console.log(err);
                var narrower1Concept = crawler_termSciences.xmlToSkosConcept(result1);
                var obj1 = {name: getPrefLabelEN(narrower1Concept.prefLabels), id: narrower1Concept.id, children: []}
                hierarchy.children.push(obj1);
                console.log(obj1.name);
                if (obj1.name == "Droit")
                    var ww = 1


                //   narrower1Concept.narrowers.forEach(function (narrower2, index2) {
                async.eachSeries(narrower1Concept.narrowers, function (narrower2, callbackEach2) {


                    if (false && filter.indexOf(obj1.name) != 0) {
                        return callbackEach2()
                    } else {
                        crawler_termSciences.queryTermScience(narrower2, function (err, result2) {
                            if (err)
                                return console.log(err);
                            var narrower2Concept = crawler_termSciences.xmlToSkosConcept(result2);
                            var obj2 = {name: getPrefLabelEN(narrower2Concept.prefLabels), id: narrower2Concept.id, children: []}
                            console.log(obj1.name + " : " + obj2.name);
                            obj1.children.push(obj2);

                            //  narrower2Concept.narrowers.forEach(function (narrower3, index3) {
                            async.eachSeries(narrower2Concept.narrowers, function (narrower3, callbackEach3) {

                                crawler_termSciences.queryTermScience(narrower3, function (err, result3) {
                                    if (err)
                                        return console.log(err);
                                    var narrower3Concept = crawler_termSciences.xmlToSkosConcept(result3);
                                    var obj3 = {name: getPrefLabelEN(narrower3Concept.prefLabels), id: narrower3Concept.id, children: []}
                                    obj2.children.push(obj3);

                                    if (narrower3Concept.narrowers.length == 0)
                                        return callbackEach3();
                                    async.eachSeries(narrower3Concept.narrowers, function (narrower4, callbackEach4) {

                                        crawler_termSciences.queryTermScience(narrower4, function (err, result4) {
                                            if (err)
                                                return console.log(err);
                                            var narrower4Concept = crawler_termSciences.xmlToSkosConcept(result4);
                                            var obj4 = {name: getPrefLabelEN(narrower4Concept.prefLabels), id: narrower4Concept.id, children: narrower4Concept.narrowers.length}
                                            obj3.children.push(obj4);
                                            callbackEach4();
                                        })
                                    }, function (err) {

                                        callbackEach3();


                                    })
                                })

                            }, function (err) {
                                callbackEach2();
                            })

                        })
                    }


                }, function (err) {
                    callbackEach1();
                })

            })

        }, function (err) {
            var xx = hierarchy
        })
        //  })


    },


    getTermScienceMap: function (key) {
        // set LOC map
        var keyIndex = 0;
        if (key == "id")
            keyIndex = 1;
        else if (key == "name")
            keyIndex = 0;

        var TS_raw = "" + fs.readFileSync("D:\\NLP\\termScience\\consolidation\\termSciences_raw.txt");
        var termScienceMap = {}
        var lines = TS_raw.split("\n");
        lines.forEach(function (line, index) {
            if (index == 0)
                return;
            var cols = line.split("\t");
            var keyValue=cols[keyIndex];
            if(key=="name") {
                keyValue = keyValue.toLowerCase().trim();
                if (!termScienceMap[keyValue])
                    termScienceMap[keyValue] = [];
                termScienceMap[keyValue].push({id: cols[1], name: cols[0], parents: cols[2]})
            }
            else if (!termScienceMap[keyValue])
                termScienceMap[keyValue]={id: cols[1], name: cols[0], parents: cols[2]}
        })

        return termScienceMap;

    },
    setCommonConcepts_TS_CTG: function () {

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

            var TS_Map = crawler_termSciences.getTermScienceMap("name");

            var ctgCount = 0
            var commonConcepts = [];
            for (var ctgKey in ctgMap) {
                if ( ctgKey == "heat") {
                    ctgCount += 1
                    ctgCount += 1
                    var ctgTokens = ctgKey.split(/[\s-_;.]/g);

                    if (Array.isArray(ctgTokens)) {
                        for (var TS_Key in TS_Map) {


                            var TS_Tokens = TS_Key.split(/[\s-_;.]/g);
                            if (ctgTokens.length == TS_Tokens.length) {
                                if (ctgTokens.length == 1 && TS_Tokens.length == 1) {
                                    if (isSame(ctgKey, TS_Key)) {

                                        commonConcepts.push({ctg: ctgMap[ctgKey], TS_: TS_Map[TS_Key]})

                                    }
                                } else {//composé
                                    if (Array.isArray(TS_Tokens)) {
                                        var nSame = 0;
                                        ctgTokens.forEach(function (ctgToken) {
                                            TS_Tokens.forEach(function (TS_Token) {
                                                if (isSame(ctgToken, TS_Token)) {
                                                    nSame += 1
                                                }
                                            })

                                        })
                                        if (nSame > 1 && (Math.abs(ctgTokens.length - TS_Tokens.length)) < 2)

                                            commonConcepts.push({ctg: ctgMap[ctgKey], TS_: TS_Map[TS_Key]})
                                    }
                                }
                            }

                        }
                    }
                    if (ctgCount % 10 == 0)
                        console.log(ctgCount + " / " + commonConcepts.length)
                }
            }

            var xx = commonConcepts;
            fs.writeFileSync("D:\\NLP\\termScience\\consolidation\\commonConcepts_LTS_CTG.json", JSON.stringify(commonConcepts,null,2))
        })


    },
    writeCommonConcepts_CSV: function () {

        var commonConcepts = JSON.parse("" + fs.readFileSync("D:\\NLP\\termScience\\consolidation\\commonConcepts_LTS_CTG.json"));





        function setIdsValues(locMap) {
            for (var key in locMap) {
                var item = locMap[key]
                item.parentNames = "";
                item.childrenNames = ""
                if (item.parents) {
                    var parentGroupIds = item.parents.split(",");
                    parentGroupIds.forEach(function (parentGroupId) {
                        var groupNames = ""
                        var parentSubgroupIds = parentGroupId.split(";")
                        parentSubgroupIds.forEach(function (parentId) {
                            if (!locMap[parentId])
                                return;
                            if (groupNames != "")
                                groupNames += ","
                            groupNames += locMap[parentId].name;
                        })
                        if (item.parentNames != "")
                            item.parentNames += " | "
                        item.parentNames += groupNames;
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
            var str = "CTG_concept\tCTG_id\tLOC_concept\tLOC_id\tLOC_parents\n";
            commonConcepts.forEach(function (item) {
                item.LOC.forEach(function (locItem_) {
                    var locId = locItem_.id;
                    if (locId == "sh85084167")
                        var vv = 3
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
            fs.writeFileSync("D:\\NLP\\termScience\\consolidation\\commonConcepts_LOC_CTG.csv", str)

        }


        var locMap = crawler_LOC.getLocMap("id");
        //  console.log(JSON.stringify(locMap["sh85136954"]))
        locMap = setAncestors(locMap);
        //  console.log(JSON.stringify(locMap["sh85136954"]))
        locMap = setIdsValues(locMap);
        //console.log(JSON.stringify(locMap["sh85136954"]))
        printLocMap(locMap)


        return;


    }
    ,
    getConceptsCsv: function () {
        var tree = JSON.parse("" + fs.readFileSync("D:\\NLP\\termScience\\consolidation\\termSciencesHierarchy_levels4.txt"))


        var concepts = [];

        function recurseChildren(node, parentIds) {
            parentIds += "," + node.id;
            var obj = {name: node.name, id: node.id, parents: parentIds}
            concepts.push(obj)
            if (node.children && Array.isArray(node.children)) {
                node.children.forEach(function (child) {
                    recurseChildren(child, parentIds)
                })
            }


        }

        recurseChildren(tree, "")
        var x = concepts;
        var strOut = 'name\tid\tparents\n';
        concepts.forEach(function (concept) {
            strOut += concept.name + "\t" + concept.id + "\t" + concept.parents + "\n"
        });

        fs.writeFileSync("D:\\NLP\\termScience\\consolidation\\termSciences_raw.txt", strOut)


    }


}
module.exports = crawler_termSciences;

if (false) {
    crawler_termSciences.buildHierarchy()
}
if (true) {
    crawler_termSciences.setCommonConcepts_TS_CTG()
}
if (false) {
    crawler_termSciences.writeCommonConcepts_CSV();
}
