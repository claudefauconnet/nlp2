var Sparql_facade = (function () {
    var self = {};
    var elasticUrl = "/elastic";
    if (window.location.href.indexOf("https") > -1)
        elasticUrl = "../elastic";


    self.getTopConcepts = function (sourceLabel,callback) {
        $("#waitImg").css("display", "block");
        var source = Config.sources[sourceLabel]
        var graphIri = source.graphIri
        if (source.isExternal) {
            return eval("sparql_" +sourceLabel + ".getTopConcepts(" + callback + ")")
        } else {

            Sparql_skos_generic.getTopConcepts(graphIri, callback);
        }
    }

    self.getNodeChildren = function (sourceLabel,conceptId, options, callback) {
        $("#waitImg").css("display", "block");
        var source = Config.sources[sourceLabel]
        var graphIri = source.graphIri
        if (source.isExternal) {
            return eval("sparql_"+sourceLabel + ".getNodeChildren('" + conceptId + "'," + JSON.stringify(options) + "," + callback + ")")
        } else {
            Sparql_skos_generic.getNodeChildren(graphIri,conceptId, options, callback);
        }
    }


    self.searchConceptAndAncestors = function (sourceLabel,word, ancestorsDepth,options, callback) {
        $("#waitImg").css("display", "block");
        var source = Config.sources[sourceLabel]
        var graphIri = source.graphIri
        if (source.isExternal) {
            options.ancestorsDepth = ancestorsDepth;
            return eval("sparql_" + sourceLabel + ".searchConceptAndAncestors('" + word + "'," +ancestorsDepth+","+ JSON.stringify(options) + "," + callback + ")")
        } else {
            Sparql_skos_generic.searchConceptAndAncestors(graphIri,word, ancestorsDepth, {depth:ancestorsDepth}, callback);
        }
    }

    self.getConceptAndAncestorsById = function (sourceLabel,conceptId, ancestorsDepth,options, callback) {
        $("#waitImg").css("display", "block");
        var source = Config.sources[sourceLabel];
        var graphIri = source.graphIri

        options.conceptId=conceptId;
        options.ancestorsDepth = ancestorsDepth;
        if (source.isExternal) {

            return eval("sparql_" + sourceLabel + ".searchConceptAndAncestors('" + null + "'," + JSON.stringify(options) + "," + callback + ")")
        } else {
            Sparql_skos_generic.searchConceptAndAncestors(graphIri,null, ancestorsDepth, options, callback);
        }
    }

    self.getNodeInfos = function (sourceLabel,conceptId,options, callback) {
        $("#waitImg").css("display", "block");
        var source = Config.sources[sourceLabel]
        var graphIri = source.graphIri
        if (source.isExternal) {
            return eval("sparql_"+sourceLabel+ ".getNodeInfos('" + conceptId + "'," + JSON.stringify(options) + "," + callback + ")")
        } else {
            Sparql_skos_generic.getNodeInfos(graphIri,conceptId, options, callback);
        }
    }


    return self;

})()
