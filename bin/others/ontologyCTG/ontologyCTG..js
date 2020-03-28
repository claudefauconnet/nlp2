var fs = require('fs');

var ontologyCTG = {

    loaSourceFile: function () {

        var file = "D:\\Total\\graphNLP\\export_doc_chapter_neo_2.txt"

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
        var jsonArray = ontologyCTG.loaSourceFile();


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
            strEntities += "<http://onto.ctg.total.com#EntityType/"+ key+ "> <http://www.w3.org/2000/01/rdf-schema#label> \"" + key + "\"@en .\n"
        }


        jsonArray.forEach(function (item, index) {


            if (index == 0)
                return;
            var paragraphUrl = "<http://onto.ctg.total.com#Paragraph/" + item.ID + ">"
            str += paragraphUrl + " <https://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://onto.ctg.total.com#ParagraphType/"+ "simple"+ "> .\n"

            if (item.Document && item.Document != "") {
                if (!docsMap[item.Document]) {
                    var docId = 1000 + Object.keys(docsMap).length
                    docsMap[item.Document] = "<http://onto.ctg.total.com#Document/" + docId + ">"
                    strDocs += docsMap[item.Document] + " <https://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://onto.ctg.total.com#DocumentType/"+ "GM_MEC"+ "> .\n"
                    strDocs += docsMap[item.Document] + " <http://www.w3.org/2000/01/rdf-schema#label> \"" + item.Document + "\"@en .\n"
                }


            }

            var text=item.ParagraphText;
            if(text && text.length>5) {
                text = text.replace(/"/gm, "")
                text = text.replace(/[;]/gm, "")
                str += paragraphUrl + " <http://purl.org/dc/dcmitype/Text> \"" + text + "\"@en .\n"
            }


            for (var key in entitiesMap) {

                if (item[key] && item[key] != "") {
                    item[key].split(";").forEach(function (entity) {
                        var entityName = entity.replace(/"/g, "");


                        if (!entitiesMap[key][entityName]) {
                            var entityId =(Object.keys(entitiesMap).length*1000) + Object.keys(entitiesMap[key]).length
                            entitiesMap[key][entityName] = "<http://onto.ctg.total.com#Entity/" + entityId + ">"

                            strEntities += entitiesMap[key][entityName] + " <http://www.w3.org/2000/01/rdf-schema#label> \"" + entityName + "\"@en .\n"
                            strEntities += entitiesMap[key][entityName] + " <https://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://onto.ctg.total.com#EntityType/"+ key+ "> .\n"


                        }

                        str += paragraphUrl + " <http://purl.org/dc/terms/subject> " + entitiesMap[key][entityName] + ".\n"
                    })
                }
            }


        })

        var strAll=strDocs+strEntities+str;

        strAll=strAll.replace(/""/gm,"\"")
        strAll=strAll.replace(/;/gm,"")
        fs.writeFileSync("D:\\Total\\graphNLP\\ontology.rdf.nt", strAll)


    }


}

module.exports = ontologyCTG

ontologyCTG.buildNTfile()
