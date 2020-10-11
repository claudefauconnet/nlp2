var MainController = (function () {
    var self = {}
    self.currentSource = null;
    self.currentTool = null
    self.UI = {

        loadSources: function (treeDiv, withCBX) {
            var treeData = []
            Object.keys(Config.sources).forEach(function (sourceLabel) {
                treeData.push({id: sourceLabel, text: sourceLabel, parent: "#", data: Config.sources[sourceLabel]})
            })
            common.loadJsTree(treeDiv, treeData, {
                withCheckboxes: withCBX,
                selectNodeFn: function (evt, obj) {
                    self.currentSource = obj.node.id;
                    MainController.UI.onSourceSelect()

                }
            })

        },

        loadToolsList: function (treeDiv) {
            var treeData = []
            for (var key in Config.tools) {
                // Object.keys(Config.tools).forEach(function (toolLabel) {
                treeData.push({id: key, text: Config.tools[key].label, parent: "#", data: Config.tools[key]})
            }
            //})
            common.loadJsTree(treeDiv, treeData, {
                selectNodeFn: function (evt, obj) {
                    self.currentTool = obj.node.id;
                    self.currentSource=null;
                    MainController.UI.loadSources("sourcesTreeDiv", obj.node.data.multiSources);
                    $("#accordion").accordion("option", {active: 1});
                    var controller = Config.tools[self.currentTool].controller
                    self.UI.updateActionDivLabel()
                    controller.init(self.currentSource)



                }
            })

        },
        onSourceSelect: function () {
            if (!self.currentSource)
                return MainController.UI.message("select a source")
          self.UI.updateActionDivLabel()
            var controller = Config.tools[self.currentTool].controller
            controller.init(self.currentSource)

            /*    if (self.currentTool == 0) {
                    ThesaurusBrowser.showThesaurusTopConcepts(self.currentSource)
                }*/


        },

        message: function (message) {
            $("#message").html("message")
        },

        updateActionDivLabel:function(){
            if(self.currentSource)
            $("#sourcePanelLabel").html(Config.tools[self.currentTool].label + " : " + self.currentSource)
            else
                $("#sourcePanelLabel").html(Config.tools[self.currentTool].label);

        }
    }


    return self;


})()
