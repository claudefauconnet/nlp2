var sparql_facade = (function () {
    var self = {};
    var elasticUrl = "/elastic";
    if (window.location.href.indexOf("https") > -1)
        elasticUrl = "../elastic";


    self.getTopConcepts = function (callback) {
        $("#waitImg").css("display", "block");
        var ontology = app_config.ontologies[app_config.currentOntology]
        var conceptsGraphUri = app_config.ontologies[app_config.currentOntology].conceptsGraphUri
        if (ontology.isExternal) {

            return eval("sparql_" + app_config.currentOntology + ".getTopConcepts(" + callback + ")")
        } else {

            sparql_skos_generic.getTopConcepts(conceptsGraphUri, callback);
        }
    }

    self.getNodeChildren = function (conceptId, options, callback) {
        $("#waitImg").css("display", "block");
        var ontologyDesc = app_config.ontologies[app_config.currentOntology]
        if (ontologyDesc.isExternal) {
            return eval("sparql_"+app_config.currentOntology + ".getNodeChildren('" + conceptId + "'," + JSON.stringify(options) + "," + callback + ")")
        } else {
            sparql_skos_generic.getNodeChildren(conceptId, options, callback);
        }
    }


    self.searchConceptAndAncestors = function (word, ancestorsDepth,options, callback) {
        $("#waitImg").css("display", "block");
        var ontologyDesc = app_config.ontologies[app_config.currentOntology]
        if (ontologyDesc.isExternal) {
            options.ancestorsDepth = ancestorsDepth;
            return eval("sparql_" + app_config.currentOntology + ".searchConceptAndAncestors('" + word + "'," +ancestorsDepth+","+ JSON.stringify(options) + "," + callback + ")")
        } else {
            sparql_skos_generic.searchConceptAndAncestors(word, ancestorsDepth, {depth:ancestorsDepth}, callback);
        }
    }

    self.getConceptAndAncestorsById = function (conceptId, ancestorsDepth,options, callback) {
        $("#waitImg").css("display", "block");
        var ontologyDesc = app_config.ontologies[app_config.currentOntology];
        if(options.ontology){
            ontologyDesc= app_config.ontologies[options.ontology];
        }
        options.conceptId=conceptId;
        options.ancestorsDepth = ancestorsDepth;
        if (ontologyDesc.isExternal) {

            return eval("sparql_" + app_config.currentOntology + ".searchConceptAndAncestors('" + null + "'," + JSON.stringify(options) + "," + callback + ")")
        } else {
            sparql_skos_generic.searchConceptAndAncestors(null, ancestorsDepth, options, callback);
        }
    }

    self.getNodeInfos = function (conceptId,options, callback) {
        $("#waitImg").css("display", "block");
        var ontologyDesc = app_config.ontologies[app_config.currentOntology]
        if (ontologyDesc.isExternal) {
            return eval("sparql_"+app_config.currentOntology + ".getNodeInfos('" + conceptId + "'," + JSON.stringify(options) + "," + callback + ")")
        } else {
            sparql_skos_generic.getNodeInfos(conceptId, options, callback);
        }
    }


    return self;

})()
