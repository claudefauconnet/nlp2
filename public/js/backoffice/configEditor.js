var configEditor = (function () {
    var self = {};

    var schemaformId = "shemaForm";


    self.editConfig = function () {
        var formStr = "<div style='width: 500px'><form id='shemaForm'></form></div>"
        $("#mainDiv").html(formStr);
        var json = context.indexConfigs[context.currentIndexName];
        var parts = Object.keys(json);
        var schema = {}
        parts.forEach(function (part) {
            var subPart = part;
            if (part == "connector") {
                part += "_" + json["connector"].type;
            }
            if (context.jsonSchemas[part]) {
                var subSchema = context.jsonSchemas[part][subPart];
                schema[subPart] = subSchema;
            }

        })
        self.editJsonForm(schemaformId, schema, json, function (errors, data) {
            var xx = data;
        })
    }


    self.createNewConfig = function () {

        var config = {};
        var connectorType;
        var formStr = "<div style='width: 500px'><form id='shemaForm'></form></div>"

        async.series([


                //general
                function (callbackSeries) {
                    $("#mainDiv").html(formStr);
                    self.editJsonForm(schemaformId, context.jsonSchemas.general, null, function (errors, data) {
                        config.general = data.general;
                        callbackSeries()
                    })
                }
                ,
                //choose connector type
                function (callbackSeries) {
                    $("#mainDiv").html(formStr);
                    self.editJsonForm(schemaformId, context.jsonSchemas.connectorTypes, null, function (errors, data) {
                        connectorType = data.connector;
                        callbackSeries()
                    })
                }
                ,
                //connector config (depending on connector)
                function (callbackSeries) {
                    var connectorSchema;
                    if (connectorType == "fs")
                        connectorSchema = context.jsonSchemas.connector_fs;
                    else if (connectorType == "sql")
                        connectorSchema = context.jsonSchemas.connector_sql;
                    else if (connectorType == "imap")
                        connectorSchema = context.jsonSchemas.connector_imap;
                    else if (connectorType == "csv")
                        connectorSchema = context.jsonSchemas.connector_csv;
                    else if (connectorType == "book")
                        connectorSchema = context.jsonSchemas.connector_book;


                    $("#mainDiv").html(formStr);
                    self.editJsonForm(schemaformId, connectorSchema, null, function (errors, data) {
                        config.connector = data.connector;
                        callbackSeries()
                    })
                }
                ,
                //connector config defaultMappings (depending on connector)
                function (callbackSeries) {

                    self.generateDefaultMappingFields(config.connector, function (err, result) {
                        var defaultMappingFields = result;
                        var fieldNames = Object.keys(result);
                        var html = "<div><ul>"
                        fieldNames.forEach(function (field) {
                            html += "<li><input type='checkBox' checked='checked' class='mappingFieldCbx' value='" + field + "'>" + field + "</li>"

                        })

                        html += "</ul>"
                        asyncDialog.show("mainDiv", html, function (ok) {
                            if (ok) {
                                var selectedMappingFields = {}
                                $(".mappingFieldCbx").each(function (index, value) {
                                    if ($(this).prop("checked")) {
                                        var name = $(this).val();
                                        selectedMappingFields[name] = result[name]

                                    }
                                })

                                var type = config.general.indexName;

                                config["mappings"]={[type]:{["properties"]:selectedMappingFields}};

                                callbackSeries();
                            } else {
                                callbackSeries(err);
                            }
                        });
                    });
                },


                function (callbackSeries) {

                }

            ],


            function (err) {
                var xx = config;
            })

    }


    self.editJsonForm = function (formId, jsonSchema, json, onSubmit) {

        $("#" + formId).jsonForm({

            "schema": jsonSchema,
            "onSubmit": onSubmit,
            "value": json,
        });


    }


    self.loadTemplates = function (callback) {

        var payload = {
            getTemplates: 1,
        }
        mainController.post(config.elasticUrl, payload, function (err, result) {
            if (err)
                return callback(err);
            context.templates = result;
            callback(null, result);

        })
    }


    self.generateDefaultMappingFields = function (connector, callback) {
        connector.contentField = context.contentField;
        var payload = {
            generateDefaultMappingFields: 1,
            connector: JSON.stringify(connector)
        }
        mainController.post(config.elasticUrl, payload, function (err, result) {
            if (err)
                return callback(err);


            callback(null, result);

        })
    }

    self.editConfigXX = function (json) {

        var html = "<div id='configEditorDiv'>";

        function isString(s) {
            return typeof (s) === 'string' || s instanceof String;
        }


        var recurse = function (json) {
            for (var key in json) {
                if (Object.keys(json).length == 0)
                    return;
                if (json[key] == true)
                    json[key] = "true"
                if (isString(json[key])) {

                    html += "<div><span style=' font-weight: bold' id='" + key + "'>" + key + "</span>";
                    html += "<input id='" + key + "' value='" + json[key] + "'>" + "</div>"

                } else {
                    html += "<div><span style=' font-weight: bold;font-size: larger' >" + key + "</span></div>";
                    html += "<div>"
                    recurse(json[key])
                    html += "</div>"
                }

            }
        }

        var json = context.indexConfigs[context.currentIndexName];
        recurse(json)
        // }
        html += "</div>";
        $("#mainDiv").html(html)
    }


    return self;


})()




