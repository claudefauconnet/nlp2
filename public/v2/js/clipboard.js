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
                self.SetVisjNodeClipoardSelected(content.id);
            }
            else {
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

    self.SetVisjNodeClipoardSelected=function(nodeId){
        var newNodes=[];
        visjsGraph.data.nodes.getIds().forEach(function(id){
            var newNode={id:id}
            if(nodeId==id)
                newNode.shape="star";
            else
                newNode.shape="box";
            newNodes.push(newNode)

        })
        visjsGraph.data.nodes.update(newNodes)
    }


    self.visjsGroups={
        selected:{color:{border:'blue'}, borderWidth:3},
        unselected:{color:{border:'black'}, borderWidth:1}
    }


    return self;
})()
