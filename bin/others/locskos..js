var fs = require('fs');
var sax = require("sax")
var locskos = {


    //http://id.loc.gov/authorities/subjects/sh85052724.html

    //Research--Equipment and supplies

    //http://id.loc.gov/authorities/subjects/sh00006584.html machinery

    //http://id.loc.gov/authorities/subjects/sh85019928.html capillarity


    //science   http://id.loc.gov/authorities/subjects/sh00007934.html
    parseRdfXml: function (sourcePath, options, callback) {
        var saxStream = sax.createStream(true)

        if (!options) {
            options = {extractedLangages: "en"};
        }
        var conceptTagNames = ["rdf:Description", "skos:ConceptScheme", "skos:Concept", "iso-thes:ConceptGroup"]
        var conceptsMap = {}
        var currentConcept = null;
        var currentTagName = null;
        var currentParentTagName = "";
        var stop = false;
        var countConcepts = 0;
        var countConceptsEnd = 0;
        saxStream.on("error", function (e) {
            // unhandled errors will throw, since this is a proper node
            // event emitter.
            console.error("error!", e)
            // clear the error
            this._parser.error = null
            this._parser.resume()
        })

        saxStream.on("opentag", function (node) {
            var x = node;


            if (node.name == "skos:Collection")
                stop = true;
            if (conceptTagNames.indexOf(node.name) > -1) {

                countConcepts += 1
                currentConcept = {};
                var id = node.attributes["rdf:about"];
                // console.log(id);

                if (!id) {
                    currentConcept = null;
                    return;
                }
                currentConcept.id = id;
                currentConcept.prefLabels = {};
                currentConcept.altLabels = {};
                currentConcept.schemes = [];
                currentConcept.relateds = [];
                currentConcept.narrowers = [];
                currentConcept.broaders = [];
                currentConcept.topConcepts = [];

            }
            if (currentConcept) {
                if (node.name == "skos:prefLabel") {

                    var lang = node.attributes["xml:lang"];
                    if (!lang) {
                        currentTagName = "prefLabels_" + "X"
                    }
                    if (options.extractedLangages.indexOf(lang) > -1) {
                        currentTagName = "prefLabels_" + lang
                    }

                }
                if (node.name == "skos:altLabel") {
                    var lang = node.attributes["xml:lang"];
                    if (!lang) {
                        currentTagName = "altLabels_" + "X"
                    }

                    if (options.extractedLangages.indexOf(lang) > -1) {
                        currentTagName = "altLabels_" + lang
                    }

                }

                if (node.name == "skos:topConceptOf") {
                    var type = node.attributes["rdf:resource"]
                    currentConcept.topConcepts.push(type);
                } else if (node.name == "rdf:type") {
                    var type = node.attributes["rdf:resource"]
                    if (type.indexOf("ConceptScheme") > -1) {
                        currentConcept.isConceptScheme = true;
                    }
                } else if (node.name == "skos:inScheme") {
                    currentConcept.schemes.push(node.attributes["rdf:resource"]);
                } else if (node.name == "skos:broader") {
                    currentConcept.broaders.push(node.attributes["rdf:resource"]);
                } else if (node.name == "skos:narrower") {
                    currentConcept.narrowers.push(node.attributes["rdf:resource"]);
                } else if (node.name == "skos:related") {
                    currentConcept.relateds.push(node.attributes["rdf:resource"]);

                }
                /*   if (node.name == "iso-thes:superGroup") {
                       currentConcept.broaders.push(node.attributes["rdf:resource"]);
                   }*/

            }
        })

        saxStream.on("text", function (text) {

            if (!currentConcept)
                return;
            if (currentTagName) {
                if (currentTagName.indexOf("prefLabels_") == 0) {
                    var array = currentTagName.split("_")
                    if (text == "Donges")
                        var x = 3

                    currentConcept[array[0]][array[1]] = text;
                } else if (currentTagName.indexOf("altLabels_") == 0) {
                    var array = currentTagName.split("_")
                    if (!currentConcept[array[0]][array[1]])
                        currentConcept[array[0]][array[1]] = [];
                    currentConcept[array[0]][array[1]].push(text)


                }
            }

            currentTagName = null;
        })


        saxStream.on("closetag", function (node) {
            if (!currentConcept)
                return;
            if (conceptTagNames.indexOf(node) > -1) {
                countConceptsEnd += 1

                if (!stop)
                    if (Object.keys(currentConcept.prefLabels).length > 0)
                        conceptsMap[currentConcept.id] = currentConcept;

            }
            if (countConceptsEnd > 500) {
                var x = 3
            }

        })
        saxStream.on("end", function (node) {

            callback(null, conceptsMap)

        })

        if (fs.existsSync(sourcePath)) {
            fs.createReadStream(sourcePath)
                .pipe(saxStream)
        } else {
            callback("No such File " + sourcePath);
        }


    },


    readCsv: function (filePath, lines, separator, callback) {


        var jsonData = [];
        var startId = 100000;
        var strOut = '';
        var lastLine = ""
        fs.createReadStream(filePath)


            .on('data', function (data) {
                var str = data.toString();
                //     console.log(data.toString());

                var lines = str.split("\n");
                lines[0]=lastLine+lines[0];
                lastLine = lines[lines.length - 1];


                lines.forEach(function (line, lineIndex) {
                    if (lineIndex < lines.length - 1) {
                        var json
                        try {
                             json = JSON.parse(line)
                        }catch(e){
                            console.log(lineIndex+"  "+line)
                            return;
                        }
                     //   console.log(JSON.stringify(json, null, 2))
                        json["@graph"].forEach(function (node) {
                            if (node["@type"] == "skos:Concept") {

                                if(!node["skos:broader"]) {

                                    delete node["skos:changeNote"];
                                    delete node["@type"];
                                    delete node["skos:editorial"];
                                    delete node["skos:altLabel"];
                                    delete node["skos:related"];

                                   if(node["skos:prefLabel"])
                                   // jsonData.push(node["skos:prefLabel"]["@value"]+"\t"+node["@id"]+"\n")
                                       strOut+=node["skos:prefLabel"]["@value"]+"\t"+node["@id"]+"\n"
                                }
                            }
                        })

                    }

                })


                if (jsonData.length > 1000000)
                    var x = 3;
            })
            .on('end', function () {
                fs.writeFileSync("D:\\NLP\\LOCtopNodes.txt", strOut)
                return callback(null, {headers: headers, data: jsonData})
            })


    },


}

module.exports = locskos

locskos.readCsv("D:\\NLP\\lcsh.skos.ndjson")
