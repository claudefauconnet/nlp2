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

        function customMenu(node) {
            skosEditor.editSkosMenuNode = node;
            var items = $.jstree.defaults.contextmenu.items(node);
            delete items.ccp;
            if (node.type === 'root' || self.context.isReadOnly) {
                delete items.create;
                delete items.rename;
                delete items.remove;

            }
            items.openBranch = {
                label: "openBranch",
                action: function () {
                    var node = skosEditor.editSkosMenuNode;
                    $("#" + treeDiv).jstree(true).open_all(node.id, 1000)
                }
            }
            items.editSkos = {
                label: "editSkos",
                action: function () {
                    var node = skosEditor.editSkosMenuNode;
                    if (skosEditor.context.editSkosNodeFn)
                        skosEditor.context.editSkosNodeFn(node);
                }

            }

            return items;
        }

        var plugins = [];
        plugins.push("search");

        plugins.push("sort");
        //   plugins.push("types");
        plugins.push("contextmenu");

        if (!self.context.isReadOnly) {
            plugins.push("dnd");
        }
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
            "crrm": {"move": {"always_copy": "multitree"}},
            contextmenu: {items: customMenu}


        }).on("select_node.jstree",
            function (evt, obj) {
                if (skosEditor.onJstreeNodeClick) {
                    skosEditor.onJstreeNodeClick(evt, obj);
                    return;
                }


                var conceptData = obj.node.data
                $("#popupDiv").css("display", "block");
                var options = {}
                if (self.context.isReadOnly) {
                    options.readOnly = true
                }
                skosEditor.context.editingNode = obj.node;
                skosEditor.conceptEditor.editConcept(concept.data, "editorDivId", options);
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
                            obj.node.data.id = self.rootId + "/" + obj.node.text
                        else
                            obj.node.data.id = obj.node.text
                    }
                    $('#' + treeId).jstree(true).set_id(obj.node, obj.node.data.id);
                    obj.node.data.prefLabels = [{lang: self.outputLang, value: obj.node.text}]
                    var conceptData = obj.node.data;
                 //   skosEditor.context.editingNode = null;
                    //  skosEditor.conceptEditor.editConcept(conceptData, "editorDivId");

                })


    }


    self.openAllTree = function (thesaurusIndex) {
        if (!skosEditor.context.expanded) {
            skosEditor.context.expanded = true;
            $('#treeDiv' + thesaurusIndex).jstree('open_all');
        } else {

            skosEditor.context.expanded = false;
            $('#treeDiv' + thesaurusIndex).jstree('close_all');
        }
    }


    self.synchronizeEditorData = function (node) {

        if (!node)
            return;
        /*    var json = skosEditor.conceptEditor.getConceptData();

            if (!json.id)
                return;

            node.data = json;*/
        if (node.data.prefLabels.length > 0) {
            var prefLabel = node.data.prefLabels[0]
            node.data.prefLabels.forEach(function (item) {
                    if (item.lang == self.outputLang)
                        prefLabel = item.value;
                }
            )
            if (node.text != prefLabel) {
                node.text = prefLabel;
                $("#treeDiv1").jstree(true).rename_node(node.id, prefLabel);
                $("#treeDiv1").jstree(true).refresh_node (node.id);
            }
        }

    }

    self.loadThesaurus = function (rdfPath, editorDivId, thesaurusIndex) {

        if (skosEditor.data && skosEditor.context.modified && !skosEditor.context.isReadOnly) {
            if (confirm("Save Current file  before open new file?")) {
                self.saveThesaurus(thesaurusIndex);
                skosEditor.context.modified = null;
            }
        }
        self.context.isReadOnly = false;
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
                thesaurusName: thesaurusName,
                checkModifications: true,

            })
        }
        $.ajax({
            type: "POST",
            url: elasticUrl,
            data: payload,
            dataType: "json",

            success: function (data, textStatus, jqXHR) {
                self.context.currentRdfPath = rdfPath;
                if (data.mode && data.mode == "readOnly") {
                    self.context.isReadOnly = true;
                    if (confirm("this file is already editing : force write mode ?")) {
                        if (confirm("DANGER  of data loss  when editing same file simultaneously in more than one window, continue ?")) {
                            self.context.isReadOnly = false;

                        }


                    }


                }
                self.context.data = data.skos;
                var data = data.skos
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

        if (skosEditor.context.modified) {
            if (confirm("Save opened Thesaurus ?")) {
                self.saveThesaurus(thesaurusIndex);
                skosEditor.context.modified = null;

            }
        }
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

        skosEditor.context.modified = false

        var rdfPath = prompt("enter rdf file location", $("#skosInput" + thesaurusIndex).val());

        if (!rdfPath || rdfPath == "")
            return;
        if (self.context.isReadOnly && self.context.currentRdfPath == rdfPath) {
            if (confirm("This file is allready editing Do you want to overwrite  :" + rdfPath)) {
                if (!confirm("confirm overwrite : other editing  modifications will be lost"))
                    return;
            }

        }

        var data = [];
        //get jstree nodes
        var jsonNodes = $('#treeDiv' + thesaurusIndex).jstree(true).get_json('#', {flat: true});
        $.each(jsonNodes, function (i, item) {
            if (item.text == "AA" || item.text == "BB")
                var x = 3
            if (item.id == thesaurusNodeId || item.id == "#")
                return;
            if (!item.data || !item.data.broaders || item.data.broaders.length == 0)
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
                var html = "<div class='concept-group' style='background-color: #b8d6a2'>" +
                    "  <div class='row'>" +
                    "    <div class='col-sm-3'>" +
                    "       <label for='concept_about_value'><h6>about</h6></label> " +
                    "    </div>" +
                    "    <div class='col-lg'>" +
                    "      <input class ='concept_input' id='concept_about_value' value='" + conceptData.id + "' size='70'>" +
                    "   </div>" +
                    "</div>" +
                    "</div>"
                return html;
            }

            function setDefinitions(conceptData) {
                var html = "   <div class='concept-group' style='background-color:#5da9261c'> <h6><span class='title'> Definition</span> <button  class='concept_button' onclick='skosEditor.conceptEditor.addToConceptDefinitions()'>+</button> </h6>"
                conceptData.definitions.forEach(function (definition, index) {
                    html += "  <div class='row'>" +

                        "    <div class='col-lg'>" +
                        "      <textarea class ='concept_input' id='concept_definition_value_" + index+"'  cols='70', rows='3'>"+ definition +"</textarea>" +

                        "   </div>" +
                        "<div class='col'>" +
                        "       <button  class='concept_button' onclick=skosEditor.conceptEditor.removeFromConcept('definitions'," + index + ")> -</button>" +
                        "    </div>" +
                        "</div>"
                })
                html += "</div>"
                return html;
            }

            function setNotes(conceptData) {
                var html = "   <div class='concept-group' style='background-color:#5da9261c'> <h6><span class='title'> Notes</span> <button  class='concept_button' onclick='skosEditor.conceptEditor.addToConceptNotes()'>+</button> </h6>"
                conceptData.notes.forEach(function (note, index) {
                    html += "  <div class='row'>" +
                        "    <div class='col-lg'>" +
                        "      <textarea class ='concept_input' id='concept_note_value_" + index+"'  cols='70', rows='3'>"+ note +"</textarea>" +

                        "   </div>" +
                        "<div class='col'>" +
                        "       <button  class='concept_button' onclick=skosEditor.conceptEditor.removeFromConcept('notes'," + index + ")> -</button>" +
                        "    </div>" +
                        "</div>"
                })
                html += "</div>"
                return html;
            }


            function setPrefLabels(conceptData) {
                var html = "   <div class='concept-group' style='background-color:#b8d6a2'> <h6><span class='title'> prefLabels</span> <button  class='concept_button' onclick='skosEditor.conceptEditor.addToConceptPrefLabels(true)'>+</button> </h6>"
                conceptData.prefLabels.forEach(function (prefLabel, index) {
                    html += "<div class='container concept-item' >"

                    html += "  <div class='row'>" +

                        "    <div class='col'>" +
                        "      <input class ='concept_input'  id='concept_prefLabel_lang_" + index + "' value='" + prefLabel.lang + "' size='5'>" +
                        "   </div>" +


                        "    <div class='col'>" +
                        "      <input   class ='concept_input'  id='concept_prefLabel_value_" + index + "' value='" + prefLabel.value + "' size='50'>" +
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

                var html = "   <div class='concept-group' style='background-color:#5da9261c'> <h6><span class='title'> altLabels</span> <button   class='concept_button' onclick='skosEditor.conceptEditor.addToConceptAltLabels()'>+</button></h6> "
                conceptData.altLabels.forEach(function (altLabel, index) {
                    html += "<div class='container concept-item' >"

                    html += "  <div class='row'>" +

                        "    <div class='col'>" +
                        "      <input class ='concept_input' id='concept_altLabel_lang_" + index + "' value='" + altLabel.lang + "' size='5'>" +
                        "   </div>" +

                        "    <div class='col'>" +
                        "      <input class ='concept_input'   id='concept_altLabel_value_" + index + "' value='" + altLabel.value + "' size='50'>" +
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
                var html = "   <div class='concept-group' style='background-color:#5da9261c'> <h6><span class='title'> related</span> <button   class='concept_button' onclick='skosEditor.conceptEditor.addToConceptRelateds()'>+</button></h6> "
                conceptData.relateds.forEach(function (related, index) {
                    html += "<div class='container concept-item' >"

                    html += "  <div class='row'>" +
                        "    <div class='col'>" +
                        "      <input  class ='concept_input' id='concept_related_" + index + "' value='" + related + "' size='50'>" +
                        "   </div>" +

                        "    <div class='col'>" +
                        "       <button  class ='concept_input'  class='concept_button' onclick=skosEditor.conceptEditor.removeFromConcept('relateds'," + index + ")> -</button>" +
                        "    </div>" +
                        "</div>"
                    html += "</div>"
                })


                html += "</div>"
                return html;
            }


            function setBroaders(conceptData) {
                var html = "   <div class='concept-group' style='background-color:#5da9261c'><h6> <span class='title'> broader</span> <button   class='concept_button' onclick='skosEditor.conceptEditor.addToConceptBroaders()'>+</button></h6> "
                conceptData.broaders.forEach(function (broader, index) {
                    html += "<div class='container concept-item' >"

                    html += "  <div class='row'>" +
                        "    <div class='col'>" +
                        "      <input class ='concept_input' id='concept_broader_" + index + "' value='" + broader + "' size='70'>" +
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
        //    html += "<form name='conceptDetails'>"
            html += setAbout(conceptData);
            html += setPrefLabels(conceptData);
            html += setDefinitions(conceptData);
            html += setNotes(conceptData);
            html += setAltLabels(conceptData);
            html += setBroaders(conceptData);
            html += setRelated(conceptData);

            html += "</div>"
       //     html += "</form>";


            $("#" + editorDivId).html(html);
            if (options.readOnly) {
                $(".concept_button").css("display", "none")
            }
            if (options.bgColor) {
                $("#" + editorDivId + " .concept-group").css("background-color", options.bgColor);

            }






            $('.concept_input').bind("blur", function (a, b, c) {

                var value = $(this).val();
                var id = $(this).attr("id");

                if (id && id.indexOf("concept_") > -1) {
                    var array = id.split("_");
                    var property = array[2]
                    var index = -1;//valeurs simples
                    if (array.length == 4)
                        var index = parseInt(array[3])//tableaux

                    var type = array[1]
                    if (type == "about")
                        conceptData.id = value;
                    if (type == "altLabel") {
                        conceptData.altLabels[index][property]= value;
                    }
                    if (type == "prefLabel") {
                        conceptData.prefLabels[index][property]= value;
                    }
                    if (type == "related")
                        conceptData.relateds[index]= value;
                    if (type == "broader")
                        conceptData.broaders[index]= value;
                    if (type == "definition")
                        conceptData.definitions[index]= value;
                    if (type == "note")
                        conceptData.notes[index]= value;
                }

                skosEditor.context.editingNode.data = conceptData;
                skosEditor.synchronizeEditorData( skosEditor.context.editingNode);

            })
          //  $( ".concept_button").unbind( "click" );


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
            skosEditor.context.modified = true;
            return conceptData;


        }


    }

    self.addChildToSelectedNode = function (childSkosData, thesaurusIndex, label) {
        if (!label)
            label = childSkosData.prefLabels[0].value
        var treeDiv = '#treeDiv' + thesaurusIndex;
        var parent = $(treeDiv).jstree('get_selected');

        if (childSkosData.broaders.length == 0)
            childSkosData.broaders.push(parent.id)

        if ($(treeDiv).jstree(true).get_node(childSkosData.id))
            return


        var newNode = {
            id: childSkosData.id,
            text: label,
            data: childSkosData,
            icon: "concept-icon.png"

        }
        $(treeDiv).jstree(true).create_node(parent, newNode, "first", function () {
            //$(treeDiv).jstree(true).open_node( parent.id);
            $(treeDiv).jstree()._open_to(newNode.id);

        }, false);

    }


    self.addLocLevel = function (thesaurusIndex) {
        var treeDiv = '#treeDiv' + thesaurusIndex;
        var node = $(treeDiv).jstree(true).get_selected(true)[0]
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
                $(treeDiv).jstree(true).set_icon(node.id, "concept-icon-yellow.png")
                var parent = $(treeDiv).jstree('get_selected');

                data.forEach(function (itemData) {
                    self.addChildToSelectedNode(itemData, thesaurusIndex);

                })
            }
            , error: (function (err) {

            })
        })

    }

    return self;

})
()
