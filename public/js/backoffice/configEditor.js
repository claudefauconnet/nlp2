var configEditor = (function () {
        var self = {};

        var schemaformId = "shemaForm";


        self.editConfig = function () {
            if (!context.currentIndexName)
                return alert("select an index ")
            var json = context.indexConfigs[context.currentIndexName];
            return self.createNewConfig(json)


        }


        self.createNewConfig = function (json) {

            var config = {};
            var connectorType;
            var selectedMappingFields = {}
            var type;
            var formStr = "<div style='width: 500px'><form id='shemaForm'></form></div>"

            async.series([


                    //general
                    function (callbackSeries) {
                        $("#mainDiv").html(formStr);
                        self.editJsonForm(schemaformId, context.jsonSchemas.general, json, null, function (errors, data) {
                            if (!data.general.indexName.match(/^[a-z0-9_]+$/))
                                return callbackSeries("index name only accept lowercase and numbers")
                            config.general = data.general;
                            type = config.general.indexName;
                            callbackSeries()
                        })
                    }
                    ,
                    //choose connector type
                    function (callbackSeries) {
                        if (json) {
                            connectorType = json.connector.type;
                            return callbackSeries();
                        }

                        $("#mainDiv").html(formStr);
                        self.editJsonForm(schemaformId, context.jsonSchemas.connectorTypes, json, null, function (errors, data) {
                            connectorType = data.connector;
                            callbackSeries()
                        })
                    }
                    ,
                    //connector config (depending on connector)
                    function (callbackSeries) {
                        var connectorSchema;
                        if (connectorType == "document")
                            connectorSchema = context.jsonSchemas.connector_document;
                        else if (connectorType == "sql")
                            connectorSchema = context.jsonSchemas.connector_sql;
                        else if (connectorType == "imap")
                            connectorSchema = context.jsonSchemas.connector_imap;
                        else if (connectorType == "csv")
                            connectorSchema = context.jsonSchemas.connector_csv;
                        else if (connectorType == "book")
                            connectorSchema = context.jsonSchemas.connector_pdfBook;
                        else if (connectorType == "json")
                            connectorSchema = context.jsonSchemas.connector_json;


                        $("#mainDiv").html(formStr);
                        self.editJsonForm(schemaformId, connectorSchema, json, null, function (errors, data) {
                            config.connector = data.connector;
                            if (connectorType == "imap") {
                                imapUI.showFoldersDialog(data.connector.imapServerUrl, data.connector.emailAdress, data.connector.emailpassword, data.connector.rootDir, function (err, result) {
                                    if (!result) {
                                        return callbackSeries("a mail box has to be selected")
                                    }
                                    config.connector.rootBox = result
                                    config.connector = data.connector;
                                    callbackSeries();
                                })


                            } else {

                                callbackSeries()
                            }
                        })
                    }
                    ,
                    // dialog contentField and analyzer
                    function (callbackSeries) {
                        $("#mainDiv").html(formStr);
                        self.editJsonForm(schemaformId, context.jsonSchemas.schema, json, null, function (errors, data) {
                            config.schema = data.schema;
                            callbackSeries();
                        })
                    },

                    //Mappings SQL
                    function (callbackSeries) {

                        self.generateDefaultMappingFields(config.connector, function (err, result) {
                            if (err) {
                                return callbackSeries(err)
                            }
                            self.editMappings("index mappings", result, true, function (err, fields) {
                                if (err)
                                    callbackSeries(err);
                                if (!fields)
                                    return callbackSeries();

                                var mappings = {[type]: {["properties"]: fields}};
                                config.schema.mappings = mappings;
                                selectedMappingFields = fields;
                                callbackSeries();
                            })

                        })

                    },


                    //display excerpt
                    function (callbackSeries) {
                        self.editMappings("display mappings", selectedMappingFields, false, function (err, fields) {
                            if (err)
                                callbackSeries(err);
                            if (!fields)
                                return callbackSeries();

                            var excerptFields = Object.keys(fields);
                            var display = []
                            for (var key in selectedMappingFields) {
                                if (excerptFields.indexOf(key) > -1)
                                    display.push({[key]: {"cssClass": "excerpt"}});
                                else
                                    display.push({[key]: {"cssClass": "text"}});
                            }
                            config.display = display;
                            callbackSeries();
                        })

                    },

                    // add contentField to display when necessary
                    function (callbackSeries) {
                        if (connectorType == "book" || connectorType == "document")
                            config.display.push({[config.schema.contentField]: {"cssClass": "text"}});
                        return callbackSeries();

                    }

                ],


                function (err) {

                    if (err) {
                        if (err.responseText)
                            alert(err.responseText);
                        else
                            alert(err);
                        return $("#mainDiv").html(err);

                    }


                    $("#mainDiv").html("configuration ready");
                    if (confirm("save index configuration?")) {

                        indexes.saveIndexConfig(config.general.indexName, JSON.stringify(config, null, 2), function (err, result) {

                            ui.initSourcesList(true, config.general.indexName);
                            context.currentIndexName=config.general.indexName;


                        })
                    }
                }
            )

        }


        self.editJsonForm = function (formId, jsonSchema, json, buttons, onSubmit) {
            var options = {
                "schema": jsonSchema,
                "onSubmit": onSubmit,
                "value": json,
            }
            if (buttons) {
                options.form = ["*"];
                buttons.forEach(function (button) {
                    options.form.push({"type": "button", "title": button.title, onClick: button.onClick});
                })

            }
            $("#" + formId).jsonForm(options);
            var xx = $(".btnDefault");
            $(".btn-default").addClass("btn-primary ")
        }


        self.loadTemplates = function (callback) {

            var payload = {
                getTemplates: 1,
            }
            mainController.post(appConfig.elasticUrl, payload, function (err, result) {
                if (err)
                    return callback(err);
                context.templates = result;
                context.contentField = Object.keys(context.templates.defaultContentMapping)[0]
                callback(null, result);

            })
        }


        self.generateDefaultMappingFields = function (connector, callback) {
            connector.contentField = context.contentField;
            var payload = {
                generateDefaultMappingFields: 1,
                connector: JSON.stringify(connector)
            }
            mainController.post(appConfig.elasticUrl, payload, function (err, result) {
                if (err)
                    return callback(err);


                callback(null, result);

            })
        }


        self.editMappings = function (title, json, checked, callback) {
            var callbackFn = callback;
            var fieldNames = Object.keys(json);
            var html = "<div><b>" + title + "</b><ul>"
            var checkedStr = "";
            if (checked)
                checkedStr = "checked='checked'";
            fieldNames.forEach(function (field) {
                html += "<li><input type='checkBox' " + checkedStr + " class='mappingFieldCbx' value='" + field + "'>" + field + "</li>"

            })
            html += "</ul>"
            asyncDialog.show("mainDiv", html, function (ok) {
                if (ok) {
                    var selectedFields = {}
                    $(".mappingFieldCbx").each(function (index, value) {
                        if ($(this).prop("checked")) {
                            var name = $(this).val();
                            selectedFields[name] = json[name]

                        }
                    })

                    callbackFn(null, selectedFields)

                } else {
                    callback();
                }
            });

        }


        self.saveIndexationConfig = function () {
            var config = context.indexConfigs[context.currentIndexName];
            var indexationConfig = context.currentIndexationConfig;
            config.indexation = indexationConfig;
            indexes.saveIndexConfig(config.general.indexName, JSON.stringify(config, null, 2), function (err, result) {
                $("#messageDiv").html("configuration saved");
            })
        }


        self.deleteIndexConfig = function () {
            if (!context.currentIndexName)
                return alert("select an index ")

            if (confirm("delete source config :" + context.currentIndexName)) {
                var payload = {
                    deleteIndexConfig: 1,
                    index: context.currentIndexName
                }
                mainController.post(appConfig.elasticUrl, payload, function (err, result) {
                    if (err)
                        return callback(err);
                    $("#messageDiv").html("configuration deleted :" + context.currentIndexName);
                    ui.initSourcesList(true);
                })


            }


        }


        return self;


    }
)
()




