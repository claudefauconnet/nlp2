
var jsTreeEditor=(function(){
    var self={};
    self.getNodeSubjsTree = function (tree, rootNodeId, parentName) {
        var jsTree = {};
        var currentParent = null;

        function recurse(node) {
            delete node.parent;
            if (node.id == rootNodeId) {

                jsTree = node
                currentParent = node.id
            }
            /*  if (node.parent && node.parent == currentParent) {
                  jsTreeData.push(node)
                  currentParent = node.id
              }*/
            if (node.children) {
                node.children.forEach(function (child) {
                    if (child.commonConceptCount > 0)
                        child.type = "commonConcept"
                    else
                        child.type = "default"
                    recurse(child);

                })
            } else
                node.children = [];

        }

        recurse(tree);

        return jsTree;


    }


    self.drawJsTree = function (treeDiv,editorDivId, jsTreeData) {

        var plugins = ["types"];
        /*   plugins.push("search");

           plugins.push("sort");
           //   plugins.push("types");
           plugins.push("contextmenu");
           plugins.push("dnd");*/
        plugins.push("search");

        if ($('#' + treeDiv).jstree)
            $('#' + treeDiv).jstree("destroy")

        $('#' + treeDiv).jstree({
            'core': {
                'check_callback': true,
                'data': jsTreeData,
            },
            "types": {
                "commonConcept": {
                    "icon": "concept-icon.png"
                },
                "default": {
                    // "icon": "concept-icon.png"
                }
            }
            ,
            'plugins': plugins,
            "search": {
                "case_sensitive": false,
                "show_only_matches": true
            }
        }).on("select_node.jstree", true,
            function (evt, obj) {
                $("#"+editorDivId).animate({'zoom': .7}, 'slow');
                var data = comparator.conceptsMap[obj.node.id].data
                skosEditor.conceptEditor.editConcept(data, editorDivId,{readOnly: true})

            }).on('loaded.jstree', function () {
            //  $('#' + treeDiv).jstree('open_all');
        })
        ;
    }

   self.showRectJsTree= function (obj) {
        $("#jstreeTtitleH").html("")
        $("#jstreeTtitleV").html("")
        var jsTreeData = [{
            text: "vertical",
            parent: "#",
            id: "vertical",
        },
            {
                text: "horizontal",
                parent: "#",
                id: "horizontal",
            }
        ]
        var subTreeV = self.getNodeSubjsTree(self.treeV, obj.id.v, "#")
        var subTreeH = self.getNodeSubjsTree(self.treeH, obj.id.h, "#");

        $("#jstreeTtitleH").html($('#thesaurus2').val())
        $("#jstreeTtitleV").html($('#thesaurus1').val())

        /*    jsTreeData=jsTreeData.concat(subTreeV);
            jsTreeData=jsTreeData.concat(subTreeH);
            console.log(JSON.stringify(jsTreeData,null,2))*/


        self.drawJsTree("jsTreeDivV","editorDivVId", subTreeV)
        self.drawJsTree("jsTreeDivH","editorDivHId", subTreeH)

    }

    self.getNodeChildrenSubTree = function (tree, rootNodeId) {
        var subTree = {};
        var currentParent = null;

        function recurse(node) {
            delete node.data;
            if (node.id == rootNodeId) {
                //  node.parent="#"
                subTree = node;
            } else {
                if (node.children)
                    node.children.forEach(function (child) {
                        recurse(child)
                    })
            }
        }

        recurse(tree);
        return subTree;
    }


    return self;

})()
