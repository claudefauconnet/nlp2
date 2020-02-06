var fs = require("fs")
var DOMParser = require('xmldom').DOMParser;
var skoReader = require("../backoffice/skosReader..js");
var async = require('async');
var request = require('request');

var termScienceToSkos = {


    xmlToTree: function (xmlStr, options, callback) {
        var maxRecurseLevels = 60;

        var doc = new DOMParser().parseFromString(xmlStr, 'text/xml');


        var concepts = [];

        function recurseChildren(node) {

            var concept = {
                name: "",
                children: []
            }
            concepts.push(concept)
// name
            var idNode = node.getElementsByTagName("feat").item(0);
            if(!idNode)
                return;
            var id = idNode.getAttribute("conceptIdentifier");
            if (id)
                concept.id = id;
            var prefLabelNode = node.getElementsByTagName("struct").item(0);
            if (!prefLabelNode)
                return;
            var termNode = prefLabelNode.getElementsByTagName("feat");
            for (var i = 0; i < termNode.length; i++) {
                var elt = termNode.item(i);


                var type = elt.getAttribute("type")
                if (type == "term") {
                    var name = elt.childNodes[0].nodeValue;
                    concept.name = name;
                }
            }


            //children
            var brackNodes = node.getElementsByTagName("brack");
            if (!brackNodes)
                return;
            for (var i = 0; i < brackNodes.length; i++) {
                var featNodes = brackNodes[i].getElementsByTagName("feat");
                for (var j = 0; j < featNodes.length; j++) {
                    var elt = featNodes.item(j);
                    var type = elt.getAttribute("type")
                    var target = elt.getAttribute("target")

                    if (type == "specificConcept") {
                        var childName = elt.childNodes[0].nodeValue;
                        concept.children.push({
                            name: childName,
                            id: target.substring(1),// remove #
                        })
                    }
                }
            }

        }


        function setElementsMap() {
            var allElements = doc.documentElement.getElementsByTagName("struct");
            //   var allElements = doc.documentElement.childNodes;

            for (var i = 0; i < allElements.length; i++) {
                var elt = allElements.item(i);
                recurseChildren(elt)
            }

        }

        setElementsMap();
        callback(null, concepts[0])
        //   console.log()
    }
    , queryTermScience: function (conceptId, callback) {

        var url = "http://www.termsciences.fr/-/Fenetre/Fiche/XML/?idt=" + conceptId + "&lng=en"

        var options = {
            method: 'GET',
            url: url,
            headers: {
                'Content-Type': 'text/xml; charset=utf-8',
            }

        };


        function decodeXml(string) {
            var escaped_one_to_xml_special_map = {
                '&amp;': '&',
                '&quot;': '"',
                '&lt;': '<',
                '&gt;': '>'
            };
            return string.replace(/(&quot;|&lt;|&gt;|&amp;)/g,
                function (str, item) {
                    return escaped_one_to_xml_special_map[item];
                });
        }

        request(options, function (error, response, body) {
            if (error)
                return callback(error);
            if (body.error)
                return callback(body.error);


            var p = body.indexOf("<textarea")
            p = body.indexOf(">", p)
            var q = body.indexOf("</textarea")
            var xml = body.substring(p + 1, q)
            xml = decodeXml(xml);
            xml = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n" +
                "<termSienceRoot>\n" +
                xml +
                "</termSienceRoot>\n";
            callback(null, xml)

        })


    },

    buildTree: function (rootConceptId, maxDepth, callback) {
        var rootConcept = {"name": "root", id: rootConceptId, children: []}
        var continueToRecurse=true
        function recurseChildren(conceptParent, currentLevel, maxDepth, callbackRecurse) {

            var x = rootConcept;
            setTimeout(function () {
                termScienceToSkos.queryTermScience(conceptParent.id, function (err, xmlStr) {

                    termScienceToSkos.xmlToTree(xmlStr, {}, function (err, concept) {
                        if (err) {
                            return callback(err);
                        }
                        if (!conceptParent.children)
                            conceptParent.children = []
                        conceptParent.children.push(concept);
                        if (currentLevel < maxDepth) {
                            async.eachSeries(conceptParent.children, function (childConcept, callbackEach) {
                                var ierationend= recurseChildren(childConcept, currentLevel + 1, maxDepth,callbackRecurse);
                                continueToRecurse=continueToRecurse || ierationend
                                callbackEach()
                            }, function (err) {
                                if (err)
                                    return callbackRecurse(err);
                                return false;

                            })

                        }
                        else {
                            return true;

                        }
                    })
                })
            }, 1000)
            if(!continueToRecurse)
            return  callbackRecurse(null,conceptParent);
        }

        async.series([function (callbackSeries) {
               recurseChildren(rootConcept, 0, maxDepth, function (err, result) {
                    rootConcept =result;
                    callbackSeries();
                })
            }],
            function (err) {
                return rootConcept

            })
    }
}


if (false) {

    var xmlPath = "D:\\NLP\\termScience\\termScienceRoot.xml";
    var rdfPath = "D:\\NLP\\termScience\\termScience.rdf";


    var includeFiles = [""]
    var p = xmlPath.lastIndexOf("\\");
    var q = xmlPath.lastIndexOf(".");
    var rootEltName = xmlPath.substring(p + 1, q);
    var xmlStr = "" + fs.readFileSync(xmlPath);
    var maxDepth = 3;
    var depth = 0;
    var rootConcept;


    termScienceToSkos.xmlToTree(xmlStr, {}, function (err, concept) {
        if (depth == 0)
            rootConcept = concept;


        async.eachSeries(concept.children, function (childConcept, callbackEach) {
            termScienceToSkos.recurseChildren(childConcept, 0, 2);
        }, function (err) {
            if (err)
                console.log(err);
            fs.writeFileSync(rdfPath, JSON.stringify(rootConcept, null, 2))
            console.log("Done ")
        })


    })
}
if (true) {

    var totalSubjects = [{"name": "Chemistry", "id": "TE.15428"},
        {"name": "Energy", "id": "TE.29455"},
        {"name": "Building industry", "id": "TE.41893"},
        {"name": "Industrial Entreprises", "id": "TE.168061"},
        {"name": "Information", "id": "TE.42031"},
        {"name": "Computer science", "id": "TE.42056"},
        {"name": "Mathematics", "id": "TE.48512"},
        {"name": "Physics", "id": "TE.60624"}
    ]

    var rdfPath = "D:\\NLP\\termScience\\TotalConcepts.rdf";

    termScienceToSkos.buildTree(totalSubjects[0].id, 4, function (err, concept) {
        fs.writeFileSync(rdfPath, JSON.stringify(concept, null, 2))
    })


}


//var commonEnums=xsdToSkos.getCommonEnumeration();




