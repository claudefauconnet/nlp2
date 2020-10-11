var Sparql_facade = (function () {
    var self = {};
    var elasticUrl = "/elastic";
    if (window.location.href.indexOf("https") > -1)
        elasticUrl = "../elastic";


    self.getTopConcepts = function (sourceLabel, callback) {
        $("#waitImg").css("display", "block");
        var source = Config.sources[sourceLabel]
        var graphIri = source.graphIri
        source.controller.getTopConcepts(graphIri, callback);
    }

    self.getNodeChildren = function (sourceLabel, conceptId, options, callback) {
        $("#waitImg").css("display", "block");
        var source = Config.sources[sourceLabel]
        var graphIri = source.graphIri
        source.controller.getNodeChildren(graphIri, conceptId, options, callback);

    }


    self.searchConceptAndAncestors = function (sourceLabel, word, id, ancestorsDepth, options, callback) {
        $("#waitImg").css("display", "block");
        var source = Config.sources[sourceLabel]
        var graphIri = source.graphIri
        source.controller.searchConceptAndAncestors(graphIri, word, id, ancestorsDepth, {}, callback)

    }

    self.getConceptAndAncestorsById = function (sourceLabel, conceptId, ancestorsDepth, options, callback) {
        $("#waitImg").css("display", "block");
        var source = Config.sources[sourceLabel];
        var graphIri = source.graphIri;
        source.controller.searchConceptAndAncestors(null, conceptId, ancestorsDepth, options, callback);

    }

    self.getNodeInfos = function (sourceLabel, conceptId, options, callback) {
        $("#waitImg").css("display", "block");
        var source = Config.sources[sourceLabel]
        var graphIri = source.graphIri
        source.controller.getNodeInfos(graphIri, conceptId, options, callback);

    }


    return self;

})()
