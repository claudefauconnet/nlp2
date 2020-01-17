var fs = require('fs');
var async = require('async');
var request = require('request');
var ndjson = require('ndjson');
const socket = require('../../routes/socket.js');
const elasticRestProxy = require('../elasticRestProxy..js')

var unitsExtractor = {


    rdfToAnnotator: function (sourcePath, options, callback) {
        var conceptsArray = [];
        var xmlnsRootLength = -1
        if (!options)
            options = {
                outputLangage: "en",

            }


        var conceptsMap = {}
        var currentNode = null
        var currentConcept = null;
        var currentTagName = null;
        var strict = true; // set to false for html-mode
        var saxStream = require("sax").createStream(strict)
        saxStream.on("error", function (e) {
            // unhandled errors will throw, since this is a proper node
            // event emitter.
            console.error("error!", e)
            // clear the error
            this._parser.error = null
            this._parser.resume()
        })

        saxStream.on("opentag", function (node) {
            currentNode = node;


            if (node.name == "record") {
                currentConcept = {};
                var id = node.attributes["id"];
                currentConcept.id = id;
                currentConcept.prefLabels = [];
                currentConcept.altLabels = [];
                currentConcept.symbols = [];


            }
            if (node.name == "lg.version") {


                currentTagName = "lg.version"


            }


        })

        saxStream.on("text", function (text) {
            if (!currentConcept)
                return;
            if (currentTagName) {
                if (currentTagName == "lg.version") {
                    var lang = currentNode.attributes["lg"];

                    if (lang == "eng") {
                        currentConcept.prefLabels.push(text)
                    }


                }
            }

            currentTagName = null;
        })


        saxStream.on("closetag", function (node) {
            if (node == "record") {
                conceptsArray.push(currentConcept);
            }
        })
        saxStream.on("end", function (node) {
            var unitsArray = []
            conceptsArray.forEach(function (item) {

                unitsArray.push({id:item.id,label: item.prefLabels[0], symbol: item.prefLabels[1]})
            })
            callback(null, unitsArray)
        })

        if (fs.existsSync(sourcePath)) {
            fs.createReadStream(sourcePath)
                .pipe(saxStream)
        } else {
            callback("No such File " + sourcePath);
        }


    }
}
var xmlPath = "D:\\NLP\\measurement-unit.xml";

unitsExtractor.rdfToAnnotator(xmlPath, {}, function (err, result) {
    var x = result;
    fs.writeFileSync(xmlPath+".json",JSON.stringify(result,null,2))

})



