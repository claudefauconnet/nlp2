var fs = require("fs")
var DOMParser = require('xmldom').DOMParser;
var skoReader=require("../backoffice/skosReader..js");

var xsdToSkos = {




    getCommonEnumeration:function() {

        var enumsMap = {}
        var path = "D:\\NLP\\energistics\\common\\v2.1\\xsd_schemas\\";
        var schemas = ["CommonEnumerations.xsd"]
        //  schemas.push("QuantityClass.xsd")

        schemas.forEach(function (schema) {

            var str = "" + fs.readFileSync(path + schema)
            var doc = new DOMParser().parseFromString(str, 'text/xml');
           var  allElements = doc.documentElement.getElementsByTagName("xs:simpleType");
            for (var i = 0; i < allElements.length; i++) {
                var elt = allElements.item(i);
                var name = elt.getAttribute("name");
                if (name)
                    enumsMap[name] = elt;
            }
        })

        return enumsMap;
    },





    parseXsd: function (xsdPath, options, callback) {
        var p=xsdPath.lastIndexOf("\\");
        var q=xsdPath.lastIndexOf(".");
        var rootEltName=xsdPath.substring(p+1,q);
        var str = "" + fs.readFileSync(xsdPath)
        var doc = new DOMParser().parseFromString(str, 'text/xml');
        var schema = doc.documentElement.getElementsByTagName("xs:schema");
        var eltsMap =xsdToSkos.getCommonEnumeration()

        function setElementsMap() {
            allElements = doc.documentElement.getElementsByTagName("xs:complexType");
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

        setElementsMap();


        var tree = {text: "root", id: "root", data: {type: "", tagName: ""}, parent:"#", children: []}
        var index = 0;

        function recurse(node, parentObj) {
            index++;
            if (node.tagName == "xs:annotation")
                return;


            if (!node.getAttribute)
                return;
            var name = node.getAttribute("name");
            var type = node.getAttribute("type");

            if(type=="eml:LithologyQualifierKindExt")
                var xx=3

            if (name == "CuttingsIntervalLithology")
                var x = 3;
            if (type) {
                type = type.split(":")[1];
                if (eltsMap[type]) {
                    return recurse(eltsMap[type], parentObj)
                }
            }else  if (node.tagName == "xs:enumeration") {
                name = node.getAttribute("value")

            }

          if (name == "")
                name = "?"

            //   console.log(node.tagName+"  "+name);

            var obj = {text: name, id: (node.tagName + "_" + name + "_" + index), data: {type: "", tagName: node.tagName}, parent:parentObj.id, children: []};

            if (false && node.tagName == "xs:sequence") {
                parentObj = obj;
            } else {
                if (!parentObj.children)
                    parentObj.children = [];
                parentObj.children.push(obj);
            }


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
                if(type=="eml:LithologyKindExt")
                    var xx=3
                if (type && type != "") {
                    type = type.split(":")[1];
                    if (eltsMap[type]) {

                        recurse(eltsMap[type], obj)
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
                    recurse(child, obj)
                }
            }


        }
        var rootElt=eltsMap[rootEltName]

    //    var rootEl = doc.documentElement.getElementsByTagName("xs:element")[0]
        recurse(rootElt, tree)
callback(null,tree)
     //   console.log()



    },

    treeToSkosEditorArray:function(tree){

        var conceptsArray=[];

        function recurse(node){
            if (node.text == "root")

            var grandParent=null;
            if(node.text=="?") {
                grandParent = node.parent;
            }
            else {
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
            node.children.forEach(function(child){
                if(grandParent)
                    child.parent=grandParent
                recurse(child)
            })


        }
        recurse(tree);


       return conceptsArray;

    }





}


module.exports = xsdToSkos
var xsdPath = "D:\\NLP\\energistics\\witsml\\v2.0\\xsd_schemas\\DrillReport.xsd"
var rdfPath=  "D:\\NLP\\energistics\\DrillReport.rdf";

var xsdPath = "D:\\NLP\\energistics\\witsml\\v2.0\\xsd_schemas\\WellboreGeology.xsd"
var rdfPath=  "D:\\NLP\\energistics\\WellboreGeology.rdf";

//var commonEnums=xsdToSkos.getCommonEnumeration();

xsdToSkos.parseXsd(xsdPath, {}, function (err, result) {
    if (err)
        return console.log(err)

   var conceptsArray=  xsdToSkos.treeToSkosEditorArray(result)

    skoReader.skosEditorToRdf(rdfPath,conceptsArray,null,function (err,result){
        if (err)
            return console.log(err)
        console.log("done "+rdfPath)

         var str=JSON.stringify(conceptsArray, null, 2);
   fs.writeFileSync(rdfPath+".json",str)
    })




})
