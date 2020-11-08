var Clipboard = (function () {
    var self = {};
    var content = null;
    self.copy = function (data, elementId, event) {

        content = data;
        content.tool = MainController.currentTool
        if (!data.source)
            content.source = MainController.currentSource
        content.date = new Date()


        $(".clipboardSelected").removeClass("clipboardSelected")

        if (elementId) {
            var elt = document.getElementById(elementId)

            $(elt).addClass("clipboardSelected")
        }


    }

    self.getContent = function () {
        return content;
    }


    return self;
})()
