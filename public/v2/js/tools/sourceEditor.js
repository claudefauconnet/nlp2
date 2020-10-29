var SourceEditor = (function () {
        var self = {};
        self.schema = {};
        self.data = {};
        self.currentSourceSchema;
        self.currentSourceUri;
        self.currentSourceLabel;
        self.schemasConfig;
        self.prefLang = "en"
        //self.currentSourceSchema=Sparql_schema.npdOntologyUri

        self.editingObject;




        self.onLoaded = function () {
            $("#sourceDivControlPanelDiv").html("<button onclick='SourceEditor.onNewSourceButton()'>New Source</button>")
           if(! self.schemasConfig) {
               $.getJSON("config/schemas.json", function (json) {
                   self.schemasConfig=json;
               })
           }
            //   console.log(JSON.stringify(Config.sources,null,2)

        }


        self.getJstreeContextMenu = function () {
            return {
                addChild: {
                    label: "add Child",
                    action: function (obj, sss, cc) {

                        SourceEditor.onAddNewObject(self.editingObject)
                        ;
                    },

                },
                delete: {
                    label: "Delete",
                    action: function (obj, sss, cc) {

                        SourceEditor.deleteEditingObject()
                        ;
                    },

                },


            }


        }

        self.onSourceSelect = function (sourceLabel) {
            self.currentSourceLabel = sourceLabel;
            self.currentSourceUri = Config.sources[sourceLabel].graphIri
            if (Config.sources[sourceLabel].sourceSchema)
                self.currentSourceSchema = self.schemasConfig[Config.sources[sourceLabel].sourceSchema]
            else// default SKOS
                self.currentSourceSchema = self.schemasConfig["SKOS"];
            self.initSchemaClasses(self.currentSourceSchema, function (err, result) {
                if (err)
                    return MainController.UI.message(err)
                var contextMenu = self.getJstreeContextMenu()
                ThesaurusBrowser.showThesaurusTopConcepts(sourceLabel, {treeSelectNodeFn: SourceEditor.editNode, contextMenu: contextMenu})
                $("#graphDiv").load("snippets/sourceEditor.html")
                $("#SourceEditor_NewObjectDiv").css("display", "none")
                $("#actionDivContolPanelDiv").html("<button onclick='SourceEditor.onAddNewObject()'>+</button>")
            })


        }

        self.onAddNewObject = function (parentObj) {

            $("#graphDiv").load("snippets/sourceEditor.html")
            setTimeout(function () {

              //  $("#SourceEditor_mainDiv").css("display", "block")
                $("#SourceEditor_NewObjectDiv").css("display", "block")
                $("#SourceEditor_graphUri").html("sourceGraphUri")
                common.fillSelectOptions("SourceEditor_NewClassSelect", self.schema.classes, true, "label", "id")

                if(!parentObj)
                    parentObj=self.editingObject
if(parentObj){
                if(self.currentSourceSchema){
                    var parentProperty=self.currentSourceSchema.newObject.treeParentProperty
                    var mandatoryProps=self.currentSourceSchema.newObject.mandatoryProperties;
                    var childClass=self.currentSourceSchema.newObject.treeChildrenClasses[parentObj.type ]
                    var initData={}
                    initData[parentProperty]=[{value:parentObj.about,type:"uri"}];
                    mandatoryProps.forEach(function(item){
                        initData[item]= [{"xml:lang":self.prefLang,value:"",type:"literal"}]
                    })

                    self.initClass (childClass,initData) ;

                }
}





            }, 200)






        },
            self.initClass = function (classId, initData) {
            if(!classId)
                classId = $("#SourceEditor_NewClassSelect").val();

                var classLabel = self.schema.classes[classId].label
                self.initSchemaClasses(self.currentSourceSchema, function (err, result) {
                    if (err)
                        return MainController.UI.message(err)
                    $("#SourceEditor_NewClassSelect").val("");
                    $("#SourceEditor_NewObjectDiv").css("display", "none");
                    $("#SourceEditor_ObjectType").html(classLabel);

                    if (self.currentSourceUri.lastIndexOf("/") != self.currentSourceUri.length - 1)
                        self.currentSourceUri += "/"
                    var nodeId = self.currentSourceUri + common.getRandomHexaId(10)
                    $("#SourceEditor_ObjectUri").val(nodeId);
                    self.editNode(null, {node: {id: nodeId, data: {type: classId}}}, initData)
                })

            }


        self.onNewSourceButton = function () {
            var sourceGraphUri = prompt("new source graph uri", "http://mySourceUri/");
            if (sourceGraphUri && sourceGraphUri != "") {
                self.currentSourceUri = sourceGraphUri;

                var html = "<div id='currentSourceTreeDiv'></div>"
                $("#actionDiv").html(html);
                var jsTreeData = [{id: sourceGraphUri, text: sourceGraphUri, parent: "#"}];
                common.loadJsTree('currentSourceTreeDiv', jsTreeData, {selectNodeFn: SourceEditor.editNode})
                $("#accordion").accordion("option", {active: 2});


                self.initSchemaClasses(self.currentSourceSchema, function (err, result) {
                    if (err)
                        return MainController.UI.message(err)

                    $("#graphDiv").load("snippets/sourceEditor.html")
                    setTimeout(function () {
                        $("#SourceEditor_NewObjectDiv").css("display", "block")
                        $("#SourceEditor_graphUri").html("sourceGraphUri")
                        common.fillSelectOptions("SourceEditor_NewClassSelect", self.schema.classes, true, "label", "id")
                    }, 500)


                })
            }


        }


        self.initSchemaClasses = function (sourceSchema, callback) {

            Sparql_schema.getClasses(sourceSchema, function (err, result) {
                if (err)
                    return callback(err);
                self.schema.classes = {}
                result.forEach(function (item) {
                    self.schema.classes[item.class.value] = {id: item.class.value, label: common.getItemLabel(item,"class"), objectProperties: {}, annotations: {}}
                })
                return callback();

            })


        }
        self.initClassPropsAndAnnotations = function (sourceSchema, classId, callback) {
            async.series([
                function (callbackSeries2) {
                    Sparql_schema.getClassProperties(sourceSchema, classId, function (err, result) {
                        if (err)
                            return callbackSeries2(err)
                        result.forEach(function (item) {
                            if (item.subProperty)
                                self.schema.classes[classId].objectProperties[item.subProperty.value] = {id: item.subProperty.value, label: common.getItemLabel(item,"subProperty")}
                            else
                                self.schema.classes[classId].objectProperties[item.property.value] = {id: item.property.value, label: common.getItemLabel(item,"property")}

                        })

                        callbackSeries2();
                    })
                }
                , function (callbackSeries2) {
                    Sparql_schema.getObjectAnnotations(sourceSchema, classId, function (err, result) {
                        if (err)
                            return callbackSeries2(err)

                        result.forEach(function (item) {
                            self.schema.classes[classId].annotations[item.annotation.value] = {id: item.annotation.value, label:common.getItemLabel(item,"annotation")}
                        })

                        callbackSeries2();
                    })
                }


            ], function (err) {
                callback(err)

            })


        }


        self.editNode = function (event, obj, initData) {

            $("#SourceEditor_mainDiv").css("display", "block")
            var editingObject;
            var type;
            if (!obj.node.data || !obj.node.data.type)
                type = "http://www.w3.org/2004/02/skos/core#Concept"
            else
                type = obj.node.data.type


            var nodeProps = {}
            async.series([

                    //initClassPropsAndAnnotations for type
                    function (callbackSeries) {
                        if (Object.keys(self.schema.classes[type].objectProperties).length > 0)
                            return callbackSeries();

                        self.initClassPropsAndAnnotations(self.currentSourceSchema, type, function (err, result) {
                            return callbackSeries()
                        })
                    }
                    //init editing object
                    , function (callbackSeries) {
                        editingObject = self.schema.classes[type]
                        editingObject.about = obj.node.id;
                        editingObject.type = editingObject.id;
                        if(self.editingObject)
                        editingObject.parent =self.editingObject.about
                        // delete editingObject.id
                        editingObject.objectPropertiesList = Object.keys(self.schema.classes[type].objectProperties).sort();
                        editingObject.annotationsList = Object.keys(self.schema.classes[type].annotations).sort();
                        self.editingObject = editingObject;
                        return callbackSeries()
                    },

                    //get node data and prepare editingObject
                    function (callbackSeries) {
                        if (initData) {
                            editingObject.isNew = 1;
                           for(var key in initData){
                                nodeProps[key] =initData[key]
                            }

                            return callbackSeries();
                        }


                        Sparql_generic.getNodeInfos(self.currentSourceLabel, obj.node.id, {}, function (err, result) {
                            if (err) {
                                return callbackSeries()
                            }

                            result.forEach(function (item) {
                                if (!nodeProps[item.prop.value])
                                    nodeProps[item.prop.value] = []
                                nodeProps[item.prop.value].push(item.value);
                            })
                            callbackSeries()
                        })
                    },
                    function (callbackSeries) {
                        for (var prop in editingObject.objectProperties) {
                            if (nodeProps[prop])
                                editingObject.objectProperties[prop].value = nodeProps[prop];
                        }
                        for (var prop in editingObject.annotations) {
                            if (nodeProps[prop])
                                editingObject.annotations[prop].value = nodeProps[prop];
                        }

                        return callbackSeries()

                    },
                    //draw node data
                    function (callbackSeries) {

                        $("#SourceEditor_ObjectUri").val(editingObject.about);
                        $("#SourceEditor_ObjectType").html(self.schema.classes[editingObject.type].label);
                        $(".SourceEditor_minorDiv").remove();
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
            var values = [];
            if (newValue) {
                var value = {value: ""};
                if (metaType == "annotations") {
                    value["xml:lang"] = self.prefLang;
                    value.type = "literal";
                } else
                    value.type = "uri";

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
                    "<td><span>" + keyLabel + "</span></td>" +
                    "<td>" + langStr + "<input class='SourceEditor_value '  value='" + value.value + "'></td>" +
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

        self.getPredicateValueType = function (className, predicate) {
            if (self.schema.classes[className].objectProperties[predicate])
                return "uri"
            if (self.schema.classes[className].annotations[predicate])
                return "literal"
            return null;
        }

        self.saveEditingObject = function () {

            var triples = [];
            var predicate
            var nodeLabel = null
            triples.push({subject: self.editingObject.about, predicate: "http://www.w3.org/1999/02/22-rdf-syntax-ns#type", object: self.editingObject.type, valueType: "uri"})

            $(".SourceEditor_input_TR").each(function (e, x) {

                predicate = $(this).attr("id").substring(13)
                var value = $(this).find(".SourceEditor_value").val();
                var lang = $(this).find(".SourceEditor_lang").val();
                var valueType = self.getPredicateValueType(self.editingObject.type, predicate)

                var triple = {subject: self.editingObject.about, predicate: predicate, object: value, valueType: valueType}
                if (lang && lang != "")
                    triple.lang = lang;


                triples.push(triple)
                if (predicate.indexOf("prefLabel") > -1 && (!lang || lang == self.prefLang))
                    nodeLabel = value;
                else if (!nodeLabel && (predicate.indexOf("label") > -1 && (!lang || lang == self.prefLang)))
                    nodeLabel = value;

            })


            Sparql_generic.update(self.currentSourceLabel, triples, function (err, result) {
                if (err)
                    MainController.UI.message(err)

                MainController.UI.message("data saved")
                if (self.editingObject.isNew) {
                    var jsTreeData = [{
                        id: self.editingObject.about,
                        text: nodeLabel,
                        parent: self.editingObject.parent,
                        data: {type: predicate}
                    }]
                    var rootNode = $("#currentSourceTreeDiv").jstree(true).get_node("#")
                    if (rootNode)
                        common.addNodesToJstree('currentSourceTreeDiv', self.editingObject.parent, jsTreeData, {})
                    else
                        common.loadJsTree('currentSourceTreeDiv', jsTreeData, null)
                }

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

        self.deleteEditingObject=function(){

            var children=  $('#currentSourceTreeDiv').jstree(true).get_node(self.editingObject.about).children
            if(children.length>0)
               return alert("cannot delete node with children")
            Sparql_generic.deleteTriplesBySubject(self.currentSourceLabel,self.editingObject.about,function(err, result){
                if(err)
                    MainController.UI.message(err);
                $('#currentSourceTreeDiv').jstree(true).delete_node(self.editingObject.about)
                $('#currentSourceTreeDiv').jstree(true).deselect_all ();
                self.editingObject=null;
                $("#SourceEditor_mainDiv").css("display", "none")


            })



        }


        return self;


    }
)
()
