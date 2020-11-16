var Blender = (function () {

        var self = {}
        var isLoaded = false
        self.modifiedNodes = []
        self.tempGraph;
        self.currentSourceSchema;
        self.currentSource;
        self.currentTab = 0;
        self.backupSource = false// using  a clone of source graph
        self.onLoaded = function () {
            // $("#sourceDivControlPanelDiv").html("")
        }


        self.initPanel = function () {
            if (isLoaded)
                return;


            $("#blenderPanelDiv").load("snippets/blender/blender.html")
            setTimeout(function () {
                    var editableSources = [];
                    for (var key in Config.sources) {
                        if (Config.sources[key].editable)
                            editableSources.push(key)
                    }

                    common.fillSelectOptions("Blender_SourcesSelect", editableSources.sort(), true)
                    $("#Blender_PopupEditDiv").dialog({
                        autoOpen: false,
                        height: 600,
                        width: 600,
                        modal: true,
                    });
                    $("#Blender_tabs").tabs({
                        activate: function (event, ui) {
                            self.currentTab = $("#Blender_tabs").tabs('option', 'active')
                        }

                    })
                    isLoaded = true;
                }, 200
            )

        }


        self.onSourceSelect = function (source) {

            $("#Blender_conceptTreeDiv").html("");
            self.currentTreeNode = null;
            self.currentSource = null;
            $("#Blender_collectionTreeDiv").html("");
            Collection.currentTreeNode = null;
            if (source == "") {
                return
            }


            self.currentSource = source


            async.series([
                    function (callbackSeries) {
                        SourceEditor.schema.initSourceSchema(source, function (err, result) {
                            callbackSeries(err);
                        })
                    }

                    , function (callbackSeries) {
                        if (!self.backupSource) {
                            Config.sources[source].controller = eval(Config.sources[source].controller)
                            return callbackSeries();
                        }
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
                            callbackSeries(err);
                        })
                    },

                    function (callbackSeries) {
                        self.showTopConcepts(null, function (err, result) {
                            callbackSeries(err);
                        })


                    }
                    ,
                    function (callbackSeries) {
                        Collection.Sparql.getCollections(source, null, function (err, result) {
                            var jsTreeOptions = {};
                            jsTreeOptions.contextMenu = Collection.getJstreeContextMenu()
                            jsTreeOptions.selectNodeFn = Collection.selectNodeFn;
                            jsTreeOptions.onMoveNodeFn = Blender.dnd.moveNode;
                            jsTreeOptions.dnd = Blender.dnd
                            TreeController.drawOrUpdateTree("Blender_collectionTreeDiv", result, "#", "collection", jsTreeOptions)
                            callbackSeries(err);

                        })
                    }
                ],
                function (err) {
                    if (err)
                        return MainController.UI.message(err);
                })
        }
        self.showTopConcepts = function (collectionIds, callback) {
            var options = {};
            if (collectionIds)
                options.filterCollections = collectionIds
            Sparql_facade.getTopConcepts(self.currentSource, options, function (err, result) {
                if (err) {
                    MainController.UI.message(err);
                    return callback(err)
                }
                var jsTreeOptions = {};
                jsTreeOptions.contextMenu = Blender.getJstreeConceptsContextMenu()
                jsTreeOptions.selectNodeFn = Blender.selectNodeFn
                jsTreeOptions.onMoveNodeFn = Blender.dnd.moveNode
                jsTreeOptions.dnd = self.dnd

                TreeController.drawOrUpdateTree("Blender_conceptTreeDiv", result, "#", "topConcept", jsTreeOptions)
                return callback()
            })

        }

        self.dnd = {

            "drag_start": function (data, element, helper, event) {
                return true;
            },
            "drag_move": function (data, element, helper, event) {

                return true;


            },
            "drag_stop": function (data, element, helper, event) {
                console.log("drag_stop_" + self.currentTab)
                if (self.currentTab == 0) {
                    Blender.menuActions.dropNode()
                } else if (self.currentTab == 1) {
                    Collection.dropNode()
                }
                // return true;


                return false;


            },
            checkTreeOperations: function (operation, node, parent, position, more) {
                Blender.currentOperation = {operation: operation, node: node, parent: parent, position: position, more, more}

                return true;
            },
            moveNode: function (event, obj) {
                self.menuActions.movingNode = {id: obj.node.id, newParent: obj.parent, oldParent: obj.old_parent}
            },

        },


            self.selectNodeFn = function (event, propertiesMap) {
                if (propertiesMap) {
                    self.currentTreeNode = propertiesMap.node
                    $("#Blender_conceptTreeDiv").jstree(true).settings.contextmenu.items = self.getJstreeConceptsContextMenu()

                    if (self.currentTreeNode.data.type == "externalReference")
                        return;

                    if (propertiesMap.event.ctrlKey)
                        Clipboard.copy({
                            type: "node",
                            id: self.currentTreeNode.id,
                            label: self.currentTreeNode.text,
                            source: self.currentSource
                        }, self.currentTreeNode.id + "_anchor", propertiesMap.event)


                    ThesaurusBrowser.openTreeNode("Blender_conceptTreeDiv", self.currentSource, propertiesMap.node);
                    self.externalReferences.openNarrowMatchNodes(self.currentSource, self.currentTreeNode.id)

                }
                //  $.jstree.defaults.contextmenu.items = self.getJstreeConceptsContextMenu();


            }


        self.getJstreeConceptsContextMenu = function () {
            var menuItems = {}
            if (!self.currentTreeNode)
                return menuItems
            if (self.currentTreeNode.data.type == "externalReference") {
                menuItems.showExternalReferenceTreeNodes = {

                    label: "show external nodes",
                    action: function (obj, sss, cc) {
                        self.externalReferences.showExternalReferenceTreeNodes()
                    }
                }
                return menuItems;
            }

            var clipboard = Clipboard.getContent()
            if (clipboard.length > 0 && clipboard[0].type == "node") {
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
                        pasteAsReference: {
                            label: " reference",
                            action: function (obj, sss, cc) {
                                self.externalReferences.pasteAsReference()
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
                    self.nodeEdition.editNode()
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
                    self.nodeEdition.createChildNode();
                    ;
                },
            },
                menuItems.importChildren = {
                    label: "Import child nodes",
                    action: function (obj, sss, cc) {
                        Import.showImportNodesDialog();
                        ;
                    },
                }

            return menuItems;

        }


        self.menuActions = {


            dropNode: function () {


                var newParent = self.menuActions.movingNode.newParent
                var oldParent = self.menuActions.movingNode.oldParent
                var id = self.menuActions.movingNode.id
                if (self.menuActions.lastDroppedNodeId == id)
                    return
                self.menuActions.lastDroppedNodeId = id;

                var node = $("#Blender_conceptTreeDiv").jstree(true).get_node(id)
                $("#Blender_conceptTreeDiv").jstree(true).open_node(newParent)
                if (!confirm("Confirm : move concept node and descendants :" + node.text + "?")) {
                    return
                }

                var broaderPredicate = "http://www.w3.org/2004/02/skos/core#broader"


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


                var node;
                var treeDivId;
                if (self.currentTab == 0) {
                    node = self.currentTreeNode
                    treeDivId = "Blender_conceptTreeDiv"
                } else if (self.currentTab == 1) {
                    node = Collection.currentTreeNode
                    treeDivId = "Blender_collectionTreeDiv"
                }
                var str = ""
                if (node.children.length > 0)
                    str = " and all its descendants"
                if (confirm("delete node " + node.text + str)) {

                    var nodeIdsToDelete = [node.id]
                    async.series([

                            function (callbackSeries) {// descendants of type concept
                                if (node.children.length == 0)
                                    return callbackSeries();
                                if (self.currentTab != 0)
                                    return callbackSeries();
                                Sparql_generic.getSingleNodeAllDescendants(self.currentSource, node.id, function (err, result) {
                                    if (err) {
                                        return callbackSeries(err);
                                    }
                                    var subjectsIds =
                                        result.forEach(function (item) {
                                            nodeIdsToDelete.push(item.narrower.value)
                                        })
                                    callbackSeries();
                                })
                            },
                            function (callbackSeries) {// descendants of type collection
                                if (node.children.length == 0)
                                    return callbackSeries();
                                if (self.currentTab != 1)
                                    return callbackSeries();
                                Collection.Sparql.getSingleNodeAllDescendants(self.currentSource, node.id, function (err, result) {
                                    if (err) {
                                        return callbackSeries(err);
                                    }
                                    var subjectsIds =
                                        result.forEach(function (item) {
                                            nodeIdsToDelete.push(item.narrower.value)
                                        })
                                    callbackSeries();
                                })

                            },

                            function (callbackSeries) {
                                Sparql_generic.deleteTriples(self.currentSource, nodeIdsToDelete, null, null, function (err, result) {
                                    if (err) {
                                        return callbackSeries(err);
                                    }
                                    callbackSeries();
                                })
                            },
                            function (callbackSeries) {// delete members triple in parentNode
                                if (self.currentTab != 1)
                                    return callbackSeries();
                                Sparql_generic.deleteTriples(self.currentSource, node.parent, "http://www.w3.org/2004/02/skos/core#member", node.id, function (err, result) {
                                    if (err) {
                                        return callbackSeries(err);
                                    }
                                    callbackSeries();
                                })

                            },
                            function (callbackSeries) {// delete from tree
                                common.deleteNode(treeDivId, node.id)
                                if (self.currentTab == 0) {
                                    self.currentTreeNode = null;
                                } else if (self.currentTab == 1) {
                                    Collection.currentTreeNode = null
                                }
                                callbackSeries();
                            }
                        ],

                        function (err) {
                            if (err) {
                                return MainController.UI.message(err)
                            }
                            MainController.UI.message("nodes deleted " + nodeIdsToDelete.length)
                        }
                    )
                }
            },


            pasteClipboardNodeOnly:

                function (callback) {
                    var dataArray = Clipboard.getContent();
                    if (!dataArray)
                        return;
                    async.eachSeries(dataArray, function (data, callbackEach) {


                        if (data.type == "node") {// cf clipboard and annotator
                            var fromSource = data.source;
                            var toGraphUri = Config.sources[self.currentSource].graphUri
                            var id = data.id;
                            var label = data.label;
                            var existingNodeIds = common.getjsTreeNodes("Blender_conceptTreeDiv", true)
                            if (existingNodeIds.indexOf(id) > -1) {
                                MainController.UI.message("node " + id + " already exists")
                                if (callback)
                                    return callback(null)
                            }
                            Sparql_generic.copyNodes(fromSource, toGraphUri, id, {setObjectFn: Blender.menuActions.setCopiedNodeObjectFn}, function (err, result) {
                                if (err)
                                    return MainController.UI.message(err);
                                var jstreeData = [{id: id, text: label, parent: self.currentTreeNode.id, data: {type: "http://www.w3.org/2004/02/skos/core#Concept"}}]
                                common.addNodesToJstree("Blender_conceptTreeDiv", self.currentTreeNode.id, jstreeData)
                                callbackEach()

                            })
                        }
                    }, function (err) {
                        if (!callback)
                            Clipboard.clear();
                        else
                            return callback(null)

                    })


                }

            ,
            setCopiedNodeObjectFn: function (item) {
                var newParent = self.currentTreeNode;
                if (item.prop.value == "http://www.w3.org/2004/02/skos/core#broader")
                    item.value.value = newParent.id;
                return item


            }
            ,


            pasteClipboardNodeDescendants: function (callback) {
                var dataArray = Clipboard.getContent();
                if (!dataArray)
                    return;
                var totalNodesCount = 0
                async.eachSeries(dataArray, function (data, callbackEach) {

                    self.menuActions.pasteClipboardNodeOnly(function (err, result) {

                        Clipboard.clear();

                        var existingNodeIds = common.getjsTreeNodes("Blender_conceptTreeDiv", true)
                        var fromSource = data.source;
                        var toGraphUri = Config.sources[self.currentSource].graphUri
                        var id = data.id;
                        var label = data.label;
                        var depth = 3
                        var childrenIds = [id]
                        var currentDepth = 1

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
                                            if (existingNodeIds.indexOf(childId) > -1) {

                                                return MainController.UI.message("node " + id + " already exists")
                                            }

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
                                            TreeController.drawOrUpdateTree("Blender_conceptTreeDiv", items[parentId], parentId, "child" + currentDepth, null)
                                        }

                                        callbackWhilst();

                                    })


                                })
                            }
                            , function (err) {
                                if (err)
                                    callbackEach(err);
                                callbackEach();
                            })
                    })
                }, function (err) {
                    if (err)
                        return MainController.UI.message(err)
                    return MainController.UI.message("copied " + totalNodesCount + " nodes")
                })


            }


            /**
             *
             *  A FINIR
             *
             *
             * @param callback
             */
            ,
            pasteClipboardNodeAscendants: function () {
                var data = Clipboard.getContent();
                if (!data)
                    return;

                self.menuActions.pasteClipboardNodeOnly(function (err, result) {

                    var existingNodeIds = common.getjsTreeNodes("Blender_conceptTreeDiv", true)
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
                                    TreeController.drawOrUpdateTree("Blender_conceptTreeDiv", items[parentId], parentId, "broader" + i, null)
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

            }
            ,
            pasteClipboardNodeProperties: function () {
                var data = Clipboard.getContent();
                Clipboard.clear();
            }
            ,


            createConceptFromWord: function () {
                var data = Clipboard.getContent();
                var initData = {"http://www.w3.org/2004/02/skos/core#prefLabel": [{"xml:lang": SourceEditor.prefLang, value: data.label, type: "literal"}]}
                self.nodeEdition.createChildNode(initData)
            }
            ,


        }


        self.nodeEdition = {
            createSchemeOrCollection: function (type) {
                var skosType;
                if (type == "Scheme") {
                    skosType = "http://www.w3.org/2004/02/skos/core#ConceptScheme"
                    $("#Blender_tabs").tabs("option", "active", 0);
                } else if (type == "Collection") {
                    $("#Blender_tabs").tabs("option", "active", 1);
                    skosType = "http://www.w3.org/2004/02/skos/core#Collection"
                } else
                    return;

                if (!self.currentSource) {
                    return alert("select a source");
                }

                self.nodeEdition.openDialog()
                var initData = {
                    "http://www.w3.org/2004/02/skos/core#prefLabel":
                        [{"xml:lang": Config.sources[self.currentSource].prefLang || "en", value: "", type: "literal"}]
                }
                SourceEditor.editNewObject("Blender_nodeEditionDiv", self.currentSource, skosType, initData);

            }


            ,
            editNode: function () {
                self.nodeEdition.openDialog()
                if (self.currentTab == 0) {
                    var type = "http://www.w3.org/2004/02/skos/core#Concept"
                    SourceEditor.editNode("Blender_nodeEditionDiv", self.currentSource, self.currentTreeNode.id, type, false)
                } else if (self.currentTab == 1) {
                    var type = "http://www.w3.org/2004/02/skos/core#Collection"
                    SourceEditor.editNode("Blender_nodeEditionDiv", self.currentSource, Collection.currentTreeNode.id, type, false)
                }
                return true;


            }


            , createChildNode: function (initData) {
                if (!initData)
                    initData = {}
                var parentNode;
                var parentProperty;
                var mandatoryProps;
                var childClass;
                var treeDivId;


                if (self.currentTab == 0) {
                    parentNode = self.currentTreeNode;
                    parentProperty = SourceEditor.currentSourceSchema.newObject.treeParentProperty;
                    mandatoryProps = SourceEditor.currentSourceSchema.newObject.mandatoryProperties;
                    childClass = SourceEditor.currentSourceSchema.newObject.treeChildrenClasses[parentNode.data.type];
                    treeDivId = 'Blender_conceptTreeDiv';
                    type = "http://www.w3.org/2004/02/skos/core#Concept"
                    if (self.currentTreeNode.data.type == "http://www.w3.org/2004/02/skos/core#ConceptScheme")
                        initData["http://www.w3.org/2004/02/skos/core#topConceptOf"] = [{value: self.currentTreeNode.id, type: "uri"}]

                } else if (self.currentTab == 1) {
                    parentNode = Collection.currentTreeNode;
                    var type = "http://www.w3.org/2004/02/skos/core#Collection"
                    parentProperty = "^" + Collection.broaderProperty;
                    mandatoryProps = ["http://www.w3.org/2004/02/skos/core#prefLabel"]
                    childClass = "http://www.w3.org/2004/02/skos/core#Collection";
                    treeDivId = 'Blender_collectionTreeDiv';
                }

                mandatoryProps.forEach(function (item) {
                    if (!initData[item])
                        initData[item] = [{"xml:lang": SourceEditor.prefLang, value: "", type: "literal"}]
                })
                initData[parentProperty] = [{value: parentNode.id, type: "uri"}];

                self.nodeEdition.openDialog()
                SourceEditor.editNewObject("Blender_nodeEditionDiv", self.currentSource, childClass, initData);

            },


            openDialog: function () {
                $("#Blender_PopupEditDiv").dialog("open")

                $(".ui-dialog-titlebar-close").css("display", "none")

            },

            saveEditingNode: function () {
                SourceEditor.saveEditingObject(function (err, editingObject) {
                    if (err) {
                        MainController.UI.message(err)
                    }
                    if (self.nodeEdition.afterSaveEditingObject(editingObject))
                        $("#Blender_PopupEditDiv").dialog("close")
                })
            }
            ,


            afterSaveEditingObject: function (editingObject) {

                if (editingObject.errors && editingObject.errors.length > 0) {
                    var errorsStr = ""
                    editingObject.errors.forEach(function (item) {
                        errorsStr += item + "."
                    })
                    alert(errorsStr)
                    return false;
                }


                var treeDiv, currentNodeId;
                currentNodeId = "#"
                if (Blender.currentTab == 0) {
                    treeDiv = 'Blender_conceptTreeDiv'
                    if (Blender.currentTreeNode)
                        currentNodeId = Blender.currentTreeNode.id
                } else if (Blender.currentTab == 1) {
                    treeDiv = 'Blender_collectionTreeDiv'
                    if (Collection.currentTreeNode)
                        currentNodeId = Collection.currentTreeNode.id
                }

                var parent = editingObject.parent || "#"
                if (editingObject.isNew) {
                    editingObject.isNew = false;
                    var jsTreeData = [{
                        id: editingObject.about,
                        text: editingObject.nodeLabel,
                        parent: currentNodeId,
                        data: {type: editingObject.type}
                    }]


                    var parentNode = $("#" + treeDiv).jstree(true).get_selected("#")
                    if (parentNode)
                        common.addNodesToJstree(treeDiv, currentNodeId, jsTreeData, {})
                    else
                        common.loadJsTree("#" + treeDiv, jsTreeData, null)


                } else {
                    if (editingObject.nodeLabel) {
                        $("#" + treeDiv).jstree(true).rename_node(currentNodeId, editingObject.nodeLabel)
                        common.setTreeAppearance();
                    }
                }
                return true;

            }
            , cancelEditingNode: function () {
                $("#Blender_PopupEditDiv").dialog("close")
            }

        }


        self.externalReferences = {
            /**
             *
             *
             * adds nodes to tree comining from another scheme
             * using narrowMatch property : its values concats <nodeUri>@<saprqlServerUrl>:<graphUri



             */
            openNarrowMatchNodes: function (thesaurusLabel, nodeId) {
                // narrower match in other source
                Sparql_generic.getNodeInfos(thesaurusLabel, nodeId, {propertyFilter: ["http://www.w3.org/2004/02/skos/core#narrowMatch"]}, function (err, result) {
                    if (err) {
                        return MainController.UI.message(err);
                    }
                    var newTreeNodes = []
                    result.forEach(function (item) {
                        newTreeNodes.push({
                            id: item.value.value,
                            text: "@" + item.value.value,
                            parent: nodeId,
                            data: {type: "externalReference"}

                        })

                    })
                    if (newTreeNodes.length > 0)
                        common.addNodesToJstree("Blender_conceptTreeDiv", nodeId, newTreeNodes)

                    /*  var narrowMatchIds = []
                      result.forEach(function (item) {
                          var str = item.value.value;
                          var array = (/[@:]/).exec(str)
                          if (array.length == 4)
                              narrowMatchIds.push({id: array[0],serverUrl:array[1],graphUri:array[2]})

                          })*/


                })


            },


            /**
             *
             *adds a "narrowMatch property to node with uri value : id + "@" + fromSparql_url + ":" + fromGraphUri
             *show it as child node
             *
             *
             *
             */
            pasteAsReference: function () {
                var dataArray = Clipboard.getContent();
                if (!dataArray)
                    return;
                var newTreeNodes = []

                async.eachSeries(dataArray, function (data, callbackEach) {

                        var existingNodeIds = common.getjsTreeNodes("Blender_conceptTreeDiv", true)
                        var fromSource = data.source;
                        var fromGraphUri = Config.sources[fromSource].graphUri
                        var fromSparql_url = Config.sources[fromSource].sparql_url
                        var id = data.id;

                    var objectUri=self.externalReferences.generateExternalUrl(id,fromSparql_url,fromGraphUri,data.label)
                        newTreeNodes.push(
                            {
                                id: id,
                                text: "@" + fromSource + "/" + data.label,
                                parent: self.currentTreeNode,
                                data: {type: "externalReference"}
                            }
                        )

                        var triple = {subject: self.currentTreeNode.id, predicate: "http://www.w3.org/2004/02/skos/core#narrowMatch", object: objectUri, valueType: "uri"};
                        Sparql_generic.insertTriples(self.currentSource, [triple], function (err, result) {
                            callbackEach(err);
                        })

                    }, function (err) {
                        if (err)
                            return MainController.UI.message(err);
                        common.addNodesToJstree("Blender_conceptTreeDiv", self.currentTreeNode.id, newTreeNodes)
                        Clipboard.clear();
                    }
                )
            }

            , showExternalReferenceTreeNodes: function () {
                var str = self.currentTreeNode.id;

                Sparql_generic.getNodeChildren(externalSourceLabel, null,id,0,{},function(err,result){
                    if(err)
                      return  MainController.UI.message(err);

                    var jsTreeOptions={}
                    TreeController.drawOrUpdateTree("Blender_conceptTreeDiv", result, id, "child1", jsTreeOptions)

                })



            },
            parseExternalUrl:function(url) {


                var p = str.indexOf("?")
                if(p<0)
                    return null;

                var id = str.substring(0, p);
                var params =  str.substring(p+1).split("&");
                var obj={}
               params.forEach(function(str){
                   var array=str.split("=")
                   obj[array[0]]=array[1]

               })

                for (var key in Config.sources) {
                    if (Config.sources[key].sparql_url == sparql_url && Config.sources[key].graphUri == graphUri)
                        sourceLabel = key
                }

            }
            ,generateExternalUrl:function(id,sparql_url,graphUri,label){
              return ""+id + "?sparql_url=" + sparql_url + "&graphUri=" + graphUri+ "&label=" + label;
        }


        }


        return self;

    }
    ()
)
