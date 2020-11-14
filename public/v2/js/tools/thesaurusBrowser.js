var ThesaurusBrowser = (function () {
    var self = {}


    self.onLoaded = function () {
        $("#sourceDivControlPanelDiv").html("<input id='SourceEditor_searchAllSourcesTermInput'> <button onclick='ThesaurusBrowser.searchAllSourcesTerm()'>Search</button>")
    }
    self.onSourceSelect = function (thesaurusLabel) {
        MainController.currentSource = thesaurusLabel;
        self.showThesaurusTopConcepts(thesaurusLabel)
        $("#actionDivContolPanelDiv").html("<input id='GenericTools_searchTermInput'> <button onclick='ThesaurusBrowser.searchTerm()'>Search</button>")
    }

    self.selectNodeFn = function (event, propertiesMap) {
        var source;
        if(propertiesMap.node.data && propertiesMap.node.data.sourceLabel)
            source=propertiesMap.node.data && propertiesMap.node.data.sourceLabel // coming from search all sources
        else
            source= MainController.currentSource// coming from  specific tool current surce
        self.currentTreeNode = propertiesMap.node;
        if (propertiesMap.event.ctrlKey)
            Clipboard.copy({
                type: "node",
                id: self.currentTreeNode.id,
                label: self.currentTreeNode.text,
                source:  source
            }, self.currentTreeNode.id + "_anchor", propertiesMap.event)


        if (true || propertiesMap.event.ctrlKey) {
            self.editThesaurusConceptInfos(source, propertiesMap.node)
        }
        {
            self.openTreeNode("currentSourceTreeDiv", source, propertiesMap.node)
        }

    }

    self.showThesaurusTopConcepts = function (thesaurusLabel, options) {
        if (!options)
            options = {}

        Sparql_facade.getTopConcepts(thesaurusLabel, options, function (err, result) {
            if (!options)
                options = {}
            if (err) {
                return MainController.message(err);
            }

            if(false){
                var str=""
                result.forEach(function(item){
                 str+=thesaurusLabel+"\t"+item.topConcept.value+"\t"+item.topConceptLabel.value+"\n"
                })
                console.log(str)
            }




            $("#accordion").accordion("option", {active: 2});
            var html = "<div id='currentSourceTreeDiv'></div>"

            $("#actionDiv").html(html);


            var jsTreeOptions = options;
            jsTreeOptions.contextMenu = self.getJstreeConceptsContextMenu()
            jsTreeOptions.selectNodeFn = Config.tools[MainController.currentTool].controller.selectNodeFn;
            TreeController.drawOrUpdateTree("currentSourceTreeDiv", result, "#", "topConcept", jsTreeOptions)


            Sparql_generic.collections.getCollections(thesaurusLabel, options, function (err, result) {

            })


        })


    }
    self.getJstreeConceptsContextMenu = function () {
        return {
            copyNode: {
                label: "Copy Node",
                action: function (e) {
                    Clipboard.copy({type: "node", id: self.currentTreeNode.id, label: self.currentTreeNode.text, source: MainController.currentSource}, self.currentTreeNode.id + "_anchor", e)


                },

            },
        }
    }

    self.openTreeNode = function (divId, thesaurusLabel, node, callback) {
        var existingNodes = common.getjsTreeNodes(divId, true)
        if (node.children.length > 0)
            return;

        Sparql_facade.getNodeChildren(thesaurusLabel, null, node.id, 1, null, function (err, result) {
            if (err) {
                return MainController.UI.message(err);
            }
            TreeController.drawOrUpdateTree(divId, result, node.id, "child1")

        })

    }


    self.editThesaurusConceptInfos = function (thesaurusLabel, node, callback) {

        Sparql_facade.getNodeInfos(thesaurusLabel, node.id, null, function (err, result) {
            if (err) {
                return MainController.UI.message(err);
            }
            //    SkosConceptEditor.editConcept("graphDiv",result)
            self.showNodeInfos("graphDiv", "en", node.id, result)


        })


    }

    self.showNodeInfos = function (divId, defaultLang, nodeId, data) {

        var bindings = []
        var propertiesMap = {label: "", id: "", properties: {}};
        data.forEach(function (item) {
            var propName = item.prop.value
            var p = propName.lastIndexOf("#")
            if (p == -1)
                var p = propName.lastIndexOf("/")
            if (p > -1)
                var propName = propName.substring(p + 1)
            var value = item.value.value;
            /*   if (item.valueLabel)
                   value = item.valueLabel.value;*/

            if (!propertiesMap.properties[propName])
                propertiesMap.properties[propName] = {name: propName, langValues: {}}

            if (item.value && item.value["xml:lang"]) {
                if (!propertiesMap.properties[propName].langValues[item.value["xml:lang"]])
                    propertiesMap.properties[propName].langValues[item.value["xml:lang"]] = []
                propertiesMap.properties[propName].langValues[item.value["xml:lang"]].push(value);
            } else {
                if (!propertiesMap.properties[propName].value)
                    propertiesMap.properties[propName].value = [];
                propertiesMap.properties[propName].value.push(value);
            }

        })


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

        for (var key in propertiesMap.properties) {
            if (defaultProps.indexOf(key) < 0)
                defaultProps.push(key)
        }
        var str = "<table class='infosTable'>"
        str += "<tr><td class='detailsCellName'>UUID</td><td><a target='_blank' href='" + nodeId + "'>" + nodeId + "</a></td></tr>"
        str += "<tr><td>&nbsp;</td><td>&nbsp;</td></tr>"


        defaultProps.forEach(function (key) {
            if (!propertiesMap.properties[key])
                return;

            str += "<tr >"


            if (propertiesMap.properties[key].value) {
                var values = propertiesMap.properties[key].value;
                str += "<td class='detailsCellName'>" + propertiesMap.properties[key].name + "</td>"
                var valuesStr = ""
                values.forEach(function (value, index) {
                    if (value.indexOf("http") == 0)
                        value = "<a target='_blank' href='" + value + "'>" + value + "</a>"
                    if (index > 0)
                        valuesStr += "<br>"
                    valuesStr += value
                })
                str += "<td class='detailsCellValue'>" + valuesStr + "</td>"
                str += "</tr>"


            } else {
                var keyName = propertiesMap.properties[key].name
                var selectId = "detailsLangSelect_" + keyName
                var propNameSelect = "<select id='" + selectId + "' onchange=ThesaurusBrowser.onNodeDetailsLangChange('" + keyName + "') >"
                var langDivs = "";


                for (var lang in propertiesMap.properties[key].langValues) {
                    var values = propertiesMap.properties[key].langValues[lang];
                    var selected = "";
                    if (lang == defaultLang)
                        selected = "selected";
                    propNameSelect += "<option " + selected + ">" + lang + "</option> ";
                    var valuesStr = ""
                    values.forEach(function (value, index) {
                        if (value.indexOf("http") == 0)
                            value += "<a target='_blank' href='" + value + "'>" + value + "</a>"
                        if (index > 0)
                            valuesStr += "<br>"
                        valuesStr += value

                    })

                    langDivs += "<div class='detailsLangDiv_" + keyName + "' id='detailsLangDiv_" + keyName + "_" + lang + "'>" + valuesStr + "</div>"

                }


                propNameSelect += "</select>"

                str += "<td class='detailsCellName'>" + propertiesMap.properties[key].name + " " + propNameSelect + "</td>"
                str += "<td class='detailsCellValue'>" + langDivs + "</td>";

                if (propertiesMap.properties[key].langValues[defaultLang])
                    str += "<script>ThesaurusBrowser.onNodeDetailsLangChange('" + keyName + "','" + defaultLang + "') </script>";

                str += "</tr>"

            }

        })
        str += "</table>"


        $("#" + divId).html(str)


    }


    self.onNodeDetailsLangChange = function (property, lang) {
        $('.detailsLangDiv_' + property).css('display', 'none')
        if (!lang)
            lang = $("#detailsLangSelect_" + property).val();
        if ($("#detailsLangDiv_" + property + "_" + lang).html())
            $("#detailsLangDiv_" + property + "_" + lang).css("display", "block");

    }

    self.searchTerm = function (sourceLabel, term, rootId, callback) {
        if (!term)
            term = $("#GenericTools_searchTermInput").val()

        if (!term || term == "")
            return
        var options = {
            term: term,
            rootId: rootId
        }
        TreeController.getFilteredNodesJstreeData(sourceLabel, options, function (err, jstreeData) {
            if (callback)
                return (err, jstreeData)
            MainController.UI.message("")
            common.loadJsTree("currentSourceTreeDiv", jstreeData, {
                openAll: true, selectNodeFn: function (event, propertiesMap) {
                    if (Config.tools[MainController.currentTool].controller.selectNodeFn)
                        return Config.tools[MainController.currentTool].controller.selectNodeFn(event, propertiesMap);
                    self.editThesaurusConceptInfos(MainController.currentSource, propertiesMap.node)
                }, contextMenu: self.getJstreeConceptsContextMenu()
            })

        })
    }


    self.searchAllSourcesTerm = function () {
        if (!term)
            var term = $("#SourceEditor_searchAllSourcesTermInput").val()
        if (!term || term == "")
            return

        var searchedSources = [];
        for (var sourceLabel in Config.sources) {
            if (Config.sources[sourceLabel].sourceSchema == "SKOS") {
                searchedSources.push(sourceLabel)
            }
        }
        var jstreeData = []
        async.eachSeries(searchedSources, function (sourceLabel, callbackEach) {
            setTimeout(function(){
            MainController.UI.message("searching in " + sourceLabel)
            },100)
            if (!term)
                term = $("#GenericTools_searchTermInput").val()

            if (!term || term == "")
                return
            var options = {
                term: term,
                rootId: sourceLabel
            }
            TreeController.getFilteredNodesJstreeData(sourceLabel, options, function (err, result) {
                if (err)
                    return MainController.UI.message(err)
                jstreeData.push({id: sourceLabel, text: sourceLabel, parent: "#", data: {sourceLabel: sourceLabel}})
                jstreeData = jstreeData.concat(result)
                callbackEach();
            })


        }, function (err) {
            $("#accordion").accordion("option", {active: 2});
            var html = "<div id='currentSourceTreeDiv'></div>"


            $("#actionDiv").html(html);


            common.loadJsTree("currentSourceTreeDiv", jstreeData, {
                openAll: true, selectNodeFn: function (event, propertiesMap) {
                    if (Config.tools[MainController.currentTool].controller.selectNodeFn)
                        return Config.tools[MainController.currentTool].controller.selectNodeFn(event, propertiesMap);
                    self.editThesaurusConceptInfos(propertiesMap.node.data.sourceLabel, propertiesMap.node)
                }, contextMenu: self.getJstreeConceptsContextMenu()
            })
            setTimeout(function(){
            MainController.UI. updateActionDivLabel("Multi source search :"+term)
                MainController.UI.message("")
            },200)

        })


    }




    return self;


})()
