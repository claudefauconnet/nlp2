var TermTaxonomy = (function () {
    var self = {context: {}}
    self.init = function () {
        var html = "<button onclick='TermTaxonomy.showActionPanel()'>OK</button>"
        $("#sourceActionDiv").html(html)

    }

    var colorsMap = {}
    var conceptsMap = {};
    var sourceIds = [];


    self.showActionPanel = function () {
        self.initsourceIds();
        $("#actionDiv").load("snippets/termTaxonomy.html")
        $("#accordion").accordion("option", {active: 2});

    }


    self.initsourceIds = function () {

        var jsTreesourceIds = $("#sourcesTreeDiv").jstree(true).get_checked();
        sourceIds=[]
        jsTreesourceIds.forEach(function (sourceId) {
            if (!Config.sources[sourceId].color)
                Config.sources[sourceId].color =common.palette[Object.keys(sourceIds).length];
            sourceIds.push(sourceId)
        })
    }


    self.searchConcepts = function (word) {


        self.context.currentWord = word
        conceptsMap = {}


        var exactMatch = $("#exactMatchCBX").prop("checked")

        var bindings = {}
        var sourceNodes = [];

        sourceIds.forEach(function (sourceId) {

            sourceNodes.push({id: sourceId, text: "<span class='tree_level_1' style='background-color: " +  Config.sources[sourceId].color + "'>" + sourceId + "</span>", children: [], parent: "#"})


        })
        if ($('#conceptsJstreeDiv').jstree)
            $('#conceptsJstreeDiv').jstree("destroy")
        $("#conceptsJstreeDiv").jstree({

            "checkbox": {
                "keep_selected_style": false
            },
            "plugins": ["checkbox"],
            "core": {
                'check_callback': true,
                'data': sourceNodes
            }


        });
        var selectedIds = [];
        //  sourceIds.forEach(function (source) {
        async.eachSeries(sourceIds, function (sourceId, callbackEach) {


            Sparql_facade.searchConceptAndAncestors(sourceId, word, null, 1, {exactMatch: exactMatch}, function (err, result) {
                // sparql_abstract.list(source.name, word, {exactMatch: exactMatch}, function (err, result) {

                if (err) {
                    return console.log(err);
                }

                result.forEach(function (item) {
                    var conceptId=item.concept.value
                    if (!conceptsMap[conceptId]) {
                        /*  if (result.length == 1)
                              selectedIds.push(item.id)*/
                        conceptsMap[conceptId] = item;
                        item.sourceId = sourceId;
                        item.title = item.conceptLabel.value + " / " + (item.description || item.broader1Label.value)

                        var newNode = {id: conceptId, text: "<span class='tree_level_2'>" + item.title + "</span>", data: item}
                        // setTimeout(function () {
                        $("#conceptsJstreeDiv").jstree(true).create_node(sourceId, newNode, "first", function () {
                            $("#conceptsJstreeDiv").jstree(true)._open_to(newNode.id);


                        }, false);

                        //  }, 1000)
                    }

                })
              callbackEach()


            })


        }, function (err) {
            if (err)
                return $("#messageDiv").html(err)
            $("#messageDiv").html("done")
        })
        return;


        setTimeout(function () {

            $("#conceptsJstreeDiv").jstree(true).select_node(selectedIds);

        }, 3000)


    }

    self.displayGraph = function (direction) {

var defaultMaxDepth=5

        drawRootNode = function (word) {
            var rootNodeColor = "#dda";
            var rootNodeSize = 20
            $("#graphDiv").width($(window).width() - 20)
            self.rootNode = {
                label: word,
                id: word,
                color: rootNodeColor,
                size: rootNodeSize
            }
            var visjsData = {nodes: [], edges: []}
            visjsData.nodes.push(self.rootNode);
            visjsGraph.draw("graphDiv", visjsData, {
                onclickFn: TermTaxonomy.onGraphNodeClick,
                //  onHoverNodeFn: multiSkosGraph3.onNodeClick,
                afterDrawing: function () {
                    $("#waitImg").css("display", "none")
                }
            })


        }


        var selectedConcepts = []
        var jstreeNodes = $("#conceptsJstreeDiv").jstree(true).get_bottom_checked (false)
        jstreeNodes.forEach(function (nodeId) {
            if (conceptsMap[nodeId])
                selectedConcepts.push(conceptsMap[nodeId]);
        });


        drawRootNode(self.context.currentWord)
        setTimeout(function () {
            selectedConcepts.forEach(function (item) {
                var conceptId=item.concept.value
                item.color = Config.sources[item.sourceId].color

                if (direction == "ancestors") {
                  //  sparql_abstract.getAncestors(concept.source.id, concept.id, {exactMatch: true}, function (err, result) {
                        Sparql_facade.searchConceptAndAncestors(item.sourceId, null,conceptId, defaultMaxDepth, {exactMatch: true}, function (err, result) {
                        if (err)
                            return console.log(err)
                        if (!result || !result.forEach)
                            return;
                        result.forEach(function (binding) {
                            binding.source = item.sourceId;

                            var visjsData = self.pathsToVisjsData(binding)

                            self.addVisJsDataToGraph(visjsData)

                        })
                    })
                } else if (direction == "children") {

                    self.drawSourceRootNode(self.context.currentWord, item);
                    sparql_abstract.getChildren(item.source, item.id, {}, function (err, result) {
                        if (err)
                            return console.log(err);
                        self.addChildrenNodesToGraph(item, result)
                    })
                }


            })
                , self.multisearchTimeout
        })


    }
    self.onGraphNodeClick=function(point,node,options){

    }


    return self;


})()
