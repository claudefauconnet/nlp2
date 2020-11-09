var Clipboard = (function () {
    var self = {};
    var content = null;

    self.copy = function (data, element, event) {

        content = data;
        content.tool = MainController.currentTool
        if (!data.source)
            content.source = MainController.currentSource
        content.date = new Date()


        $(".clipboardSelected").removeClass("clipboardSelected")

        if (element) {
            if (element === "_visjsNode") {
                blinkVisjsNode(content.id);
            } else {
                var elt = document.getElementById(element)
                if (elt) {
                    $(elt).addClass("clipboardSelected")
                }
            }
        }


    }

    self.getContent = function () {
        return content;
    }


    self.clear = function () {
        $(".clipboardSelected").removeClass("clipboardSelected")
        blinkVisjsNode(null);
        content = {}
    }


    blinkVisjsNode = function (selectedNodeId) {
        var hidden = true
        var setInt;


        function nodeFlash(nodeId, _stop) {

            stopInterv = _stop//!!! variable globale
            setInt = setInterval(function () {
                if (stopInterv && !hidden)
                    clearInterval(setInt)
                visjsGraph.data.nodes.update({
                    id: nodeId, hidden: hidden
                });
                hidden = !hidden

            }, 500);
        }


        var newNodes = [];
        visjsGraph.data.nodes.getIds().forEach(function (id) {
            var newNode = {id: id, hidden: false}
            if (selectedNodeId && selectedNodeId == id)
                newNode.shape = "star";
            else
                newNode.shape = "box";

            newNodes.push(newNode)

        })
        visjsGraph.data.nodes.update(newNodes)
        if (selectedNodeId)
            nodeFlash(selectedNodeId)
        else
            nodeFlash(content.id, true)

    }


    return self;
})()
