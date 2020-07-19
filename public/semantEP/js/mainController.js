var MainController = (function () {

        var self = {};


        self.colorPalette = [
            "#0072d5",
            '#FF7D07',
            "#c00000",
            '#FFD900',
            '#B354B3',
            "#a6f1ff",
            "#007aa4",
            "#584f99",
            "#cd4850",
            "#005d96",
            "#ffc6ff",
            '#007DFF',
            "#ffc36f",
            "#ff6983",
            "#7fef11",
            '#B3B005',
        ]

        self.mainObjsColorsMap = {
            Well: "#0072d5",
            Company: '#FF7D07',
            Field: '#FFD900',
            Litteral: "#a6f1ff"


        }

        self.initClasses = function () {


            Sparql_facade.getClasses(false, function (err, result) {
                if (err)
                    return self.setMessage(err)
                var color = "#ddd";
                var nodes = [];
                result.forEach(function (item) {

                    nodes.push({id: item.class.value, text: "<span class='tree_level_1' style='background-color: " + color + "'>" + item.classLabel.value + "</span>", children: [], parent: "#"})
                })


                common.loadJsTree("jstreeClassDiv", nodes, {
                    withCheckboxes: true,
                    selectNodeFn: MainController.onJstreeSelectNode,
                    onCheckNodeFn: MainController.onJstreeCheckNode,
                })

            })


        }

        self.getNodeColor = function (nodeLabel) {
            var nodeColor = "#dde"
            for (var key in self.mainObjsColorsMap) {
                if (nodeLabel.indexOf(key) == 0)
                    nodeColor = self.mainObjsColorsMap[key]
            }
            return nodeColor;
        }


        self.drawPropAndClassesGraph = function () {

            // Sparql_facade.getOwlClassesAndObjectProperties(null, function (err, result) {
            Sparql_facade.getOwlDataTypeProperties(function (err, result) {


                    if (err)
                        return self.setMessage(err);

                    Sparql_facade.getOwlClassesAndObjectProperties(null, function (err, result2) {
                        if (err)
                            return self.setMessage(err);
                        result = result.concat(result2)


                        var visjsData = {nodes: [], edges: []};
                        var jstreeData = []
                        var nodeIds = [];
                        var edgeIds = [];

                        result.forEach(function (item) {
                            var rangeId = item.range.value;
                            var rangeLabel = rangeId.substring(rangeId.lastIndexOf("#") + 1);
                            var domainId = item.domain.value;
                            var domainLabel = domainId.substring(domainId.lastIndexOf("#") + 1)
                            var propId = item.prop.value;
                            var propLabel = propId.substring(propId.lastIndexOf("#") + 1);

                            if (nodeIds.indexOf(domainId) < 0) {
                                nodeIds.push(domainId);
                                jstreeData.push({
                                    id: domainId,
                                    text: "<span class='tree_level_1' style='background-color: " + self.getNodeColor(domainLabel) + "'>" + domainLabel + "</span>",
                                    children: [],
                                    parent: "#"
                                })

                                visjsData.nodes.push({id: domainId, label: domainLabel, shape: "box", color: self.getNodeColor(domainLabel)})
                            }

                            if (rangeId.indexOf("http://www.w3.org/2001/XMLSchema") > -1) {
                                if (nodeIds.indexOf(propId) < 0) {
                                    nodeIds.push(propId);
                                    visjsData.nodes.push({id: propId, label: propLabel, shape: "box", color: self.getNodeColor(rangeLabel)})
                                }
                                if (edgeIds.indexOf(propId) < 0) {
                                    edgeIds.push(propId);
                                    visjsData.edges.push({id: propId, from: domainId, to: propId, label: rangeLabel})
                                }

                            } else {
                                if (nodeIds.indexOf(rangeId) < 0) {
                                    nodeIds.push(rangeId);
                                    jstreeData.push({
                                        id: rangeId,
                                        text: "<span class='tree_level_1' style='background-color: " + self.getNodeColor(rangeLabel) + "'>" + rangeLabel + "</span>",
                                        children: [],
                                        parent: "#"
                                    })

                                    visjsData.nodes.push({id: rangeId, label: rangeLabel, shape: "box", color: self.getNodeColor(rangeLabel)})
                                }
                                if (edgeIds.indexOf(propId) < 0) {
                                    edgeIds.push(propId);
                                    visjsData.edges.push({id: propId, from: domainId, to: rangeId, label: propLabel})
                                }
                            }


                        })

                        visjsGraph.draw("graphDiv", visjsData, {onclickFn: MainController.onGraphNodeClick})

                        jstreeData.sort(function (a, b) {
                            if (a.text > b.text)
                                return 1;
                            if (b.text > a.text)
                                return -1;
                            return 0;
                        })
                        common.loadJsTree("jstreeClassDiv", jstreeData, {
                            withCheckboxes: true,
                            selectNodeFn: MainController.onJstreeSelectNode,
                            onCheckNodeFn: MainController.onJstreeCheckNode,
                        })


                    })


                }
            )

        }


        self.onJstreeCheckNode = function (event, obj) {
            self.drawOwlNodePathsGraph(obj.node, {depth: 1});
        }
        self.onJstreeSelectNode = function (event, obj) {
            visjsGraph.network.focus(obj.node.id, {
                scale: 1,
            })

        }


        self.onGraphNodeClick = function (node, point, options) {

            self.setGraphNodeInfos(node)

        }
        self.onOwlPathGraphNodeClick = function (node, point, options) {
            if (options.ctrlKey) {
                return self.addNodeToQuery(node)
            }
            self.expandOwlPathNode(node.id)
        }


        self.setGraphNodeInfos = function (node) {
            if (!node || !node.id)
                return;
            Sparql_facade.getOwlSubClasses(node.id, function (err, result) {
                if (err)
                    return self.setMessage(err);
                var html = "<b>" + node.id + "</b>"
                html += "<ul>"
                result.forEach(function (item) {
                    var subClassId = item.subClassId.value;
                    var subClassLabel = subClassId.substring(subClassId.lastIndexOf("#") + 1);
                    html += "<li onclick=MainController.onSubClassClick('" + subClassId + "')>" + subClassLabel + "</li>"
                })

                html += "<ul>"
                $("#infosDiv").html(html);


            })
        }


        self.processQuestion = function () {
            var question = $("questionInput").val();


        }

        self.drawOwlNodePathsGraph = function (node, options) {
            if (!options)
                options = {}
            Sparql_facade.getOwlPropertiesPath(node.id, null, options, function (err, result) {
                if (err)
                    return self.setMessage(err);
                var visjsData = {nodes: [], edges: []};
                var jstreeData = []
                var nodeIds = [];
                var edgeIds = [];


                if (options.addToGraph) {

                    nodeIds = visjsGraph.data.nodes.getIds()
                    edgeIds = visjsGraph.data.edges.getIds()
                }


                result.forEach(function (item) {
                    var range1Id = item.range1.value;

                    var range1Label = range1Id.substring(range1Id.lastIndexOf("#") + 1);
                    var range1Color = self.getNodeColor(range1Label);

                    if (options.addToGraph)
                        range1Color = "red"

                    var sourceDomainId = item.sourceDomain.value;
                    var sourceDomainLabel = sourceDomainId.substring(sourceDomainId.lastIndexOf("#") + 1);
                    var sourceDomainColor = self.getNodeColor(sourceDomainLabel);
                    if (options.addToGraph)
                        sourceDomainColor = "red"

                    var prop1Id = item.prop1.value;
                    var prop1Label = prop1Id.substring(prop1Id.lastIndexOf("#") + 1);


                    var targetDomainId = item.targetDomain.value;

                    var targetDomainLabel = targetDomainId.substring(targetDomainId.lastIndexOf("#") + 1)
                    var targetDomainColor = self.getNodeColor(targetDomainLabel);

                    var prop2Id = null;
                    var prop2Label = null;
                    if (item.prop2) {
                        prop2Id = item.prop2.value;
                        prop2Label = prop2Id.substring(prop2Id.lastIndexOf("#") + 1);
                    }

                    if (nodeIds.indexOf(sourceDomainId) < 0) {
                        nodeIds.push(sourceDomainId);
                        visjsData.nodes.push({id: sourceDomainId, label: sourceDomainLabel, shape: "box", color: "red"})
                    } else {
                        if (visjsData.data)
                            visjsData.data.nodes.update({id: sourceDomainId, color: sourceDomainColor})
                    }

                    /*     if (targetDomainId.indexOf("http://www.w3.org/2001/XMLSchema") > -1) {
                             if (nodeIds.indexOf(prop1Id) < 0) {
                                 nodeIds.push(prop1Id);
                                 visjsData.nodes.push({id: prop1Id, label: prop1Label, shape: "box", color: self.getNodeColor("Litteral")})
                             }
                             if (edgeIds.indexOf(targetDomainId) < 0) {
                                 edgeIds.push(targetDomainId);
                                 visjsData.edges.push({id: prop1Id, from: sourceDomainId, to: targetDomainId, label: targetDomainId})
                             }

                         } else {*/
                    if (nodeIds.indexOf(targetDomainId) < 0) {
                        nodeIds.push(targetDomainId);
                        visjsData.nodes.push({id: targetDomainId, label: targetDomainLabel, shape: "box", color: targetDomainColor})
                    } else {
                        if (visjsData.data)
                            visjsData.data.nodes.update({id: targetDomainId, color: targetDomainColor})
                    }
                    if (prop2Id) {
                        if (edgeIds.indexOf(prop2Id) < 0) {
                            edgeIds.push(prop2Id);
                            visjsData.edges.push({id: prop2Id, from: range1Id, to: targetDomainId, label: prop2Label})
                        }
                    }
                    //}


                    if (nodeIds.indexOf(range1Id) < 0) {
                        nodeIds.push(range1Id);
                        visjsData.nodes.push({id: range1Id, label: range1Label, shape: "box", color: range1Color})
                    }


                    /*   if (edgeIds.indexOf(prop1Id) < 0) {
                           edgeIds.push(prop1Id);
                           visjsData.edges.push({id: prop1Id, from: sourceDomainId, to: range1Id, label: prop1Label})
                       }*/


                })
                if (options.addToGraph) {
                    visjsGraph.data.nodes.add(visjsData.nodes);
                    visjsGraph.data.edges.add(visjsData.edges);
                } else
                    visjsGraph.draw("graphDiv", visjsData, {onclickFn: MainController.onOwlPathGraphNodeClick})


            })


        }
        self.expandOwlPathNode = function (nodeId) {
            Sparql_facade.getOwlPropertiesPath(nodeId, null, {depth: 0, withLitterals: true}, function (err, result) {
                if (err)
                    return self.setMessage(err);

                Sparql_facade.getOwlRestrictionsOnProperties(nodeId, function (err, result2) {
                    if (err)
                        return self.setMessage(err);

                    result = result.concat(result2)
                    var visjsData = {nodes: [], edges: []};
                    var jstreeData = []
                    var nodeIds = [];
                    var edgeIds = [];


                    nodeIds = visjsGraph.data.nodes.getIds()
                    edgeIds = visjsGraph.data.edges.getIds()


                    result.forEach(function (item) {
                        /*    var range1Id = item.range1.value;

                            var range1Label = range1Id.substring(range1Id.lastIndexOf("#") + 1);
                            var range1Color=self.getNodeColor(range1Label);*/


                        var sourceDomainId = item.sourceDomain.value;
                        var sourceDomainLabel = sourceDomainId.substring(sourceDomainId.lastIndexOf("#") + 1);
                        var sourceDomainColor = self.getNodeColor(sourceDomainLabel);

                        var prop1Id = item.prop1.value;
                        var prop1Label = prop1Id.substring(prop1Id.lastIndexOf("#") + 1);

                        if (!item.targetDomain)
                            return;
                        var targetDomainId = item.targetDomain.value;
                        var targetDomainLabel = targetDomainId.substring(targetDomainId.lastIndexOf("#") + 1)
                        var targetDomainColor = self.getNodeColor(targetDomainLabel);


                        if (targetDomainId.indexOf("http://www.w3.org/2001/XMLSchema") > -1) {
                            if (nodeIds.indexOf(prop1Id) < 0) {
                                nodeIds.push(prop1Id);
                                visjsData.nodes.push({id: prop1Id, label: prop1Label, shape: "box", color: self.getNodeColor("Litteral"), data: item})
                            }
                            if (edgeIds.indexOf(prop1Id) < 0) {
                                edgeIds.push(prop1Id);
                                visjsData.edges.push({id: prop1Id, from: sourceDomainId, to: prop1Id, label: targetDomainLabel})
                            }

                        } else {
                            if (nodeIds.indexOf(targetDomainId) < 0) {
                                nodeIds.push(targetDomainId);
                                visjsData.nodes.push({id: targetDomainId, label: targetDomainLabel, shape: "box", color: targetDomainColor, data: item})
                            } else {
                                if (visjsData.data)
                                    visjsData.data.nodes.update({id: targetDomainId, color: targetDomainColor})
                            }
                            if (edgeIds.indexOf(prop1Id) < 0) {
                                edgeIds.push(prop1Id);
                                visjsData.edges.push({id: prop1Id, from: sourceDomainId, to: targetDomainId, label: "on"})
                            }

                        }


                    })

                    visjsGraph.data.nodes.add(visjsData.nodes);
                    visjsGraph.data.edges.add(visjsData.edges);
                })
            })
        }

        self.addNodeToQuery = function (node) {

            if (node.data) {
                var name = node.data.prop1.value
                var type = node.data.targetDomain.value
                var html = "<div><span id='fieldName'>" + name + "</sspan></div>"
                $("#queryDiv").html(html)
            }
        }

        self.setMessage = function (message) {
            $("#messageDiv").html(message)

        }

        return self;


    }
)
()
