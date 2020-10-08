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
            Object.keys(Config.tools).forEach(function (toolLabel) {
                treeData.push({id: toolLabel, text: toolLabel, parent: "#", data: Config.tools[toolLabel]})
            })
            common.loadJsTree(treeDiv, treeData, {
                selectNodeFn: function (evt, obj) {
                    self.currentTool = obj.node.id;

                    MainController.UI.loadSources("sourcesTreeDiv", obj.node.data.multiSources);
                    $("#accordion").accordion("option", {active: 1});


                }
            })

        },
        onSourceSelect: function () {
            if (!self.currentSource)
                return MainController.UI.message("select a source")
            if (self.currentTool == "navigate thesaurus") {

                NavigateThesaurus.showThesaurusTopConcepts(self.currentSource)

            }


        },

        message: function (message) {
            $("#message").html("message")
        }
    }


    return self;


})()
