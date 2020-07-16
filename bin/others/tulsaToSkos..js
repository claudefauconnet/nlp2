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
        "WORLD",
        "MATERIAL"
    ]
    ,

    parseTxt: function () {

        var entitiesArray = []

        var rootConcepts = [];
        var jsonArray = [];

        var filePath = "D:\\NLP\\drafts\\Tulsa.txt";

        var str = "" + fs.readFileSync(filePath);
        var lines = str.split("\n");
        var isPreviousBT = false
        var types={}
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
if(!types[type])
    types[type]=0;
types[type]+=1
            if (type == "DS") {
                obj = {
                    type: type,
                    term: line.substring(6, offset1).trim(),
                    num: line.substring(offset1, offset2).trim(),
                    scheme: line.substring(offset1, offset1 + 1),
                    line: index
                }


            } else {
                obj = {
                    type: type,
                    term: line.substring(6).trim(),
                    line: index
                }
            }

            jsonArray.push(obj);
        })
        console.log(JSON.stringify(types,null,2))
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

        function padWithLeadingZeros(string) {
            return new Array(5 - string.length).join("0") + string;
        }

        function unicodeCharEscape(charCode) {
            return "\\u" + padWithLeadingZeros(charCode.toString(16));
        }

        function unicodeEscape(string) {
            return string.split("")
                .map(function (char) {
                    var charCode = char.charCodeAt(0);
                    return charCode > 127 ? unicodeCharEscape(charCode) : char;
                })
                .join("");
        }

        jsonArray.forEach(function (item, indexItem) {

         /*   if (item.term && item.term.indexOf("ADDED") > -1)
                return;*/
            item.term = unicodeEscape(item.term).replace(/&/g, " ").replace(/'/g, " ")
            // remove dates and annotations  see Format of PA Thesauri USE...
            item.term = item.term.replace(/.*\(\d+\-*\d*\)\s*/g, "");
            item.term = item.term.replace("/", " ");

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


            if (item.type == "BT") {
                if (entity.broaders.indexOf(item.term) < 0)
                    entity.broaders.push(item.term)
                if (entity.broaders.length > 1)
                    var x = 3
                entity.broader = item.term
            } else if (item.type == "SA") {
                if (entity.relateds.indexOf(item.term) < 0)
                    entity.relateds.push(item.term)
            } else if (item.type.indexOf("US") == 0) {
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


    setEntitiesNarrowersScheme: function (entitiesMap) {

        function recurse(parent, currentScheme) {


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

    setEntitiesBoadersScheme: function (entitiesMap) {

        function recurseParent(node) {

            if (node.inScheme)
                return node.inScheme;
            if (tulsaToSkos.topConcepts.indexOf(node.broader) > -1)
                return node.broader

            else {
                if (node.broader) {
                   return recurseParent(entitiesMap[node.broader])
                } else
                    return null;
            }
        }

        for (var key in entitiesMap) {

            var entity = entitiesMap[key];
            var scheme = recurseParent(entity);
            if (scheme)
                entity.inScheme = scheme;

        }

        function recurse(parent, currentScheme) {

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
console.log(entitiesArray.length);
        var stats={}
        async.eachSeries(["all"], function (scheme, callbackSeries) {
         //   async.eachSeries(tulsaToSkos.topConcepts, function (scheme, callbackSeries) {


            //  var scheme = "all"
            var str = "";
            str += "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n" +
                "<rdf:RDF xmlns:skos=\"http://www.w3.org/2004/02/skos/core#\"  xmlns:rdf=\"http://www.w3.org/1999/02/22-rdf-syntax-ns#\">"

            str += "<skos:ConceptScheme rdf:about='http://PetroleumAbstractsThesaurus/" + scheme.replace(/ /g,'_')  + "'>"
            str += "  <skos:prefLabel xml:lang='en'>" + scheme + "</skos:prefLabel>"
            str += "</skos:ConceptScheme>";


            entitiesArray.forEach(function (entity, index) {


              if(!entity.inScheme){
                  if(!stats["noScheme"])
                      stats["noScheme"]=0
                  stats["noScheme"]+=1
              }else{
                  if(!stats[entity.inScheme])
                      stats[entity.inScheme]=0
                  stats[entity.inScheme]+=1
              }


                if (scheme == "all") {
                    if (!entity.inScheme)
                        return;
                } else {

                    if (entity.inScheme != scheme)
                        return;
                }


                str += "<skos:Concept rdf:about='http://PetroleumAbstractsThesaurus/" + entity.prefLabel.replace(/ /g,'_') + "'>\n"
                str += "  <skos:inScheme rdf:resource='http://PetroleumAbstractsThesaurus/" + entity.inScheme.replace(/ /g,'_') + "'/>\n"

                str += "  <skos:prefLabel xml:lang='en'>" + entity.prefLabel + "</skos:prefLabel>\n"

                entity.altLabels.forEach(function (altLabel) {
                    str += "  <skos:altLabel xml:lang='en'>" + altLabel.replace(/&/g, " ") + "</skos:altLabel>\n"
                })

                if (entity.broader)
                    str += "  <skos:broader rdf:resource='http://PetroleumAbstractsThesaurus/" + entity.broader.replace(/ /g,'_') + "'/>\n"


                entity.relateds.forEach(function (related) {
                    str += "  <skos:related rdf:resource='http://PetroleumAbstractsThesaurus/" + related.replace(/ /g,'_') + "'/>\n"
                })
                str += "</skos:Concept>\n"

            })
            str += "</rdf:RDF>"


            fs.writeFileSync("D:\\NLP\\Tulsa_" + scheme + ".rdf", str);
            return callbackSeries();

        }, function (err) {
            console.log("done")

            console.log(JSON.stringify(stats,null,2))
        })


    }


}

module.exports = tulsaToSkos

var jsonArray = tulsaToSkos.parseTxt();

var entitiesMap = tulsaToSkos.setEntitiesByBroaders(jsonArray)

var entitiesMap = tulsaToSkos.setEntitiesNarrowersScheme(entitiesMap);

var entitiesMap = tulsaToSkos.setEntitiesBoadersScheme(entitiesMap);


tulsaToSkos.generateRdf(entitiesMap)
//!!!!!!!!!  ATTENTION!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
/*Post import
    insert into <http://souslesens.org/oil-gas/upstream/>
{?c  <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://www.w3.org/2004/02/skos/core#ConceptScheme>}

    where {?a skos:broader ?c filter( NOT EXISTS{ ?c skos:broader ?d.})}*/
