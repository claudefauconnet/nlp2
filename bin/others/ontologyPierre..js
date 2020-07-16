const fs = require('fs');
const csv = require('csv-parser')

var ontologyPierre = {


    readCsv: function (filePath, lines, callback) {

        var headers = [];
        var jsonData = [];
        var jsonDataFetch = [];
        var startId = 100000
        var separator = "\t";
        fs.createReadStream(filePath)
            .pipe(csv(
                {
                    separator: separator,
                    /*  mapHeaders: ({header, index}) =>
                          util.normalizeHeader(headers, header)
                      ,*/


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

    }
    , extractMSRs: function (json, callback) {

        function findNotes(noteNumber, index) {

            for (var i = index; i < index + 20; i++) {
                if (json[i].content == noteNumber)
                    return json[i].content
            }
            return noteNumber


        }


        var MSRs = []
        json.forEach(function (item, itemLine) {

            if (item.isArray) {

                if (item.content.indexOf(":MSR") > -1) {
                    //MSR1,Key Parameter:Inlet Pressure,Unit:barg,Lower limit:P° and T° minimum shall be defined to avoid condensates in the turbine,Upper limit:~ 5% below MAWP,Notes:(1)
//idLine	doc	chapterNumber	titlePath	isArray	content

                    var cells = item.content.split(",");
                    var lineObj = {}
                    cells.forEach(function (line, index) {
                        var array2 = line.split(":");
                        if (array2[0] == "")
                            array2[0] = "MSRref"
                        lineObj[array2[0]] = array2[1]
                    })


                    var obj = {
                        id: item.idLine,
                        doc: item.doc,
                        chapterNumber: item.chapterNumber,
                        MSRref: lineObj.MSRref,
                        keyParameter: lineObj["Key Parameter"],
                        unit: lineObj["Unit"],
                        lowerLimit: lineObj["Lower limit"],
                        upperLimit: lineObj["Upper limit"],
                        notes: lineObj["Notes"],

                        equipment: item.titlePath.replace("Key Parameters per machine type/", ""),


                    }
                    obj.notes = findNotes(obj.notes, itemLine)


                    MSRs.push(obj);


                }


            }


        })
        callback(null, MSRs)


    },

    /*
    {
      "id": "13",
      "doc": "GM-RC-MEC-517",
      "chapterNumber": "3.1",
      "MSRref": "MSR5",
      "keyParameter": "Axial displacement",
      "unit": "mm",
      "lowerLimit": "-",
      "upperLimit": "Based on axial clearance of the rotor in the casing and thickness of the babbit",
      "notes": "",
      "equipment": "/Back Pressure Steam Turbines/"
    }



     */


    generateRDF_NT: function (MSRs, callback) {
        var predicateMappings = {

            doc: {uri: "http://data.15926.org/cfihos/10000168", label: "Document title"},
            chapterNumber: {uri: "http://data.total.com/CTG/schema/chapterNumber", label: "Chapter"},
            equipment: {uri: "http://data.15926.org/rdl/RDS8615020", label: "EQUIPMENT CLASS"},
            MSRref: {uri: "http://data.total.com/CTG/schema/MSRnumber", label: "MSRnumber"},
            id: {uri: "http://data.total.com/CTG/schema/MSRid", label: "MSRnumber"},
            keyParameter: {uri: "http://data.15926.org/dm/Property", label: "Property"},
            lowerLimit: {uri: "http://data.total.com/CTG/schema/lowerLimit", label: "lowerLimit"},
            upperLimit: {uri: "http://data.total.com/CTG/schema/upperLimit", label: "upperLimit"},
            notes: {uri: "\thttp://data.15926.org/rdl/RDS7006801", label: "DESCRIPTION DEFINITION"},


        }
        var str = "";

        MSRs.forEach(function (item) {
            var msrURI="<http://data.total.com/CTG/ontology/MSR/"+item.id+">"
    str+=msrURI+ " <http://www.w3.org/1999/02/22-rdf-syntax-ns#type>  <http://data.total.com/CTG/schema/MSR> .\n";

            for( var key in predicateMappings){
                if(item[key]){
                    str+=msrURI+ " <"+predicateMappings[key].uri+">  \""+item[key]+"\" .\n";

                }

            }
        })

        console.log(str)


    }


}
var filePath = "D:\\Total\\2020\\Pierre\\MSRtableaux.txt"
ontologyPierre.readCsv(filePath, 1000, function (err, result) {
    if (err)
        return console.log(err)
    var json = result.data[0];
    ontologyPierre.extractMSRs(json, function (err, result) {
        if (err)
            return console.log(err)
        ontologyPierre.generateRDF_NT(result, function (err, result) {
            if (err)
                return console.log(err)
        })


    })

})

module.exports = ontologyPierre
