var fs = require('fs');
var async = require('async')

var tulsaToSkos = {

    topConcepts: [
        "COMMON ATTRIBUTE",
        "EARTH AND SPACE CONCEPTS",
        "ECONOMIC FACTOR",
        "EQUIPMENT",
        "LIFE FORM",
        "OPERATING CONDITION",
        "PHENOMENON",
        "PROCESS",
        "PROPERTY",
        "WORLD"
    ]
    ,

    parseTxt: function () {

        var entitiesArray = []

        var rootConcepts = [];
        var jsonArray = [];

        var filePath = "D:\\NLP\\Tulsa.txt";

        var str = "" + fs.readFileSync(filePath);
        var lines = str.split("\n");
        var isPreviousBT = false
        lines.forEach(function (line, index) {
            var offset1 = 32;
            var offset2 = 41;
            if (line.length > 40) {
                offset1 = line.length - 8;
                offset2 = line.length;
            }

            if (index > 20000000)
                return;
            var obj
            var type = line.substring(0, 6).trim();

            if (type == "DS") {
                obj = {
                    type: type,
                    term: line.substring(6, offset1).trim(),
                    num: line.substring(offset1, offset2).trim(),
                    scheme: line.substring(offset1, offset1 + 1),
                    line: index
                }


                if (obj.term == "WORLD")
                    var x = 3
            } else {
                obj = {
                    type: type,
                    term: line.substring(6).trim(),
                    line: index
                }
            }

            jsonArray.push(obj);
        })
        return jsonArray;
    },


    listItems: function (jsonArray) {
        jsonArray.sort(function (a, b) {

            if (a.scheme > b.scheme)
                return 1;
            if (a.scheme < b.scheme)
                return -1;
            return 0;

        })

        var str = ""
        jsonArray.forEach(function (item, i) {

            if ((i > 0 && item.scheme != jsonArray[i - 1].scheme) || i == jsonArray.length - 1) {
                fs.writeFileSync("D:\\NLP\\Tulsa_" + jsonArray[i - 1].scheme + ".txt", str, null, 2)
                str = ""
            } else

                str += item.type + "\t" + item.term + "\t" + item.num + "\t" + item.scheme + "\t" + item.line + "\n"

        })
    },


    setEntitiesByBroaders: function (jsonArray) {
        var entity = null
        var entitiesMap = {};


        jsonArray.forEach(function (item, indexItem) {

            if (item.type == "DS") {
                if (entity != null) {
                    //   entitiesArray.push(entity);
                    entitiesMap[entity.prefLabel] = entity;
                }

                // var scheme = schemes[parseInt(item.scheme) - 1]
                entity = {
                    prefLabel: item.term,
                    id: item.line,
                    relateds: [],
                    altLabels: [],
                    num: item.num,
                    broaders: [],
                    narrowers: []
                }
            }

            if (entity.prefLabel == "TESTING")
                var x = 3

            if (item.type == "BT") {
                if (entity.broaders.indexOf(item.term) < 0)
                    entity.broaders.push(item.term)
                if (entity.broaders.length > 1)
                    var x = 3
                entity.broader = item.term
            } else if (item.type == "SA") {
                if (entity.relateds.indexOf(item.term) < 0)
                    entity.relateds.push(item.term)
            } else if (item.type.indexOf("SN") == 0) {
                /*  var p;
                  if ((p = item.term.indexOf(")")) > -1)
                      item.term = item.term.substring(p + 2)*/
                if (entity.altLabels.indexOf(item.term) < 0)
                    entity.altLabels.push(item.term)


            } else if (item.type == "UF") {
                if (entity.altLabels.indexOf(item.term) < 0)
                    entity.altLabels.push(item.term)

            } else if (item.type == "NT") {
                if (entity.altLabels.indexOf(item.term) < 0)
                    entity.narrowers.push(item.term)

            }


        })
        return entitiesMap;
    }
    ,


    setEntitiesNarrowers: function (entitiesMap) {

        function recurse(parent, currentScheme) {
            if (parent == "TESTING")
                var x = 3
            if (!entitiesMap[parent] || !entitiesMap[parent].narrowers)
                return;
            entitiesMap[parent].narrowers.forEach(function (narrower) {
                entitiesMap[narrower].inScheme = currentScheme;
                recurse(narrower, currentScheme)
            })

        }

        tulsaToSkos.topConcepts.forEach(function (topConcept) {
            entitiesMap[topConcept].inScheme = topConcept;
            recurse(topConcept, topConcept)
        })
        return entitiesMap;
    },


    getRootConcepts: function (entitesArray) {
        entitiesArray.forEach(function (entity) {
            if (!entity.broader && entity.narrowers.length > 2)
                rootConcepts.push(entity.prefLabel)
        })
        return rootConcepts;
    }

    , generateRdf: function (entitiesMap) {

        var entitiesArray = []
        for (var key in entitiesMap) {
            entitiesArray.push(entitiesMap[key])
        }
     //   async.eachSeries(tulsaToSkos.topConcepts, function (scheme, callbackSeries) {


        var scheme="all"
            var str = "";
            str += "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n" +
                "<rdf:RDF xmlns:skos=\"http://www.w3.org/2004/02/skos/core#\"  xmlns:rdf=\"http://www.w3.org/1999/02/22-rdf-syntax-ns#\">"

            str += "<skos:ConceptScheme rdf:about=\"http://PetroleumAbstractsThesaurus/" + scheme + "\">"
            str += "<skos:prefLabel xml:lang='en'>" + scheme + "</skos:prefLabel>"
            str += "</skos:ConceptScheme>";


            var js2xmlparser = require("js2xmlparser");


            entitiesArray.forEach(function (entity, index) {
//nsole.log(entity.inScheme)

                if (!entity.inScheme )
                    return;


                var obj = {

                    "@": {
                        "rdf:about": "http://PetroleumAbstractsThesaurus/" + entity.prefLabel
                    },

                    "skos:prefLabel": {
                        "@": {
                            "xml:lang": "en"
                        },
                        "#": entity.prefLabel
                    },

                    "skos:inScheme": {"@": {"rdf:resource": "http://PetroleumAbstractsThesaurus/" + entity.inScheme}}

                }

                if (entity.broader)
                    obj["skos:broader"] = {"@": {"rdf:resource": "http://PetroleumAbstractsThesaurus/" + entity.broader}};

                entity.altLabels.forEach(function (altLabel) {
                    obj["skos:altLabel"] = {
                        "@": {
                            "xml:lang": "en"
                        },
                        "#": altLabel
                    }
                })
                entity.relateds.forEach(function (related) {
                    obj["skos:related"] = {
                        "#": "http://PetroleumAbstractsThesaurus/" + related
                    }
                })


                str += js2xmlparser.parse("skos:Concept", obj).substring(22) + "\n";
          })
            str += "</rdf:RDF>"


            fs.writeFileSync("D:\\NLP\\Tulsa_" + scheme + ".rdf", str);
        //    return callbackSeries();

        }, function (err) {
            console.log("done")
      //  })


    }


}

module.exports = tulsaToSkos

var jsonArray = tulsaToSkos.parseTxt();

var entitiesMap = tulsaToSkos.setEntitiesByBroaders(jsonArray)

var entitiesMap = tulsaToSkos.setEntitiesNarrowers(entitiesMap)

tulsaToSkos.generateRdf(entitiesMap)
