var fs = require("fs")
var DOMParser = require('xmldom').DOMParser;
var skoReader = require("../backoffice/skosReader..js");
var async = require('async');

var xsdToSkos = {


    getCommonEnumeration: function () {

        var enumsMap = {}
        var path = "D:\\NLP\\energistics\\common\\v2.1\\xsd_schemas\\";
        var schemas = ["CommonEnumerations.xsd"]
        //  schemas.push("QuantityClass.xsd")

        schemas.forEach(function (schema) {

            var str = "" + fs.readFileSync(path + schema)
            var doc = new DOMParser().parseFromString(str, 'text/xml');
            var allElements = doc.documentElement.getElementsByTagName("xs:simpleType");
            for (var i = 0; i < allElements.length; i++) {
                var elt = allElements.item(i);
                var name = elt.getAttribute("name");
                if (name)
                    enumsMap[name] = elt;
            }
        })

        return enumsMap;
    },


    xsdToTree: function (xsdPath, options, callback) {
        var maxRecurseLevels = 60;
        var p = xsdPath.lastIndexOf("\\");
        var q = xsdPath.lastIndexOf(".");
        var rootEltName = xsdPath.substring(p + 1, q);
        var str = "" + fs.readFileSync(xsdPath)
        var doc = new DOMParser().parseFromString(str, 'text/xml');
        var schema = doc.documentElement.getElementsByTagName("xs:schema");


        function setElementsMap() {
           var allElements = doc.documentElement.getElementsByTagName("xs:complexType");
            for (var i = 0; i < allElements.length; i++) {
                var elt = allElements.item(i);
                var name = elt.getAttribute("name");
                if (name)
                    eltsMap[name] = elt;
            }
            /*     var allElements = doc.documentElement.getElementsByTagName("xs:element");
                 for (var i = 0; i < allElements.length; i++) {
                     var elt = allElements.item(i);
                     var name = elt.getAttribute("name");
                     if (name)
                         eltsMap[name] = elt;
                 }*/

            allElements = doc.documentElement.getElementsByTagName("xs:simpleType");
            for (var i = 0; i < allElements.length; i++) {
                var elt = allElements.item(i);
                var name = elt.getAttribute("name");
                if (name)
                    eltsMap[name] = elt;
            }


        }

        var commonEltsMap = xsdToSkos.getCommonEnumeration()
        var eltsMap = {}
        setElementsMap();


        var setObjectCommonEnumValues = function (obj, type) {
            type = type.split("Ext")[0];
            var simpleType = commonEltsMap[type];

            if (!simpleType)
                return;

            var enumerations = simpleType.getElementsByTagName("xs:enumeration");
            obj.children = []; //remove unused existing children
            for (var i = 0; i < enumerations.length; i++) {
                var value = enumerations.item(i).getAttribute("value")
                obj.children.push({text: value, id: ("enumeration_" + type + "_" + obj.id + "_" + value), data: {type: "enumeration", tagName: ""}, parent: obj.id, children: []})
            }
            return obj


        }


        var tree = {text: "root", id: "root", data: {type: "", tagName: ""}, parent: "#", children: []}
        var index = 0;


        function recurse(node, parentObj) {


            index++;
            if (node.tagName == "xs:annotation")
                return;
            if (node.tagName == "xs:documentation")
                return;

            parentObj.data.level += 1

            if (parentObj.data.level > maxRecurseLevels) {
                console.log(parentObj.data.level+"_"+xsdPath + " " + JSON.stringify(parentObj))
                return;

            }

            if (!node.getAttribute)
                return;
            var name = node.getAttribute("name");
            var type = node.getAttribute("type");


            if (type) {
                if (!type.split)
                    var x = 3
                type = type.split(":")[1];
                if (eltsMap[type]) {
                    return recurse(eltsMap[type], parentObj)
                }
            } else if (node.tagName == "xs:enumeration") {
                name = node.getAttribute("value")

            }

            if (name == "")
                name = "?"

            //   console.log(node.tagName+"  "+name);

            var obj = {text: name, id: (node.tagName + "_" + name + "_" + index), data: {type: "", tagName: node.tagName, level: 0}, parent: parentObj.id, children: []};


            if (commonEltsMap[type]) {
                setObjectCommonEnumValues(obj, type)
            }
            if (!parentObj.children)
                parentObj.children = [];
            parentObj.children.push(obj);


            var children = node.childNodes;


            for (var i = 0; i < children.length; i++) {
                var child = children.item(i);
                //   console.log(child.tagName);


                if (!child.getAttribute) {
                    recurse(child, obj);
                    continue;
                }


                var type = child.getAttribute("type");
                var name = child.getAttribute("name");
                if (type == "eml:LithologyKindExt")
                    var xx = 3
                if (type && type != "") {
                    type = type.split(":")[1];
                    if (eltsMap[type]) {
                        recurse(eltsMap[type], obj)
                    } else if (commonEltsMap[type]) {
                        recurse(child, obj)

                    } else {
                        recurse(child, obj)
                        // obj.children.push({name: name, type: type})
                    }

                } else if (false && name != "") {
                    obj.children.push({name: name})
                } else {

                    //   console.log(child.tagName)
                    /* if (child.tagName == "xs:sequence")
                       var x = 3;*/
                    try {
                        recurse(child, obj)
                    } catch (e) {
                        console.log(xsdPath )
                        callback(null,[])
                    }
                }
            }


        }

        var rootElt = eltsMap[rootEltName]
        if(!rootElt)
            return callback('root elt not found');

        //    var rootEl = doc.documentElement.getElementsByTagName("xs:element")[0]


        recurse(rootElt, tree)

        callback(null, tree)
        //   console.log()


    },

    treeToSkosEditorArray: function (tree) {

        var conceptsArray = [];

        function recurse(node) {
            if (node.text == "root")

                var grandParent = null;
            if (node.text == "?") {
                grandParent = node.parent;
            } else {
                if (node.text != "root") {

                    var obj = {id: node.id, prefLabels: [], broaders: [], altLabels: [], relateds: [], inScheme: ""}
                    conceptsArray.push(obj)
                    if (node.parent == "root")
                        obj.broaders.push("#");
                    else
                        obj.broaders.push(node.parent);

                    obj.prefLabels.push({lang: "en", value: node.text})
                }
            }
            node.children.forEach(function (child) {
                if (grandParent)
                    child.parent = grandParent
                recurse(child)
            })


        }

        recurse(tree);


        return conceptsArray;

    }
    ,

    parseXsdToSkos: function (xsdPath, rdfPath, options, callback) {
        if (!options)
            options = {};

        function processFile(xsdFilePath, callback1) {
            xsdToSkos.xsdToTree(xsdFilePath, {}, function (err, result) {
                if (err) {
                    console.log(err)
                    return callback1(err)
                }

                var conceptsArray = xsdToSkos.treeToSkosEditorArray(result);
                callback1(null, conceptsArray)

            })
        }

        var files = [];
        var includeFiles = [];
        if (options.includeFiles)
            includeFiles = options.includeFiles;
        if (fs.lstatSync(xsdPath).isDirectory()) {
            var dirFiles = fs.readdirSync(xsdPath);
            dirFiles.forEach(function (file) {
                if (includeFiles.length == 0 || includeFiles.indexOf(file > -1))
                    files.push(xsdPath + file);
            })

        } else if (fs.lstatSync(xsdPath).isFile()) {
            files.push(xsdPath)
        }
        var conceptsArray = [];
        async.eachSeries(files, function (file, callbackEach) {
            processFile(file, function (err, result) {
                if (err) {
                    console.log(err)
                    return callbackEach(err);
                }
                conceptsArray = conceptsArray.concat(result)
                callbackEach();
            })

        }, function (err) {
            if (err)
                return callback(err);

            skoReader.skosEditorToRdf(rdfPath, conceptsArray, null, function (err, result) {
                if (err)
                    return console.log(err)
                console.log("done " + rdfPath)
            })


        })


    }


}


module.exports = xsdToSkos
var xsdPath = "D:\\NLP\\energistics\\witsml\\v2.0\\xsd_schemas\\DrillReport.xsd"
var rdfPath = "D:\\NLP\\energistics\\DrillReport.rdf";

var xsdPath = "D:\\NLP\\energistics\\witsml\\v2.0\\xsd_schemas\\WellboreGeology.xsd"
var rdfPath = "D:\\NLP\\energistics\\WellboreGeology.rdf";


var xsdPath = "D:\\NLP\\energistics\\witsml\\v2.0\\xsd_schemas\\WellboreGeology.xsd"
var rdfPath = "D:\\NLP\\energistics\\WellboreGeology.rdf";

var xsdPath = "D:\\NLP\\energistics\\witsml\\v2.0\\xsd_schemas\\";
var rdfPath = "D:\\NLP\\energistics\\witsml.rdf";

var xsdPath = "D:\\NLP\\energistics\\resqmlv2\\v2.0.1\\xsd_schemas\\Geologic.xsd";
var rdfPath = "D:\\NLP\\energistics\\Geologic.rdf";


var includeFiles = [""]
xsdToSkos.parseXsdToSkos(xsdPath, rdfPath, function (err, result) {
    var x = err
})

//var commonEnums=xsdToSkos.getCommonEnumeration();




