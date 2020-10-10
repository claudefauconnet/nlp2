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
                var childNodeLabel = item[childNodeVar + "Label"].value;

                if (!existingNodes[childNodeId]) {
                    existingNodes[childNodeId] = 1;

                    var child = {
                        parent: parentNodeId,
                        id: childNodeId,
                        text: childNodeLabel,

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
