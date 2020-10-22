var ThesaurusBrowser = (function () {
    var self = {}

    self.onSourceSelect = function (thesaurusLabel) {
        self.showThesaurusTopConcepts(thesaurusLabel)
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


            var jsTreeOptions = {
                selectNodeFn: function (event, propertiesMap) {
                    if (options.treeSelectNodeFn) {
                        options.treeSelectNodeFn(event, propertiesMap);
                    }else {
                        if (true || propertiesMap.event.ctrlKey) {
                            self.editThesaurusConceptInfos(thesaurusLabel, propertiesMap.node)
                        }
                    }
                    {
                        self.openTreeNode("currentSourceTreeDiv", thesaurusLabel, propertiesMap.node)
                    }


                }


            }

            TreeController.drawOrUpdateTree("currentSourceTreeDiv", result, "#", "topConcept", jsTreeOptions)


        })


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
                var valuesStr=""
                values.forEach(function (value,index) {
                    if (value.indexOf("http") == 0)
                        value = "<a target='_blank' href='" + value + "'>" + value + "</a>"
                    if(index>0)
                        valuesStr+="<br>"
                    valuesStr+=value
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
                        var valuesStr=""
                         values.forEach(function (value,index) {
                             if (value.indexOf("http") == 0)
                                 value += "<a target='_blank' href='" + value + "'>" + value + "</a>"
                             if(index>0)
                                 valuesStr+="<br>"
                             valuesStr+=value

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

    return self;


})()
