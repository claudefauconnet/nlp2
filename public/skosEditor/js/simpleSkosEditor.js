


skosEditor = (function () {

    var self = {};
    self.context={}
    var elasticUrl = "../elastic";

    self.editor = null;


    self.drawJsTree = function (treeDiv, jsTreeData) {

        var plugins = [];
        plugins.push("search");

        plugins.push("sort");
        //   plugins.push("types");
        plugins.push("contextmenu");
        plugins.push("dnd");

        if ($('#' + treeDiv).jstree)
            $('#' + treeDiv).jstree("destroy")

        $('#' + treeDiv).jstree({
            'core': {
                'check_callback': true,
                'data': jsTreeData,
            }
            ,
            'plugins': plugins,
            "search": {
                "case_sensitive": false,
                "show_only_matches": true
            }
        }).on("select_node.jstree",
            function (evt, obj) {
                skosEditor.synchronizePreviousData();
                skosEditor.context.previousNode=obj.node;
                var conceptData = obj.node.data;
                skosEditor.editConcept(conceptData);
            })
            .on("rename_node.jstree Event",
                function (event, obj) {

                    if (!obj.node.data) {
                        obj.node.data = {
                            id: "",
                            prefLabels: {},
                            altLabels: [],
                            relateds: []
                        }

                    }
                    obj.node.data.prefLabels["en"] = obj.node.text
                    var conceptData = obj.node.data;
                    skosEditor.editConcept(conceptData);


                })





    }
    self.synchronizePreviousData=function(){
        if(!self.editor)
            return;
        if( !skosEditor.context.previousNode)
            return;
        var json = skosEditor.editor.getValue();

     var node=skosEditor.context.previousNode;
        node.data=json;
        if(node.data.prefLabels.length>0) {
            var prefLabel = node.data.prefLabels[0]
            node.data.prefLabels.forEach(function (item) {
                    if (item.lang == "en")
                        prefLabel = item.value;
                }
            )
            if (node.text != prefLabel) {
                node.text = prefLabel;
                $("#treeDiv").jstree('rename_node', node.id, prefLabel);
            }
        }

    }

    self.loadThesaurus = function (rdfPath) {
        var payload = {
            rdfToEditor: 1,
            rdfPath: rdfPath,
            options: JSON.stringify({
                extractedLangages: "en,fr,sp",
                outputLangage: "en",

            })
        }
        $.ajax({
            type: "POST",
            url: elasticUrl,
            data: payload,
            dataType: "json",

            success: function (data, textStatus, jqXHR) {

                $("#messageDiv").html("done")
                data.forEach(function (item) {
                    item.icon = "concept-icon.png";


                })

                self.drawJsTree("treeDiv", data)

            }
            , error: function (err) {
                $("#messageDiv").html("error" + err.responseText)
                console.log(err.responseText)


            }
        })
    }



    self.editConcept = function (conceptData) {
        self.context.currentState="toForm"


        if (self.editor)
            self.editor.setValue(conceptData);
        else {
            // Initialize the editor
            self.editor = new JSONEditor(document.getElementById('editor_holder'), {
                // Enable fetching schemas via ajax
                ajax: true,
                disable_properties: true,
                disable_edit_json: true,
                // The schema for the editor
                schema: self.skosShema,

                // Seed the form with a starting value
                startval: conceptData
            });
            self.editor.on('change', function () {

                if(skosEditor.context.currentState==  "toForm"){
                    skosEditor.context.currentState=  null;
                    return;

                }
                // Get an array of errors from the validator
                var errors = self.editor.validate();

                var indicator = document.getElementById('valid_indicator');

                // Not valid
                if (errors.length) {
                    indicator.className = 'label alert';
                    indicator.textContent = 'not valid';
                }
                // Valid
                else {
                    indicator.className = 'label success';
                    indicator.textContent = 'valid';



                }
            });

        }

    }
    self.saveThesaurus = function (rdfPath) {
        self.synchronizePreviousData();





        if(!rdfPath){
            rdfPath=prompt("enter rdf file location", $("#skosInput").val());
        }
        if(!rdfPath || rdfPath=="")
            return;

        var data=[];
        var jsonNodes = $('#treeDiv').jstree(true).get_json('#', { flat: true });
        $.each(jsonNodes, function (i, item) {
            if(item.parent!="#" && item.parent!=item.data.broaders[0]) {
                item.data.broaders.splice(0, 1, item.parent)
            }
            data.push(item.data);
        })



        var payload = {
            skosEditorToRdf: 1,
            rdfPath: rdfPath,
            data: JSON.stringify(data),
            options: JSON.stringify({ })
        }
        $.ajax({
            type: "POST",
            url: elasticUrl,
            data: payload,
            dataType: "json",

            success: function (data, textStatus, jqXHR) {

                $("#messageDiv").html("skos file saved "+payload.rdfPath)



            }
            , error: function (err) {
                $("#messageDiv").html("error" + err.responseText)
                console.log(err.responseText)


            }
        })
    }

    self.skosShema = {

        "title": "Concept",
        "properties": {
            "id": {
                "type": "string"
            },
            "prefLabels": {
                "type": "array",
                "items": {
                    "title": "prefLabel",
                    "type": "object",
                    "properties": {
                        "value": {
                            "required": true,
                            "type": "string"
                        },
                        "lang": {
                            "required": true,
                            "type": "string",
                            "enum": [
                                "en",
                                "fr",
                                "sp"
                            ]
                        }
                    }
                }
            }, "altLabels": {
                "type": "array",
                "items": {
                    "title": "altLabel",
                    "type": "string",

                }
            }
            , "relateds": {
                "type": "array",
                "items": {
                    "title": "related",
                    "type": "object",
                    "properties": {
                        "uri": {
                            "required": true,
                            "type": "string"
                        }
                    }
                }
            }
        }
    }

    self.skosShemaXX = {

        "title": "Concept",
        "properties": {
            "id": {
                "type": "string"
            },
            "prefLabels": {
                "type": "array",
                "items": {
                    "title": "prefLabel",
                    "type": "object",
                    "properties": {
                        "value": {
                            "required": true,
                            "type": "string"
                        },
                        "lang": {
                            "required": true,
                            "type": "string",
                            "enum": [
                                "en",
                                "fr",
                                "sp"
                            ]
                        }
                    }
                }
            }, "altLabels": {
                "type": "array",
                "items": {
                    "title": "altLabel",
                    "type": "object",
                    "properties": {
                        "value": {
                            "required": true,
                            "type": "string"

                        },
                        "lang": {
                            "required": true,
                            "type": "string",
                            "enum": [
                                "en",
                                "fr",
                                "sp"
                            ]
                        }
                    }
                }
            }
            , "relateds": {
                "type": "array",
                "items": {
                    "title": "related",
                    "type": "object",
                    "properties": {
                        "uri": {
                            "required": true,
                            "type": "string"
                        }
                    }
                }
            }
        }
    }

    return self;

})()
