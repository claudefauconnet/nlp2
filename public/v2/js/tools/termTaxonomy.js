var TermTaxonomy = (function () {
    var self = {context: {}}

    var colorsMap = {}
    var conceptsMap = {};
    var sourceIds = [];




    self.init = function () {
        var html = "<button onclick='TermTaxonomy.showActionPanel()'>OK</button>"
        $("#sourceDivControlPanelDiv").html(html)

    }




    self.showActionPanel = function () {
        self.initsourceIds();
        $("#actionDivContolPanelDiv").html("")
        $("#actionDiv").load("snippets/termTaxonomy.html")
        $("#accordion").accordion("option", {active: 2});

    }


    self.initsourceIds = function () {

        var jsTreesourceIds = $("#sourcesTreeDiv").jstree(true).get_checked();
        sourceIds = []
        jsTreesourceIds.forEach(function (sourceId) {
            if (!Config.sources[sourceId].color)
                Config.sources[sourceId].color = common.palette[Object.keys(sourceIds).length];
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

            sourceNodes.push({id: sourceId, text: "<span class='tree_level_1' style='background-color: " + Config.sources[sourceId].color + "'>" + sourceId + "</span>", children: [], parent: "#"})


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


            Sparql_facade.getNodeParents(sourceId, word, null, 1, {exactMatch: exactMatch}, function (err, result) {
                // sparql_abstract.list(source.name, word, {exactMatch: exactMatch}, function (err, result) {

                if (err) {
                    return console.log(err);
                }

                result.forEach(function (item) {
                    var conceptId = item.concept.value
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

        var maxDepth = 5

        drawRootNode = function (word) {
            var rootNodeColor = "#dda";
            var rootNodeSize = 20
            $("#graphDiv").width($(window).width() - 20)
            $("#graphDiv").height($(window).height() - 20)
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
        var jstreeNodes = $("#conceptsJstreeDiv").jstree(true).get_bottom_checked(false)
        jstreeNodes.forEach(function (nodeId) {
            if (conceptsMap[nodeId])
                selectedConcepts.push(conceptsMap[nodeId]);
        });


        drawRootNode(self.context.currentWord)
        setTimeout(function () {
            selectedConcepts.forEach(function (item) {
                var conceptId = item.concept.value
                item.color = Config.sources[item.sourceId].color

                if (direction == "ancestors") {
                    //  sparql_abstract.getAncestors(concept.source.id, concept.id, {exactMatch: true}, function (err, result) {
                    Sparql_facade.getNodeParents(item.sourceId, null, conceptId, maxDepth, {exactMatch: true}, function (err, result) {
                        if (err)
                            return console.log(err)
                        if (!result || !result.forEach)
                            return;
                        self.addAncestorsGraph(item.sourceId,self.context.currentWord, result, maxDepth)
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

    self.addAncestorsGraph = function (sourceId,rootNodeId, bindings, depth) {
        var visjsData = {nodes: [], edges: []}

       // edge beetwen word and concept
        var conceptId = bindings[0].concept.value;
        visjsData.edges.push({
            id: rootNodeId + "_" + conceptId,
            from: rootNodeId,
            to: conceptId,
            label: sourceId
        })


        for (var i = 1; i < depth; i++) {
            var fromVar = "";
            if (i == 1)
                fromVar = "concept"
            else
                fromVar = "broader" + (i - 1)

            var toVar = "broader" + i;

            var color=Config.sources[sourceId].color
            var options={
                from:{shape:"box",color:color},
                to:{shape:"box",color:color}
            }



            visjsData = GraphController.toVisjsData(visjsData, bindings, null, fromVar, toVar, options)
        }

        visjsGraph.data.nodes.add(visjsData.nodes)
        visjsGraph.data.edges.add(visjsData.edges)

    }


    self.onGraphNodeClick = function ( node,point, options) {
        if (node) {
            self.graphActions.currentNode = node;

            self.graphActions.showPopup(point)
        }
    }
    self.graphActions = {

        showPopup: function (point) {
            $("#graphPopupDiv").css("left", point.x)
            $("#graphPopupDiv").css("top", point.y)
            $("#graphPopupDiv").css("display", "flex")
        },
        hidePopup: function () {
            $("#graphPopupDiv").css("display", "none")
        },


        drawChildren: function () {
            self.graphActions.hidePopup();
            sparql_abstract.getChildren(self.graphActions.currentNode.data.source, self.graphActions.currentNode.id, {}, function (err, children) {
                if (err)
                    return console.log(err);
                self.addChildrenNodesToGraph(self.graphActions.currentNode, children)
            })
        }
        ,
        showDetails: function (defaultLang) {

            self.graphActions.hidePopup();


            var defaultProps = ["UUID", "http://www.w3.org/2004/02/skos/core#prefLabel",
                "http://www.w3.org/2004/02/skos/core#definition", "" +
                "http://www.w3.org/2004/02/skos/core#altLabel",
                "http://www.w3.org/2004/02/skos/core#broader",
                "http://www.w3.org/2004/02/skos/core#narrower",
                "http://www.w3.org/2004/02/skos/core#related",
                "http://www.w3.org/2004/02/skos/core#exactMatch",
                "http://www.w3.org/2004/02/skos/core#closeMatch",
                //  "http://www.w3.org/2004/02/skos/core#sameAs"
            ];

            if (!defaultLang)
                defaultLang = 'en';
            sparql_abstract.getDetails(self.graphActions.currentNode.data.source, self.graphActions.currentNode.id, {}, function (err, details) {
                for (var key in details.properties) {
                    if (defaultProps.indexOf(key) < 0)
                        defaultProps.push(key)
                }
                var str = "<table >"
                str += "<tr><td>UUID</td><td><a target='_blank' href='"+details.id+"'>"+details.id+"</a></td></tr>"

                defaultProps.forEach(function (key) {
                    if (!details.properties[key])
                        return;

                    str += "<tr >"


                    if (details.properties[key].value) {
                        var value=details.properties[key].value;
                        if(value.indexOf("http")==0)
                            value="<a target='_blank' href='"+value+"'>"+value+"</a>"
                        str += "<td class='detailsCell'>" + details.properties[key].name + "</td>"
                        str += "<td class='detailsCell'>" + value + "</td>"

                    } else {
                        var keyName = details.properties[key].name
                        var selectId = "detailsLangSelect_" + keyName
                        var propNameSelect = "<select id='" + selectId + "' onchange=multiSkosGraph3.graphActions.onDetailsLangChange('" + keyName + "') >"
                        var langDivs = "";

                        for (var lang in details.properties[key].langValues) {
                            var value = details.properties[key].langValues[lang];

                            if(value.indexOf("http")==0)
                                value="<a target='_blank' href='"+value+"'>"+value+"</a>"
                            var selected = "";
                            if (lang == defaultLang)
                                selected = "selected";
                            propNameSelect += "<option " + selected + ">" + lang + "</option> ";


                            langDivs += "<div class='detailsLangDiv_"+keyName+"' id='detailsLangDiv_" + keyName + "_" + lang + "'>" + value + "</div>"
                        }
                        propNameSelect += "</select>"

                        str += "<td class='detailsCell'>" + details.properties[key].name + " " + propNameSelect + "</td>"
                        str += "<td class='detailsCell'>" + langDivs + "</td>";
                        if(details.properties[key].langValues[defaultLang])
                            str += "<script>multiSkosGraph3.graphActions.onDetailsLangChange('" + keyName + "','" + defaultLang + "') </script>";

                    }
                    str += "</tr>"
                })
                str += "</table>"


                $("#detailsDiv").html(str)
                $("#detailsDiv").dialog("open");


            })

        },
        onDetailsLangChange: function (property, lang) {
            $('.detailsLangDiv_'+property).css('display', 'none')
            if (!lang)
                lang = $("#detailsLangSelect_" + property).val();
            if( $("#detailsLangDiv_" + property + "_" + lang).html())
                $("#detailsLangDiv_" + property + "_" + lang).css("display", "block");

        }
        ,
        setAsRootNode: function () {
            self.graphActions.hidePopup();
            var word = self.graphActions.currentNode.label
            $('#searchWordInput').val(word)
            $('#dialogDiv').dialog('open')
            self.searchConcepts(word);


        }


    }


    return self;


})()
