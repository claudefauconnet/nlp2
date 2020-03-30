var fs = require('fs');
const csv = require('csv-parser')
var ontologyCTG = {

    readCsv: function (filePath,separator, lines, callback) {

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

        return jsonArray


    },
    buildNTfile: function () {
      /*  var jsonArray = ontologyCTG.loaSourceFile("D:\\NLP\\rdfs\\Total\\extractEntities_03_20.txt");
        var jsonArrayQuantum = ontologyCTG.loaSourceFile("D:\\NLP\\rdfs\\Total\\quantum_thesaurusMapping.txt");*/

        ontologyCTG.readCsv("D:\\NLP\\rdfs\\Total\\extractEntities_03_20.txt","\t",null,function(err, jsonArray) {
            ontologyCTG.readCsv("D:\\NLP\\rdfs\\Total\\quantum_thesaurusMapping.txt", "\t", null, function (err, jsonArrayQuantum) {
                jsonArray=jsonArray.data[0]
                jsonArrayQuantum=jsonArrayQuantum.data[0]


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
            Characterisation: {},
            Method: {},
        }
        var litteralEntities = {
            Time: {},
            Temperature: {},
            Vibration: {},


        }
        var str = ""
        var strEntities = "";
        var strDocs = ""
    /*    for (var key in entitiesMap) {
            strEntities += "<http://data.total.com/resource/vocabulary/" + key + "> <http://www.w3.org/2000/01/rdf-schema#label> \"" + key + "\"@en .\n"
        }
        for (var key in litteralEntities) {
            strEntities += "<http://data.total.com/resource/vocabulary/" + key + "> <http://www.w3.org/2000/01/rdf-schema#label> \"" + key + "\"@en .\n"
        }*/



    function formatString(str){


                    str = str.replace(/"/gm, "\\\"")
                    str = str.replace(/;/gm, " ")
        return str;
                }

        jsonArray.forEach(function (item, index) {


            if (index == 0)
                return;
            var paragraphUrl = "<http://data.total.com/resource/ontology/Paragraph/" + item.ID + ">"
       //    str += paragraphUrl + " <https://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http:http://data.total.com/resource/ontology//" + "simple" + "> .\n"


         //   console.log(JSON.stringify(item,null,2))
            if (item.Document && item.Document != "") {
                if (!docsMap[item.Document]) {
                    var docId = 1000 + Object.keys(docsMap).length
                    docsMap[item.Document] = "<http://data.total.com/resource/ontology/Document/" + docId + ">"
                    strDocs += docsMap[item.Document] + " <https://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http:http://data.total.com/resource/ontology/DocumentType/" + "GM_MEC" + "> .\n"
                    strDocs += docsMap[item.Document] + " <http://www.w3.org/2000/01/rdf-schema#label> \"" + formatString(item.Document) + "\"@en .\n"

                }
                str += paragraphUrl + " <http://purl.org/dc/terms/isPartOf> " + docsMap[item.Document] + ".\n"


            }

            for (var i = 1; i < 4; i++) {
                var chapterName=item["ChapterTitle" + i]
                if (chapterName && chapterName.trim() != "") {
                    var chapterUri = "<http://data.total.com/resource/ontology/Chapter/" + item.ID + "_"+i+">"
                 //   strDocs += chapterUri + " <https://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http:http://data.total.com/resource/ontology/ChapterType/" + "Chapter1" + "> .\n"
                    if(chapterUri=="<http://data.total.com/resource/ontology/Chapter/3047_1>")
                        var x=3
                    strDocs += chapterUri + " <http://www.w3.org/2000/01/rdf-schema#label> \"" + formatString(chapterName.trim()) + "\"@en .\n"

                    str += paragraphUrl + " <http://purl.org/dc/terms/isPartOf> " + chapterUri + ".\n"
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
                entityIds.split(";").forEach(function(entityId,entityIndex){
                    var entityNames=entitiesMap[key].split(";")
                if (entityId && entityId != "") {
                    strEntities += "<" + entityId + ">  <http://www.w3.org/2000/01/rdf-schema#label> \"" + entityNames[entityIndex] + "\"@en .\n";
                    str += paragraphUrl + " <http://purl.org/dc/terms/subject> " + "<" + entityId + ">.\n"

                    var keySpan = key + "_Span"
                    var spans = item[keySpan];
                    if(spans && spans!="[]"){

                        var spanArray=/\((\d+), (\d+)\)/.exec(spans)
                        if(spanArray.length==3)
                          str+=paragraphUrl + " <http://open.vocab.org/terms/hasOffset> \""+ entityId+":"+spanArray[1]+"_"+spanArray[2] + "\" .\n";
                          else
                              var x=4;
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
                var key2 = key
                var entityId = item[key2]
                if (entityId && entityId != "") {
                    strEntities += "<" + entityId + ">  <http://www.w3.org/2000/01/rdf-schema#label> \"" + entitiesMap[key] + "\"@en .\n";
                    str += paragraphUrl + " <http://purl.org/dc/terms/subject> " +"\"" + formatString(entityId )+ "\" .\n"
                }
            }
        })


           /*     strDocs = strDocs.replace(/""/gm, "\"")
                strDocs = strDocs.replace(/;/gm, "")

                strEntities = strEntities.replace(/""/gm, "\"")
                strEntities = strEntities.replace(/;/gm, "")

                str = str.replace(/""/gm, "\"")
                str = str.replace(/;/gm, "")*/

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
                            strEntities += entitiesMap[key][entityName] + " <https://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://onto.ctg.total.com#EntityType/" + key + "> .\n"


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

ontologyCTG.buildNTfile()
