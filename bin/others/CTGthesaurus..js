var skosReader=require('../backoffice/skosReader.')

var CTGthesaurus={

    completeCTGthesaurus:function(withThesaurus){





    }




}

var rdfPath1 = "D:\\NLP\\thesaurus_CTG_Product.rdf";
// var rdfPath1 = "D:\\NLP\\thesaurusCTG-02-20.rdf";

var rdfPath2 = "D:\\NLP\\LOC_Chemistry_3.rdf";
var rdfPath2 = "D:\\NLP\\LOC_CTG_Physics_3.rdf";
var rdfPath2 = "D:\\NLP\\termScience\\termScience_Chemistry.rdf";
// var rdfPath2 = "D:\\NLP\\termScience\\termScience_Elements_Chimiques.rdf";


options = {
    outputLangage: "en",
    extractedLangages: "en",
    withSynonyms: true,
    printLemmas: false
}
skosReader.compareThesaurus(rdfPath1, rdfPath2, options, function (err, result) {
    var x = err;
    if (err)
        console.log(err);
    commonConcepts=result

})
