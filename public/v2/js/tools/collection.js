var Collection = (function () {

    var self = {}
    self.currentTreeNode;
    self.broaderProperty = "http://www.w3.org/2004/02/skos/core#member"

    self.getJstreeContextMenu = function () {
        var menuItems = {}
        var clipboard = Clipboard.getContent()
        if (clipboard.length > 0 && clipboard[0].type == "node") {


            menuItems.assignConcepts = {
                label: "Assign selected Concepts",
                action: function (obj, sss, cc) {
                   Collection.assignConcepts()
                },


            }
        }
        menuItems.filterConcepts = {
            label: "Filter Concepts",
            action: function (obj, sss, cc) {
                Collection.filterConcepts()
            }
        }
        menuItems.unAssignConcepts = {
            label: "Unassign Concepts",
            action: function (obj, sss, cc) {
                Collection.unAssignConcepts()
                ;
            },
        }

        menuItems.editNode = {
            label: "Edit node",
            action: function (obj, sss, cc) {
                Blender.nodeEdition.editNode()
            }
        }

        menuItems.deleteNode = {
            label: "Delete node",
            action: function (obj, sss, cc) {
                Blender.menuActions.deleteNode();
            },


        }
        menuItems.addChildNodeNode = {
            label: "Create child",
            action: function (obj, sss, cc) {
                Blender.nodeEdition.createChildNode();
                ;
            },
        }
        return menuItems;
    }


    self.selectNodeFn = function (event, propertiesMap) {
        if (propertiesMap)
           self.currentTreeNode = propertiesMap.node
        $("#Blender_collectionTreeDiv").jstree(true).settings.contextmenu.items = Collection.getJstreeContextMenu()

    }
    self.assignConcepts = function () {
        var nodes = Clipboard.getContent();
        var conceptIds = [];
        nodes.forEach(function (item) {
            conceptIds.push(item.id)
        })
        Sparql_generic.collections.setConceptsCollectionMembership(Blender.currentSource, conceptIds, Collection.currentTreeNode.id, function (err, result) {
            if (err)
                return MainController.UI.message(err)
            return MainController.UI.message(result)
        })

    }
    self.unAssignConcepts = function () {

    }
    self.filterConcepts = function () {
        var options = {
            filterCollections: Collection.currentTreeNode.id
        }
        TreeController.getFilteredNodesJstreeData(self.currentSource, options, function (err, jstreeData) {

            MainController.UI.message("")
            $("#Blender_tabs").tabs("option", "active", 0);
            common.loadJsTree("Blender_conceptTreeDiv", jstreeData, {
                selectNodeFn: Blender.selectNodeFn,
                contextMenu: Blender.getJstreeConceptsContextMenu()
            })

        })
    }
    self.dropNode = function () {
        var newParent = Blender.menuActions.movingNode.newParent
        var oldParent = Blender.menuActions.movingNode.oldParent
        var id = Blender.menuActions.movingNode.id
        if (Blender.menuActions.lastDroppedNodeId == id)
            return
        Blender.menuActions.lastDroppedNodeId = id;
        var broaderPredicate = self.broaderProperty



        Sparql_generic.deleteTriples(Blender.currentSource, oldParent, broaderPredicate, id, function (err, result) {
            if (err) {
                return MainController.UI.message(err)
            }
            var triple = {subject: newParent, predicate: broaderPredicate, object: id, valueType: "uri"}
            Sparql_generic.update(Blender.currentSource, [triple], function (err, result) {
                if (err) {
                    return MainController.UI.message(err)
                }
            })
        })

    }


    return self;
})()
