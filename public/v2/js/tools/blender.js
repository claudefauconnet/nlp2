var Blender = (function () {

        var self = {}
        var isLoaded = false
        self.modifiedNodes = []
        self.tempGraph;
        self.currentSourceSchema;
        self.currentSource;
        self.backupSource = false// using  a clone of source graph
        self.onLoaded = function () {
            // $("#sourceDivControlPanelDiv").html("")
        }


        self.initPanel = function () {
            if (isLoaded)
                return;


            $("#blenderPanelDiv").load("snippets/blender.html")
            setTimeout(function () {
                    var editableSources = [];
                    for (var key in Config.sources) {
                        if (Config.sources[key].editable)
                            editableSources.push(key)
                    }

                    common.fillSelectOptions("Blender_SourcesSelect", editableSources.sort(), true)
                    $("#Blender_PopupDiv").dialog({
                        autoOpen: false,
                        height: 600,
                        width: 600,
                        modal: true,
                    });
                    $("#Blender_tabs").tabs({})
                    isLoaded = true;
                }, 200
            )

        }


        self.onSourceSelect = function (source) {
            self.currentSource = source

            function initSource() {
                SourceEditor.schema.initSourceSchema(source, function (err, result) {

                    Sparql_facade.getTopConcepts(self.currentSource, function (err, result) {
                        if (err) {
                            return MainController.message(err);
                        }
                        var jsTreeOptions = {};
                        jsTreeOptions.contextMenu = Blender.getJstreeContextMenu()
                        jsTreeOptions.selectNodeFn = Blender.selectNodeFn
                        /*  jsTreeOptions.onCreateNodeFn = Blender.onCreateNodeFn
                          jsTreeOptions.onDeleteNodeFn = Blender.onDeleteNodeFn*/
                        jsTreeOptions.moveNode = Blender.menuActions.moveNode
                        jsTreeOptions.dnd = self.dnd

                        TreeController.drawOrUpdateTree("Blender_treeDiv", result, "#", "topConcept", jsTreeOptions)
                    })
                })
            }


            if (source == "") {
                $("#Blender_treeDiv").html("");
                self.currentTreeNode = null;
                self.currentSource = null;
                return
            }

            if (self.backupSource) {
                self.currentSource = "_blenderTempSource"
                Config.sources[self.currentSource] = {
                    "controller": Sparql_generic,
                    "sparql_url": Config.sources[source].sparql_url,// on the same server !!!
                    "graphUri": "http://souslesens/_blenderTempSource/" + source,
                    "sourceSchema": "SKOS",
                    "predicates": {
                        "lang": "en"
                    },
                };

                Sparql_generic.copyGraph(source, Config.sources[self.currentSource].graphUri, function (err, result) {
                    initSource()
                })


            } else {
                Config.sources[source].controller = eval(Config.sources[source].controller)
                initSource()
            }


        }

        self.dnd = {

            "drag_start": function (data, element, helper, event) {
                return true;
            },
            "drag_move": function (data, element, helper, event) {
                return true;


            },
            "drag_stop": function (data, element, helper, event) {
                var nodeId = element.data.nodes[0]
                var node = $("#Blender_treeDiv").jstree(true).get_node(nodeId)

                if (confirm("Confirm : move node and descendants :" + node.text + "?"))
                    return true;
                return false;


            },
            checkTreeOperations: function (operation, node, parent, position, more) {
                Blender.currentOperation = {operation: operation, node: node, parent: parent, position: position, more, more}

                return true;
            }
        },


            self.selectNodeFn = function (event, propertiesMap) {
                if (propertiesMap)
                    self.currentTreeNode = propertiesMap.node
                ThesaurusBrowser.openTreeNode("Blender_treeDiv", self.currentSource, propertiesMap.node);


                var xx = $("#Blender_treeDiv").jstree(true).settings.contextmenu

                $("#Blender_treeDiv").jstree(true).settings.contextmenu.items = self.getJstreeContextMenu()

                //  $.jstree.defaults.contextmenu.items = self.getJstreeContextMenu();


            }

        self.getJstreeContextMenu = function () {
            var menuItems = {}
            var clipboard = Clipboard.getContent()
            if (clipboard.length>0 && clipboard[0].type == "node") {


                menuItems.pasteNode = {
                    "label": "Paste...",
                    "separator_before": false,
                    "separator_after": true,

                    "action": false,
                    "submenu": {
                        pasteNode: {
                            label: "node",
                            action: function () {
                                self.menuActions.pasteClipboardNodeOnly();
                            }
                        },
                        pasteProperties: {
                            label: "some properties...",
                            action: function () {
                                self.menuActions.pasteClipboardNodeProperties()
                                ;
                            },
                        }
                        ,
                        pasteDescendants: {
                            label: " descendants",
                            action: function (obj, sss, cc) {
                                self.menuActions.pasteClipboardNodeDescendants()
                                ;
                            },
                        },

                        /*   pasteAscendants: {
                               label: "ascendants",
                               action: function (obj, sss, cc) {
                                   self.menuActions.pasteClipboardNodeAscendants()
                                   ;
                               },
                           }*/
                    }

                }

            } else if (clipboard && clipboard.type == "word") {
                menuItems.pasteDescendants = {
                    label: " create concept " + Clipboard.getContent().label,
                    action: function (obj, sss, cc) {
                        self.menuActions.createConceptFromWord()
                        ;
                    }

                }
            }

            menuItems.editNode = {
                label: "Edit node",
                action: function (obj, sss, cc) {
                    self.menuActions.editNode()
                }
            }

            menuItems.deleteNode = {
                label: "Delete node",
                action: function (obj, sss, cc) {
                    self.menuActions.deleteNode();
                },


            }
            menuItems.addChildNodeNode = {
                label: "Create child",
                action: function (obj, sss, cc) {
                    self.menuActions.createChildNode();
                    ;
                },
            }

            return menuItems;

        }


        self.menuActions = {


            moveNode: function (event, obj) {
                var newParent = obj.parent
                var oldParent = obj.old_parent
                var id = obj.node.id
                var broaderPredicate = "http://www.w3.org/2004/02/skos/core#broader"
                var triple = "<" + id + "> <" + broaderPredicate + "> <" + newParent + ">."


                Sparql_generic.deleteTriples(self.currentSource, id, broaderPredicate, oldParent, function (err, result) {
                    if (err) {
                        return MainController.UI.message(err)
                    }
                    var triple = {subject: id, predicate: broaderPredicate, object: newParent, valueType: "uri"}
                    Sparql_generic.update(self.currentSource, [triple], function (err, result) {
                        if (err) {
                            return MainController.UI.message(err)
                        }
                    })
                })

            },


            deleteNode: function () {
                var str = ""
                if (self.currentTreeNode.children.length > 0)
                    str = " and all its descendants"
                if (confirm("delete node " + self.currentTreeNode.text + str)) {

                    if (self.currentTreeNode.children.length > 0) {
                        Sparql_generic.getSingleNodeAllDescendants(self.currentSource, self.currentTreeNode.id, function (err, result) {
                            if (err) {
                                return MainController.UI.message(err)
                            }
                            var subjectsIds = [self.currentTreeNode.id]
                            result.forEach(function (item) {
                                subjectsIds.push(item.narrower.value)
                            })
                            Sparql_generic.deleteTriples(self.currentSource, subjectsIds, null, null, function (err, result) {
                                if (err) {
                                    return MainController.UI.message(err)
                                }
                                common.deleteNode("Blender_treeDiv", self.currentTreeNode.id)
                            })

                        })
                    } else {
                        Sparql_generic.deleteTriples(self.currentSource, self.currentTreeNode.id, null, null, function (err, result) {
                            if (err) {
                                return MainController.UI.message(err)
                            }
                            common.deleteNode("Blender_treeDiv", self.currentTreeNode.id)
                        })
                    }
                }
            },


            pasteClipboardNodeOnly: function (callback) {
                var dataArray = Clipboard.getContent();
                async.eachSeries(dataArray,function(data,callbackEach) {

                    /* if (!callback)
                         Clipboard.clear();*/
                    if (!data)
                        return;

                    if (data.type == "node") {// cf clipboard and annotator
                        var fromSource = data.source;
                        var toGraphUri = Config.sources[self.currentSource].graphUri
                        var id = data.id;
                        var label = data.label;
                        var existingNodeIds = common.getjsTreeNodes("Blender_treeDiv", true)
                        if (existingNodeIds.indexOf(id) > -1) {
                            MainController.UI.message("node " + id + " already exists")
                            if (callback)
                                return callback(null)
                        }
                        Sparql_generic.copyNodes(fromSource, toGraphUri, id, {setObjectFn: Blender.menuActions.setCopiedNodeObjectFn}, function (err, result) {
                            if (err)
                                return MainController.UI.message(err);
                            var jstreeData = [{id: id, text: label, parent: self.currentTreeNode.id, data: {type: "http://www.w3.org/2004/02/skos/core#Concept"}}]
                            common.addNodesToJstree("Blender_treeDiv", self.currentTreeNode.id, jstreeData)
                           callbackEach()

                        })
                    }
                },function(err){
                    if (!callback)
                        Clipboard.clear();
                   else
                        return callback(null)

                })


            },
            setCopiedNodeObjectFn: function (item) {
                var newParent = self.currentTreeNode;
                if (item.prop.value == "http://www.w3.org/2004/02/skos/core#broader")
                    item.value.value = newParent.id;
                return item


            },


            pasteClipboardNodeDescendants: function (callback) {
                var data = Clipboard.getContent();
                if (!data)
                    return;

                self.menuActions.pasteClipboardNodeOnly(function (err, result) {

                    Clipboard.clear();

                    var existingNodeIds = common.getjsTreeNodes("Blender_treeDiv", true)
                    var fromSource = data.source;
                    var toGraphUri = Config.sources[self.currentSource].graphUri
                    var id = data.id;
                    var label = data.label;
                    var depth = 3
                    var childrenIds = [id]
                    var currentDepth = 1
                    var totalNodesCount = 0
                    async.whilst(
                        function test(cb) {
                            return childrenIds.length > 0
                        },

                        function (callbackWhilst) {//iterate

                            Sparql_generic.getNodeChildren(fromSource, null, childrenIds, 1, null, function (err, result) {
                                if (err)
                                    return MainController.UI.message(err);
                                childrenIds = []
                                if (result.length == 0)
                                    return callbackWhilst();
                                totalNodesCount += result.length
                                var items = {}
                                result.forEach(function (item) {

                                    var parentId;
                                    if (item["child" + currentDepth]) {

                                        parentId = item.concept.value;

                                        var childId = item["child" + currentDepth].value
                                        if (existingNodeIds.indexOf(childId) > -1)
                                            return
                                        childrenIds.push(childId)
                                        if (!items[parentId])
                                            items[parentId] = [];
                                        items[parentId].push(item)
                                    }

                                })


                                Sparql_generic.copyNodes(fromSource, toGraphUri, childrenIds, {}, function (err, result) {
                                    if (err)
                                        return callbackWhilst(err)
                                    for (var parentId in items) {
                                        TreeController.drawOrUpdateTree("Blender_treeDiv", items[parentId], parentId, "child" + currentDepth, null)
                                    }

                                    callbackWhilst();

                                })


                            })
                        }
                        , function (err) {
                            if (err)
                                return MainController.UI.message(err)
                            return MainController.UI.message("copied " + totalNodesCount + " nodes")
                        })
                })


            }









            /**
             *
             *  A FINIR
             *
             *
             * @param callback
             */
            , pasteClipboardNodeAscendants: function () {
                var data = Clipboard.getContent();
                if (!data)
                    return;

                self.menuActions.pasteClipboardNodeOnly(function (err, result) {

                    var existingNodeIds = common.getjsTreeNodes("Blender_treeDiv", true)
                    var fromSource = data.source;
                    var toGraphUri = Config.sources[self.currentSource].graphUri
                    var id = data.id;
                    var label = data.label;
                    var depth = 8
                    Sparql_generic.getNodeParents(fromSource, null, id, depth, null, function (err, result) {
                        if (err)
                            return MainController.UI.message(err);
                        var childrenIds = []

                        if (result.length > 0) {
                            for (var i = 1; i <= depth; i++) {
                                var items = {}
                                result.forEach(function (item) {

                                    var parentId;
                                    if (item["broader" + i]) {
                                        if (i == 1) {
                                            parentId = id
                                        } else {
                                            parentId = item["broader" + (i - 1)].value;

                                        }
                                        var childId = item["broader" + i].value
                                        if (existingNodeIds.indexOf(childId) > -1)
                                            return
                                        childrenIds.push(childId)
                                        if (!items[parentId])
                                            items[parentId] = [];
                                        items[parentId].push(item)


                                    }


                                })
                                for (var parentId in items) {
                                    TreeController.drawOrUpdateTree("Blender_treeDiv", items[parentId], parentId, "broader" + i, null)
                                }


                            }
                            Sparql_generic.copyNodes(fromSource, toGraphUri, childrenIds, {}, function (err, result) {
                                if (err)
                                    return MainController.UI.message(err);


                            })


                        }
                        self.modified = true;

                    })


                })

            },
            pasteClipboardNodeProperties: function () {
                var data = Clipboard.getContent();
                Clipboard.clear();
            },

            createChildNode: function (initData) {
                if (!initData)
                    initData = {}
                var parentNode = self.currentTreeNode;
                var parentProperty = SourceEditor.currentSourceSchema.newObject.treeParentProperty;
                var mandatoryProps = SourceEditor.currentSourceSchema.newObject.mandatoryProperties;
                var childClass = SourceEditor.currentSourceSchema.newObject.treeChildrenClasses[parentNode.data.type];
                initData[parentProperty] = [{value: parentNode.id, type: "uri"}];
                mandatoryProps.forEach(function (item) {
                    if (!initData[item])
                        initData[item] = [{"xml:lang": SourceEditor.prefLang, value: "", type: "literal"}]
                })

                if (self.currentTreeNode.data.type == "http://www.w3.org/2004/02/skos/core#ConceptScheme")
                    initData["http://www.w3.org/2004/02/skos/core#topConceptOf"] = [{value: self.currentTreeNode.id, type: "uri"}]


                $("#Blender_PopupDiv").dialog("open")
                $("#Blender_PopupDiv").on('dialogclose', function (event) {
                    if (event.ctrlKey || confirm("save node data")) {
                        SourceEditor.saveEditingObject(function (err, editingObject) {
                            if (editingObject.isNew) {
                                editingObject.isNew = false;
                                var jsTreeData = [{
                                    id: editingObject.about,
                                    text: editingObject.nodeLabel,
                                    data: {type: editingObject.type}
                                }]
                                var parentNode = $("#Blender_treeDiv").jstree(true).get_selected("#")
                                if (parentNode)
                                    common.addNodesToJstree('Blender_treeDiv', self.currentTreeNode.id, jsTreeData, {})
                                else
                                    common.loadJsTree('Blender_treeDiv', jsTreeData, null)


                            }
                        })
                    }
                });

                SourceEditor.editNewObject("Blender_PopupDiv", self.currentSource, childClass, initData);

            },


            createConceptFromWord: function () {
                var data = Clipboard.getContent();
                var initData = {"http://www.w3.org/2004/02/skos/core#prefLabel": [{"xml:lang": SourceEditor.prefLang, value: data.label, type: "literal"}]}
                self.menuActions.createChildNode(initData)
            },


            editNode: function () {
                var type = "http://www.w3.org/2004/02/skos/core#Concept"
                $("#Blender_PopupDiv").dialog("open")
                $("#Blender_PopupDiv").on('dialogclose', function (event) {
                    if (event.ctrlKey || confirm("save node data")) {
                        SourceEditor.saveEditingObject(function (err, editingObject) {
                            if (err) {
                                return MainController.UI.message(err)
                            }
                            $("#Blender_treeDiv").jstree(true).rename_node ( self.currentTreeNode.id, editingObject.nodeLabel)
                            common.setTreeAppearance();
                        })

                    }
                });
                SourceEditor.editNode("Blender_PopupDiv", self.currentSource, self.currentTreeNode.id, type, false)


            }
        }

        self.createScheme = function () {

            if (!self.currentSource) {
                return alert("select a source");
            }
            $("#Blender_PopupDiv").dialog("open")
            $("#Blender_PopupDiv").on('dialogclose', function (event) {
                SourceEditor.saveEditingObject(function (err, editingObject) {
                    if (editingObject.isNew) {
                        editingObject.isNew = false;
                        var jsTreeData = [{
                            id: editingObject.about,
                            text: editingObject.nodeLabel,
                            parent: "#",
                            data: {type: editingObject.type}
                        }]
                        var parentNode = $("#Blender_treeDiv").jstree(true).get_selected("#")
                        if (parentNode)
                            common.addNodesToJstree('Blender_treeDiv', "#", jsTreeData, {})
                        else
                            common.loadJsTree('Blender_treeDiv', jsTreeData, null)


                    }
                })
            });
            SourceEditor.editNewObject("Blender_PopupDiv", self.currentSource, "http://www.w3.org/2004/02/skos/core#ConceptScheme", {});

        }


        return self;

    }
    ()
)
