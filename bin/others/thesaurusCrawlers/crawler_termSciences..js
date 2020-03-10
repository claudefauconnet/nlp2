var fs = require('fs');
const async = require('async');
const request = require('request')
const sax = require("sax");
var DOMParser = require('xmldom').DOMParser;
var skosReader = require("../../backoffice/skosReader.")

var skosToElastic = require("../skosToElastic.")
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
    },
    queryTermScience: function (conceptId, callback) {


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
    buildHierarchyBroaders: function () {


        var children = JSON.parse("" + fs.readFileSync("D:\\NLP\\termScience\\consolidation\\temp2\\narrowers.json"))


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

        var hierarchy = [];
        async.eachSeries(children, function (child, callbackEach1) {

            /*  var hierarchy = {name: "deepConcepts3", id: rootTermId, children: []}
              async.eachSeries(deepConcepts3, function (narrower1, callbackEach1) {*/


            crawler_termSciences.queryTermScience(child, function (err, result1) {
                if (err)
                    return console.log(err);
                var broader1Concept = crawler_termSciences.xmlToSkosConcept(result1);
                //  var obj1 = {name: getPrefLabelEN(broader1Concept.prefLabels), id: broader1Concept.id, broaders: []}
                var parentObj1 = {level: 1, id: broader1Concept.id, name: getPrefLabelEN(broader1Concept.prefLabels), broaders: []}
                hierarchy.push(parentObj1)
                if (hierarchy.length % 100 == 0)
                    console.log(hierarchy.length)

                //   narrower1Concept.narrowers.forEach(function (narrower2, index2) {
                async.eachSeries(broader1Concept.broaders, function (broaders2, callbackEach2) {

                    crawler_termSciences.queryTermScience(broaders2, function (err, result2) {
                        if (err)
                            return console.log(err);
                        var broader2Concept = crawler_termSciences.xmlToSkosConcept(result2);
                        var parentObj2 = {level: 2, id: broader2Concept.id, name: getPrefLabelEN(broader2Concept.prefLabels), broaders: []}
                        parentObj1.broaders.push(parentObj2)


                        async.eachSeries(broader2Concept.broaders, function (broaders3, callbackEach3) {

                            crawler_termSciences.queryTermScience(broaders3, function (err, result3) {
                                if (err)
                                    return console.log(err);
                                var broader3Concept = crawler_termSciences.xmlToSkosConcept(result3);
                                var parentObj3 = {level: 3, id: broader3Concept.id, name: getPrefLabelEN(broader3Concept.prefLabels), broaders: []}
                                parentObj2.broaders.push(parentObj3)


                                async.eachSeries(broader3Concept.broaders, function (broaders4, callbackEach4) {

                                    crawler_termSciences.queryTermScience(broaders4, function (err, result4) {
                                        if (err)
                                            return console.log(err);
                                        var broader4Concept = crawler_termSciences.xmlToSkosConcept(result4);
                                        var parentObj4 = {level: 4, id: broader4Concept.id, name: getPrefLabelEN(broader4Concept.prefLabels), broaders: []}
                                        parentObj3.broaders.push(parentObj4)


                                        async.eachSeries(broader4Concept.broaders, function (broaders5, callbackEach5) {

                                            crawler_termSciences.queryTermScience(broaders5, function (err, result5) {
                                                if (err)
                                                    return console.log(err);
                                                var broader5Concept = crawler_termSciences.xmlToSkosConcept(result5);
                                                var parentObj5 = {level: 5, id: broader5Concept.id, name: getPrefLabelEN(broader5Concept.prefLabels), broaders: []}
                                                parentObj4.broaders.push(parentObj5)
                                                async.eachSeries(broader5Concept.broaders, function (broaders6, callbackEach6) {

                                                    crawler_termSciences.queryTermScience(broaders6, function (err, result6) {
                                                        if (err)
                                                            return console.log(err);
                                                        var broader6Concept = crawler_termSciences.xmlToSkosConcept(result6);
                                                        var parentObj6 = {level: 6, id: broader6Concept.id, name: getPrefLabelEN(broader6Concept.prefLabels), broaders: []}
                                                        parentObj5.broaders.push(parentObj6)


                                                        async.eachSeries(broader6Concept.broaders, function (broaders7, callbackEach7) {

                                                            crawler_termSciences.queryTermScience(broaders7, function (err, result7) {
                                                                if (err)
                                                                    return console.log(err);
                                                                var broader7Concept = crawler_termSciences.xmlToSkosConcept(result7);

                                                                var parentObj7 = {
                                                                    level: 7,
                                                                    id: broader7Concept.id,
                                                                    name: getPrefLabelEN(broader7Concept.prefLabels),
                                                                    broaders: broader7Concept.broaders.length
                                                                }
                                                                console.log(JSON.stringify(parentObj7))
                                                                parentObj6.broaders.push(parentObj7)
                                                                callbackEach7();
                                                            })


                                                        }, function (err) {
                                                            callbackEach6()
                                                        })
                                                    })

                                                }, function (err) {
                                                    callbackEach5()
                                                })
                                            })

                                        }, function (err) {
                                            callbackEach4()
                                        })

                                    })
                                }, function (err) {
                                    callbackEach3()
                                })

                            })
                        }, function (err) {
                            callbackEach2()
                        })

                    })
                }, function (err) {
                    callbackEach1()
                })

            })

        }, function (err) {
            var xxx = hierarchy;
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
        var filter = [
            //"Mathematics",
            "Physics",
            // "Energy",
            // "Civil service",
            "Chemistry",
            "Building industry",
            "Industrial Entreprises",
            "Information",
            "Computer science",
            "Spare-time activities"]
        var filter = [
            "Analytical chemistry",
            "Inorganic chemistry",
            "Organic chemistry",
            "Physical chemistry",
            "Chemical compound",
            "Chemical element",
            "Chemical reaction",
            "Chemical structure",
        ]

        var domains = ["TE.31503"]
        var filter = [];

        var rootTermId = "TE.31503"
        var domains = JSON.parse("" + fs.readFileSync(("D:\\NLP\\termScience\\consolidation\\temp2\\narrowers.json")))
        /*  var hierarchy = {name: "conceptsTechnology", id: rootTermId, children: []}
           crawler_termSciences.queryTermScience(rootTermId, function (err, result) {
               if (err)
                   return console.log(err);
          var rootTermConcept = crawler_termSciences.xmlToSkosConcept(result);

                  async.eachSeries( rootTermConcept.narrowers,function(narrower1, callbackEach1){*/

        /*    var hierarchy = {name: "domaines techniques", id: rootTermId, children: []}
            async.eachSeries(domains, function (narrower1, callbackEach1) {*/

        var hierarchy = {name: "TSterms", id: rootTermId, children: []}
        async.eachSeries(domains, function (domain, callbackEach1) {
            //  var narrower1 = domain.split(",")[0]
            //  var hierarchy = {name: "conceptsTechnology", id: rootTermId, children: []}
            crawler_termSciences.queryTermScience(domain, function (err, result1) {
                if (err)
                    return console.log(err);
                var narrower1Concept = crawler_termSciences.xmlToSkosConcept(result1);
                var obj1 = narrower1Concept;//{name: getPrefLabelEN(narrower1Concept.prefLabels), id: narrower1Concept.id, children: []}
                obj1.children = [];
                hierarchy.children.push(obj1);

                if (obj1.name == "Radio")
                    var ww = 1


                //   narrower1Concept.narrowers.forEach(function (narrower2, index2) {
                async.eachSeries(narrower1Concept.narrowers, function (narrower2, callbackEach2) {


                    if (false) {
                        return callbackEach2()
                    } else {
                        crawler_termSciences.queryTermScience(narrower2, function (err, result2) {
                            if (err)
                                return console.log(err);
                            var narrower2Concept = crawler_termSciences.xmlToSkosConcept(result2);
                            var obj2 = narrower2Concept;
                            obj2.children = [];
                            console.log(getPrefLabelEN(obj2.prefLabels), obj2.id);
                            // {name: getPrefLabelEN(narrower2Concept.prefLabels), id: narrower2Concept.id, children: []}
                            obj1.children.push(obj2);
                            if (false || (filter.length > 0 && filter.indexOf(getPrefLabelEN(obj2.prefLabels)) < 0))
                                return callbackEach2();
                            //  narrower2Concept.narrowers.forEach(function (narrower3, index3) {
                            async.eachSeries(narrower2Concept.narrowers, function (narrower3, callbackEach3) {

                                crawler_termSciences.queryTermScience(narrower3, function (err, result3) {
                                    if (err)
                                        return console.log(err);
                                    var narrower3Concept = crawler_termSciences.xmlToSkosConcept(result3);

                                    var obj3 = narrower3Concept;//{name: getPrefLabelEN(narrower3Concept.prefLabels), id: narrower3Concept.id, children: []}
                                    obj3.children = [];
                                    obj2.children.push(obj3);
                                    console.log(getPrefLabelEN(obj3.prefLabels), obj3.id);

                                    if (true || narrower3Concept.narrowers.length == 0)
                                        return callbackEach3();
                                    async.eachSeries(narrower3Concept.narrowers, function (narrower4, callbackEach4) {

                                        crawler_termSciences.queryTermScience(narrower4, function (err, result4) {
                                            if (err)
                                                return console.log(err);
                                            var narrower4Concept = crawler_termSciences.xmlToSkosConcept(result4);
                                            var obj4 = narrower4Concept;// {name: getPrefLabelEN(narrower4Concept.prefLabels), id: narrower4Concept.id, children: narrower4Concept.narrowers.length}
                                            obj2.children = [];
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
            var xx =
                hierarchy
        })

        //    })


    },
    getTermScienceMap: function (key) {
        // set TS_ map
        var keyIndex = 0;
        if (key == "id")
            keyIndex = 1;
        else if (key == "name")
            keyIndex = 0;

        var TS_raw = "" + fs.readFileSync("D:\\NLP\\termScience\\consolidation\\termSciences_raw.txt");
        //  var TS_raw = "" + fs.readFileSync("D:\\NLP\\termScience\\consolidation\\termSciences_technology_raw.txt");
        var termScienceMap = {}
        var lines = TS_raw.split("\n");
        lines.forEach(function (line, index) {
            if (index == 0)
                return;
            var cols = line.split("\t");
            var keyValue = cols[keyIndex];
            if (key == "name") {
                keyValue = keyValue.toLowerCase().trim();


                if (!termScienceMap[keyValue])
                    termScienceMap[keyValue] = [];
                termScienceMap[keyValue].push({id: cols[1], name: cols[0], parents: cols[2]})
            } else if (!termScienceMap[keyValue])
                termScienceMap[keyValue] = {id: cols[1], name: cols[0], parents: cols[2]}
        })

        return termScienceMap;

    },
    getAllTermScienceMap: function () {
        var TS_allterms = JSON.parse("" + fs.readFileSync("D:\\NLP\\termScience\\consolidation\\allterms.alphabetic_no_n.csv"));
        var map = {};
        TS_allterms.forEach(function (term) {

            map[term.name.toLowerCase()] = term;
        })
        return map;
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
        skosReader.rdfToFlat("D:\\NLP\\thesaurusCTG-02-20.rdf",
            {
                output: "json", outputLangage: "en",
                extractedLangages: "en,fr,sp",
                thesaurusName: "xx"
            }, function (err, ctgArray) {
                var ctgMap = {};

                ctgArray.forEach(function (concept) {

                    ctgMap[concept.prefLabels.toLowerCase()] = concept
                })

                // var TS_Map = crawler_termSciences.getTermScienceMap("name");
                var TS_Map = crawler_termSciences.getAllTermScienceMap("name");


                function getDistinctTokens(key) {
                    var tokens = key.split(/[\s-_;.]/g);
                    var distinctTokens = [];
                    tokens.forEach(function (token) {
                        if (distinctTokens.indexOf(token) < 0)
                            distinctTokens.push(token)
                    })
                    return distinctTokens;
                }


                var ctgCount = 0
                var commonConcepts = [];
                for (var ctgKey in ctgMap) {
                    if (true || ctgKey == "defoliant") {
                        ctgCount += 1
                        ctgCount += 1
                        var ctgTokens = getDistinctTokens(ctgKey)

                        if (Array.isArray(ctgTokens)) {
                            for (var TS_Key in TS_Map) {


                                var TS_Tokens = getDistinctTokens(TS_Key)
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
                fs.writeFileSync("D:\\NLP\\termScience\\consolidation\\commonConcepts_LTS_CTG_all.json", JSON.stringify(commonConcepts, null, 2))
                //    fs.writeFileSync("D:\\NLP\\termScience\\consolidation\\commonConcepts_LTS_CTG_technology.json", JSON.stringify(commonConcepts, null, 2))
                //    fs.writeFileSync("D:\\NLP\\termScience\\consolidation\\commonConcepts_LTS_CTG.json", JSON.stringify(commonConcepts, null, 2))
            })


    },
    writeCommonConcepts_CSV: function (TS_Map) {

        var commonConcepts = JSON.parse("" + fs.readFileSync("D:\\NLP\\termScience\\consolidation\\commonConcepts_LTS_CTG.json"));

        // var  commonConcepts = JSON.parse("" + fs.readFileSync("D:\\NLP\\termScience\\consolidation\\commonConcepts_LTS_CTG_technology.json"));

        function setIdsValues(TS_Map) {
            for (var key in TS_Map) {
                var item = TS_Map[key]
                item.parentNames = "";
                item.childrenNames = ""
                if (item.parents) {
                    var parentGroupIds = item.parents.split(",");
                    parentGroupIds.forEach(function (parentGroupId) {
                        var groupNames = ""
                        var parentSubgroupIds = parentGroupId.split(";")
                        parentSubgroupIds.forEach(function (parentId) {
                            if (!TS_Map[parentId])
                                return;
                            if (groupNames != "")
                                groupNames += ","
                            groupNames += TS_Map[parentId].name;
                        })
                        if (item.parentNames != "")
                            item.parentNames += ","
                        item.parentNames += groupNames;
                    })
                }
                if (item.children) {
                    var childrenIds = item.children.split(",");
                    childrenIds.forEach(function (childrenId) {
                        if (!TS_Map[childrenId])
                            return;
                        if (item.childrenNames != "")
                            item.childrenNames += ","
                        item.childrenNames += TS_Map[childrenId].name;
                    })
                }
                TS_Map[key] = item;
            }
            return TS_Map;
        }

        function printTS_Map(TS_Map) {
            var str = "CTG_concept\tCTG_id\tTS__concept\tTS__id\tTS__parents\n";
            commonConcepts.forEach(function (item) {
                item.TS_.forEach(function (TS_Item_) {
                    var TS_Id = TS_Item_.id;
                    if (TS_Id == "sh85084167")
                        var vv = 3
                    var TS_Item = TS_Map[TS_Id];
                    if (!TS_Item)
                        return;

                    var target = item.ctg
                    var targetId = "";
                    if (target.pathIds && target.pathIds.length > 0)
                        targetId = target.pathIds[0];


                    var str2 = target.prefLabel + "\t" + targetId + "\t" + TS_Item.name + "\t" + TS_Item.id + "\t" + TS_Item.parentNames + "\n"
                    if (str.indexOf(str2) < 0)
                        str += str2

                })


            })
            fs.writeFileSync("D:\\NLP\\termScience\\consolidation\\commonConcepts_TS__CTG.csv", str)

        }


        var TS_Map = crawler_termSciences.getTermScienceMap("id");
        //  console.log(JSON.stringify(TS_Map["sh85136954"]))

        TS_Map = setIdsValues(TS_Map);
        //console.log(JSON.stringify(TS_Map["sh85136954"]))
        printTS_Map(TS_Map)


        return;


    }
    ,

    getConceptsCsv: function () {
        var tree = JSON.parse("" + fs.readFileSync("D:\\NLP\\termScience\\consolidation\\termSciencesHierarchy_levels.txt"))

        var tree = JSON.parse("" + fs.readFileSync("D:\\NLP\\termScience\\consolidation\\termSciencesHierarchy_technology.txt"))
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

        //   fs.writeFileSync("D:\\NLP\\termScience\\consolidation\\termSciences_raw.txt", strOut)
        fs.writeFileSync("D:\\NLP\\termScience\\consolidation\\termSciences_technology_raw.txt", strOut)


    },
    getDeepConcepts: function () {

        var tree4 = JSON.parse("" + fs.readFileSync("D:\\NLP\\termScience\\consolidation\\termSciencesHierarchy_levels4.txt"))
        var tree8 = JSON.parse("" + fs.readFileSync("D:\\NLP\\termScience\\consolidation\\termSciencesHierarchy_levels8.txt"))
        var tree12 = JSON.parse("" + fs.readFileSync("D:\\NLP\\termScience\\consolidation\\termSciencesHierarchy_levels12.txt"))


        var leafConcepts = [];

        function setNewDescendants(node, descendantsTree) {
            var descendants = null;
            descendantsTree.children.forEach(function (child) {
                if (node.id == child.id) {
                    descendants = child.children
                }
            })
            return descendants;

        }

        function recurseChildren(node, descendantsTree) {
            if (!node.children)
                return;
            if (!Array.isArray(node.children) && node.children > 0)
            //leafConcepts.push(node.id)
                node.children = setNewDescendants(node, descendantsTree)
            else
                node.children.forEach(function (child) {
                    recurseChildren(child, descendantsTree)
                })
        }

        recurseChildren(tree8, tree12)
        recurseChildren(tree4, tree8)

        var xx = tree4;
    }

    ,
    compareAll: function () {
        var commonConceptsA = JSON.parse("" + fs.readFileSync("D:\\NLP\\termScience\\consolidation\\commonConcepts_LTS_CTG_all.json"));
        // var commonConceptsA = JSON.parse("" + fs.readFileSync("D:\\NLP\\termScience\\consolidation\\commonConcepts_TS__CTGalphabetic.csv"));

        var existingTSCommon = []


        var conceptsA = []


        function getTSIds(array) {
            var ids = [];
            array.forEach(function (item) {
                if (ids.indexOf(item.TS_.id) < 0)
                    ids.push(item.TS_.id)
            })
            return ids

        }


        function getCtgIds(array) {
            var ids = [];
            array.forEach(function (item) {
                item.ctg.pathIds.forEach(function (pathId) {
                    ids.push(pathId);
                    console.log(item.TS_.name + "\t" + item.TS_.id + '\t' + pathId)
                })


            })
            return ids;
        }


        // var idsH = getCtgIds(commonConceptsH)
        //  var idsA = getCtgIds(commonConceptsA)
        var idsA = getTSIds(commonConceptsA)

        var conceptsA = []
        idsA.forEach(function (id) {
            if (existingTSCommon.indexOf(id) < 0)
                conceptsA.push(id)
        })
        var x = conceptsA;

        var nonCommonA = [];
        idsA.forEach(function (id) {
            if (idsH.indexOf(id) < 0)
                nonCommonA.push(id)
        })

        var nonCommonH = [];
        idsH.forEach(function (id) {
            if (idsA.indexOf(id) < 0)
                nonCommonH.push(id)
        })


    }
    , getNewConceptsFromAll: function () {


    }

    , processNewConcepts: function () {

        var commonConceptsA = JSON.parse("" + fs.readFileSync("D:\\NLP\\termScience\\consolidation\\commonConcepts_LTS_CTG_all.json"));
        var newConcepts = JSON.parse("" + fs.readFileSync("D:\\NLP\\termScience\\consolidation\\temp\\newConcepts.json"));
        var commonConceptsA = JSON.parse("" + fs.readFileSync("D:\\NLP\\termScience\\consolidation\\commonConcepts_LTS_CTG_all.json"));

        //   var oldConcepts= JSON.parse("" + fs.readFileSync("D:\\NLP\\termScience\\consolidation\\commonConcepts_LTS_CTG_all.json"));
        var newConceptsMap = {}
        newConcepts.forEach(function (concept) {
            newConceptsMap[concept.id] = concept;
        })


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

        var orphanConcepts = []
        commonConceptsA.forEach(function (concept, index) {

            var conceptX = newConceptsMap[concept.TS_.id]

            if (!conceptX || !conceptX.broaders) {
                orphanConcepts.push(concept.TS_.id)
                return;
            }
            var parents = "";
            var parentNames = "";

            conceptX.broaders.forEach(function (broader, index2) {
                if (index != 0)
                    parents += ","
                parents += broader.id;
                if (parents == "") {
                    orphanConcepts.push(concept)
                } else {
                    var parentName = getPrefLabelEN(broader.prefLabels)
                    if (index != 0)
                        parentNames = "," + parentNames
                    parentNames = parentName + parentNames;
                }


            })

            concept.TS_.parents = parents;
            concept.TS_.parentNames = parentNames;
            // commonConceptsA[index]=concept;

        })

        var x = orphanConcepts;
        var str = "CTG_concept\tCTG_id\tTS__concept\tTS__id\tTS__parents\n";
        commonConceptsA.forEach(function (item) {


            var target = item.ctg
            var targetId = "";
            if (target.pathIds && target.pathIds.length > 0)
                targetId = target.pathIds[0];
            var TS_Item = item.TS_;
            if (TS_Item.parents != "")
                var xx = 3

            var str2 = target.prefLabel + "\t" + targetId + "\t" + TS_Item.name + "\t" + TS_Item.id + "\t" + TS_Item.parentNames + "\n"
            if (str.indexOf(str2) < 0)
                str += str2

        })


        fs.writeFileSync("D:\\NLP\\termScience\\consolidation\\temp\\commonConcepts_TS__CTG.csv", str)


    }
    , listHierarchy: function () {
        var filter = [
            "Chemistry,Biochemistry,16",
            "Chemistry,Chemistry, Agricultural,1",
            "Chemistry,Analytical chemistry,35",
            "Chemistry,Inorganic chemistry,1",
            "Chemistry,Organic chemistry,14",
            "Chemistry,Chemistry, Pharmaceutical,2",
            "Chemistry,Physical chemistry,38",
            "Chemistry,Chemical compound,42",
            "Chemistry,Chemical element,30",
            "Chemistry,Chemical reaction,1",
            "Chemistry,Chemical structure,2",
            "Energy,Nuclear energy,2",
            "Mathematics,Mathematical Computing,2",
            "Physics,Acoustics,3",
            "Physics,Biophysics,8",
            "Physics,Displacement,5",
            "Physics,Hardness,1",
            "Physics,Electricity,7",
            "Physics,Energy,9",
            "Physics,Gravitation,1",
            "Physics,Magnetics,1",
            "Physics,Matter,9",
            "Physics,Mechanics,13",
            "Physics,Mesure physique,1",
            "Physics,Optics,9",
            "Physics,Ph énomène physique,16",
            "Physics,Nuclear physics,11",
            "Physics,Porosity,1",
            "Physics,Pressure,5",
            "Physics,Radiation,6",
            "Physics,Rheology,4",
            "Physics,Temperature,6",
            "Physics,Thermodynamics,3",


        ]
        var terms = JSON.parse("" + fs.readFileSync("D:\\NLP\\termScience\\consolidation\\termSciencesHierarchy_levels.txt"))
        var terms2 = JSON.parse("" + fs.readFileSync("D:\\NLP\\termScience\\consolidation\\termSciencesHierarchy_technology.txt"))
        terms.children = terms.children.concat(terms2.children)
        var terms = JSON.parse("" + fs.readFileSync("D:\\NLP\\termScience\\consolidation\\temp2\\conceptsLevel4.json"));


        var array = [];
        terms.children.forEach(function (term) {
            term.children.forEach(function (child) {
                var ok = true


                /*   filter.forEach(function(item){
                       if(item.indexOf(child.name)>-1)
                           ok=true
                   })*/
                if (!ok)
                    return;
                if (child.children.length > 0) {
                    array.push(child.id + "," + term.name + "," + child.name + "," + child.children.length)
                    console.log(child.id + "," + term.name + "," + child.name + "," + child.children.length)
                }


            })

        })
        var x = array


    }
    , TS_ToFlat: function (options) {




        var items = JSON.parse("" + fs.readFileSync("D:\\NLP\\termScience\\consolidation\\temp2\\commonConcepts_08_03.json"))


        var allItems = [];
        var allUniqueItems = [];

        function recurseAllItems(node) {
            if (allUniqueItems.indexOf(node.id) < 0) {
                allUniqueItems.push(node.id)
                allItems.push(node);
                if (!node.broaders || !Array.isArray(node.broaders)) {
                    node.broaders.forEach(function (broader, indexParent) {
                        recurseAllItems(broader)
                    })
                }
            } else {
                var x = 3
            }
        }

        items.forEach(function (item) {
            recurseAllItems(item)
        })


        function recurseAncestors(node, ancestors, level) {
if( node.id=="TE.84154")
    var x=3
            if (!node)
                return ancestors;

            ancestors += "|"
            var spaces = ""
            for (var i = 0; i < level; i++) {
                spaces += "_"
            }
            ancestors += spaces + node.id + ";" + node.name;
            var level2 = level + 1;
            if (!node.broaders || !Array.isArray(node.broaders))
                return ancestors
            node.broaders.forEach(function (broader, indexParent) {
                ancestors = recurseAncestors(broader, ancestors, level2)
            })
            return ancestors;
        }


        var jsonArray = []
        allItems.forEach(function (item) {

            var ancestors = recurseAncestors(item, "", 1);
            if (options.output == 'json') {
                jsonArray.push({id: item.id, ancestors: ancestors, prefLabels: item.name, altLabels: ""})
            } else {
                str += item.id;
                if (options.withAncestors) {
                    str += "\t" + ancestors
                }
                str += "\t" + item.name + "\t" + "" + "\n"
            }

        })

        if (options.output == 'json') {
            return jsonArray;
        } else
            return str;
    },



    TStoElastic: function () {
        var json = crawler_termSciences.TS_ToFlat({output: "json"})

        var all = [];
        var fetch = []
        var count = 0;
        json.forEach(function (item) {
            item.thesaurus = "TS"
            fetch.push(item)
            if (fetch.length > 1000) {
                all.push(fetch)
                fetch = [];
            }
        })
        all.push(fetch)

        async.eachSeries(all, function (json, callbackEachSeries) {
            var x = json;
            var createIndex = false;
            if (count == 0)
                createIndex = true;
            skosToElastic.flatToElastic(json, count, createIndex, function (err, result) {
                if (err)
                    console.log(err)
                count += json.length
                console.log(count)
                var x = err;
                callbackEachSeries()
            })
        })
    }
    , listConcepts: function (callback) {
        var pages = [];
        for (var i = 65; i <= 90; i++) {

            pages.push(String.fromCharCode(i))

        }

        pages = ["C"]
        // var pages = [["A", 1], ["A", 2]]

        var terms = [];
        var termIds = [];
        var previousPageCount = -1
        async.eachSeries(pages, function (page, callbackEachPageLetter) {
            var pageNums = []
            previousPageCount = -1
            for (var i = 1; i <= 500; i++) {
                pageNums.push(i);
            }

            pageNums = [108]
            async.eachSeries(pageNums, function (pageNum, callbackEachPageNum) {
                var url = "http://www.termsciences.fr/-/Index/Explorer/Alphabet/?lettre=" + page + "&page=" + pageNum + "&lng=en"
                var options = {
                    method: 'GET',
                    url: url,
                    headers: {
                        'Content-Type': 'text/xml; charset=utf-8',
                    }

                };
                request(options, function (error, response, body) {
                    if (error)
                        return callbackEachPageNum(error);
                    if (body.error)
                        return callbackEachPageNum(body.error);

                    var regex1 = /<a([^>]*)>([^<]+)<\/a>/gm;

                    var array;
                    var pageItemsCount = 0
                    while ((array = regex1.exec(body)) != null) {
                        var str = array[1];
                        var term = array[2].trim();
                        if (str.indexOf("idt=") > -1) {
                            var regex2 = /idt=([^&]*)&/gm;
                            var array2 = regex2.exec(str);
                            if (array2 && array2.length == 2) {
                                var id = array2[1];
                                if (termIds.indexOf(page + "-" + id) < 0) {
                                    termIds.push(page + "-" + id)
                                    terms.push({name: term, id: id})
                                    pageItemsCount += 1
                                } else {// on a fini les numero de pages
                                    return callbackEachPageNum("endLetter");
                                }
                            } else {
                                var x = 3
                            }

                        }

                    }
                    /*  if (previousPageCount != -1 && previousPageCount == pageItemsCount) {
                          return callbackEachPageNum("endLetter");
                      }*/
                    console.log(page[0] + "-" + pageNum + "   " + pageItemsCount);

                    previousPageCount = pageItemsCount;


                    return callbackEachPageNum()


                })


            }, function (err) {
                if (err && err == "endLetter")
                    return callbackEachPageLetter()

                return callbackEachPageLetter()

            })
        }, function (err) {
            var x = terms;
            fs.writeFileSync("D:\\NLP\\termScience\\allTerms.csv", JSON.stringify(terms, null, 2))

        })
    }
    ,

    hierarchiesToRdf: function () {


        function getTSmap() {
            var narrowersArray = JSON.parse("" + fs.readFileSync("D:\\NLP\\termScience\\consolidation\\temp2\\narrowersObjs.json"))
            var narrowersMap = {}


            narrowersArray.children.forEach(function (item) {
                function recurse(node) {
                    narrowersMap[item.id] = item
                    if (node.children && Array.isArray(node.children)) {
                        node.children.forEach(function (child) {

                            recurse(child)
                        })
                    }
                }
                recurse(item)

            })

            var TSmap = {};
            var TSnarrowersIds = [];
            var count = 0;
            var count2 = 0;

            var dirPath = "D:\\NLP\\termScience\\consolidation\\temp2\\CTGinterest\\"
            var files = fs.readdirSync(dirPath)
            files.forEach(function (fileName) {
                var filePath = dirPath + fileName;
                var json = JSON.parse("" + fs.readFileSync(filePath));
                console.log(fileName)


                function recurseAddChildrenToMap(node) {
                    count++;
                    if (node == "TE.15439")
                        var x = 3
                    TSmap[node.id] = node;
                    var childrenIds = []
                    if (node.children && Array.isArray(node.children)) {
                        node.children.forEach(function (child) {
                            childrenIds.push(child)
                            recurseAddChildrenToMap(child)
                        })
                    }
                }
                function recurseNarrowersToMap(node) {
                    if (node == "TE.15439")
                        var x = 3
                    if(!  TSmap[node.id]) {
                        TSmap[node.id] = node;
                        count2++;
                    }
                    //rplace naarowers ids by narrowers obj
                    if (node.narrowers && Array.isArray(node.narrowers)) {
                        node.narrowers.forEach(function (narrower, indexNarrower) {
                            var narrowerObj = narrowersMap[narrower];
                            if(!narrowersMap[narrower])
                                return;
                            node.narrowers[indexNarrower] = narrowerObj;

                            // set borader on narrower
                            if(  !node.narrowers[indexNarrower].broaders)
                                node.narrowers[indexNarrower].broaders=[]
                            node.narrowers[indexNarrower].broaders.push(node.id)

                            if (! narrowersMap[narrower] && TSnarrowersIds.indexOf(narrower) < 0 && childrenIds.indexOf(narrower) < 0)
                                   TSnarrowersIds.push(narrower)
                            recurseNarrowersToMap(narrowerObj)
                        })
                    }

                }


                recurseAddChildrenToMap(json);
                recurseNarrowersToMap(json)


                var x = TSmap;
                var length = Object.keys(TSmap).length
                console.log(length + "  " + count)
                var y = TSnarrowersIds

            })
            var x = TSmap;
            var length = Object.keys(TSmap).length
            console.log(length + "  " + count+" "+count2)
            var y = TSnarrowersIds
            return TSmap;

        }


        var skosEditorArray = [];

        function recurseChildren(node,level) {
            var broadersIds = [];
            if(node.id=="TE.15575")
                var x=3
            if (node.broaders && Array.isArray(node.broaders)) {
                node.broaders.forEach(function (broader) {
                    var broaderId="";
                    if(typeof broader=="object")
                        broaderId=broader.id
                    else{
                        broaderId=broader
                    }

                    if(broaderId!="TE.192836" ) {
                        if(broadersIds.indexOf(broaderId)<0)
                        broadersIds.push(broaderId)
                    }


                })
             // supperession des broaders absents de l'arborescence

                    var broadersIds2=[];
                    broadersIds.forEach(function (id){
                        if(TSmap[id])
                            broadersIds2.push(id)
                    })
                    broadersIds=broadersIds2


            }
            if(level>0 && broadersIds.length==0)
                return;


            var narrowersIds = [];
            if (node.narrowers && Array.isArray(node.narrowers)) {
                node.narrowers.forEach(function (narrower) {
                    if(typeof narrower=="object")
                    narrowersIds.push(narrower.id)
                    else{
                        narrowersIds.push(narrower)
                    }

                })
            }
            if(!node.prefLabels)
                node.prefLabels=[{lang:"en",value:node.name}]
            if(!node.altLabels)
                node.altLabels=[];

            var obj = {
                id: node.id,
                prefLabels: node.prefLabels,
                altLabels: node.altLabels,
                broaders: broadersIds,
                narrowers: narrowersIds,
                relateds: node.relateds,
                definitions: node.definitions,
                notes: []
            }
            skosEditorArray.push(obj);
var level2=level+1
            if (node.children && Array.isArray(node.children)) {
                node.children.forEach(function (child) {

                    recurseChildren(child,level2)
                })
            }


        }

        var TSmap = getTSmap();
        for (var key in TSmap) {
            recurseChildren(TSmap[key],0)
        }

        skosReader.skosEditorToRdf("D:\\NLP\\termScience\\consolidation\\temp2\\TS.rdf",skosEditorArray)

    }


}
module.exports = crawler_termSciences;

if (false) {
    crawler_termSciences.listConcepts();
}


if (false) {
    crawler_termSciences.buildHierarchy()
}
if (false) {
    crawler_termSciences.buildHierarchyBroaders();
}
if (false) {
    crawler_termSciences.setCommonConcepts_TS_CTG()
}
if (false) {
    crawler_termSciences.writeCommonConcepts_CSV();
}

if (false) {
    crawler_termSciences.getDeepConcepts()

}
if (false) {
    crawler_termSciences.getConceptsCsv()
}

if (false) {
    crawler_termSciences.compareAll()
}


if (false) {
    crawler_termSciences.processNewConcepts();
}

if (false) {
    crawler_termSciences.listHierarchy()

}

if (false) {
    crawler_termSciences.TS_ToFlat({output: "json"})

}

if (false) {
    crawler_termSciences.TStoElastic();
}
if (true) {
    crawler_termSciences.hierarchiesToRdf();
}
