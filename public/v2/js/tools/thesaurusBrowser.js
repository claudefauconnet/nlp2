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
        self.currentTreeNode = propertiesMap.node
        if (true || propertiesMap.event.ctrlKey) {
            self.editThesaurusConceptInfos(MainController.currentSource, propertiesMap.node)
        }
        {
            self.openTreeNode("currentSourceTreeDiv", MainController.currentSource, propertiesMap.node)
        }

    }

    self.showThesaurusTopConcepts = function (thesaurusLabel, options) {
        if (!options)
            options = {}

        Sparql_facade.getTopConcepts(thesaurusLabel, function (err, result) {
            if (err) {
                return MainController.message(err);
            }


            $("#accordion").accordion("option", {active: 2});
            var html = "<div id='currentSourceTreeDiv'></div>"

            $("#actionDiv").html(html);


            var jsTreeOptions = options;
            jsTreeOptions.contextMenu = self.getJstreeContextMenu()
            jsTreeOptions.selectNodeFn =Config.tools[MainController.currentTool].controller.selectNodeFn;
            TreeController.drawOrUpdateTree("currentSourceTreeDiv", result, "#", "topConcept", jsTreeOptions)


        })


    }
    self.getJstreeContextMenu = function () {
        return {
            copyNode: {
                label: "Copy Node",
                action: function () {
                    Clipboard.copy =({id:self.currentTreeNode.id,label:self.currentTreeNode.text})


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

        if (!rootId)
            rootId = "#"
        if (!sourceLabel)
            sourceLabel = MainController.currentSource
        var depth = 5
        Sparql_generic.getNodeParents(sourceLabel, term, null, depth, null, function (err, result) {
            if (err)
                return MainController.UI.message(err)

            var existingNodes = {};
            var jstreeData = []

            result.forEach(function (item) {
                for (var i = depth; i > 0; i--) {
                    if (item["broader" + i]) {
                        var id = item["broader" + i].value
                        if (!existingNodes[id]) {
                            existingNodes[id] = 1
                            var label = item["broader" + i + "Label"].value
                            var parentId = rootId
                            if (item["broader" + (i + 1)])
                                parentId = item["broader" + (i + 1)].value
                            jstreeData.push({id: id, text: label, parent: parentId, data: {sourceLabel: sourceLabel}})
                        }
                    }
                }
                jstreeData.push({id: item.concept.value, text: item.conceptLabel.value, parent: item["broader1"].value, data: {sourceLabel: sourceLabel}})
                $("#messageDiv").html("");
            })
            if (callback)
                return callback(null, jstreeData)

            common.loadJsTree("currentSourceTreeDiv", jstreeData, {
                openAll: true, selectNodeFn: function (event, propertiesMap) {
                    if (Config.tools[MainController.currentTool].selectNodeFn)
                        return Config.tools[MainController.currentTool].controller.selectNodeFn(event, propertiesMap);
                    self.editThesaurusConceptInfos(MainController.currentSource, propertiesMap.node)
                }
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
            MainController.UI.message("searching in " + sourceLabel)
            self.searchTerm(sourceLabel, term, sourceLabel, function (err, result) {
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
                    if (Config.tools[MainController.currentTool].selectNodeFn)
                        return Config.tools[MainController.currentTool].controller.selectNodeFn(event, propertiesMap);
                    self.editThesaurusConceptInfos(propertiesMap.node.data.sourceLabel, propertiesMap.node)
                }
            })

        })


    }

    return self;


})()
