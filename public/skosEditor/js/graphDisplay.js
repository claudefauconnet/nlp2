var graphDisplay = (function () {
    var self = {};
    self.drawTreeGraph = function (options) {

        var maxLevels = parseInt($("#maxGraphLevels").val());
        var graphDisplay_type = $("#graphDisplay_type").val();
        var layout = $("#graphDisplay_layout").val();

        var visjsDataV = self.getTreeVisjsData(comparator.treeV, maxLevels, {shape: "dot", color: "green"});
        var visjsDataH = self.getTreeVisjsData(comparator.treeH, maxLevels, {shape: "dot", color: "orange"});
        var visJSDataCommonEdges = self.getCommonEdges(visjsDataV.nodes, visjsDataH.nodes);


        if (graphDisplay_type == "all") {
            visjsDataV.nodes = visjsDataV.nodes.concat(visjsDataH.nodes);
            visjsDataV.edges = visjsDataV.edges.concat(visjsDataH.edges);

            visjsDataV.edges = visjsDataV.edges.concat(visJSDataCommonEdges);

        } else if (graphDisplay_type == "commonEdgesAndParentsOnly") {
            visjsDataV = self.getCommonNodesVisjData(visJSDataCommonEdges);
        }

        $("#graphDiv").width($(window).width())
        $("#graphDiv").height($(window).height() - 200)

        var options = {};
        if (layout == "hierarchical")
            options.layoutHierarchical = true;
        options.notSmoothEdges = true;

        options.fixedLayout = true;
        options.onclickFn = function (node, point) {


        }
        visjsGraph.draw("graphDiv", visjsDataV, options)
    }

    self.getTreeVisjsData = function (tree, maxLevels, options) {
        //    var interpolateColorFn = d3.scaleSequential(d3.interpolateYlOrRd).domain([1, Math.log(self.commonConcepts.length / 2)]);
        var allnodeIds = [];
        var nodes = [];
        var edges = [];


        function recurse(node, level) {
            if (level > maxLevels)
                return

            if (node.id && allnodeIds.indexOf(node.id) < 0) {
                allnodeIds.push(node.id);
                //
                var data = node.data;
                if (!data)
                    data = {};
                data.commonConcepts = node.commonConcepts;
                var visNode = {
                    label: node.data.prefLabels[0].value,
                    id: node.id,
                    color: options.color,
                    data: node.data,
                    shape: options.shape,
                    size: 10
                }
                nodes.push(visNode)
            }
            if (node.children)
                node.children.forEach(function (child) {
                    if (node.id && child.id) {
                        edges.push({
                            from: node.id,
                            to: child.id,
                            type: "parent"
                        })
                    }
                    recurse(child, level + 1)

                })
        }


        recurse(tree, 0)

        var visjsData = {nodes: nodes, edges: edges};
        return visjsData
    }

    self.getCommonEdges = function (nodesV, nodesH) {
        var edges = [];
        var uniqueEdges = [];
        nodesV.forEach(function (nodeV) {
            nodeV.data.commonConcepts.forEach(function (commmonConcept) {
                if (uniqueEdges.indexOf(commmonConcept) < 0) {
                    uniqueEdges.push(commmonConcept)
                    var array = commmonConcept.split(" | ")

                    edges.push({
                        from: array[0],
                        to: array[1],
                        type: "common",
                        color: "blue",
                        width: 1


                    })
                }
            })
        })

        return edges;


    }

    self.getCommonNodesVisjData = function (commonEdges) {
        var uniqueNodes = [];
        var uniqueEdges = [];
        var topNodes = [];
        var nodes = [];
        var edges = [];

        var yOffset = 30;
        var xOffset = 200;

        var maxX = 0

        function recurseAncestors(node, options, level) {

            if (!node)
                return;
            if (uniqueNodes.indexOf(node.id) < 0) {
                uniqueNodes.push(node.id)
                var color = "#ddd";
                var shape = "box";
                if (level > 1) {
                    color = options.color;
                    shape = options.shape
                }
                var visNode = {
                    label: node.data.prefLabels[0].value,
                    id: node.id,
                    color: color,
                    data: node.data,
                    shape: shape,
                    size: 10 + (5 * level)
                }
                if (level == 1) {//common node
                    visNode.fixed = {x: true, y: true}
                    visNode.x = options.fixedX
                    visNode.y = options.commonY

                } else {//parentNode
                    visNode.fixed = {x: true, y: false}
                    if (options.side == "left") {
                        visNode.x = options.fixedX - (level * xOffset)
                    } else {
                        visNode.x = options.fixedX + (level * xOffset)
                    }
                    maxX = visNode.x;

                }
                nodes.push(visNode)

            }

            var parent = node.data.broaders[0];
            if (parent) {
                var edgeKey = parent + "|" + node.id;
                if (uniqueEdges.indexOf(edgeKey) < 0) {
                    uniqueEdges.push(edgeKey)
                    edges.push({
                        from: parent,
                        to: node.id,
                        type: "parent"
                    })
                }

                recurseAncestors(comparator.conceptsMap[parent], options, level + 1)

            } else {
                if (visNode)
                    topNodes.push(visNode)
            }

        }

        function setTopNodesRootNode(topNodes, rootNodeName, color, x) {
            var color = topNodes[0].color
            var x = topNodes[0].x
            if (x > 0)
                x += xOffset;
            else
                x -= xOffset

            nodes.push({
                id: rootNodeName,
                label: rootNodeName,
                color: color,
                shape: "box",
                fixed: {x: true},
                x: x
            })
            topNodes.forEach(function (node) {
                edges.push({
                    from: node.id,
                    to: rootNodeName,
                    type: "parent"

                })
            })


        }

        var commonY = 5;
        topNodes = [];

        var color = $("#thesaurusSelectH").css("background-color")
        commonEdges.forEach(function (commonEdge) {
            edges.push(commonEdge);
            var conceptV = comparator.conceptsMap[commonEdge.from];


            recurseAncestors(conceptV, {shape: "box", color: color, fixedX: 150, side: "left", commonY: commonY}, 1);
            commonY += yOffset
        })
        setTopNodesRootNode(topNodes, $("#thesaurusSelectH").val())

        var commonY = 5;
        topNodes = [];
        var color = $("#thesaurusSelectV").css("background-color")
        commonEdges.forEach(function (commonEdge) {
            var conceptH = comparator.conceptsMap[commonEdge.to];
            recurseAncestors(conceptH, {shape: "box", color: color, fixedX: 350, side: "right", commonY: commonY}, 1)
            commonY += yOffset

        })

        setTopNodesRootNode(topNodes, $("#thesaurusSelectV").val())

        nodes.sort(function (a, b) {
            if (a.label > b.label)
                return 1;
            if (a.label < b.label)
                return -1;
            return 0;

        })


        return {nodes: nodes, edges: edges};


    }
    return self;


})()