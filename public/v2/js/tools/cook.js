var Cook = (function () {

        var self = {}
        var isLoaded = false
        self.modifiedNodes = []
        self.tempGraph;
        self.onLoaded = function () {
            // $("#sourceDivControlPanelDiv").html("")
        }


        self.initPanel = function () {
            if (isLoaded)
                return;


            $("#cookPanelDiv").load("snippets/cook.html")
            setTimeout(function () {
                    var editableSources = [];
                    for (var key in Config.sources) {
                        if (Config.sources[key].editable)
                            editableSources.push(key)
                    }

                    common.fillSelectOptions("Cook_SourcesSelect", editableSources.sort(), true)
                    $("#Cook_PopupDiv").dialog({
                        autoOpen: false,
                        height: 600,
                        width: 600,
                        modal: true,
                    });
                    $("#Cook_tabs").tabs({})
                    isLoaded = true;
                }, 200
            )

        }


        self.onSourceSelect = function (source) {

            if (source == "") {
                $("#Cook_treeDiv").html("");
                self.currentTreeNode = null;
                self.currentSource = null;
                return
            }

            self.currentSource = "_cookTempSource"
            Config.sources[self.currentSource] = {
                "controller": Sparql_generic,
                "sparql_url": Config.sources[source].sparql_url,// on the same server !!!
                "graphUri": "http://souslesens/_cookTempSource/" + source,
                "sourceSchema": "SKOS",
                "predicates": {
                    "lang": "en"
                },
            };


            Sparql_generic.copyGraph(source, Config.sources[self.currentSource].graphUri, function (err, result) {


                self.modifiedNodes = []

                Sparql_facade.getTopConcepts(self.currentSource, function (err, result) {
                    if (err) {
                        return MainController.message(err);
                    }
                    var jsTreeOptions = {};
                    jsTreeOptions.contextMenu = Cook.getJstreeContextMenu()
                    jsTreeOptions.selectNodeFn = Cook.selectNodeFn
                    /*  jsTreeOptions.onCreateNodeFn = Cook.onCreateNodeFn
                      jsTreeOptions.onDeleteNodeFn = Cook.onDeleteNodeFn*/
                    jsTreeOptions.moveNode = Cook.menuActions.moveNode
                    jsTreeOptions.dnd = self.dnd

                    TreeController.drawOrUpdateTree("Cook_treeDiv", result, "#", "topConcept", jsTreeOptions)
                })

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
                var nodeId = element.data.nodes[0]
                var node = $("#Cook_treeDiv").jstree(true).get_node(nodeId)

                if (confirm("Confirm : move node and descendants :" + node.text + "?"))
                    return true;
                return false;


            },
            checkTreeOperations: function (operation, node, parent, position, more) {
                Cook.currentOperation = {operation: operation, node: node, parent: parent, position: position, more, more}

                return true;
            }
        },


            self.selectNodeFn = function (event, propertiesMap) {
                if (propertiesMap)
                    self.currentTreeNode = propertiesMap.node
                ThesaurusBrowser.openTreeNode("Cook_treeDiv", self.currentSource, propertiesMap.node);


                var xx = $("#Cook_treeDiv").jstree(true).settings.contextmenu

                $("#Cook_treeDiv").jstree(true).settings.contextmenu.items = self.getJstreeContextMenu()

                //  $.jstree.defaults.contextmenu.items = self.getJstreeContextMenu();


            }

        self.getJstreeContextMenu = function () {
            var menuItems = {}
            var clipboard = Clipboard.getContent()
            if (clipboard && clipboard.type == "node") {


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

            }

            menuItems.editNode = {
                label: "Edit node",
                action: function (obj, sss, cc) {
                    var type = "http://www.w3.org/2004/02/skos/core#Concept"
                    $("#Cook_PopupDiv").dialog("open")
                    $("#Cook_PopupDiv").on('dialogclose', function (event) {
                        SourceEditor.saveEditingObject(Cook.currentSource)
                    });
                    SourceEditor.editNode("Cook_PopupDiv", self.currentSource, self.currentTreeNode.id, type, false)
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
                if (self.currentTreeNode.children.length > 0)
                    return alert("cannot delete nodes with Children")
                if (confirm("delete node " + self.currentTreeNode.text)) {
                    Sparql_generic.deleteTriples(self.currentSource, self.currentTreeNode.id, null, null, function (err, result) {
                        if (err) {
                            return MainController.UI.message(err)
                        }
                        common.deleteNode("Cook_treeDiv", self.currentTreeNode.id)
                    })
                }
            },


            pasteClipboardNodeOnly: function (callback) {
                var data = Clipboard.getContent();
                if (!data)
                    return;

                if (data.type == "node") {// cf clipboard and annotator
                    var fromSource = data.source;
                    var toGraphUri = Config.sources[self.currentSource].graphUri
                    var id = data.id;
                    var label = data.label;
                    var existingNodeIds = common.getjsTreeNodes("Cook_treeDiv", true)
                    if (existingNodeIds.indexOf(id) > -1) {
                        MainController.UI.message("node " + id + " already exists")
                        if (callback)
                            return callback(null)
                    }
                    Sparql_generic.copyNodes(fromSource, toGraphUri, id, {setObjectFn: Cook.menuActions.setCopiedNodeObjectFn}, function (err, result) {
                        if (err)
                            return MainController.UI.message(err);
                        var jstreeData = [{id: id, text: label, parent: self.currentTreeNode.id, data: {type: "http://www.w3.org/2004/02/skos/core#Concept"}}]
                        common.addNodesToJstree("Cook_treeDiv", self.currentTreeNode.id, jstreeData)
                        if (callback)
                            return callback(null)

                    })
                } else if (data.type == "word") {

                }


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

                    var existingNodeIds = common.getjsTreeNodes("Cook_treeDiv", true)
                    var fromSource = data.source;
                    var toGraphUri = Config.sources[self.currentSource].graphUri
                    var id = data.id;
                    var label = data.label;
                    var depth = 3
                    Sparql_generic.getNodeChildren(fromSource, null, id, depth, null, function (err, result) {
                        if (err)
                            return MainController.UI.message(err);
                        var childrenIds = []

                        if (result.length > 0) {
                            for (var i = 1; i <= depth; i++) {
                                var items = {}
                                result.forEach(function (item) {

                                    var parentId;
                                    if (item["child" + i]) {
                                        if (i == 1) {
                                            parentId = id
                                        } else {
                                            parentId = item["child" + (i - 1)].value;

                                        }
                                        var childId = item["child" + i].value
                                        if (existingNodeIds.indexOf(childId) > -1)
                                            return
                                        childrenIds.push(childId)
                                        if (!items[parentId])
                                            items[parentId] = [];
                                        items[parentId].push(item)


                                    }


                                })
                                for (var parentId in items) {
                                    TreeController.drawOrUpdateTree("Cook_treeDiv", items[parentId], parentId, "child" + i, null)
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

                    var existingNodeIds = common.getjsTreeNodes("Cook_treeDiv", true)
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
                                    TreeController.drawOrUpdateTree("Cook_treeDiv", items[parentId], parentId, "broader" + i, null)
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

            },

            createChildNode: function () {

            },


        }

        self.saveModifiedNodes = function () {
            var actions = {delete: [], alter: [], create: [], move: []}
            self.modifiedNodes.forEach(function (item) {
                actions[item.action].push(item)
            })


            async.series([

                //delete
                function (callbackSeries) {
                    var toDeleteIds = []
                    actions.delete.forEach(function (item) {
                        toDeleteIds.push(item.nodeId)
                    })
                    Sparql_generic.deleteTriplesBySubject(self.currentSource, toDeleteIds, function (err, result) {

                        return callbackSeries(err);
                    })
                },
            ], function (err) {

            })


        }


        return self;

    }
    ()
)
