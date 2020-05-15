/**
 * Created by claud on 09/05/2017.
 */
var fs=require('fs');
var httpProxy=require('../../httpProxy.');
var async=require('async');


var rdfsList=[
    'http://resource.geosciml.org/vocabulary/cgi/2016/IUGS_CGI_register__for_INSPIRE_lithology_with_content.rdf',
    'http://resource.geosciml.org/vocabulary/cgi/2016/alterationtype.rdf',
    'http://resource.geosciml.org/vocabulary/cgi/2016/boreholedrillingmethod.rdf',
    'http://resource.geosciml.org/vocabulary/cgi/2016/compositioncategory.rdf',
    'http://resource.geosciml.org/vocabulary/cgi/2016/compoundmaterialconstituentpartrole.rdf',
    'http://resource.geosciml.org/vocabulary/cgi/2016/consolidationdegree.rdf',
    'http://resource.geosciml.org/vocabulary/cgi/2016/contacttype.rdf',
    'http://resource.geosciml.org/vocabulary/cgi/2016/conventioncode.rdf',
    'http://resource.geosciml.org/vocabulary/cgi/2016/deformationstyle.rdf',
    'http://resource.geosciml.org/vocabulary/cgi/2016/descriptionpurpose.rdf',
    'http://resource.geosciml.org/vocabulary/cgi/2016/determinationmethodorientation.rdf',
    'http://resource.geosciml.org/vocabulary/cgi/2016/eventenvironment.rdf',
    'http://resource.geosciml.org/vocabulary/cgi/2016/eventprocess.rdf',
    'http://resource.geosciml.org/vocabulary/cgi/2016/faultmovementsense.rdf',
    'http://resource.geosciml.org/vocabulary/cgi/2016/faultmovementtype.rdf',
    'http://resource.geosciml.org/vocabulary/cgi/2016/faulttype.rdf',
    'http://resource.geosciml.org/vocabulary/cgi/2016/featureobservationmethod.rdf',
    'http://resource.geosciml.org/vocabulary/cgi/2016/foliationtype.rdf',
    'http://resource.geosciml.org/vocabulary/cgi/2016/geneticcategory.rdf',
    'http://resource.geosciml.org/vocabulary/cgi/2016/geologicunitmorphology.rdf',
    'http://resource.geosciml.org/vocabulary/cgi/2016/geologicunitpartrole.rdf',
    'http://resource.geosciml.org/vocabulary/cgi/2016/geologicunittype.rdf',
    'http://resource.geosciml.org/vocabulary/cgi/2016/lineationtype.rdf',
    'http://resource.geosciml.org/vocabulary/cgi/2016/mappedfeatureobservationmethod.rdf',
    'http://resource.geosciml.org/vocabulary/cgi/2016/mappingframe.rdf',
    'http://resource.geosciml.org/vocabulary/cgi/2016/metamorphicfacies.rdf',
    'http://resource.geosciml.org/vocabulary/cgi/2016/metamorphicgrade.rdf',
    'http://resource.geosciml.org/vocabulary/cgi/2016/particleaspectratio.rdf',
    'http://resource.geosciml.org/vocabulary/cgi/2016/particleshape.rdf',
    'http://resource.geosciml.org/vocabulary/cgi/2016/particletype.rdf',
    'http://resource.geosciml.org/vocabulary/cgi/2016/planarpolaritycode.rdf',
    'http://resource.geosciml.org/vocabulary/cgi/2016/proportionterm.rdf',
    'http://resource.geosciml.org/vocabulary/cgi/2016/simplelithology.rdf',
    'http://resource.geosciml.org/vocabulary/cgi/2016/stratigraphicrank.rdf',
    'http://resource.geosciml.org/vocabulary/cgi/2016/valuequalifier.rdf',
    'http://resource.geosciml.org/vocabulary/cgi/2016/vocabularyrelation.rdf',
    'http://resource.geosciml.org/vocabulary/cgi/2016/ClassificationMethodUsed.rdf',
    'http://resource.geosciml.org/vocabulary/cgi/2016/CommodityCode.rdf',
    'http://resource.geosciml.org/vocabulary/cgi/2016/EarthResourceExpression.rdf',
    'http://resource.geosciml.org/vocabulary/cgi/2016/EarthResourceForm.rdf',
    'http://resource.geosciml.org/vocabulary/cgi/2016/EarthResourceMaterialRole.rdf',
    'http://resource.geosciml.org/vocabulary/cgi/2016/EarthResourceShape.rdf',
    'http://resource.geosciml.org/vocabulary/cgi/2016/EndUsePotential.rdf',
    'http://resource.geosciml.org/vocabulary/cgi/2016/EnvironmentalImpact.rdf',
    'http://resource.geosciml.org/vocabulary/cgi/2016/ExplorationActivityType.rdf',
    'http://resource.geosciml.org/vocabulary/cgi/2016/ExplorationResult.rdf',
    'http://resource.geosciml.org/vocabulary/cgi/2016/MineStatus.rdf',
    'http://resource.geosciml.org/vocabulary/cgi/2016/MineralOccurrenceType.rdf',
    'http://resource.geosciml.org/vocabulary/cgi/2016/MiningActivity.rdf',
    'http://resource.geosciml.org/vocabulary/cgi/2016/ProcessingActivity.rdf',
    'http://resource.geosciml.org/vocabulary/cgi/2016/RawMaterialRole.rdf',
    'http://resource.geosciml.org/vocabulary/cgi/2016/ReserveCategory.rdf',
    'http://resource.geosciml.org/vocabulary/cgi/2016/ResourceCategory.rdf',
    'http://resource.geosciml.org/vocabulary/cgi/2016/UNFCValue.rdf',
    'http://resource.geosciml.org/vocabulary/cgi/2016/WasteStorage.rdf',




]

var ontologyCGI={

    downloadAll:function() {
        var str="";
        async.eachSeries(rdfsList, function (rdfUrl, callbackEach) {
            httpProxy.get(rdfUrl,{},function(err,result){
                str+=""+result+"\n"
callbackEach();
            })


        },function(err){

            fs.writeFileSync("D:\\NLP\\importedResources\\cgi\\allFiles.rdf",str)

        })
    }


}
module.exports=ontologyCGI

ontologyCGI.downloadAll();
