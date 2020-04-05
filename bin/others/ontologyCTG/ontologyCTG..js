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
                var uniqueResource = [];
                var str = ""
                var strEntities = "";
                var strDocs = "";

                var strRelations = "";
                var relationsCounter = 1000;
                var resourceStr = ""


                function formatString(str) {
                    if (!str.replace)
                        var x = 3

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

                    var docId
                    if (index == 0)
                        return;
                    var paragraphUrl = "<http://data.total.com/resource/ontology/ctg/Paragraph/" + item.ID + ">"
                    //    str += paragraphUrl + " <https://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http:http://data.total.com/resource/ontology/ctg//" + "simple" + "> .\n"


                    //   console.log(JSON.stringify(item,null,2))
                    if (item.Document && item.Document != "") {
                        if (!docsMap[item.Document]) {
                            docId = 1000 + Object.keys(docsMap).length
                            docsMap[item.Document] = "<http://data.total.com/resource/ontology/ctg/Document/" + docId + ">"
                            strDocs += docsMap[item.Document] + " <https://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http:http://data.total.com/resource/ontology/ctg/DocumentType/" + "GM_MEC" + "> .\n"
                            strDocs += docsMap[item.Document] + " <http://www.w3.org/2000/01/rdf-schema#label> \"" + formatString(item.Document) + "\"@en .\n"


                            resourceStr += docsMap[item.Document]   + " <http://www.w3.org/2004/02/skos/core#prefLabel> \""+ formatString(item.Document)+"\" .\n"
                            resourceStr += docsMap[item.Document]   + " <http://www.w3.org/2004/02/skos/core#inScheme> <http://data.total.com/resource/ontology/ctg/Document> .\n";

                            var arrayDoc=item.Document.split("_");
                            if(arrayDoc.length==6){
                                var domain="<http://data.total.com/resource/ontology/ctg/Domain/"+arrayDoc[2]+">";
                                var branch="<http://data.total.com/resource/ontology/ctg/Branch/"+arrayDoc[2]+"_"+arrayDoc[1]+">";
                                var docType="<http://data.total.com/resource/ontology/ctg/Document-type/"+arrayDoc[2]+"_"+arrayDoc[1]+"_"+arrayDoc[0]+">";

                                if(uniqueResource.indexOf(domain)<0) {
                                    uniqueResource.push(domain);
                                    resourceStr += domain + " <http://www.w3.org/2004/02/skos/core#prefLabel> \"" + arrayDoc[2] + "\" .\n";
                                    resourceStr += domain  + " <http://www.w3.org/2004/02/skos/core#inScheme> <http://data.total.com/resource/ontology/ctg/Domain> .\n";

                                }
                                if(uniqueResource.indexOf(branch)<0) {
                                    uniqueResource.push(branch);
                                    resourceStr += branch + " <http://www.w3.org/2004/02/skos/core#prefLabel> \"" + arrayDoc[1] + "\" .\n";
                                    resourceStr += branch  + " <http://www.w3.org/2004/02/skos/core#inScheme> <http://data.total.com/resource/ontology/ctg/Branch> .\n";

                                }
                                if(uniqueResource.indexOf(docType)<0) {
                                    uniqueResource.push(docType);
                                    resourceStr += docType + " <http://www.w3.org/2004/02/skos/core#prefLabel> \"" + arrayDoc[0] + "\" .\n";
                                    resourceStr += docType  + " <http://www.w3.org/2004/02/skos/core#inScheme> <http://data.total.com/resource/ontology/ctg/Document-type> .\n";

                                }

                                resourceStr += branch  + " <http://www.w3.org/2004/02/skos/core#broader> "+domain+" .\n";
                                resourceStr += docType  + " <http://www.w3.org/2004/02/skos/core#broader> "+branch+" .\n";
                                resourceStr += docsMap[item.Document]  + " <http://www.w3.org/2004/02/skos/core#broader> "+docType+" .\n";

                            }
                            else{
                                var x=3;
                            }

                        }
                        str += paragraphUrl + " <http://purl.org/dc/terms/isPartOf> " + docsMap[item.Document] + ".\n"


                    }

                    for (var i = 1; i < 4; i++) {
                        var chapterName = item["ChapterTitle" + i]
                        if (chapterName && chapterName.trim() != "") {
                            var chapterUri = "<http://data.total.com/resource/ontology/ctg/Chapter/" + item.ID + "_" + i + ">"
                            //   strDocs += chapterUri + " <https://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http:http://data.total.com/resource/ontology/ctg/ChapterType/" + "Chapter1" + "> .\n"

                            //    strDocs += chapterUri + " <http://www.w3.org/2000/01/rdf-schema#label> \"" + formatString(chapterName.trim()) + "\"@en .\n"
                            if (i == 1) {
                               var  topChapterLabel = chapterName.trim();
                                if (!chaptersMap[docId + "_" + topChapterLabel]) {
                                    var chapterId = 1000 + Object.keys(chaptersMap).length
                                    var topChapterUrl = "<http://data.total.com/resource/ontology/ctg/Chapter/" + chapterId + ">"
                                    chaptersMap[docsMap[item.Document] + "_" + topChapterLabel] =topChapterUrl;

                                }
                                topChapterUrl=chaptersMap[ docsMap[item.Document] + "_" + topChapterLabel];
                                str += paragraphUrl + " <http://purl.org/dc/terms/isPartOf> \"" + i + "_" + formatString(chapterName.trim()) + "\"@en .\n"

                                resourceStr += paragraphUrl + " <http://www.w3.org/2004/02/skos/core#prefLabel> \"" + item.ID + "\" .\n"
                                resourceStr += paragraphUrl + " <http://www.w3.org/2004/02/skos/core#inScheme> <http://data.total.com/resource/ontology/ctg/Paragraph> .\n";
                                resourceStr += paragraphUrl + " <http://www.w3.org/2004/02/skos/core#broader> " + topChapterUrl + " .\n"


                                resourceStr += topChapterUrl + " <http://www.w3.org/2004/02/skos/core#prefLabel> \"" + chapterName.trim() + "\" .\n"
                                resourceStr += topChapterUrl + " <http://www.w3.org/2004/02/skos/core#inScheme> <http://data.total.com/resource/ontology/ctg/Chapter> .\n";
                                resourceStr += topChapterUrl + " <http://www.w3.org/2004/02/skos/core#broader> " +   docsMap[item.Document] + " .\n"
                            }
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
                    if (entitiesUriStr && entitiesUriStr.split) {

                        entitiesUriStr.split(";").forEach(function (itemEntity, indexX) {
                            var splitArray = itemEntity.split("|")
                            var entityId = splitArray[2]
                            var type = splitArray[0]
                            var label = splitArray[1]
                            if (!label)
                                return console.log("ERROR " + paragraphUrl + " :  " + splitArray.toString());

                            if (uniqueEntities.indexOf(entityId) < 0) {
                                uniqueEntities.push(entityId);
                                strEntities += "<" + entityId + ">  <http://www.w3.org/2000/01/rdf-schema#label> \"" + formatString(label) + "\"@en .\n";
                                strEntities += "<" + entityId + "> <https://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://data.total.com/resource/ontology/ctg/EntityType/" + type + "> .\n"
                            }

                            str += paragraphUrl + " <http://purl.org/dc/terms/subject> " + "<" + entityId + ">.\n"
                            str += paragraphUrl + " <http://open.vocab.org/terms/hasOffset> \"" + itemEntity + "\" .\n";

                            if (quantumMap[entityId]) {
                                var quantumURI = quantumMap[entityId]["Quantum_URI"]
                                // quantumURI=quantumURI.trim()
                                strEntities += "<" + entityId + ">  <http://www.w3.org/2004/02/skos/core#exactMatch> <" + quantumURI + "> .\n"
                                strEntities += "<" + entityId + ">  <http://www.w3.org/2004/02/skos/core#definition> \"" + formatString(quantumMap[entityId].Definition) + "\"@en .\n"
                            }


                        })
                    }

                    for (var key in litteralEntities) {
                        var entityValue = item[key]
                        if (entityValue && entityValue != "") {
                            str += paragraphUrl + " <http://data.total.com/resource/ontology/ctg/properties#" + key + ">" + "<" + entityValue + ">.\n"
                        }
                    }


                    var relationsStr0 = item["RDF_Triple"];
                    if (relationsStr0 && relationsStr0 != "[]") {
                        var relationTypeUri = "http://data.total.com/resource/ontology/ctg/relation#"
                        var relationUri = "http://data.total.com/resource/ontology/ctg/Relation/" + (relationsCounter++);

                        relationsStr0 = relationsStr0.replace(/\),\s\(/g, ";")
                        relationsStr0 = relationsStr0.replace(/[\['\]\(\)]/g, "")

                        relationsStr0.split(";").forEach(function (relationStr) {
                            var array = relationStr.split(",")
                            if (array.length == 3) {
                                var subject = array[0];
                                var predicate = array[1].trim();
                                var object = array[2].trim();
                                strRelations += "<" + subject + "> <" + relationTypeUri + predicate + "> <" + object + ">.\n"
                                /*   strRelations += "<" + subject + "> <" + relationTypeUri + predicate + "> <" + object + "> <" + relationUri + ">.\n"
                                   str += paragraphUrl + " <http://data.total.com/resource/ontology/ctg/properties#hasTriple>  " + relationUri + " .\n"*/
                            }

                        })


                    }


                })


                var strAll = strDocs + strEntities + str ;


                fs.writeFileSync("D:\\NLP\\rdfs\\Total\\ontology.rdf.nt", strAll)
                fs.writeFileSync("D:\\NLP\\rdfs\\Total\\ontologyTriples.rdf.nt", strRelations)
                fs.writeFileSync("D:\\NLP\\rdfs\\Total\\resources.rdf.nt", resourceStr)
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



}

module.exports = ontologyCTG


ontologyCTG.readXlsx("D:\\NLP\\rdfs\\Total\\OntoMEC_triplet_20200402.xlsx", function (err, result) {

})

//ontologyCTG.buildNTfile();
