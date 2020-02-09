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
            if (!idNode)
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

        if (doc && doc.documentElement) {
            setElementsMap();
            callback(null, concepts[0])
        } else {
            callback(null, {});
        }

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

    buildTreeToSkos: function (rootConceptId, maxDepth, rdfPath, callback) {

        function getConceptChildren(conceptId, callback) {
            if (conceptId == "TE.173836")
                var x = 3
            var concept = {"name": "", id: conceptId, children: []}

            if (conceptId)
                termScienceToSkos.queryTermScience(conceptId, function (err, xmlStr) {

                    termScienceToSkos.xmlToTree(xmlStr, {}, function (err, concept2) {
                        if (err) {
                            return callback(err);
                        }

                        concept.name = concept2.name
                        concept.children = concept2.children
                        return callback(null, concept)
                    })
                })

        }


        var children1 = []
        var children2 = []
        var children3 = []
        var children4 = []
        var children5 = []
        var children6 = []

        var conceptsMap = {};
        var editorArray = [];
        var maxLevel=4
       var  level3_exclude=["Biochimie","Chimie agricole","Chimie pharmaceutique"]
        async.series([
            function (callbackSeries) {
                getConceptChildren(rootConceptId, function (err, concept) {
                    if (err)
                        return callbackSeries(err);
                    conceptsMap[concept.id] = concept;
                    concept.children.forEach(function (child) {
                        children1.push(child)
                    })
                    callbackSeries();
                })
            },
            function (callbackSeries) {
                if(maxLevel<2)
                    return callbackSeries()
                var index = 0;
                async.eachSeries(children1, function (item, callbackEach) {
                    getConceptChildren(item.id, function (err, concept) {
                        if (err)
                            return callbackEach(err);

                        conceptsMap[concept.id] = concept;
                        if(level3_exclude.indexOf(concept.name)>-1)
                            return callbackEach();
                        concept.children.forEach(function(child){
                            child.parent=concept.id
                            children2.push(child)
                        })
                        callbackEach();
                    })
                }, function (err) {
                    if (err)
                        return callbackSeries(err);
                    callbackSeries();
                })
            },
            function (callbackSeries) {
                if(maxLevel<3)
                    return callbackSeries()
                var index = 0;
                async.eachSeries(children2, function (item, callbackEach) {

                    getConceptChildren(item.id, function (err, concept) {
                        if (err)
                            return callbackEach(err);

                        conceptsMap[concept.id] = concept;
                        concept.children.forEach(function(child){
                            child.parent=concept.id
                            children3.push(child)
                        })

                        callbackEach();
                    })
                }, function (err) {
                    if (err)
                        return callbackSeries(err);
                    callbackSeries();
                })
            }
            ,
            function (callbackSeries) {
            if(maxLevel<4)
               return callbackSeries()
                var index = 0;
                async.eachSeries(children3, function (item, callbackEach) {
                    getConceptChildren(item.id, function (err, concept) {
                        if (err)
                            return callbackEach(err);


                        concept.children.forEach(function(child){
                            child.parent=concept.id
                            children4.push(child)
                        })
                        conceptsMap[concept.id] = concept;
                        callbackEach();
                    })
                }, function (err) {
                    if (err)
                        return callbackSeries(err);
                    callbackSeries();
                })
            }
            ,
            function (callbackSeries) {
                if(maxLevel<5)
                    return callbackSeries()
                var index = 0;
                async.eachSeries(children4, function (item, callbackEach) {
                    getConceptChildren(item.id, function (err, concept) {
                        if (err)
                            return callbackEach(err);

                        conceptsMap[concept.id] = concept;
                        concept.children.forEach(function(child){
                            child.parent=concept.id
                            children5.push(child)
                        })
                        callbackEach();
                    })
                }, function (err) {
                    if (err)
                        return callbackSeries(err);
                    callbackSeries();
                })
            },


       function (callbackSeries) {
           if(maxLevel<6)
               return callbackSeries()
                var index = 0;
                async.eachSeries(children5, function (item, callbackEach) {
                    getConceptChildren(item.id, function (err, concept) {
                        if (err)
                            return callbackEach(err);
                        conceptsMap[concept.id] = concept;
                        concept.children.forEach(function(child){
                            child.parent=concept.id
                            children6.push(child)
                        })
                        callbackEach();
                    })
                }, function (err) {
                    if (err)
                        return callbackSeries(err);
                    callbackSeries();
                })
            },

            // *************************final treatment**********************
            function (callbackSeries) {


                for (var key in conceptsMap) {
                    var node = conceptsMap[key]
                    console.log(key)

                    function recurseChildren(node) {
                        var obj = {
                            id: node.id,
                            prefLabels: [{lang: "en", value: node.name}],

                            altLabels: []
                        }
                        if (node.parent) {
                            obj.broaders = [node.parent];
                            editorArray.push(obj);
                        }

                        if (node.children) {
                            node.children.forEach(function (child) {
                                editorArray.push({
                                    id: child.id,
                                    prefLabels: [{lang: "en", value: child.name}],
                                    broaders: [node.id],
                                    altLabels: [],
                                    relateds: []
                                })
                                if(child.id=="TE.49696")
                                    var w=3
                                if(conceptsMap[child.id])
                                    recurseChildren(conceptsMap[child.id])
                            })
                        }
                    }

                    recurseChildren(node);


                }
                callbackSeries()
            }


        ], function (err) {
            if (err)
                return callback(err)


            skoReader.skosEditorToRdf(rdfPath, editorArray, {}, function (err, result) {
                if (err) {
                    return callback(err);
                }
                callback();
            })

        })


    }
    ,

    treeToThesaurusEditor: function (tree) {
        var conceptsArray = []

        function recurse(node, parentId) {
            if (!node.id)
                node.id = node.name;
            var obj = {
                id: node.id,
                prefLabels: [{"lang": "en", "value": node.name}],
                altLabels: [],
                relateds: [],
                broaders: [parentId]
            }
            conceptsArray.push(obj);

            if (node.children) {
                node.children.forEach(function (child) {
                    var nodeId = node.id;
                    recurse(child, nodeId)
                })
            }
        }

        recurse(tree, "#");
        return conceptsArray;
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


    var humanSubject = [{"name": "Philosophy", "id": "TE.60063"},
        {"name": "Ethnology", "id": "TE.31503"},
        {"name": "History", "id": "TE.39654"},
        {"name": "Psychology", "id": "TE.185309"},
        {"name": "Religion", "id": "TE.68945"}]


    others = {"name": "Methodology", "id": "TE.50404"}

    var selectedSubjects = [{"name": "Chemistry", "id": "TE.15428"}]
    var selectedSubjects = [{"name": "Physics", "id": "TE.60624"}]
    //  var selectedSubjects = [{"name": "Elements Chimiques", "id": "TE.173836"}]

    async.eachSeries(selectedSubjects, function (subject, callbackEachSubject) {
        var rdfPath = "D:\\NLP\\termScience\\termScience_" + subject.name + ".rdf";
        termScienceToSkos.buildTreeToSkos(subject.id, 6, rdfPath, function (err, result) {
            if (err) {
                return callbackEachSubject(err);

            }
            var x = result

            callbackEachSubject();
        })

    }, function (err) {
        if (err) {
            return console.log(err);
        }
        return console.log("ALL DONE");
    })

}

if (false) {
    var jsonPath = "D:\\NLP\\termScience\\terms2.json";
    var rdfPath = "D:\\NLP\\termScience\\termSciences_Physics.rdf";
    var json = JSON.parse("" + fs.readFileSync(jsonPath));


    skoReader.skosEditorToRdf(rdfPath, conceptsArray, {})

}

if (false) {

    var conceptsMap = JSON.parse("" + fs.readFileSync("d:\\NLP\\conceptsMap.json"));

    var editorArray=[];
    for (var key in conceptsMap) {
        var node = conceptsMap[key]
        console.log(key)

        function recurseChildren(node) {
            var obj = {
                id: node.id,
                prefLabels: [{lang: "en", value: node.name}],

                altLabels: []
            }
            if (node.parent) {
                obj.broaders = [node.parent];
                editorArray.push(obj);
            }

            if (node.children) {
                node.children.forEach(function (child) {
                    editorArray.push({
                        id: child.id,
                        prefLabels: [{lang: "en", value: child.name}],
                        broaders: [node.id],
                        altLabels: [],
                        relateds: []
                    })
                    if(child.id=="TE.49696")
                        var w=3
                    if(conceptsMap[child.id])
                    recurseChildren(conceptsMap[child.id])
                })
            }
        }

        recurseChildren(node);


    }


    var rdfPath = "D:\\NLP\\termScience\\termScience_" + "Chemistry" + ".rdf";
    skoReader.skosEditorToRdf(rdfPath, editorArray, {}, function (err, result) {

    })





}


//var commonEnums=xsdToSkos.getCommonEnumeration();




