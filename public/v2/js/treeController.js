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

    self.getFilteredNodesJstreeData = function (sourceLabel, options, callback) {
        if (!options.term)
            options.term = $("#GenericTools_searchTermInput").val()


        if (!options.rootId)
            options.rootId = "#"
        if (!sourceLabel)
            sourceLabel = MainController.currentSource
        var depth = 5
        Sparql_generic.getNodeParents(sourceLabel, options.term, options.ids, depth, options, function (err, result) {
            if (err)
                return MainController.UI.message(err)

            var existingNodes = {};
            var jstreeData = []

            result.forEach(function (item) {
                for (var i = depth; i > 0; i--) {
                    if (item["broader" + i]) {
                        var id = item["broader" + i].value
                        if (!existingNodes[id]) {
                            existingNodes[id] = 1
                            var label = item["broader" + i + "Label"].value
                            var parentId = options.rootId
                            if (item["broader" + (i + 1)])
                                parentId = item["broader" + (i + 1)].value
                            jstreeData.push({id: id, text: label, parent: parentId, data: {sourceLabel: sourceLabel}})
                        }
                    }
                }
                jstreeData.push({id: item.concept.value, text: item.conceptLabel.value, parent: item["broader1"].value, data: {sourceLabel: sourceLabel}})

            })

            return callback(null, jstreeData)


        })


    }


    return self;

})();
