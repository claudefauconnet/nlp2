var fs = require('fs');
const csv = require('csv-parser')
const async = require('async');

var ontologyQuantum = {
    readXlsx: function (filePath, feuille, callback) {
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

                var worksheet = sheets[feuille]
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


                jsonArray = dataArray


                var conceptsMap = {}
                var disciplinesMap = {}
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

                if (feuille == "Feuil1") {


                    jsonArray.forEach(function (item, index) {
                        if (!item.ID.substring)
                            return;
                        item.ID = item.ID.substring(6)
                        if (!conceptsMap[item.ID]) {
                            conceptsMap[item.ID] = "<http://data.total.com/resource/ontology/quantum/PhyscicalClass/" + item.ID + ">";
                            strEntities +=conceptsMap[item.ID]+ " <http://www.w3.org/2004/02/skos/core#prefLabel> \"" + formatString(item.Name) + "\" .\n"
                            strEntities +=conceptsMap[item.ID]+ " <http://www.w3.org/2004/02/skos/core#definition> \"" + formatString(item.Definition) + "\" .\n"
                            if (item.ParentPhysicalClassID && item.ParentPhysicalClassID.substring) {
                                var parent = item.ParentPhysicalClassID.substring(6)
                                strEntities += conceptsMap[item.ID] + " <http://www.w3.org/2004/02/skos/core#broader> " + "<http://data.total.com/resource/ontology/quantum/PhyscicalClass/" + parent + "> .\n"
                            }

                        }

                        item.DisciplineID = item.DisciplineID.substring(6)
                        if (!disciplinesMap[item.DisciplineID]) {
                            disciplinesMap[item.DisciplineID] = "<http://data.total.com/resource/ontology/quantum/Discipline/" + item.DisciplineID + ">"
                            strEntities += disciplinesMap[item.DisciplineID] + "  <http://www.w3.org/2004/02/skos/core#prefLabel> \"" + item["Lookup_Discipline"] + "\" .\n"
                        }
                        strEntities += conceptsMap[item.ID] + " <http://purl.org/dc/terms/subject> " + disciplinesMap[item.DisciplineID] + " .\n"
                    })


                    jsonArray.forEach(function (item, index) {

                        // item.DisciplineID=item.DisciplineID.substring(6)
                        var xx = disciplinesMap[item.DisciplineID]
                        strEntities += conceptsMap[item.ID] + "  <http://purl.org/dc/terms/subject> " + disciplinesMap[item.DisciplineID] + ".\n"


                    })


                    var strAll = strEntities;


                    fs.writeFileSync("D:\\NLP\\rdfs\\Total\\ontology.quantum.rdf.nt", strAll);
                }
                if (feuille == "Feuil3") {
                    jsonArray.forEach(function (item, index) {
                        if (!item.ID.substring)
                            return;
                        item.ID = item.ID.substring(6)
                        if (!conceptsMap[item.ID]) {
                            conceptsMap[item.ID] = "<http://data.total.com/resource/ontology/quantum/Attribute/" + item.ID + ">";
                            strEntities += conceptsMap[item.ID]+ " <http://www.w3.org/2004/02/skos/core#prefLabel> \"" + formatString(item.Name) + "\" .\n"
                            strEntities += conceptsMap[item.ID]+ " <http://www.w3.org/2004/02/skos/core#definition> \"" + formatString(item.Definition) + "\" .\n"


                        }


                    })

                    var strAll = strEntities;
                    fs.writeFileSync("D:\\NLP\\rdfs\\Total\\ontology.quantumAttr.rdf.nt", strAll);
                }

        if (feuille == "Feuil2") {
            jsonArray.forEach(function (item, index) {
                if (!item.AttributeID.substring)
                    return;
                item.AttributeID = item.AttributeID.substring(6)
                item.PhysicalClassID = item.PhysicalClassID.substring(6)
                    strEntities += "<http://data.total.com/resource/ontology/quantum/Attribute/" + item.AttributeID + "> <http://www.w3.org/2004/02/skos/core#broader> <http://data.total.com/resource/ontology/quantum/PhyscicalClass/" +item.PhysicalClassID+ "> .\n"
            })

            var strAll = strEntities;
            fs.writeFileSync("D:\\NLP\\rdfs\\Total\\ontology.quantumAttrBorader.rdf.nt", strAll);
        }
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

module.exports = ontologyQuantum


ontologyQuantum.readXlsx("D:\\NLP\\rdfs\\Total\\quantumPhysicalClasses.xlsx", "Feuil1", function (err, result) {

})

//ontologyCTG.buildNTfile();
