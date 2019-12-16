var visjsGraph = (function () {


    var self = {};
    self.network = null;
    self.simulationTimeOut = 1000;
    self.data;
    self.legendLabels=[];
    self.context={};
    self.currentScale;


    var simulationOn = false;

    self.draw = function (divId, visjsData, _options, callback) {
        self.legendLabels=self.legendLabels.concat(visjsData.labels)
        var container = document.getElementById(divId);
        self.data = {
            nodes: new vis.DataSet(visjsData.nodes),
            edges: new vis.DataSet(visjsData.edges)
        };
        var options = {
            width: "" + $("#graphDiv").width() + "px",
            height: "" + $("#graphDiv").height() + "px",
            nodes: {
                shape: 'dot',
                size: 12
            }
        };


        self.network = new vis.Network(container, self.data, options);
        simulationOn = true;
        window.setTimeout(function () {
            self.network.stopSimulation();
            simulationOn = false;
        }, self.simulationTimeOut)


        self.network.on("click", function (params) {
            if (params.edges.length == 0 && params.nodes.length == 0) {//simple click stop animation
                if (simulationOn)
                    self.network.stopSimulation();
                else
                    self.network.startSimulation();
                simulationOn = !simulationOn;
              GraphController.hideNodePopover();
            }

            // select node
            else if (params.nodes.length == 1) {

                var nodeId = params.nodes[0];
                var node = self.data.nodes.get(nodeId);
                node._graphPosition = params.pointer.DOM;
                var point = params.pointer.DOM;
                self.context.currentNode = node;
                var options={
                    ctrlKey:(params.event.srcEvent.ctrlKey?1:0)
                }

                GraphController.onNodeClicked(node, point,options)


            }

            //select edge{
            else if (params.edges.length == 1) {
                var edgeId = params.edges[0];
                var edge = self.data.edges.get(edgeId);
                edge.fromNode = self.data.nodes.get(edge.from);
                edge.toNode = self.data.nodes.get(edge.to);
                var point = params.pointer.DOM;
                GraphController.onEdgeClicked(edge, point)
            }

            }).on("zoom", function (params) {
            self.onScaleChange()

        });


        /*   window.setTimeout(function () {
              var ids=  self.data.nodes.getIds();
              var newNodes=[]
              ids.forEach(function(id) {
                  newNodes.push({id:id, "label":""})
              })
                  self.data.nodes.update(newNodes);

              }, 3000)*/

        if (callback)
            return callback()

    }


    self.exportGraph = function () {

    }
    self.clearGraph = function () {// comment ca marche  bad doc???
        if (self.network)
            self.network.destroy();
        $("#graph_legendDiv").html("");

    }


    self.drawLegend = function () {

    }


    self.removeNodes = function (key, value, removeEdges) {
        var nodeIds = [];
        var nodes = visjsGraph.data.nodes.get();
        nodes.forEach(function (node) {
            if (node[key] == value)
                nodeIds.push(node.id)
        })
        visjsGraph.data.nodes.remove(nodeIds);

        if (removeEdges) {
            var edgeIds = [];
            var edges = visjsGraph.data.edges.get();
            edges.forEach(function (edge) {
                if (edge[key] == value)
                    edgeIds.push(edge.id)
            })
            visjsGraph.data.edges.remove(edgeIds);
        }
    }


    self.onScaleChange = function () {
        var scale = self.network.getScale();
        if (!self.currentScale || Math.abs(scale - self.currentScale) > .01) {

            var scaleCoef = scale >= 1 ? (scale * .9) : (scale * 2)
            var size = Config.visjs.defaultNodeSize / scaleCoef;
            var fontSize = (Config.visjs.defaultTextSize / (scaleCoef));
            if (scale < 1)
                fontSize = (Config.visjs.defaultTextSize / (scaleCoef * 0.8));
            else
                fontSize = (Config.visjs.defaultTextSize / (scaleCoef * 1.3));

            var nodes = self.data.nodes.get();
            nodes.forEach(function (node) {

                var shape = node.shape;
                if (!shape)
                    shape = Config.visjs.defaultNodeShape;
                if (shape != "box") {

                    if (scale > Config.visjs.showNodesLabelMinScale) {
                        node.label=node.ishidden ? null : node.hiddenLabel;
                        node.size= size;
                        node.font={size: fontSize}
                        self.labelsVisible = true;


                    } else {
                        self.labelsVisible = false;
                        node.label=null;
                        node.size= size;
                        node.font={size: fontSize}

                    }

                    //nodes.push(node);
                }
            })
         self.data.nodes.update(nodes)

        }
        self.currentScale = scale;
    }


    return self;


})()
