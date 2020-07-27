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

        self.nodeColors = {
            Class: "#aba",
            Property: "#bac",
            "http://www.w3.org/2002/07/owl#ObjectProperty": "#aba",
            "http://www.w3.org/2002/07/owl#DatatypeProperty": "#bac",
            Value: "#0072d5",
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
                            /*   if(domainId=="http://sws.ifi.uio.no/vocab/npd-v2#WellboreDrillStemTest")
                                   var x=3
                               if(propId=="http://sws.ifi.uio.no/vocab/npd-v2#WellboreDrillStemTest")
                                   var x=3
                               if(rangeId=="http://sws.ifi.uio.no/vocab/npd-v2#WellboreDrillStemTest")
                                   var x=3*/

                            if (rangeId.indexOf("http://www.w3.org/2001/XMLSchema") > -1) {
                                if (nodeIds.indexOf(propId) < 0) {
                                    nodeIds.push(propId);
                                    visjsData.nodes.push({id: propId, label: propLabel, shape: "box", color: self.getNodeColor(rangeLabel), data: {domain: domainId, range: rangeId, prop: propId}})
                                    jstreeData.push({
                                        id: propId,
                                        text: "<span class='tree_level_1' style='background-color: " + self.getNodeColor(rangeId) + "'>" + propLabel + "</span>",
                                        children: [],
                                        data: {domain: domainId, range: propId, propId: rangeId},
                                        parent: "#"
                                    })
                                }


                            } else if (nodeIds.indexOf(rangeId) < 0) {
                                nodeIds.push(rangeId);
                                jstreeData.push({
                                    id: rangeId,
                                    text: "<span class='tree_level_1' style='background-color: " + self.getNodeColor(rangeLabel) + "'>" + rangeLabel + "</span>",
                                    children: [],
                                    data: {domain: domainId, range: rangeId, propId: propId},
                                    parent: "#"
                                })

                                visjsData.nodes.push({id: rangeId, label: rangeLabel, shape: "box", color: self.getNodeColor(rangeLabel), data: {domain: domainId, range: rangeId, prop: propId}})
                            } else if (nodeIds.indexOf(domainId) < 0) {
                                nodeIds.push(domainId);
                                jstreeData.push({
                                    id: domainId,
                                    text: "<span class='tree_level_1' style='background-color: " + self.getNodeColor(domainLabel) + "'>" + domainLabel + "</span>",
                                    children: [],
                                    data: {domain: domainId, range: rangeId, propId: propId},
                                    parent: "#"
                                })

                                visjsData.nodes.push({id: domainId, label: domainLabel, shape: "box", color: self.getNodeColor(domainLabel), data: {domain: domainId, range: rangeId, prop: propId}})
                            }


                            if (edgeIds.indexOf(propId) < 0) {
                                edgeIds.push(propId);
                                visjsData.edges.push({id: propId, from: domainId, to: propId, label: rangeLabel})
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
            self.onJstreeCheckClassNode(event, obj);
            self.drawOwlNodePathsGraph(obj.node, {depth: 1});
        }
        self.onJstreeSelectNode = function (event, obj) {
            self.onJstreeSelectClassNode(event, obj)
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
                        visjsData.nodes.push({id: sourceDomainId, label: sourceDomainLabel, shape: "box", color: "red", data: item})
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
                        visjsData.nodes.push({id: targetDomainId, label: targetDomainLabel, shape: "box", color: targetDomainColor, data: item})
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


        self.searchData = function () {
            var word = $("#questionInput").val();
            Sparql_facade.searchData(word, function (err, result) {
                if (err)
                    return self.setMessage(err);
                var classes = []
                var jstreeData = []
                result.forEach(function (item) {
                    var classId = item.class.value;
                    var classLabel = classId.substring(classId.lastIndexOf("#") + 1);
                    var id = item.id.value;
                    var name = item.name.value;

                    if (classes.indexOf(classId) < 0) {
                        classes.push(classId)
                        jstreeData.push({
                            id: classId,
                            text: "<span class='tree_level_1' style='background-color:#e78f08'>" + classLabel + "</span>",
                            children: [],
                            parent: "#"
                        })
                        jstreeData.push({
                            id: id,
                            text: "<span class='tree_level_1' style='background-color:#e78f08'>" + name + "</span>",
                            children: [],
                            parent: classId
                        })
                    }
                })

                common.loadJsTree("jstreeClassDiv", jstreeData, {
                    withCheckboxes: true,
                    selectNodeFn: MainController.onJstreeSearchClassNode,
                    onCheckNodeFn: MainController.onJstreeCheckNode,
                })


            })

        }

        self.searchClasses = function (word) {
            if (!word)
                word = $("#questionInput").val();
            //  return  self.onJstreeSelectClassNode("null", {node:{id:word}},{resetGraph:1});


            Sparql_facade.searchClasses(word, function (err, result) {
                if (err)
                    return self.setMessage(err);
                var jstreeData = []


                result.sort(function (a, b) {
                    var ax = parseInt(a.countInstances.value)
                    var bx = parseInt(b.countInstances.value)
                    if (ax > bx)
                        return -1;
                    if (ax > bx)
                        return 1;
                    return 0;
                })
                var nodeIds = []
                result.forEach(function (item) {
                    var classPropId = item.classProp.value;
                    var classPropLabel = classPropId.substring(classPropId.lastIndexOf("#") + 1);
                    var typeId = item.type.value;
                    var propId = item.propId.value;
                    var typeLabel = typeId.substring(typeId.lastIndexOf("#") + 1)
                    var countInstances = item.countInstances.value;

                    nodeIds.push(classPropId)
                    jstreeData.push({
                        id: classPropId,
                        text: "<span class='tree_level_1' style='background-color: " + self.nodeColors[typeLabel] + "'>" + classPropLabel + "(" + countInstances + ")" + "</span>",
                        children: [],
                        data: {type: "Class", parent: item.parent.value, id: classPropId, propId: propId},
                        parent: "#"
                    })
                })

                jstreeData.forEach(function (item) {
                    if (item.id == "http://sws.ifi.uio.no/vocab/npd-v2#WellboreDrillStemTest")
                        var x = 3

                    item.parent = item.data.parent;
                    if (nodeIds.indexOf(item.data.parent) < 0) {
                        nodeIds.push(item.data.parent);
                        var parentLabel = item.data.parent.substring(item.data.parent.lastIndexOf("#") + 1)
                        jstreeData.push({
                            id: item.data.parent,
                            text: "<span class='tree_level_1' style='background-color: " + self.nodeColors["Class"] + "'>" + parentLabel + "</span>",
                            children: [],
                            data: {type: "Class", id: item.data.parent},
                            parent: "#"
                        })

                    }

                })
                common.loadJsTree("jstreeClassDiv", jstreeData, {
                    withCheckboxes: true,
                    selectNodeFn: MainController.onJstreeSelectClassNode,
                    onCheckNodeFn: MainController.onJstreeCheckClassNode,
                })
            })
        }

        self.onJstreeSearchDataNode = function (event, object) {
            $("#infosDiv").html(object.node.id)
        }


        self.onJstreeSelectClassNode = function (event, object, options) {
            if (!options)
                options = {}
            $("#infosDiv").html(object.node.id);

            if (true) {
                var data = [];
                var direction = 0;
                async.series(
                    [
                        function (callbackSeries) {
                            Sparql_facade.getLinkedClasses(object.node.id, direction, function (err, result) {
                                if (err)
                                    return callbackSeries(err);
                                data = result;
                                callbackSeries()
                            })
                        },


                        function (callbackSeries) {

                            var jstreeData = []
                            var parent = object.node.id;

                            data.forEach(function (item) {
                                var propId = item.prop.value;
                                var rangeId = null;

                                if(item.range)
                                    rangeId=  item.range.value;
                                else// cas des ObjectProperties
                                    rangeId=item.prop.value;
                                var rangeLabel = rangeId.substring(rangeId.lastIndexOf("#") + 1);
                                var propType = item.propType.value;

                                var domainId = item.domain.value;
                                var domainLabel = domainId.substring(domainId.lastIndexOf("#") + 1);


                                var litteralType = null;
                                if (rangeId.indexOf("http://www.w3.org/2001/XMLSchema#") > -1) {
                                    litteralType = rangeId
                                    rangeId = propId;
                                    var rangeLabel = rangeId.substring(rangeId.lastIndexOf("#") + 1);


                                }

                                if (domainId.indexOf("http://www.w3.org/2001/XMLSchema#") > -1) {
                                    litteralType = domainId
                                    domainId = propId;
                                    var domainLabel = domainId.substring(domainId.lastIndexOf("#") + 1);

                                }


                                if (parent == domainId) {


                                    jstreeData.push({
                                        id: rangeId,
                                        text: "<span class='tree_level_1' style='background-color: " + self.nodeColors[propType] + "'>" + rangeLabel + "</span>",
                                        children: [],
                                        data: {propType: propType, propId: propId, range: rangeId, domain: domainId, litteralType: litteralType},
                                        parent: "#"
                                    })
                                } else {
                                    // parent=rangeId;
                                    jstreeData.push({
                                        id: domainId,
                                        text: "<span class='tree_level_1' style='background-color: " + self.nodeColors[propType] + "'>" + domainLabel + "</span>",
                                        children: [],
                                        data: {propType: propType, propId: propId, range: rangeId, domain: domainId, litteralType: litteralType},
                                        parent: "#"
                                    })
                                }

                            });
                            if (options.resetGraph) {

                                common.loadJsTree("jstreeClassDiv", jstreeData, {
                                    withCheckboxes: true,
                                    selectNodeFn: MainController.onJstreeSelectClassNode,
                                    onCheckNodeFn: MainController.onJstreeCheckClassNode,
                                })

                            } else {
                                common.addNodesToJstree("jstreeClassDiv", parent, jstreeData);
                            }


                            callbackSeries()
                        }
                        ,

                        function (callbackSeries) {
                            Sparql_facade.getOwlObjInfos(object.node.id, function (err, result) {
                                if (err)
                                    return callbackSeries(err);
                                var html = "<ul>";
                                html += "<li>" + object.node.id + "</li>"
                                result.forEach(function (item) {
                                    html += "<li>" + item.prop.value + " : " + item.value.value + "</li>"
                                })
                                html += "</ul>"
                                $("#infosDiv").html(html);

                                callbackSeries()
                            })
                        }


                    ], function (err) {
                        if (err)
                            return self.setMessage(err);
                        return;

                    })
            }
            return;

        }

        self.onJstreeCheckClassNode = function (event, object) {
            $("#infosDiv").html(object.node.id);
            self.showPropertyValueDialog(object.node)

        }
        self.setMessage = function (message) {
            $("#messageDiv").html(message)

        }


        self.showPropertyValueDialog = function (node) {

            if (node.data) {
                var propId = node.data.propId;
                var nodeId = propId.substring(propId.lastIndexOf("#") + 1)
                var sourceDomain = node.data.domain;
                var targetDomain = node.data.range;
                var html = ""
                if (node.data.litteralType && node.data.litteralType.indexOf("http://www.w3.org/2001/XMLSchema#") > -1) {
                    html += "<div>" +
                        "<span class='propertyValue' id='_Node_prop_" + nodeId + "'>" + nodeId + "</span>"
                    html += "<input class='propertyValue' id='_Node_operator_" + nodeId + "'>"
                    html += "<input class='propertyValue' id='_Node_value_" + nodeId + "'>"
                } else {
                    html += "<div><span class='propertyValue'  id='_Node_prop_" + nodeId + "'>" + targetDomain + "</span>"
                    html += "<input class='propertyValue' id='_Node_value_" + nodeId + "'>"
                    html += "<button class='propertyValue' onclick=MainController.listDomainValues('" + nodeId + "','" + sourceDomain + "','" + targetDomain + "')>List</button>"
                    html += "<select  class='propertyValue' id='_Node_possible_values_" + nodeId + "'></select>"
                }

                html += "<button onclick=MainController.addPropertyValue('" + propId + "')>AddPropertyValue</button>"
                html += "</div>"

                $("#dialogDiv").html(html)
                $("#dialogDiv").dialog("open");
            }
        }

        self.addPropertyValue = function (propId) {
            var nodeId = propId.substring(propId.lastIndexOf("#") + 1)
            var id = $("#_Node_prop_" + nodeId).html();
            var operator = $("#_Node_operator_" + nodeId).val();
            var value = $("#_Node_value_" + nodeId).val();
            var text = id;
            var domain = $("#jstreeClassDiv").jstree(true).get_node(propId);
            domain = domain.data.domain;
            var data = {propId: propId, domain: domain, selected: true}
            if (value != "") {
                data.filter = {operator: operator, value: value}
                text += " " + operator + " " + value;
            }
            var jstreeData = []
            jstreeData.push({
                id: text,
                text: "<span class='tree_level_1' style='background-color: " + self.nodeColors["Value"] + "'>" + text + "</span>",
                children: [],
                data: data,
                //  parent: parent
            })
            common.addNodesToJstree("jstreeClassDiv", propId, jstreeData, {checkNodes: 1});
            $("#dialogDiv").dialog("close");
        }


        self.listDomainValues = function (nodeId, sourceDomain, targetDomain) {
            var value = $("#_Node_value_" + nodeId).val()
            Sparql_facade.listDataValues(sourceDomain, targetDomain, value, function (err, result) {
                result.forEach(function (item) {
                    item.name = item.y.value;
                    item.id = item.x.value;

                })
                common.fillSelectOptions("_Node_possible_values_" + nodeId, result, true, "name", "id")
            })


        }

        self.execDataQuery = function () {

            var valueNodes = $("#jstreeClassDiv").jstree(true).get_checked(true);

            var querySelection = ""
            var queryProjection = "";
            var propIds = []
            var nodesMap = {}
            valueNodes.forEach(function (node, index) {
                if (!node.data.selected && node.data.propType!= "http://www.w3.org/2002/07/owl#ObjectProperty")
                    return;
                var subjectLabel = node.data.domain.substring(node.data.domain.lastIndexOf("#") + 1)
                var predicateLabel = node.data.propId;
                var valueLabel = predicateLabel.substring(predicateLabel.lastIndexOf("#") + 1)

                if (!nodesMap[node.id])
                    nodesMap[node.id] = subjectLabel

                if (node.data.filter) {
                querySelection += " ?" + subjectLabel + " <" + predicateLabel + ">  ?" + valueLabel + "_value. "
                querySelection += "optional  {?" + subjectLabel + "<http://sws.ifi.uio.no/vocab/npd-v2#name>  ?" + subjectLabel + "_name.} "

                    querySelection += " filter(?" + valueLabel + "_value" + node.data.filter.operator + node.data.filter.value + ") ";

                }else{
                    querySelection += "optional{ ?" + subjectLabel + " <" + predicateLabel + ">  ?" + valueLabel + "_value. "
                    if(node.data.propType!= "http://www.w3.org/2002/07/owl#ObjectProperty")
                    querySelection += "optional  {?" + subjectLabel + "<http://sws.ifi.uio.no/vocab/npd-v2#name>  ?" + subjectLabel + "_name.}} "
                    else
                        querySelection += "optional  {?" + valueLabel+ "_value " + "<http://sws.ifi.uio.no/vocab/npd-v2#name>  ?" + subjectLabel + "_name.}} "
                }

                node.parents.forEach(function (parent, parentIndex) {
                    if (parent == "#" || parentIndex == 0)
                        return;
                    var parentNode = $("#jstreeClassDiv").jstree(true).get_node(parent);

                    if (parentNode.parent == "#")
                        return;
                    if (!nodesMap[parentNode.id]) {
                        var parentSubjectLabel = parentNode.parent.substring(parentNode.parent.lastIndexOf("#") + 1)
                        var parentPredicateLabel = parentNode.data.propId;

                        if (nodesMap[parentNode.id])
                            return;
                        nodesMap[parentNode.id] = parentSubjectLabel

                        querySelection += " ?" + subjectLabel + "<" + parentPredicateLabel + "> ?" + parentSubjectLabel + ". "
                        querySelection += "optional { ?" + parentSubjectLabel + "<http://sws.ifi.uio.no/vocab/npd-v2#name>  ?" + parentSubjectLabel + "_name.} "


                    }
                })


            })

            /*     for( var key in nodesMap){
                     queryProjection+= " <"+nodesMap[key]+"> ?property ?value.  ?property rdfs:label ?label. "
                 }*/

            var query = "SELECT * from <http://sws.ifi.uio.no/data/npd-v2/>   WHERE {";
            query += querySelection + queryProjection +
                "} limit 10000"


            console.log(query)


        }

        return self;


    }
)
()
