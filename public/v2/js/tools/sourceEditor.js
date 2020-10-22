var SourceEditor = (function () {
        var self = {};
        self.schema = {};
        self.data = {};
        self.currentSchemaUri;
        self.currentSourceUri;
        self.currentSourceLabel;

        self.prefLang = "en"
        //self.currentSchemaUri=Sparql_schema.npdOntologyUri

        self.editingObject;
        self.lastId = 1000;

        self.onLoaded = function () {
            $("#sourceDivControlPanelDiv").html("<button onclick='SourceEditor.onNewSourceButton()'>New Source</button>")

        }

        self.onSourceSelect = function (sourceLabel) {
            self.currentSourceLabel = sourceLabel;
            self.currentSourceUri = Config.sources[sourceLabel].graphIri
            if (Config.sources[sourceLabel].schemaUri)
                self.currentSchemaUri = Config.sources[sourceLabel].schemaUri
            else// default SKOS
                self.currentSchemaUri = Sparql_schema.skosUri;
            self.initSchemaClasses(self.currentSchemaUri, function (err, result) {
                if (err)
                    return MainController.UI.message(err)
                ThesaurusBrowser.showThesaurusTopConcepts(sourceLabel, {treeSelectNodeFn: SourceEditor.editJstreeNode})
                $("#graphDiv").load("snippets/sourceEditor.html")
                $("#SourceEditor_NewObjectDiv").css("display", "none")
            })


        }


        self.onNewSourceButton = function () {
            var sourceGraphUri = prompt("new source graph uri", "http://mySourceUri/");
            if (sourceGraphUri && sourceGraphUri != "") {
                self.currentSourceUri = sourceGraphUri;

                var html = "<div id='currentSourceTreeDiv'></div>"
                $("#actionDiv").html(html);
                var jsTreeData = [{id: sourceGraphUri, text: sourceGraphUri, parent: "#"}];
                common.loadJsTree('currentSourceTreeDiv', jsTreeData, {selectNodeFn: SourceEditor.editJstreeNode})
                $("#accordion").accordion("option", {active: 2});


                self.initSchemaClasses(self.currentSchemaUri);


                $("#graphDiv").load("snippets/sourceEditor.html")
                setTimeout(function () {
                    $("#SourceEditor_NewObjectDiv").css("display", "block")
                    $("#SourceEditor_graphUri").html("sourceGraphUri")
                    common.fillSelectOptions("SourceEditor_NewClassSelect", self.schema.classes, true, "label", "id")
                }, 500)


            }


        }


        self.initSchemaClasses = function (schemaUri, callback) {

            Sparql_schema.getClasses(schemaUri, function (err, result) {
                if (err)
                    return callback(err);
                self.schema.classes = {}
                result.forEach(function (item) {
                    self.schema.classes[item.class.value] = {id: item.class.value, label: item.classLabel.value, objectProperties: {}, annotations: {}}
                })
                return callback();

            })


        }
        self.initClassPropsAndAnnotations = function (schemaUri, classId) {
            async.series([
                function (callbackSeries) {
                    Sparql_schema.getClassProperties(schemaUri, classId, function (err, result) {
                        if (err)
                            return callbackSeries(err)
                        result.forEach(function (item) {
                            if (item.subProperty)
                                self.schema.classes[classId].objectProperties[item.subProperty.value] = {id: item.subProperty.value, label: item.subPropertyLabel.value}
                            else
                                self.schema.classes[classId].objectProperties[item.property.value] = {id: item.property.value, label: item.propertyLabel.value}

                        })

                        callbackSeries();
                    })
                }
                , function (callbackSeries) {
                    Sparql_schema.getObjectAnnotations(schemaUri, classId, function (err, result) {
                        if (err)
                            return callbackSeries(err)

                        result.forEach(function (item) {
                            self.schema.classes[classId].annotations[item.annotation.value] = {id: item.annotation.value, label: item.annotationLabel.value}
                        })

                        callbackSeries();
                    })
                }


            ], function (err) {
                if (err) {
                    return MainController.UI.message(err)
                }
            })


        }


        self.onSelectNewClass = function (classId) {
            $("#SourceEditor_NewClassSelect").val("");
            $("#SourceEditor_ObjectType").html(classId);
            self.lastId += 1;
            $("#SourceEditor_ObjectUri").val(self.currentSourceUri + self.lastId);


        }

        self.saveNewObject = function () {
            var jsTreeData = [];
            var objectType = $("#SourceEditor_ObjectType").html();
            var objectUri = $("#SourceEditor_ObjectUri").val()
            var objectPrefLabel = $("#SourceEditor_ObjectPrefLabel").val()
            jsTreeData = [{
                id: objectUri,
                text: objectPrefLabel,
                parent: self.currentSourceUri,
                data: {type: objectType}
            }]
            common.addNodesToJstree('currentSourceTreeDiv', self.currentSourceUri, jsTreeData, {})

        }


        self.editJstreeNode = function (event, obj) {


            var editingObject
            var type;
            if (!obj.node.data || !obj.node.data.type)
                type = "http://www.w3.org/2004/02/skos/core#Concept"
            else
                type = obj.node.data.type


            async.series([

                    //initClassPropsAndAnnotations for type
                    function (callbackSeries) {
                        if (Object.keys(self.schema.classes[type].objectProperties).length > 0)
                            return callbackSeries();

                        self.initClassPropsAndAnnotations(self.currentSchemaUri, type, function (err, result) {
                            return callbackSeries()
                        })
                    },
                    //get node data and prepare editingObject
                    function (callbackSeries) {
                        Sparql_generic.getNodeInfos(self.currentSourceLabel, obj.node.id, {}, function (err, result) {
                            if (err) {
                                return callbackSeries()
                            }

                            var nodeProps = {}
                            result.forEach(function (item) {
                                if (!nodeProps[item.prop.value])
                                    nodeProps[item.prop.value] = []
                                nodeProps[item.prop.value].push(item.value);
                            })


                            editingObject = self.schema.classes[type]
                            editingObject.about = obj.node.id;
                            editingObject.type = editingObject.id;
                            // delete editingObject.id
                            editingObject.objectPropertiesList = Object.keys(self.schema.classes[type].objectProperties).sort();
                            editingObject.annotationsList = Object.keys(self.schema.classes[type].annotations).sort();
                            self.editingObject = editingObject;

                            for (var prop in editingObject.objectProperties) {
                                if (nodeProps[prop])
                                    editingObject.objectProperties[prop].value = nodeProps[prop];
                            }
                            for (var prop in editingObject.annotations) {
                                if (nodeProps[prop])
                                    editingObject.annotations[prop].value = nodeProps[prop];
                            }

                            return callbackSeries()
                        })
                    },
                    //draw node data

                    function (callbackSeries) {
                        $(".SourceEditor_minorDiv").remove()
                        common.fillSelectOptions("SourceEditor_NewObjectPropertySelect", editingObject.objectPropertiesList, true, "label", "id")
                        for (var key in editingObject.objectProperties) {
                            if (editingObject.objectProperties[key].value) {

                                self.drawObjectValue("objectProperties", key, editingObject, "SourceEditor_ObjectPropertiesTableDiv")
                            }
                        }

                        common.fillSelectOptions("SourceEditor_NewObjectAnnotationSelect", editingObject.annotationsList, true, "label", "id")
                        for (var key in editingObject.annotations) {
                            if (editingObject.annotations[key].value)
                                self.drawObjectValue("annotations", key, editingObject, "SourceEditor_ObjectAnnotationsTableDiv")
                        }

                    }

                ],

                function (err) {
                    if (err) {
                        return MainController.UI.message(err)
                    }
                }
            )


        }

        /**
         *  create also the key Div inside metaType if not exists (to group same keys values)
         *
         *
         * @param metaType annotations or objectProperties
         * @param key
         * @param editingObject
         * @return {string}
         */
        self.drawObjectValue = function (metaType, key, editingObject, parentDiv, focus, newValue) {
            var type = editingObject.type;
            var values=[];
            if (newValue) {
                var value = {value:""};
                if (metaType == "annotations")
                    value["xml:lang"] = self.prefLang;
                values.push(value);
            } else
                values = editingObject[metaType][key].value

            var keyLabel = editingObject[metaType][key].label
            var html = ""
            values.forEach(function (value) {
                var langStr = "";
                if (value["xml:lang"]) {
                    langStr = "<input class='SourceEditor_lang' value='" + value["xml:lang"] + "'>"
                }
                html += "<tr class='SourceEditor_input_TR' id='SourceEditor_" + key + "'>" +
                    "<td><span>" + keyLabel + "</span></td>"+
                    "<td>"+langStr +"<input class='SourceEditor_value'  value='" + value.value + "'></td>" +
                    "</tr>"
            })

            var divId = "SourceEditor_" + keyLabel.replace(/ /g, "_") + "Div"
            //if (!self.schema.classes[type][metaType][key].divId) {
            if (!$("#" + divId).length) {
                self.schema.classes[type][metaType][key].divId = divId;
                $("#" + parentDiv).append("<div class='SourceEditor_minorDiv' id='" + divId + "'>  <table></table></div>")
            }
            setTimeout(function () {
                $("#" + divId).append(html)
                //  $("#SourceEditor_" + key +".SourceEditor_minorDiv").focus()
            }, 200)
            //$(html).appendTo( $( "#"+divId ) );

        }

        self.saveEditingObject = function () {

            var triples = [];
            $(".SourceEditor_input_TR").each(function (e, x) {
                var predicate = $(this).attr("id").substring(13)
                var value = $(this).find(".SourceEditor_value").val();
                var lang = $(this).find(".SourceEditor_lang").val();
                if (lang && lang != "")
                    value += "@" + lang

                triples.push({subject: self.editingObject.about, predicate: predicate, object: value})

            })
            var xx = triples;

            Sparql_generic.update(self.currentSourceLabel,triples,function(err, result){
                if(err)
                    MainController.UI.message(err)

                MainController.UI.message("data saved")

            })


        }


        self.onSelectNewProperty = function (property) {
            $("#SourceEditor_NewPropertySelect").val("");
            self.drawObjectValue("objectProperties", property, self.editingObject, "SourceEditor_ObjectPropertiesTableDiv", "", true)


        }

        self.onSelectNewAnnotation = function (annotation) {
            $("#SourceEditor_NewPropertySelect").val("");
            self.drawObjectValue("annotations", annotation, self.editingObject, "SourceEditor_ObjectAnnotationsTableDiv", "focus", true)

        }


        return self;


    }
)()
