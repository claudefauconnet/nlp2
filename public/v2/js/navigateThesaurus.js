var NavigateThesaurus = (function () {
    var self = {}

    self.showThesaurusTopConcepts = function (thesaurusLabel) {
        Sparql_facade.getTopConcepts(thesaurusLabel, function (err, result) {
            if (err) {
                return MainController.message(err);
            }

            var options = {layoutHierarchical: 1}


            //  GraphController.drawOrUpdateGraph("graphDiv",result,null,"#","topConcept",null,"box",options)
            $("#accordion").accordion("option", {active: 2});
            var html = "<div id='currentSourceTreeDiv'></div>"

            $("#actionDiv").html(html);


            var jsTreeOptions = {
                selectNodeFn: function (event, propertiesMap) {
                    if(propertiesMap.event.ctrlKey){
                        self.editThesaurusConceptInfos(thesaurusLabel,propertiesMap.node)
                    }else {
                        self.openTreeNode("currentSourceTreeDiv", thesaurusLabel, propertiesMap.node)
                    }


                }


            }

            TreeController.drawOrUpdateTree("currentSourceTreeDiv", result, "#", "topConcept", jsTreeOptions)


        })


    }

    self.openTreeNode = function (divId, thesaurusLabel,node, callback) {
        var existingNodes = common.getjsTreeNodes(divId, true)
        if(node.children.length>0)
        return;

        Sparql_facade.getNodeChildren(thesaurusLabel, node.id,null, function(err, result){
            if(err){
                return MainController.message(err);
            }
            TreeController.drawOrUpdateTree(divId, result,node.id, "child1")

        } )

    }


    self.editThesaurusConceptInfos=function( thesaurusLabel,node, callback){

        Sparql_facade.getNodeInfos(thesaurusLabel,node.id,null,function(err, result){
            if(err){
                return MainController.message(err);
            }
        //    SkosConceptEditor.editConcept("graphDiv",result)
            self.showNodeInfos("graphDiv","en",result)


        })



    }

    self.showNodeInfos= function (divId,defaultLang,data) {

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

            if (item.value && item.value["xml:lang"]){
                if (!propertiesMap.properties[propName].langValues[item.value["xml:lang"]])
                    propertiesMap.properties[propName].langValues[item.value["xml:lang"]]=[]
                    propertiesMap.properties[propName].langValues[item.value["xml:lang"]].push(value);
            }
            else {
                if(! propertiesMap.properties[propName].value)
                    propertiesMap.properties[propName].value=[];
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
            var str = "<table >"
            str += "<tr><td>UUID</td><td><a target='_blank' href='"+data.id+"'>"+data.id+"</a></td></tr>"

            defaultProps.forEach(function (key) {
                if (!propertiesMap.properties[key])
                    return;

                str += "<tr >"


                if (propertiesMap.properties[key].value) {
                    var values=propertiesMap.properties[key].value;
                    values.forEach(function (value) {
                        if (value.indexOf("http") == 0)
                            value = "<a target='_blank' href='" + value + "'>" + value + "</a>"
                        str += "<td class='detailsCell'>" + propertiesMap.properties[key].name + "</td>"
                        str += "<td class='detailsCell'>" + value + "</td>"
                        str += "</tr>"
                    })

                } else {
                    var keyName = propertiesMap.properties[key].name
                    var selectId = "detailsLangSelect_" + keyName
                    var propNameSelect = "<select id='" + selectId + "' onchange=NavigateThesaurus.onNodeDetailsLangChange('" + keyName + "') >"
                    var langDivs = "";

                    for (var lang in propertiesMap.properties[key].langValues) {
                        var values = propertiesMap.properties[key].langValues[lang];
                        values.forEach(function (value) {
                            if (value.indexOf("http") == 0)
                                value = "<a target='_blank' href='" + value + "'>" + value + "</a>"
                            var selected = "";
                            if (lang == defaultLang)
                                selected = "selected";
                            propNameSelect += "<option " + selected + ">" + lang + "</option> ";


                            langDivs += "<div class='detailsLangDiv_" + keyName + "' id='detailsLangDiv_" + keyName + "_" + lang + "'>" + value + "</div>"

                            propNameSelect += "</select>"

                            str += "<td class='detailsCell'>" + propertiesMap.properties[key].name + " " + propNameSelect + "</td>"
                            str += "<td class='detailsCell'>" + langDivs + "</td>";
                            if (propertiesMap.properties[key].langValues[defaultLang])
                                str += "<script>NavigateThesaurus.onNodeDetailsLangChange('" + keyName + "','" + defaultLang + "') </script>";

                            str += "</tr>"

                        })
                    }
                }

            })
            str += "</table>"


            $("#"+divId).html(str)




    }

    self.onNodeDetailsLangChange= function (property, lang) {
        $('.detailsLangDiv_'+property).css('display', 'none')
        if (!lang)
            lang = $("#detailsLangSelect_" + property).val();
        if( $("#detailsLangDiv_" + property + "_" + lang).html())
            $("#detailsLangDiv_" + property + "_" + lang).css("display", "block");

    }

    return self;


})()
