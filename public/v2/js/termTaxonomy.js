var TermTaxonomy=(function(){
   var self={context:{}}
    self.init=function(){
       var html="<button onclick='TermTaxonomy.showActionPanel()'>OK</button>"
        $("#sourceActionDiv").html(html)

    }

    var colorsMap = {}
    var conceptsMap = {};
    var sources = [];




    self.showActionPanel=function(){
        self.initSources();
        $("#actionDiv").load("snippets/termTaxonomy.html")
        $("#accordion").accordion("option", {active: 2});

    }


    self.initSources=function() {

        sources= $("#sourcesTreeDiv").jstree(true).get_checked(true);
        for (var key in sources) {
            var source = sources[key]
            source.name = key;
            source.color = common.palette[Object.keys(sources).length]
            sources.push(source)
        }


    }


    self.searchConcepts = function (word) {


        self.context.currentWord = word
        conceptsMap = {}


        var exactMatch = $("#exactMatchCBX").prop("checked")

        var bindings = {}
        var sourceNodes = [];

        sources.forEach(function (source) {
            sourceNodes.push({id: source.name, text: "<span class='tree_level_1' style='background-color: " + source.color + "'>" + source.name + "</span>", chldren: [], parent: "#"})


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
        //  sources.forEach(function (source) {
        async.eachSeries(sources, function (source, callbackEach) {



            Sparql_facade.searchConceptAndAncestors(source.id,word,null,1,{exactMatch: exactMatch}, function (err, result){
           // sparql_abstract.list(source.name, word, {exactMatch: exactMatch}, function (err, result) {

                if (err) {
                    return console.log(err);
                }

                result.forEach(function (item) {
                    if (!conceptsMap[item.id]) {
                        if (result.length == 1)
                            selectedIds.push(item.id)
                        conceptsMap[item.id] = item;
                        item.source = source.name;
                        item.title = item.label + " / " + (item.description || "")

                        var newNode = {id: item.id, text: "<span class='tree_level_2'>" + item.title + "</span>", data: item}
                        // setTimeout(function () {
                        $("#conceptsJstreeDiv").jstree(true).create_node(source.name, newNode, "first", function () {
                            $("#conceptsJstreeDiv").jstree(true)._open_to(newNode.id);


                        }, false);

                        //  }, 1000)
                    }

                })
                if (source.sparql_url == 'http://vps475829.ovh.net:8890/sparql') {
                    callbackEach()
                }


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

    self.searchConceptsContainWord = function () {
        var selectedConcepts = []
        var xx = $("#conceptsJstreeDiv").jstree(true).get_checked(null, true)
        xx.forEach(function (nodeId) {
            if (conceptsMap[nodeId])
                selectedConcepts.push(conceptsMap[nodeId]);
        });
        $("#conceptsJstreeDiv").jstree(true).uncheck_all()
        var xx = selectedConcepts;
        selectedConcepts.forEach(function (concept) {
            sparql_abstract.list(concept.source, self.context.currentWord, {exactMatch: false, selectedThesaurus: concept.thesaurus}, function (err, result) {

                if (err) {
                    return console.log(err);
                }
                result.forEach(function (item) {
                    if (!conceptsMap[item.id]) {
                        conceptsMap[item.id] = item;
                        item.source = concept.source;
                        item.title = item.label + " / " + item.description
                        if (concept.source == "private") {
                            item.title = item.thesaurus + " : " + item.title
                        }
                        var newNode = {id: item.id, text: item.title, data: item}
                        setTimeout(function () {
                            $("#conceptsJstreeDiv").jstree(true).create_node(concept.id, newNode, "first", function () {
                                $("#conceptsJstreeDiv").jstree(true)._open_to(newNode.id);

                            }, false);
                        }, 1000)
                    }

                })

            })


        })


    }






    return self;


})()
