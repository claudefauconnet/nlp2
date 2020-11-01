var Curator=(function(){

   var self={}


    self.onLoaded = function () {
       // $("#sourceDivControlPanelDiv").html("<input id='SourceEditor_searchAllSourcesTermInput'> <button onclick='ThesaurusBrowser.searchAllSourcesTerm()'>Search</button>")
    }
    self.onSourceSelect = function (thesaurusLabel) {
        MainController.currentSource = thesaurusLabel;

    }

    self.selectNodeFn = function (event, propertiesMap) {

        if (true || propertiesMap.event.ctrlKey) {
            self.editThesaurusConceptInfos(MainController.currentSource, propertiesMap.node)
        }
        {
            self.openTreeNode("currentSourceTreeDiv", MainController.currentSource, propertiesMap.node)
        }

    }





    return self;

}())
