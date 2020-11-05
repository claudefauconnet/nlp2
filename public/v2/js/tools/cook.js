var Cook = (function () {

    var self = {}
    var isLoaded = false
    self.modifiedNodes = []
    self.onLoaded = function () {
        // $("#sourceDivControlPanelDiv").html("")
    }


    self.initPanel = function () {
        if (isLoaded)
            return;


        $("#cookPanelDiv").load("snippets/cook.html")
        setTimeout(function () {
            common.fillSelectOptions("Cook_SourcesSelect", Object.keys(Config.sources).sort(), true)
            $("#Cook_PopupDiv").dialog({
                autoOpen: false,
                height: 600,
                width: 600,
                modal: true,
            });
            $("#Cook_tabs").tabs({})
            isLoaded = true;
        }, 200)

    }


    self.onSourceSelect = function (source) {
        if (self.modifiedNodes.length > 0) {
            if (confirm("leave source without saving " + self.modifiedNodes.length + "modifications ?"))
                return self.saveModifiedNodes()

        }

        self.modifiedNodes = []
        self.currentSource = source;
        Sparql_facade.getTopConcepts(source, function (err, result) {
            if (err) {
                return MainController.message(err);
            }
            var jsTreeOptions = {};

            jsTreeOptions.contextMenu = Cook.getJstreeContextMenu()
            jsTreeOptions.selectNodeFn = Cook.selectNodeFn
            jsTreeOptions.onCreateNodeFn = Cook.onCreateNodeFn
            jsTreeOptions.onDeleteNodeFn = Cook.onDeleteNodeFn
            jsTreeOptions.onMoveNodeFn = Cook.onMoveNodeFn
            jsTreeOptions.dnd = self.dnd


            TreeController.drawOrUpdateTree("Cook_treeDiv", result, "#", "topConcept", jsTreeOptions)
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

        }

    self.getJstreeContextMenu = function () {
        return {
            pasteNode: {
                label: "paste Node",
                action: function () {

                    self.popupActions.pasteClipboardNodeOnly()
                    ;
                },

            },
            pasteProperties: {
                label: "paste  properties...",
                action: function () {

                    self.popupActions.pasteClipboardNodeProperties()
                    ;
                },

            },
            pasteDescendants: {
                label: "paste node and Descendants",
                action: function (obj, sss, cc) {

                    self.popupActions.pasteClipboardNodeDescendants()
                    ;
                },

            },

            pasteAscendants: {
                label: "paste node and Ascendants",
                action: function (obj, sss, cc) {

                    self.popupActions.pasteClipboardNodeAscendants()
                    ;
                },


            },
            deleteNode: {
                label: "Delete node",
                action: function (obj, sss, cc) {

                    self.popupActions.deleteNode()
                    ;
                },


            },
            modifyNode: {
                label: "Modify node",
                action: function (obj, sss, cc) {
                    $("#Cook_PopupDiv").dialog("open")
                }
            }


        }


    }


    self.popupActions = {


        pasteClipboardNodeOnly: function (callback) {
            var data = MainController.clipboardContent;

            if (!data)
                return;
            var array = data.split("|")

            if (array.length == 3) {// cf annotator
                var source = array[1];
                var id = array[2];
                var existingNodeIds = common.getjsTreeNodes("Cook_treeDiv", true)
                if (existingNodeIds.indexOf(id) > -1) {
                    MainController.UI.message("node " + id + " already exists")
                    return callback(null)
                }

                Sparql_generic.getNodeLabel(source, id, function (err, result) {
                    TreeController.drawOrUpdateTree("Cook_treeDiv", result, self.currentTreeNode.id, "concept", null)
                    self.modified = true;
                    if (callback) {
                        return callback(null)
                    }

                })


            }

        },
        pasteClipboardNodeDescendants: function (callback) {
            var data = MainController.clipboardContent;
            if (!data)
                return;

            self.popupActions.pasteClipboardNodeOnly(function (err, result) {
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
        deleteNode: function () {

            if (confirm("delete node " + self.currentTreeNode.text)) {
                $("#Cook_treeDiv").jstree(true).delete_node(self.currentTreeNode.id)
            }

        }
    }


    self.onCreateNodeFn = function (event, obj) {
        self.modifiedNodes.push({nodeId:  obj.node.id, action: "create"})
    }
    self.onDeleteNodeFn = function (event, obj) {
        self.modifiedNodes.push({nodeId: obj.node.id, action: "delete"})
    }
    self.onAlterNodeFn = function (event, obj) {
        self.modifiedNodes.push({nodeId:  obj.node.id, action: "alter"})

    }
    self.onMoveNodeFn = function (node, parent, position, oldParent, oldPosition, is_multi, old_instance, new_instance) {
        self.modifiedNodes.push({nodeId: node.id, newParent: parent, oldParent: oldParent, action: "move"})
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

}())
