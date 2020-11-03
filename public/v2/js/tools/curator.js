var Curator = (function () {

    var self = {}


    self.onLoaded = function () {
        $("#sourceDivControlPanelDiv").html("")
    }
    self.onSourceSelect = function (thesaurusLabel) {

        self.currentSource = thesaurusLabel;
        $("#rightPanelDiv").css("display", "block")

        $("#rightPanelDiv").load("snippets/curator.html")
        setTimeout(function () {
            $("#Curator_tabs").tabs({})
            Sparql_facade.getTopConcepts(thesaurusLabel, function (err, result) {
                if (err) {
                    return MainController.message(err);
                }
                var jsTreeOptions = {};

                jsTreeOptions.contextMenu = Curator.getJstreeContextMenu()
                jsTreeOptions.selectNodeFn = Curator.selectNodeFn
                jsTreeOptions.onCreateNodeFn = Curator.onCreateNodeFn
                jsTreeOptions.onDeleteNodeFn =Curator.onDeleteNodeFn

                TreeController.drawOrUpdateTree("Curator_treeDiv", result, "#", "topConcept", jsTreeOptions)
            })
        }, 200)


    }
    self.selectNodeFn = function (event, propertiesMap) {
        if (propertiesMap)
            self.currentTreeNode = propertiesMap.node
        ThesaurusBrowser.openTreeNode("Curator_treeDiv", MainController.currentSource, propertiesMap.node)
    }

    self.getJstreeContextMenu = function () {
        return {
            pasteNodeOnly: {
                label: "paste Node Only",
                action: function () {

                    self.popupActions.pasteClipboardNodeOnly()
                    ;
                },

            },
            pastDescendants: {
                label: "paste node and Descendants",
                action: function (obj, sss, cc) {

                    self.popupActions.pasteClipboardNodeDescendants()
                    ;
                },

            },

            pastAscendants: {
                label: "paste node and Ascendants",
                action: function (obj, sss, cc) {

                    self.popupActions.pasteClipboardNodeAscendants()
                    ;
                },


            },


        }


    }
    self.onCreateNodeFn=function(parent,node,position){

    }
    self.onDeleteNodeFn=function(node,parent,position){

    }
    self

    self.save=function(){
        var ids=[]
        var jsonNodes = $('#Curator_treeDiv').jstree(true).get_json('#', { flat: true });
        $.each(jsonNodes, function (i, val) {
            ids.push($(val).attr('id'));
        })

        Sparql_generic.getNodesAllTriples( self.currentSource,ids,function (err,result){
            if(err)
                return MainController.UI.message(err)
        } )

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
                Sparql_generic.getNodeLabel(source, id, function (err, result) {
                    TreeController.drawOrUpdateTree("Curator_treeDiv", result, self.currentTreeNode.id, "concept", null)
                    self.modified = true;
                    if(callback){
                        return callback(null)
                    }

                })


            }

        },
        pasteClipboardNodeDescendants: function (callback) {
            var data = MainController.clipboardContent;
            if (!data)
                return;

            self.popupActions.pasteClipboardNodeOnly (function(err,result) {
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
                                        TreeController.drawOrUpdateTree("Curator_treeDiv", [item], parentId, "child" + i, null)


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
            var data = MainController.clipboardContent;
            if (!data)
                return;
            var array = data.split("|")
            if (array.length == 3) {// cf annotator
                var source = array[1];
                var id = array[2];
                Sparql_generic.getSingleNodeAllAncestors(source, id, function (err, result) {
                    TreeController.drawOrUpdateTree("Curator_treeDiv", result, "#", "broader", null)
                    self.modified = true;

                })


            }

        }
    }


    self.close = function () {
        if (self.modified) {
            confirm("save modifications before Closing Curator")
        }
        $("#rightPanelDiv").css("display", "none")


    }


    return self;

}())
