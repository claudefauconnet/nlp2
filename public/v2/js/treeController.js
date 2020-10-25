var TreeController = (function () {

    var self = {};


    self.drawOrUpdateTree = function (treeDivId, data, parentNodeId, childNodeVar, jsTreeOptions, callback) {
        if (!jsTreeOptions)
            jsTreeOptions = {}

        var jstreeData = [];
        var existingNodes = {}
        data.forEach(function (item) {

            if (childNodeVar && item[childNodeVar]) {
                var childNodeId = item[childNodeVar].value;
                var childNodeLabel = common.getItemLabel(item,childNodeVar)
                var type = item.type.value

                if (!existingNodes[childNodeId]) {
                    existingNodes[childNodeId] = 1;

                    var child = {
                        parent: parentNodeId,
                        id: childNodeId,
                        text: childNodeLabel,
                        data: {type: type}

                    }
                    jstreeData.push(child);
                }

            }


        })


        if (parentNodeId == "#") {
            common.loadJsTree(treeDivId, jstreeData, jsTreeOptions, callback)

        } else {
            common.addNodesToJstree(treeDivId, parentNodeId, jstreeData, jsTreeOptions)
        }


    }


    return self;

})();
