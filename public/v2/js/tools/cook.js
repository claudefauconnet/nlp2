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

            if (self.modifiedNodes.length > 0) {
                if (confirm("leave source without saving " + self.modifiedNodes.length + "modifications ?"))
                    return self.saveModifiedNodes()

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
var clipboard=Clipboard.getContent()
            if (clipboard && clipboard.type=="node") {

                menuItems.pasteNode = {
                    label: "paste Node",
                    disabled: function () {
                        return !MainController.clipboardContent
                    },
                    action: function () {

                        self.menuActions.pasteClipboardNodeOnly()
                        ;
                    },

                }
                menuItems.pasteProperties = {
                    label: "paste  properties...",
                    disabled: !MainController.clipboardContent,
                    action: function () {

                        self.menuActions.pasteClipboardNodeProperties()
                        ;
                    },

                }
                menuItems.pasteDescendants = {
                    disabled: !MainController.clipboardContent,
                    label: "paste node and Descendants",
                    action: function (obj, sss, cc) {

                        self.menuActions.pasteClipboardNodeDescendants()
                        ;
                    },

                }

                menuItems.pasteAscendants = {
                    disabled: !MainController.clipboardContent,
                    label: "paste node and Ascendants",
                    action: function (obj, sss, cc) {

                        self.menuActions.pasteClipboardNodeAscendants()
                        ;
                    },
                }
            }

            menuItems.modifyNode = {
                label: "Modify node",
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

                    self.menuActions.deleteNode()
                    ;
                },


            }
            menuItems.addChildNodeNode = {
                label: "Add child node",
                action: function (obj, sss, cc) {

                    //   self.menuActions.deleteNode()
                    ;
                },
            }

            return menuItems;

        }


        self.menuActions = {



            moveNode: function(event, obj) {
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
                if (confirm("delete node " + self.currentTreeNode.text)) {
                    $("#Cook_treeDiv").jstree(true).delete_node(self.currentTreeNode.id)
                }
            },
            /**
             *
             * MainController.clipboardContent stucture object or array of object
             *
             * @param callback
             * @return {*}
             */

            pasteClipboardNodeOnly: function (callback) {
                var data = Clipboard.getContent();
                if (!data)
                    return;


                if (data.type=="node") {// cf clipboard and annotator
                    var source =data.source;
                    var id = data.id;
                    var label = data.label;
                    var existingNodeIds = common.getjsTreeNodes("Cook_treeDiv", true)
                    if (existingNodeIds.indexOf(id) > -1) {
                        MainController.UI.message("node " + id + " already exists")
                        return callback(null)
                    }
                    Sparql_generic.copyNodes(source, self.currentSource, id, null, null, function (err, result) {
                        if (err)
                            return MainController.UI.message(err);
                        TreeController.drawOrUpdateTree("Cook_treeDiv", label, self.currentTreeNode.id, "concept", null)

                    })
                }
                else if(data.type=="word"){

                }


            },
            pasteClipboardNodeDescendants: function (callback) {
                var data = MainController.clipboardContent;
                if (!data)
                    return;

                self.menuActions.pasteClipboardNodeOnly(function (err, result) {
                    var existingNodeIds = common.getjsTreeNodes("Cook_treeDiv", true)
                    var array = data.split("|")
                    if (array.length == 3) {// cf annotator
                        var source = array[1];
                        var id = array[2];
                        var depth = 8
                        Sparql_generic.getNodeChildren(source, null, id, depth, null, function (err, result) {

                            if (result.length > 0) {
                                for (var i = 1; i <= depth; i++) {
                                    result.forEach(function (item) {

                                        var parentId;
                                        if (item["child" + i]) {
                                            if (i == 1) {
                                                parentId = id
                                            } else {
                                                parentId = item["child" + (i - 1)].value;

                                            }

                                            if (existingNodeIds.indexOf(item["child" + i].value) > -1)
                                                return
                                            TreeController.drawOrUpdateTree("Cook_treeDiv", [item], parentId, "child" + i, null)


                                        }


                                    })


                                }
                            }
                            self.modified = true;

                        })


                    }
                })

            }
            , pasteClipboardNodeAscendants: function () {
                var existingNodeIds = common.getjsTreeNodes("Cook_treeDiv", true)
                var data = MainController.clipboardContent;
                if (!data)
                    return;
                var array = data.split("|")
                if (array.length == 3) {// cf annotator
                    var source = array[1];
                    var id = array[2];
                    Sparql_generic.getSingleNodeAllAncestors(source, id, function (err, result) {
                        TreeController.drawOrUpdateTree("Cook_treeDiv", result, "#", "broader", null)
                        self.modified = true;

                    })


                }

            },
            pasteClipboardNodeProperties: function () {

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
