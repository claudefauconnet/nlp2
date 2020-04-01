var fs = require('fs');
const csv = require('csv-parser')
const async = require('async');

var ontologyCTG = {
    readXlsx: function (filePath, callback) {
        const XLSX = require('xlsx');
        var sheets = {};
        var dataArray = [];
        var jsonArrayQuantum = [];
        async.series([
            function (callbackSeries) {
                var workbook = XLSX.readFile(filePath);

                var sheet_name_list = workbook.SheetNames;

                sheet_name_list.forEach(function (sheetName) {
                    sheets[sheetName] = workbook.Sheets[sheetName];
                })
                callbackSeries(null, sheets)

            },
            function (callbackSeries) {

                var worksheet = sheets["Sheet1"]
                var header = [];
                var data = [];
                var ref = worksheet["!ref"];
                var range = (/([A-Z])+([0-9]+):([A-Z]+)([0-9]+)/).exec(ref);

                if (!range || range.length < 2)// feuille vide
                    return callback(null, null);
                var lineDebut = range[2];
                var lineFin = range[4];
                var colDebut = range[1]
                var colFin = range[3]
                var alphabet = "A,";
                var dbleLetterColName = colFin.length > 1
                var colNames = [];
                for (var j = 65; j < 120; j++) {
                    var colName
                    if (j <= 90)
                        colName = String.fromCharCode(j);
                    else
                        colName = "A" + String.fromCharCode(j - 26);


                    colNames.push(colName);
                    if (colName == colFin)
                        break;

                }

                for (var i = lineDebut; i <= lineFin; i++) {
                    for (var j = 0; j < colNames.length; j++) {


                        var key = colNames[j] + i;

                        if (!worksheet[key]) {
                            continue;
                        }
                        var value = worksheet[key].v;
                        if (i == lineDebut)
                            header.push(value);
                        else {
                            if (j == 0) {
                                data[i] = {}
                            }

                            if (!data[i]) {
                                continue;
                            }
                            data[i][header[j]] = value;

                        }

                    }
                }

                for (var key in data) {
                    dataArray.push(data[key]);
                }
                callbackSeries()

            }
            , function (callbackSeries) {
                ontologyCTG.readCsv("D:\\NLP\\rdfs\\Total\\quantum_thesaurusMapping.txt", "\t", null, function (err, result) {
                    jsonArrayQuantum = result.data[0];
                    callbackSeries();
                })
            }
            , function (callbackSeries) {


                jsonArray = dataArray


                var quantumMap = {};
                jsonArrayQuantum.forEach(function (item) {
                    quantumMap[item.ctg_id] = item;
                })

                var entityIdCount = 0
                var chaptersMap = {}
                var docsMap = {}


                var entitiesMap = {
                    Equipment: {},
                    Component: {},
                    Phenomenon: {},
                    Product: {},
                    Characterisation: {},
                    Method: {},
                }
                var litteralEntities = {
                    Time: {},
                    Temperature: {},
                    Vibration: {},


                }

                var uniqueEntities = [];
                var str = ""
                var strEntities = "";
                var strDocs = "";


                function formatString(str) {


                    str = str.replace(/"/gm, "\\\"")
                    str = str.replace(/;/gm, " ")
                    str = str.replace(/\n/gm, "\\\\n")
                    str = str.replace(/\r/gm, "")
                    str = str.replace(/\t/gm, " ")
                    return str;
                }

                for (var key in entitiesMap) {
                    strEntities += "<http://data.total.com/resource/ontology/ctg/EntityType/" + key + "> <http://www.w3.org/2000/01/rdf-schema#label> \"" + key + "\"@en .\n"
                }


                jsonArray.forEach(function (item, index) {


                    if (index == 0)
                        return;
                    var paragraphUrl = "<http://data.total.com/resource/ontology/ctg/Paragraph/" + item.ID + ">"
                    //    str += paragraphUrl + " <https://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http:http://data.total.com/resource/ontology/ctg//" + "simple" + "> .\n"


                    //   console.log(JSON.stringify(item,null,2))
                    if (item.Document && item.Document != "") {
                        if (!docsMap[item.Document]) {
                            var docId = 1000 + Object.keys(docsMap).length
                            docsMap[item.Document] = "<http://data.total.com/resource/ontology/ctg/Document/" + docId + ">"
                            strDocs += docsMap[item.Document] + " <https://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http:http://data.total.com/resource/ontology/ctg/DocumentType/" + "GM_MEC" + "> .\n"
                            strDocs += docsMap[item.Document] + " <http://www.w3.org/2000/01/rdf-schema#label> \"" + formatString(item.Document) + "\"@en .\n"

                        }
                        str += paragraphUrl + " <http://purl.org/dc/terms/isPartOf> " + docsMap[item.Document] + ".\n"


                    }

                    for (var i = 1; i < 4; i++) {
                        var chapterName = item["ChapterTitle" + i]
                        if (chapterName && chapterName.trim() != "") {
                            var chapterUri = "<http://data.total.com/resource/ontology/ctg/Chapter/" + item.ID + "_" + i + ">"
                            //   strDocs += chapterUri + " <https://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http:http://data.total.com/resource/ontology/ctg/ChapterType/" + "Chapter1" + "> .\n"

                            //    strDocs += chapterUri + " <http://www.w3.org/2000/01/rdf-schema#label> \"" + formatString(chapterName.trim()) + "\"@en .\n"

                            str += paragraphUrl + " <http://purl.org/dc/terms/isPartOf> \"" + i + "_" + formatString(chapterName.trim()) + "\"@en .\n"
                        }
                    }

                    var text = item.ParagraphText;
                    if (text && text.length > 5) {
                        text = text.replace(/"/gm, "")
                        text = text.replace(/[;]/gm, "")
                        str += paragraphUrl + " <http://purl.org/dc/dcmitype/Text> \"" + formatString(text) + "\"@en .\n"
                    }


                    var entitiesUriMap = {}
                    var entitiesUriStr = item["Entity_URI"];
                    if(entitiesUriStr && entitiesUriStr.split) {

                        entitiesUriStr.split(";").forEach(function (itemEntity) {
                            var splitArray = itemEntity.split("|")
                            var entityId = splitArray[1]
                            var type = splitArray[0]
                            var label = item[type]

                            if (uniqueEntities.indexOf(entityId) < 0) {
                                uniqueEntities.push(entityId);
                                strEntities += "<" + entityId + ">  <http://www.w3.org/2000/01/rdf-schema#label> \"" + formatString(label) + "\"@en .\n";
                                strEntities += "<" + entityId + "> <https://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://data.total.com/resource/ontology/ctg/EntityType/" + type + "> .\n"
                            }

                            str += paragraphUrl + " <http://purl.org/dc/terms/subject> " + "<" + entityId + ">.\n"
                            str += paragraphUrl + " <http://open.vocab.org/terms/hasOffset> \"" + itemEntity + "\" .\n";


                        })
                    }

                    for (var key in litteralEntities) {
                        var entityValue = item[key]
                        if (entityValue && entityValue != "") {
                            str += paragraphUrl + " <http://data.total.com/resource/ontology/ctg/properties#"+key+">" + "<" + entityValue + ">.\n"
                        }
                    }


                    /*   for (var key in entitiesMap) {

                           var entityIdNames = item[key]

                           entityIdNames.split(";").forEach(function (entityName, entityIndex) {
                               var entityNames = item[key].split(";")
                               if (entityId && entityId != "") {
                                   if (uniqueEntities.indexOf(entityId) < 0) {
                                       uniqueEntities.push(entityId);
                                       strEntities += "<" + entityId + ">  <http://www.w3.org/2000/01/rdf-schema#label> \"" + formatString(entityNames[entityIndex]) + "\"@en .\n";
                                       strEntities += "<" + entityId + "> <https://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://data.total.com/resource/ontology/ctg/EntityType/" + key + "> .\n"
                                   }

                                   str += paragraphUrl + " <http://purl.org/dc/terms/subject> " + "<" + entityId + ">.\n"


                                   if (entitiesUriMap[entityId]) {
                                       str += paragraphUrl + " <http://open.vocab.org/terms/hasOffset> \"" + entitiesUriMap[entityId] + "\" .\n";
                                   }

                                   if (quantumMap[entityId]) {
                                       var quantumURI = quantumMap[entityId]["Quantum_URI"]
                                       // quantumURI=quantumURI.trim()
                                       strEntities += "<" + entityId + ">  <http://www.w3.org/2004/02/skos/core#exactMatch> <" + quantumURI + "> .\n"
                                       strEntities += "<" + entityId + ">  <http://www.w3.org/2004/02/skos/core#definition> \"" + formatString(quantumMap[entityId].Definition) + "\"@en .\n"
                                   }

                                   /*    var keySpan = key + "_Span"
                                              var spans = item[keySpan];
                                              if (spans && spans != "[]") {

                                                  if(paragraphUrl=="<http://data.total.com/resource/ontology/ctg/Paragraph/7795>")
                                                      var x=3;
                                                  var spanArray = /\((\d+), (\d+)\)/.exec(spans)
                                                  if (spanArray.length == 3)
                                                      str += paragraphUrl + " <http://open.vocab.org/terms/hasOffset> \"" + key+"|"+entityId + "|" + spanArray[1] + "|" + spanArray[2] + "\" .\n";
                                                  else
                                                      var x = 4;
                                              }

                                              if (quantumMap[entityId]) {
                                                  var quantumURI = quantumMap[entityId]["Quantum_URI"]
                                                  // quantumURI=quantumURI.trim()
                                                  strEntities += "<" + entityId + ">  <http://www.w3.org/2004/02/skos/core#exactMatch> <" + quantumURI + "> .\n"
                                                  strEntities += "<" + entityId + ">  <http://www.w3.org/2004/02/skos/core#definition> \"" + formatString(quantumMap[entityId].Definition) + "\"@en .\n"
                                              }
                                          }

                                      })

                                  }
                                  for (var key in litteralEntities) {
                                      var entityId = item[key]
                                      if (entityId && entityId != "") {
                                         entityId = "<http://data.total.com/resource/ontology/ctg/entity/" + key + "/" + formatString(entityId) + ">"

                                               if (uniqueEntities.indexOf(entityId < 0)) {
                                                   uniqueEntities.push(entityId);
                                                   strEntities += "<" + entityId + ">  <http://www.w3.org/2000/01/rdf-schema#label> \"" + formatString(item[key]) + "\"@en .\n";
                                                   strEntities += entityId + " <https://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://data.total.com/resource/ontology/ctg/EntityType/" + key + "> .\n"
                                               }
                                          str += paragraphUrl + " <http://data.total.com/resource/ontology/ctg/properties#"+key+">" + "<" + entityId + ">.\n"
                                      }
                                  }
                               }*/

                })


                var strAll = strDocs + strEntities + str;


                fs.writeFileSync("D:\\NLP\\rdfs\\Total\\ontology.rdf.nt", strAll)
            },


        ], function (err) {
            if (err)
                return callback(err)
            return callback(null, dataArray);
        })


    },
    readCsv: function (filePath, separator, lines, callback) {

        var headers = [];
        var jsonData = [];
        var jsonDataFetch = [];
        var startId = 100000
        fs.createReadStream(filePath)
            .pipe(csv(
                {
                    separator: separator,


                })
                .on('header', function (header) {
                    headers.push(header);

                })

                .on('data', function (data) {


                    jsonDataFetch.push(data)

                    if (lines && jsonDataFetch.length >= lines) {
                        jsonData.push(jsonDataFetch);
                        jsonDataFetch = [];
                    }


                })
                .on('end', function () {
                    jsonData.push(jsonDataFetch);
                    return callback(null, {headers: headers, data: jsonData})
                })
            );


    },
    loaSourceFile: function (file) {


        var str = "" + fs.readFileSync(file);
        var lines = str.split("\n");

        var headers = lines[0].split("\t")


        var jsonArray = []
        lines.forEach(function (line) {
            var values = line.split("\t")
            if (values.length > headers.length)
                return "error"
            var obj = {}
            values.forEach(function (value, index) {
                obj[headers[index]] = value
            })
            jsonArray.push(obj)


        })


    },
    buildNTfile: function () {
        /*  var jsonArray = ontologyCTG.loaSourceFile("D:\\NLP\\rdfs\\Total\\extractEntities_03_20.txt");
          var jsonArrayQuantum = ontologyCTG.loaSourceFile("D:\\NLP\\rdfs\\Total\\quantum_thesaurusMapping.txt");*/

        ontologyCTG.readCsv("D:\\NLP\\rdfs\\Total\\extractEntities_03_20.txt", "\t", null, function (err, jsonArray) {
            ontologyCTG.readCsv("D:\\NLP\\rdfs\\Total\\quantum_thesaurusMapping.txt", "\t", null, function (err, jsonArrayQuantum) {
                jsonArray = jsonArray.data[0]
                jsonArrayQuantum = jsonArrayQuantum.data[0]


                var quantumMap = {};
                jsonArrayQuantum.forEach(function (item) {
                    quantumMap[item.ctg_id] = item;
                })

                var entityIdCount = 0
                var chaptersMap = {}
                var docsMap = {}

                /*
                Equipment
Component
Phenomenon
Product
Characterisation
Method
Time
Temperature
Vibration

                 */
                var entitiesMap = {
                    Equipment: {},
                    Component: {},
                    Phenomenon: {},
                    Product: {},
                    Characterisation: {},
                    Method: {},
                }
                var litteralEntities = {
                    Time: {},
                    Temperature: {},
                    Vibration: {},


                }

                var uniqueEntities = [];
                var str = ""
                var strEntities = "";
                var strDocs = ""

                /*    for (var key in entitiesMap) {
                        strEntities += "<http://data.total.com/resource/vocabulary/" + key + "> <http://www.w3.org/2000/01/rdf-schema#label> \"" + key + "\"@en .\n"
                    }
                    for (var key in litteralEntities) {
                        strEntities += "<http://data.total.com/resource/vocabulary/" + key + "> <http://www.w3.org/2000/01/rdf-schema#label> \"" + key + "\"@en .\n"
                    }*/


                function formatString(str) {


                    str = str.replace(/"/gm, "\\\"")
                    str = str.replace(/;/gm, " ")
                    return str;
                }

                for (var key in entitiesMap) {
                    strEntities += "<http://data.total.com/resource/ontology/ctg/EntityType/" + key + "> <http://www.w3.org/2000/01/rdf-schema#label> \"" + key + "\"@en .\n"
                }


                jsonArray.forEach(function (item, index) {


                    if (index == 0)
                        return;
                    var paragraphUrl = "<http://data.total.com/resource/ontology/ctg/Paragraph/" + item.ID + ">"
                    //    str += paragraphUrl + " <https://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http:http://data.total.com/resource/ontology/ctg//" + "simple" + "> .\n"


                    //   console.log(JSON.stringify(item,null,2))
                    if (item.Document && item.Document != "") {
                        if (!docsMap[item.Document]) {
                            var docId = 1000 + Object.keys(docsMap).length
                            docsMap[item.Document] = "<http://data.total.com/resource/ontology/ctg/Document/" + docId + ">"
                            strDocs += docsMap[item.Document] + " <https://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http:http://data.total.com/resource/ontology/ctg/DocumentType/" + "GM_MEC" + "> .\n"
                            strDocs += docsMap[item.Document] + " <http://www.w3.org/2000/01/rdf-schema#label> \"" + formatString(item.Document) + "\"@en .\n"

                        }
                        str += paragraphUrl + " <http://purl.org/dc/terms/isPartOf> " + docsMap[item.Document] + ".\n"


                    }

                    for (var i = 1; i < 4; i++) {
                        var chapterName = item["ChapterTitle" + i]
                        if (chapterName && chapterName.trim() != "") {
                            var chapterUri = "<http://data.total.com/resource/ontology/ctg/Chapter/" + item.ID + "_" + i + ">"
                            //   strDocs += chapterUri + " <https://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http:http://data.total.com/resource/ontology/ctg/ChapterType/" + "Chapter1" + "> .\n"

                            //    strDocs += chapterUri + " <http://www.w3.org/2000/01/rdf-schema#label> \"" + formatString(chapterName.trim()) + "\"@en .\n"

                            str += paragraphUrl + " <http://purl.org/dc/terms/isPartOf> \"" + i + "_" + formatString(chapterName.trim()) + "\"@en .\n"
                        }
                    }

                    var text = item.ParagraphText;
                    if (text && text.length > 5) {
                        text = text.replace(/"/gm, "")
                        text = text.replace(/[;]/gm, "")
                        str += paragraphUrl + " <http://purl.org/dc/dcmitype/Text> \"" + formatString(text) + "\"@en .\n"
                    }


                    for (var key in entitiesMap) {
                        var key2 = key + "_URI"
                        var entityIds = item[key2]

                        entityIds.split(";").forEach(function (entityId, entityIndex) {
                            var entityNames = item[key].split(";")
                            if (entityId && entityId != "") {
                                if (uniqueEntities.indexOf(entityId) < 0) {
                                    uniqueEntities.push(entityId);
                                    strEntities += "<" + entityId + ">  <http://www.w3.org/2000/01/rdf-schema#label> \"" + formatString(entityNames[entityIndex]) + "\"@en .\n";
                                    strEntities += "<" + entityId + "> <https://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://data.total.com/resource/ontology/ctg/EntityType/" + key + "> .\n"
                                }

                                str += paragraphUrl + " <http://purl.org/dc/terms/subject> " + "<" + entityId + ">.\n"

                                var keySpan = key + "_Span"
                                var spans = item[keySpan];
                                if (spans && spans != "[]") {

                                    if (paragraphUrl == "<http://data.total.com/resource/ontology/ctg/Paragraph/7795>")
                                        var x = 3;
                                    var spanArray = /\((\d+), (\d+)\)/.exec(spans)
                                    if (spanArray.length == 3)
                                        str += paragraphUrl + " <http://open.vocab.org/terms/hasOffset> \"" + key + "|" + entityId + "|" + spanArray[1] + "|" + spanArray[2] + "\" .\n";
                                    else
                                        var x = 4;
                                }

                                if (quantumMap[entityId]) {
                                    var quantumURI = quantumMap[entityId]["Quantum_URI"]
                                    // quantumURI=quantumURI.trim()
                                    strEntities += "<" + entityId + ">  <http://www.w3.org/2004/02/skos/core#exactMatch> <" + quantumURI + "> .\n"
                                    strEntities += "<" + entityId + ">  <http://www.w3.org/2004/02/skos/core#definition> \"" + formatString(quantumMap[entityId].Definition) + "\"@en .\n"
                                }
                            }

                        })

                    }
                    for (var key in litteralEntities) {
                        var entityId = item[key]
                        if (entityId && entityId != "") {
                            /* entityId = "<http://data.total.com/resource/ontology/ctg/entity/" + key + "/" + formatString(entityId) + ">"

                                 if (uniqueEntities.indexOf(entityId < 0)) {
                                     uniqueEntities.push(entityId);
                                     strEntities += "<" + entityId + ">  <http://www.w3.org/2000/01/rdf-schema#label> \"" + formatString(item[key]) + "\"@en .\n";
                                     strEntities += entityId + " <https://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://data.total.com/resource/ontology/ctg/EntityType/" + key + "> .\n"
                                 }*/
                            str += paragraphUrl + " <http://data.total.com/resource/ontology/ctg/properties#" + key + ">" + "<" + entityId + ">.\n"
                        }
                    }
                })

                var strAll = strDocs + strEntities + str;


                fs.writeFileSync("D:\\NLP\\rdfs\\Total\\ontology.rdf.nt", strAll)
            })
        })

    },
    buildNTfile0: function () {
        var jsonArray = ontologyCTG.loaSourceFile();

        var entityIdCount = 0
        var chaptersMap = {}
        var docsMap = {}
        var entitiesMap = {
            Equipment: {},
            Component: {},
            Phenomenon: {},
            Characterisation: {},
            Method: {},
            Time: {},
            Temperature: {}

        }
        var str = ""
        var strEntities = "";
        var strDocs = ""
        for (var key in entitiesMap) {
            strEntities += "<http://onto.ctg.total.com#EntityType/" + key + "> <http://www.w3.org/2000/01/rdf-schema#label> \"" + key + "\"@en .\n"
        }


        jsonArray.forEach(function (item, index) {


            if (index == 0)
                return;
            var paragraphUrl = "<http://onto.ctg.total.com#Paragraph/" + item.ID + ">"
            str += paragraphUrl + " <https://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://onto.ctg.total.com#ParagraphType/" + "simple" + "> .\n"

            if (item.Document && item.Document != "") {
                if (!docsMap[item.Document]) {
                    var docId = 1000 + Object.keys(docsMap).length
                    docsMap[item.Document] = "<http://onto.ctg.total.com#Document/" + docId + ">"
                    strDocs += docsMap[item.Document] + " <https://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://onto.ctg.total.com#DocumentType/" + "GM_MEC" + "> .\n"
                    strDocs += docsMap[item.Document] + " <http://www.w3.org/2000/01/rdf-schema#label> \"" + item.Document + "\"@en .\n"
                }


            }

            var text = item.ParagraphText;
            if (text && text.length > 5) {
                text = text.replace(/"/gm, "")
                text = text.replace(/[;]/gm, "")
                str += paragraphUrl + " <http://purl.org/dc/dcmitype/Text> \"" + text + "\"@en .\n"
            }


            for (var key in entitiesMap) {

                if (item[key] && item[key] != "") {
                    item[key].split(";").forEach(function (entity) {
                        var entityName = entity.replace(/"/g, "");


                        if (!entitiesMap[key][entityName]) {
                            var entityId = (entityIdCount++) + 1000
                            entitiesMap[key][entityName] = "<http://onto.ctg.total.com#Entity/" + entityId + ">"

                            strEntities += entitiesMap[key][entityName] + " <http://www.w3.org/2000/01/rdf-schema#label> \"" + entityName + "\"@en .\n"
                            //  strEntities += entitiesMap[key][entityName] + " <https://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://onto.ctg.total.com#EntityType/" + key + "> .\n"


                        }

                        str += paragraphUrl + " <http://purl.org/dc/terms/subject> " + entitiesMap[key][entityName] + ".\n"
                    })
                }
            }


        })

        var strAll = strDocs + strEntities + str;

        strAll = strAll.replace(/""/gm, "\"")
        strAll = strAll.replace(/;/gm, "")
        fs.writeFileSync("D:\\Total\\graphNLP\\ontology.rdf.nt", strAll)


    }


}

module.exports = ontologyCTG


ontologyCTG.readXlsx("D:\\NLP\\rdfs\\Total\\OntoMEC_20200401.xlsx", function (err, result) {

})

//ontologyCTG.buildNTfile();
