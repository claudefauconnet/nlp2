var Sparql_facade = (function () {
    var self = {};
    var elasticUrl = "/elastic";
    if (window.location.href.indexOf("https") > -1)
        elasticUrl = "../elastic";


    self.getTopConcepts = function (sourceLabel, options, callback) {
        $("#waitImg").css("display", "block");
        var source = Config.sources[sourceLabel]
        var graphUri = source.graphUri
        source.controller.getTopConcepts(sourceLabel,  options,callback);
    }

    self.getNodeChildren = function (sourceLabel,word, conceptId,descendantsDepth, options, callback) {
        $("#waitImg").css("display", "block");
        var source = Config.sources[sourceLabel]
        var graphUri = source.graphUri
        source.controller.getNodeChildren(sourceLabel, word,conceptId, descendantsDepth,options, callback);

    }


    self.getNodeParents = function (sourceLabel, word, id, ancestorsDepth, options, callback) {
        $("#waitImg").css("display", "block");
        var source = Config.sources[sourceLabel]
        var graphUri = source.graphUri
        source.controller.getNodeParents(sourceLabel, word, id, ancestorsDepth, options, callback)

    }

    self.getConceptAndAncestorsById = function (sourceLabel, conceptId, ancestorsDepth, options, callback) {
        $("#waitImg").css("display", "block");
        var source = Config.sources[sourceLabel];
        var graphUri = source.graphUri;
        source.controller.getNodeParents(sourceLabel,null, conceptId, ancestorsDepth, options, callback);

    }

    self.getNodeInfos = function (sourceLabel, conceptId, options, callback) {
        $("#waitImg").css("display", "block");
        var source = Config.sources[sourceLabel]
        var graphUri = source.graphUri
        source.controller.getNodeInfos(sourceLabel, conceptId, options, callback);

    }


    return self;

})()
