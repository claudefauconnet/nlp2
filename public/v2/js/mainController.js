var MainController = (function () {
    var self = {}
    self.currentSource = null;
    self.currentTool = null
    self.UI = {

        loadSources: function (treeDiv, withCBX) {
            var treeData = []
            Object.keys(Config.sources).forEach(function (sourceLabel,index) {
                    if (!Config.sources[sourceLabel].color)
                        Config.sources[sourceLabel].color = common.palette[index%common.palette.length];

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
                    self.currentSource = null;
                    MainController.UI.loadSources("sourcesTreeDiv", obj.node.data.multiSources);
                    $("#accordion").accordion("option", {active: 1});
                    var controller = Config.tools[self.currentTool].controller
                    self.UI.updateActionDivLabel();
                    if (Config.tools[self.currentTool].multiSources)
                        controller.onSourceSelect(self.currentSource)
                    if(Config.tools[self.currentTool].onLoaded)
                        Config.tools[self.currentTool].onLoaded()

                }
            })

        },
        onSourceSelect: function () {
            $("#actionDivContolPanelDiv").html("");
            $("#sourceDivControlPanelDiv").html("");

            if (Config.tools[self.currentTool].multiSources)
                return
            if (!self.currentSource)
                return MainController.UI.message("select a source");

            self.UI.updateActionDivLabel()
            var controller = Config.tools[self.currentTool].controller
            controller.onSourceSelect(self.currentSource)

            /*    if (self.currentTool == 0) {
                    ThesaurusBrowser.showThesaurusTopConcepts(self.currentSource)
                }*/


        },

        message: function (message) {
            $("#messageDiv").html(message)
        },



        setCredits:function(){

            var html="<div><span class='topTitle'>SousLeSens Vocables</span></div>"
            $("#graphDiv").html(html)


        },

        updateActionDivLabel: function () {
            if (self.currentSource)
                $("#sourcePanelLabel").html(Config.tools[self.currentTool].label + " : " + self.currentSource)
            else
                $("#sourcePanelLabel").html(Config.tools[self.currentTool].label);

        }
    }


    return self;


})()
