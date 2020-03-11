var fs = require('fs');
const async = require('async');
var sax = require("sax");
const csv = require('csv-parser');
var skosReader = require('../../backoffice/skosReader.')


var crawler_Rameau = {

    test:function(){

        var filePath="D:\\NLP\\importedResources\\databnf_rameau_xml\\databnf_rameau__skos_000016.xml"
        var options= {extractedLangages: "fr", outputLangage: "fr"}
        skosReader.rdfToEditor(filePath,options,function(err,result){
            var x=result;
            var xx=result.skos.slice(0,1000)
            var xxx=xx;

        })

    }





}

module.exports=crawler_Rameau;

crawler_Rameau.test();
