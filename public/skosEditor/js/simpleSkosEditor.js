skosEditor = (function () {

    var self = {};
    self.context = {}
    var elasticUrl = "../elastic";
    var thesaurusNodeId = "_thesaurusNodeId"
    self.editor = null;
    self.initThesaurusSelects = function () {


        common.fillSelectOptions("thesaurusSelect1", thesaurusList, true);
        common.fillSelectOptions("thesaurusSelect2", thesaurusList, true);
        common.fillSelectOptions("thesaurusSelect3", thesaurusList, true);
        common.fillSelectOptions("thesaurusSelect4", thesaurusList, true);


    }

    self.drawJsTree = function (treeDiv, jsTreeData) {

        var plugins = [];
        plugins.push("search");

        plugins.push("sort");
        //   plugins.push("types");
        plugins.push("contextmenu");
        plugins.push("dnd");
        plugins.push("search");


        if ($('#' + treeDiv).jstree)
            $('#' + treeDiv).jstree("destroy")

        $('#' + treeDiv).jstree({
            'core': {
                // 'check_callback':true,
                'check_callback': function (operation, node, node_parent, node_position, more) {
                    return true;
                },
                'data': jsTreeData,
            }
            ,
            'plugins': plugins,
            "search": {
                "case_sensitive": false,
                "show_only_matches": true
            },
            "crrm": {"move": {"always_copy": "multitree"}}


        }).on("select_node.jstree",
            function (evt, obj) {
                if (skosEditor.isMultiple)
                    return;
                skosEditor.synchronizePreviousData();
                skosEditor.context.previousNode = obj.node;
                var conceptData = obj.node.data
                $("#popupDiv").css("display", "block")
                skosEditor.conceptEditor.editConcept(conceptData, "editorDivId");
            })
            .on("rename_node.jstree Event",
                function (event, obj) {
                    $("#popupDiv").css("display", "none")
                    var treeId = event.target.id

                    if (!obj.node.data) {
                        obj.node.data = {
                            id: "",
                            prefLabels: [],
                            altLabels: [],
                            relateds: [],
                            broaders: [],
                            definitions: [],
                            notes: []
                        }

                    }

                    if (obj.node.parent != "#") {


                        var parentNode = $('#' + treeId).jstree(true).get_node(obj.node.parent)
                        obj.node.data.id = parentNode.data.id + "/" + obj.node.text;
                        obj.node.data.broaders = [parentNode.data.id]


                    } else {
                        if (self.rootId)
                            obj.node.data.id = [self.rootId + "/" + obj.node.text]
                        else
                            obj.node.data.id = [obj.node.text]
                    }
                    $('#' + treeId).jstree(true).set_id(obj.node, obj.node.data.id);
                    obj.node.data.prefLabels = [{lang: self.outputLang, value: obj.node.text}]
                    var conceptData = obj.node.data;
                    skosEditor.context.previousNode = obj.node;
                    skosEditor.conceptEditor.editConcept(conceptData, "editorDivId");

                })


    }


    self.openAllTree = function (thesaurusIndex) {

        $('#treeDiv' + thesaurusIndex).jstree('open_all');
    }


    self.synchronizePreviousData = function () {

        if (!skosEditor.context.previousNode)
            return;
        var json = skosEditor.conceptEditor.getConceptData();

        var node = skosEditor.context.previousNode;
        node.data = json;
        if (node.data.prefLabels.length > 0) {
            var prefLabel = node.data.prefLabels[0]
            node.data.prefLabels.forEach(function (item) {
                    if (item.lang == self.outputLang)
                        prefLabel = item.value;
                }
            )
            if (node.text != prefLabel) {
                node.text = prefLabel;
                $("#treeDiv").jstree('rename_node', node.id, prefLabel);
            }
        }

    }

    self.loadThesaurus = function (rdfPath, editorDivId, thesaurusIndex) {
        self.outputLang = $("#outputLangInput" + thesaurusIndex).val();
        if (!self.outputLang || self.outputLang == "")
            self.outputLang = "en";
        $("#" + editorDivId).html("");
        $("#treeDiv" + thesaurusIndex).html("");
        $("#countConcepts" + thesaurusIndex).html("");
        $("#waitImg").css("display", "block");
        var thesaurusName = rdfPath.substring(rdfPath.lastIndexOf("\\") + 1)
        thesaurusName = thesaurusName.substring(0, thesaurusName.indexOf("."))

        var lastBroaderOption = null;
        if ($("#broaderTypeInput" + thesaurusIndex).val() == "last")
            lastBroaderOption = true;

        var payload = {
            rdfToEditor: 1,
            rdfPath: rdfPath,
            options: JSON.stringify({
                extractedLangages: "en,fr,sp",
                outputLangage: self.outputLang,
                lastBroader: lastBroaderOption,
                thesaurusName: thesaurusName

            })
        }
        $.ajax({
            type: "POST",
            url: elasticUrl,
            data: payload,
            dataType: "json",

            success: function (data, textStatus, jqXHR) {
                $("#waitImg").css("display", "none");
                $("#countConcepts" + thesaurusIndex).html(data.length)


                data.forEach(function (item, index) {
                    item.icon = "concept-icon.png";

                })


                self.drawJsTree("treeDiv" + thesaurusIndex, data)


            }
            , error: function (err) {
                $("#messageDiv").html("error" + err.responseText)
                console.log(err.responseText)
                $("#waitImg").css("display", "none");


            }
        })
    }


    self.initNewThesaurus = function (thesaurusIndex) {
        $("#skosInput" + thesaurusIndex).val("")
        $("#skosInput" + thesaurusIndex).val("")
        self.outputLang = $("#outputLangInput" + thesaurusIndex).val();
        if (!self.outputLang || self.outputLang == "")
            self.outputLang = "en";
        var thesaurusName = prompt("enter thesaurus name", "");
        if (!thesaurusName || thesaurusName == "")
            return;
        self.rdfUri = prompt("enter thesaurus uri", "http:souslesens/skosEditor/");

        if (!self.rdfUri || self.rdfUri == "")
            return;
        var id = self.rdfUri + thesaurusName;
        self.rootId = id;
        var jsTreeData = [
            {
                id: id,
                text: thesaurusName,
                parent: "#",
                data: {
                    id: id,
                    prefLabels: [{lang: self.outputLang, value: thesaurusName}],
                    altLabels: [],
                    broaders: [],
                    relateds: [],
                    definitions: [],
                    notes: []
                }
            }
        ]
        self.drawJsTree("treeDiv" + thesaurusIndex, jsTreeData);

    }

    self.saveThesaurus = function (thesaurusIndex) {
        self.synchronizePreviousData();


        var rdfPath = prompt("enter rdf file location", $("#skosInput" + thesaurusIndex).val());

        if (!rdfPath || rdfPath == "")
            return;

        var data = [];
        //get jstree nodes
        var jsonNodes = $('#treeDiv' + thesaurusIndex).jstree(true).get_json('#', {flat: true});
        $.each(jsonNodes, function (i, item) {
            if (item.id == thesaurusNodeId || item.id == "#")
                return;
            if (!item.data || !item.data.broaders)
                var x = 3
            if (!item.data.broaders || item.parent == thesaurusNodeId) {
                item.data.broaders = [];
            } else {
                if (item.data.broaders.length > 0) {
                    if (item.parent != item.data.broaders[0])
                        item.data.broaders[0] = item.parent;
                } else {
                    item.data.broaders.push(item.parent)
                }
            }
            data.push(item.data);


        })
        // reset incorrect nodeIds (newly created)
        data.forEach(function (item) {
        })

        data.forEach(function (item) {

        })

        var payload = {
            skosEditorToRdf: 1,
            rdfPath: rdfPath,
            data: JSON.stringify(data),
            options: JSON.stringify({})
        }
        $.ajax({
            type: "POST",
            url: elasticUrl,
            data: payload,
            dataType: "json",

            success: function (data, textStatus, jqXHR) {

                $("#messageDiv").html("skos file saved " + payload.rdfPath)


            }
            , error: function (err) {
                $("#messageDiv").html("error" + err.responseText)
                console.log(err.responseText)


            }
        })
    }


    self.conceptEditor = {
        currentEditorDivId: null,
        editConcept: function (conceptData, editorDivId, options) {
            if (editorDivId)
                currentEditorDivId = editorDivId;
            else
                editorDivId = currentEditorDivId;

            if (!conceptData)
                return $("#" + editorDivId).html("");
            if (!options)
                options = {};


            self.context.conceptData = conceptData
            self.context.currentState = "toForm"


            function setAbout(conceptData) {
                var html = "<div class='concept-group' >" +
                    "  <div class='row'>" +
                    "    <div class='col-sm-3'>" +
                    "       <label for='concept_about_value'><h6>about</h6></label> " +
                    "    </div>" +
                    "    <div class='col-lg'>" +
                    "      <input id='concept_about_value' value='" + conceptData.id + "' size='70'>" +
                    "   </div>" +
                    "</div>" +
                    "</div>"
                return html;
            }

            function setDefinitions(conceptData) {
                var html = "   <div class='concept-group'> <h6><span class='title'> Definition</span> <button  class='concept_button' onclick='skosEditor.conceptEditor.addToConceptDefinitions()'>+</button> </h6>"
                conceptData.definitions.forEach(function (definition, index) {
                    html += "  <div class='row'>" +
                        "    <div class='col-sm-3'>" +
                        "       <label for='concept_definition_value_" + index + "'><h6>about</h6></label> " +
                        "    </div>" +
                        "    <div class='col-lg'>" +
                        "      <input id='concept_definition_value_" + index + "' value='" + definition + "' size='70'>" +
                        "   </div>" +
                        "</div>"
                })
                html += "</div>"
                return html;
            }

            function setNotes(conceptData) {
                var html = "   <div class='concept-group'> <h6><span class='title'> Notes</span> <button  class='concept_button' onclick='skosEditor.conceptEditor.addToConceptNotes()'>+</button> </h6>"
                conceptData.notes.forEach(function (note, index) {
                    html += "  <div class='row'>" +
                        "    <div class='col-sm-3'>" +
                        "       <label for='concept_about_value_" + index + "'><h6>about</h6></label> " +
                        "    </div>" +
                        "    <div class='col-lg'>" +
                        "      <input id='concept_about_value_'" + index + " value='" + note + "' size='70' >" +
                        "   </div>" +
                        "</div>"
                })
                html += "</div>"
                return html;
            }


            function setPrefLabels(conceptData) {
                var html = "   <div class='concept-group'> <h6><span class='title'> prefLabels</span> <button  class='concept_button' onclick='skosEditor.conceptEditor.addToConceptPrefLabels()'>+</button> </h6>"
                conceptData.prefLabels.forEach(function (prefLabel, index) {
                    html += "<div class='container concept-item' >"

                    html += "  <div class='row'>" +

                        "    <div class='col'>" +
                        "      <input  id='concept_prefLabel_lang_" + index + "' value='" + prefLabel.lang + "' size='5'>" +
                        "   </div>" +


                        "    <div class='col'>" +
                        "      <input    id='concept_prefLabel_value_" + index + "' value='" + prefLabel.value + "' size='50'>" +
                        "   </div>" +
                        "    <div class='col'>" +
                        "       <button   class='concept_button' onclick=skosEditor.conceptEditor.removeFromConcept('prefLabels'," + index + ")> -</button>" +
                        "    </div>" +
                        "</div>"
                    html += "</div>"
                })
                html += "</div>"
                return html;
            }

            function setAltLabels(conceptData) {

                var html = "   <div class='concept-group'> <h6><span class='title'> altLabels</span> <button   class='concept_button' onclick='skosEditor.conceptEditor.addToConceptAltLabels()'>+</button></h6> "
                conceptData.altLabels.forEach(function (altLabel, index) {
                    html += "<div class='container concept-item' >"

                    html += "  <div class='row'>" +

                        "    <div class='col'>" +
                        "      <input  id='concept_altLabel_lang_" + index + "' value='" + altLabel.lang + "' size='5'>" +
                        "   </div>" +

                        "    <div class='col'>" +
                        "      <input    id='concept_altLabel_value_" + index + "' value='" + altLabel.value + "' size='50'>" +
                        "   </div>" +

                        "    <div class='col'>" +
                        "       <button   class='concept_button' onclick=skosEditor.conceptEditor.removeFromConcept('altLabels'," + index + ")> -</button>" +
                        "    </div>" +
                        "</div>"
                    html += "</div>"

                })
                html += "</div>"

                return html;
            }

            function setRelated(conceptData) {
                var html = "   <div class='concept-group'> <h6><span class='title'> related</span> <button   class='concept_button' onclick='skosEditor.conceptEditor.addToConceptRelateds()'>+</button></h6> "
                conceptData.relateds.forEach(function (related, index) {
                    html += "<div class='container concept-item' >"

                    html += "  <div class='row'>" +
                        "    <div class='col'>" +
                        "      <input  id='concept_related_" + index + "' value='" + related + "' size='50'>" +
                        "   </div>" +

                        "    <div class='col'>" +
                        "       <button   class='concept_button' onclick=skosEditor.conceptEditor.removeFromConcept('relateds'," + index + ")> -</button>" +
                        "    </div>" +
                        "</div>"
                    html += "</div>"
                })


                html += "</div>"
                return html;
            }


            function setBroaders(conceptData) {
                var html = "   <div class='concept-group'><h6> <span class='title'> broader</span> <button   class='concept_button' onclick='skosEditor.conceptEditor.addToConceptBroaders()'>+</button></h6> "
                conceptData.broaders.forEach(function (broader, index) {
                    html += "<div class='container concept-item' >"

                    html += "  <div class='row'>" +
                        "    <div class='col'>" +
                        "      <input  id='concept_broader_" + index + "' value='" + broader + "' size='70'>" +
                        "   </div>" +
                        "    <div class='col'>" +
                        "       <button  class='concept_button' onclick=skosEditor.conceptEditor.removeFromConcept('broaders'," + index + ")> -</button>" +
                        "    </div>" +
                        "</div>"
                    html += "</div>"
                })


                html += "</div>"
                return html;
            }


            var html = "<div class='concept'>"
            html += "<form name='conceptDetails'>"
            html += setAbout(conceptData);
            html += setDefinitions(conceptData);
            html += setNotes(conceptData);
            html += setBroaders(conceptData);
            html += setPrefLabels(conceptData);
            html += setAltLabels(conceptData);
            html += setRelated(conceptData);

            html += "</div>"
            html += "</form>";


            $("#" + editorDivId).html(html);
            if (options.readOnly) {
                $(".concept_button").css("display", "none")
            }
            if (options.bgColor) {
                $("#" + editorDivId + " .concept-group").css("background-color", options.bgColor);

            }


        }
        ,


        addToConceptPrefLabels: function () {
            self.context.conceptData.prefLabels.splice(0, 0, {lang: self.outputLang, value: ""})
            var conceptData = self.context.conceptData
            self.conceptEditor.editConcept(conceptData);
        }
        ,
        addToConceptAltLabels: function () {
            self.context.conceptData.altLabels.splice(0, 0, {lang: self.outputLang, value: ""})
            var conceptData = self.context.conceptData
            self.conceptEditor.editConcept(conceptData);
        }
        ,
        addToConceptBroaders: function () {
            self.context.conceptData.broaders.splice(0, 0, "")
            var conceptData = self.context.conceptData
            self.conceptEditor.editConcept(conceptData);
        }
        ,
        addToConceptRelateds: function () {
            self.context.conceptData.relateds.splice(0, 0, "")
            var conceptData = self.context.conceptData
            self.conceptEditor.editConcept(conceptData);
        }
        ,
        addToConceptDefinitions: function () {
            self.context.conceptData.definitions.splice(0, 0, "")
            var conceptData = self.context.conceptData
            self.conceptEditor.editConcept(conceptData);
        }
        ,
        addToConceptNotes: function () {
            self.context.conceptData.notes.splice(0, 0, "")
            var conceptData = self.context.conceptData
            self.conceptEditor.editConcept(conceptData);
        }
        ,


        removeFromConcept: function (type, index) {
            self.context.conceptData[type].splice(index, 1)
            var conceptData = self.context.conceptData
            self.conceptEditor.editConcept(conceptData);
        }
        ,


        getConceptData: function () {
            var conceptData = {about: "", prefLabels: [], altLabels: [], broaders: [], altLabels: [], relateds: [], definitions: [], notes: []}
            $("input").each(function (a, b) {
                var id = $(this).attr("id")

                var value = $(this).val()
                if (id && id.indexOf("concept_") > -1) {
                    var array = id.split("_");
                    var type = array[1]
                    if (type == "about")
                        conceptData.id = value;
                    if (type == "altLabel") {
                        conceptData.altLabels.push(value);
                    }
                    if (type == "prefLabel") {
                        conceptData.prefLabels.push(value);
                    }
                    if (type == "related")
                        conceptData.relateds.push(value);
                    if (type == "broader")
                        conceptData.broaders.push(value);
                    if (type == "definition")
                        conceptData.definitions.push(value);
                    if (type == "note")
                        conceptData.notes.push(value);

                }


            })
            var altLabels = []
            var lang = "";
            if (conceptData.altLabels)
                conceptData.altLabels.forEach(function (item, index) {
                    if (index % 2 == 0) {
                        lang = item;
                    } else {
                        altLabels.push({lang: lang, value: item})
                    }
                })
            conceptData.altLabels = altLabels;


            var prefLabels = []
            var lang = ""
            if (conceptData.prefLabels)
                conceptData.prefLabels.forEach(function (item, index) {
                    if (index % 2 == 0) {
                        lang = item;
                    } else {
                        prefLabels.push({lang: lang, value: item})
                    }
                })
            conceptData.prefLabels = prefLabels;

            return conceptData;


        }


    }

    self.addLocLevel = function () {
        var node = $('#treeDiv2').jstree(true).get_selected(true)[0]
        var payload = {
            getLOCchildren: 1,
            conceptId: node.id,
            maxLevels: 1,

        }
        $.ajax({
            type: "POST",
            url: elasticUrl,
            data: payload,
            dataType: "json",

            success: function (data, textStatus, jqXHR) {

                var parent = $('#treeDiv2').jstree('get_selected');

                data.forEach(function (itemData) {
                  if( $('#treeDiv2').jstree(true).get_node(itemData.id))
                      return;
                    var newNode = {
                        state: "open",
                        id: itemData.id,
                        text: itemData.prefLabels[0].value,
                        parent: node.id,
                        data: itemData

                    }
                    var position = 'inside';
                    var parent = $('#treeDiv2').jstree('get_selected');


                    $('#treeDiv2').jstree("create_node", node.id, position, newNode, false, false);

                })
            }
            , error: (function (err) {

            })
        })

    }

    return self;

})
()
