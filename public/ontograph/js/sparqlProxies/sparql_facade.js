var sparql_facade = (function () {
    var self = {};


    self.getTopConcepts = function (callback) {
        var ontology = app_config.ontologies[app_config.currentOntology]
        var conceptsGraphUri = app_config.ontologies[app_config.currentOntology].conceptsGraphUri
        if (ontology.isExternal) {

            return eval("sparql_" + app_config.currentOntology + ".getTopConcepts(" + callback + ")")
        } else {

            sparql_skos_generic.getTopConcepts(conceptsGraphUri, callback);
        }
    }

    self.getNodeChildren = function (conceptId, depth, callback) {
        var ontologyDesc = app_config.ontologies[app_config.currentOntology]
        if (ontologyDesc.isExternal) {
            return eval("sparql_"+app_config.currentOntology + ".getNodeChildren('" + conceptId + "'," + JSON.stringify({depth:2}) + "," + callback + ")")
        } else {
            sparql_skos_generic.getNodeChildren(conceptId, depth, callback);
        }
    }


    self.searchConceptAndAncestors = function (word, ancestorsDepth,options, callback) {
        var ontologyDesc = app_config.ontologies[app_config.currentOntology]
        if (ontologyDesc.isExternal) {
            options.ancestorsDepth = ancestorsDepth;
            return eval("sparql_" + app_config.currentOntology + ".searchConceptAndAncestors('" + word + "'," + JSON.stringify(options) + "," + callback + ")")
        } else {
            sparql_skos_generic.searchConceptAndAncestors(word, ancestorsDepth, {depth:ancestorsDepth}, callback);
        }
    }

    self.getNodeInfos = function (conceptId,options, callback) {
        var ontologyDesc = app_config.ontologies[app_config.currentOntology]
        if (ontologyDesc.isExternal) {
            return eval("sparql_"+app_config.currentOntology + ".getNodeInfos('" + conceptId + "'," + JSON.stringify(options) + "," + callback + ")")
        } else {
            sparql_skos_generic.getNodeInfos(conceptId, options, callback);
        }
    }


    return self;

})()
