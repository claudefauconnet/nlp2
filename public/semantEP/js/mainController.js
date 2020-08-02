var MainController = (function () {

        var self = {};
        self.queryNodes = {};

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


        self.nodeColors = {
            Class: "#aba",
            Property: "#bac",
            "ObjectProperty": "#584f99",
            "http://www.w3.org/2002/07/owl#DatatypeProperty": "#bac",
            Value: "#0072d5",
            Litteral: "#a6f1ff",
            Subclass: '#FFD900',
        }


        self.searchObjects = function () {

            var query = "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>" +
                "prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>" +
                "prefix npd: <http://sws.ifi.uio.no/data/npd-v2#>" +
                "SELECT * from <http://sws.ifi.uio.no/vocab/npd-v2/>   WHERE {" +
                "  {" +
                "    ?prop rdf:type  <http://www.w3.org/2002/07/owl#ObjectProperty>.   ?prop rdfs:domain  ?object. ?prop rdfs:range  ?parentObject " +
                "  }" +

                "}order by ?object limit 10000"
            Sparql_facade.querySPARQL_proxy(query, null, null, null, function (err, result) {
                if (err) {
                    return self.setMessage(err);
                }
                var objectIds = [];
                var objectPropertiesIds = [];
                var jstreeData = [];
                var visjsData = {nodes: [], edges: []};
                result.results.bindings.forEach(function (item) {
                    var objectId = item.object.value;
                    var objectLabel = objectId.substring(objectId.lastIndexOf("#") + 1);
                    var propId = item.prop.value;
                    var parentObjectId = item.parentObject.value;
                    var parentObjectLabel = parentObjectId.substring(parentObjectId.lastIndexOf("#") + 1);

                    //  var countInstances = item.countInstances.value;
                    var data = {type: "Class", objectId: objectId, propId: propId, objectLabel: objectLabel, parentObjectId: parentObjectId, parentObjectLabel: parentObjectLabel}
                    if (objectIds.indexOf(objectId) < 0) {
                        objectIds.push(objectId)
                        jstreeData.push({
                            id: objectId,
                            text: "<span class='tree_level_1' style='background-color: " + self.nodeColors["Class"] + "'>" + objectLabel + "</span>",
                            data: data,
                            parent: "#"
                        })
                        visjsData.nodes.push({id: data.objectId, label: data.objectLabel, data: data, shape: "box", color: self.nodeColors["Class"]})
                    }
                    if (objectIds.indexOf(parentObjectId) < 0) {
                        objectIds.push(parentObjectId)
                        jstreeData.push({
                            id: parentObjectId,
                            text: "<span class='tree_level_1' style='background-color: " + self.nodeColors["Class"] + "'>" + parentObjectLabel + "</span>",
                            data: {type: "Class", objectId: objectId, propId: propId, objectLabel: objectLabel, parentObjectId: parentObjectId, parentObjectLabel: parentObjectLabel},
                            parent: "#"
                        })
                        visjsData.nodes.push({id: data.parentObjectId, label: data.parentObjectLabel, data: data, shape: "box", color: self.nodeColors["Class"]})
                    }
                    if (objectPropertiesIds.indexOf(propId) < 0) {

                        visjsData.edges.push({id: data.propId, from: data.objectId, to: data.parentObjectId, arrows: "to"})
                    }

                })


                /*    visjsData.nodes.forEach(function (node) {
                        if(visjsGraph.network.getConnectedEdges().length<2)
                            node.hidden=true;

                })*/


                if (false && options.addToGraph) {
                    visjsGraph.data.nodes.add(visjsData.nodes);
                    visjsGraph.data.edges.add(visjsData.edges);
                } else
                    visjsGraph.draw("graphDiv", visjsData, {onclickFn: MainController.visjsNodeOnclick})
            })
        }


        self.searchDatatypeProperties = function (object, callback) {

            var query = "  PREFIX owl: <http://www.w3.org/2002/07/owl#>PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\n" +
                "SELECT distinct * from <http://sws.ifi.uio.no/vocab/npd-v2/>   WHERE {{?object rdfs:subClassOf ?bNode." +
                "   filter (?object=<" + object.id + ">) " +
                "  ?bNode  owl:onProperty  ?prop.    ?prop rdf:type ?propType.  optional{ ?prop ?xx ?datatype. filter(?xx in( rdfs:range))}  }  } LIMIT 1000"


            Sparql_facade.querySPARQL_proxy(query, null, null, null, function (err, result) {
                if (err) {
                    return self.setMessage(err);
                }
                var nodeIds = visjsGraph.data.nodes.getIds();
                var edgeIds = visjsGraph.data.edges.getIds();
                var objectPropertiesIds = [];
                var jstreeData = [];
                var visjsData = {nodes: [], edges: []};
                result.results.bindings.forEach(function (item) {
                    var objectId = item.object.value;
                    var objectLabel = objectId.substring(objectId.lastIndexOf("#") + 1);
                    var propId = item.prop.value;
                    var propLabel = propId.substring(propId.lastIndexOf("#") + 1);
                    var propType = item.propType.value

                    if (propType == "http://www.w3.org/2002/07/owl#DatatypeProperty") {
                        if (!item.datatype)
                            return x = 3;
                        var datatype = item.datatype.value;
                        var datatypeLabel = datatype.substring(datatype.lastIndexOf("#") + 1);
                        var propLabel = propId.substring(propId.lastIndexOf("#") + 1);
                        var data = {type: "Litteral", objectId: objectId, propId: propId, propLabel: propLabel, datatype: datatype, datatypeLabel: datatypeLabel}
                        if (nodeIds.indexOf(propId) < 0) {
                            nodeIds.push(propId)
                            visjsData.nodes.push({id: propId, label: propLabel, data: data, shape: "box", color: self.nodeColors["Litteral"]})
                        }
                        if (edgeIds.indexOf(propId) < 0) {
                            edgeIds.push(propId)
                            visjsData.edges.push({id: data.propId, from: data.objectId, to: data.propId, arrows: "from"})
                        }
                    } else if (propType == "http://www.w3.org/2002/07/owl#ObjectProperty") {
                        var data = {type: "ObjectProperty", propId: propId, propLabel: propLabel, objectId: objectId, objectLabel: objectLabel}
                        if (nodeIds.indexOf(propId) < 0) {
                            nodeIds.push(propId)
                            visjsData.nodes.push({id: propId, label: propLabel, data: data, shape: "box", color: self.nodeColors["ObjectProperty"]})
                        }
                        if (edgeIds.indexOf(propId) < 0) {
                            edgeIds.push(propId)
                            visjsData.edges.push({id: data.propId, from: data.objectId, to: data.propId, arrows: "from"})
                        }
                    }


                })
                if (callback) {
                    return callback(null, visjsData.nodes)
                }
                visjsGraph.data.nodes.add(visjsData.nodes);
                visjsGraph.data.edges.add(visjsData.edges);


            })


        }


        self.searchSubClasses = function (object) {
            var query = "  PREFIX owl: <http://www.w3.org/2002/07/owl#>PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\n" +
                "SELECT distinct * from <http://sws.ifi.uio.no/vocab/npd-v2/>   WHERE {?object rdfs:subClassOf ?parentObject." +
                "   filter (?parentObject=<" + object.id + ">) " +
                "} LIMIT 1000"


            Sparql_facade.querySPARQL_proxy(query, null, null, null, function (err, result) {
                if (err) {
                    return self.setMessage(err);
                }
                var nodeIds = visjsGraph.data.nodes.getIds();
                var edgeIds = visjsGraph.data.edges.getIds();
                var objectPropertiesIds = [];
                var jstreeData = [];
                var visjsData = {nodes: [], edges: []};
                result.results.bindings.forEach(function (item) {
                    var objectId = item.object.value;
                    var objectLabel = objectId.substring(objectId.lastIndexOf("#") + 1);
                    var parentObjectId = item.parentObject.value;
                    var parentObjectLabel = parentObjectId.substring(parentObjectId.lastIndexOf("#") + 1);
                    var propId = "http://www.w3.org/2000/01/rdf-schema#subClassOf";
                    var data = {type: "Class", objectId: objectId, propId: propId, objectLabel: objectLabel, parentObjectId: parentObjectId, parentObjectLabel: parentObjectLabel}
                    if (nodeIds.indexOf(objectId) < 0) {
                        nodeIds.push(objectId)
                        var data = {type: "Class", objectId: objectId, propId: propId, objectLabel: objectLabel, parentObjectId: parentObjectId, parentObjectLabel: parentObjectLabel}
                        visjsData.nodes.push({id: data.objectId, label: data.objectLabel, data: data, shape: "box", color: self.nodeColors["Subclass"]})
                    }
                    /*    if (nodeIds.indexOf(parentObjectId) < 0) {
                            nodeIds.push(parentObjectId)
                            var data = {type: "Class", objectId: parentObjectId, propId: propId, objectLabel: parentObjectLabel, childObjectId: objectId, childObjectLabel: objectLabel}
                            visjsData.nodes.push({id: data.parentObjectId, label: data.parentObjectLabel, data: data, shape: "box", color: self.nodeColors["Subclass"]})
                        }*/
                    visjsData.edges.push({from: data.objectId, to: data.parentObjectId, arrows: {to: {type: "bar"}}})


                })


                visjsGraph.data.nodes.update(visjsData.nodes);
                visjsGraph.data.edges.update(visjsData.edges);
            })
        }


        self.visjsNodeOnclick = function (node, point, options) {

            if (!node || !node.data)
                return;

            self.currentGraphNode = node;
            if (node.data.type == "Class") {
                self.showNodeInfos(node.id)

                MainController.searchSubClasses(node);
                setTimeout(function () {
                    visjsGraph.network.stopSimulation();
                }, 3000)


                MainController.searchDatatypeProperties(node, function (err, result) {
                    self.currentObjectProperties = {};
                    var html = "<div style='display: flex;flex-direction: column'>"
                    html += "<div>" + node.label + "  <input type='checkbox' onchange='MainController.popupSelectAllproperties($(this))'></div>"
                    result.forEach(function (item) {
                        self.currentObjectProperties[item.data.propId] = item.data;
                        html += "<div style='margin: 2px;padding:1px;border-radius: 2px;background-color:" + item.color + "'> " +
                            " <input type='checkbox' class='popupPropertyCBX'  id='popupPropertyCBX_" + item.data.propId + "'>" +
                            item.data.propLabel + "" + "</div>"
                    })
                    html += "<button onclick='MainController.popupOnPropertiesSelected()'>Select</div>"
                    $("#graphPopupDiv").html(html)
                    $("#graphPopupDiv").css("top", point.y)
                    var left = point.x + $("#lefTabs").width()
                    $("#graphPopupDiv").css("left", left)
                    $("#graphPopupDiv").css("display", "block")
                });
                return;
            } else if (node.data.type == "Litteral" || node.data.type == "ObjectProperty") {

                if (options.ctrlKey)
                    return MainController.addGraphPropertyToQuery()
                if (options.altKey)
                    return MainController.showPropertyValueDialog()
                var html = "<table>" +
                    "<tr><td><span onclick='MainController.addGraphPropertyToQuery()'>SelectProperty</span> </td></tr>" +
                    "<tr><td><span onclick='MainController.showPropertyValueDialog()'>FilterProperty</span> </td></tr>" +
                    "</table>"

                $("#graphPopupDiv").html(html)
                $("#graphPopupDiv").css("top", point.y)
                var left = point.x + $("#lefTabs").width()
                $("#graphPopupDiv").css("left", left)
                $("#graphPopupDiv").css("display", "block")

            }

        }


        self.popupSelectAllproperties = function (cbx) {
            var checked = $(cbx).prop("checked")
            $(".popupPropertyCBX").prop("checked", checked)


        }

        self.popupOnPropertiesSelected = function () {
            $(".popupPropertyCBX").each(function (index, prop) {
                if ($(this).prop("checked")) {
                    var id = $(this).prop("id").substring(17)
                    var node = self.currentObjectProperties[id]
                    self.queryNodes[id] = node;
                }

            })
            var html = "<div style='display: flex;flex-direction: column'>"

            for (var key in self.queryNodes) {
                var idDiv = key.substring(key.lastIndexOf("#") + 1)
                html += "<div style='margin: 2px;padding:1px;border-radius: 2px;background-color: #ddd  '> " +
                    " <button onclick=MainController.showPropertyValueDialog('" + key + "','popupFilter_" + idDiv + "')>" +
                    self.queryNodes[key].propLabel + "" + "</button>"
                html += "</div> "
                html += "<div id='popupFilter_" + idDiv + "'></div>"
            }
            html += "<button onclick='  $(\"#graphPopupDiv\").css(\"display\", \"none\")'>OK</button>"
            html += "<button onclick='MainController.execDataQuery()'>EXEC</button>"
            $("#graphPopupDiv").html(html)


        }


        self.showNodeInfos = function (nodeId) {
            Sparql_facade.getOwlObjInfos(nodeId, function (err, result) {
                if (err)
                    return callbackSeries(err);
                var html = "<ul>";
                html += "<li>" + nodeId + "</li>"
                result.forEach(function (item) {
                    html += "<li>" + item.prop.value + " : " + item.value.value + "</li>"
                })
                html += "</ul>"
                $("#infosDiv").html(html);
            })
        }


        self.setMessage = function (message) {
            $("#messageDiv").html(message)

        }


        self.showPropertyValueDialog = function (node, div) {
            if (!div)
                $("#graphPopupDiv").css("display", "none")
            else {
                node=self.currentObjectProperties[node];
                node = {data: node}
            }


            if (!node)
                node = self.currentGraphNode;
            if (node.data) {
                var propId = node.data.propId;

                var id = propId.substring(propId.lastIndexOf("#") + 1);
                var propLabel = node.data.propLabel;
                var objectId = node.data.objectId;
                var objectLabel = objectId.substring(objectId.lastIndexOf("#") + 1)
                var datatype = node.data.datatype;
                var html = ""
                if (true || node.data.datatype && node.data.datatype.indexOf("http://www.w3.org/2001/XMLSchema#") > -1) {
                    html += "<div>" +
                        "<span class='propertyValue' id='_Node_prop_" + id + "'>" + propLabel + "</span><br>"
                    html += "<select class='propertyValue' id='_Node_operator_" + id + "'>" +
                        "<option></option>" +
                        "<option selected>=</option>" +
                        "<option>></option>" +
                        "<option><</option>" +
                        "<option>contains</option>" +

                        "</select>"
                    html += "<input class='propertyValue' id='_Node_value_" + id + "'>"
                } else {
                    /*   html += "<div><span   id='_Node_prop_" + propId + "'>" + targetDomain + "</span>"
                       html += "<input  id='_Node_value_" + propId + "'>"
                       html += "<button  onclick=MainController.listDomainValues('" + propId + "','" + objectId + "','" + targetDomain + "')>List</button>"
                       html += "<select  class='propertyValue' id='_Node_possible_values_" + nodeId + "'></select>"*/
                }

                html += "<button onclick=MainController.addGraphPropertyFilterToQuery('" + id + "')>AddPropertyValue</button>"
                html += "</div>"
                if (div) {
                    $("#" + div).html(html)
                }else {

                    $("#dialogDiv").html(html)
                    $("#dialogDiv").dialog("open");
                }
            }
        }


        self.setVisjsInitialNodeProperties = function (node) {
            if (!self.queryNodes[node.id])
                return;
            if (!self.queryNodes[node.id].initalproperties) {
                self.queryNodes[node.id].initalproperties = {
                    color: node.color,
                    label: node.label,
                    shape: node.shape,
                }
                self.queryNodes[node.id].visjNodeId = node.id

            }
        }
        self.addGraphPropertyToQuery = function (node) {
          //  $("#graphPopupDiv").css("display", "none")
            if (!node)
                node = self.currentGraphNode;
            self.queryNodes[node.id] = node.data;
            self.setVisjsInitialNodeProperties(node);


            if (node.data.filter) {
                var text = " " + node.data.filter.operator + " " + node.data.filter.value;
                var newLabel = node.label + text;
                /*     var filterId = node.id + "_" + node.data.filter.operator + "_" + node.data.filter.value
                     self.queryNodes[filterId] = node.data.filter;
                     self.queryNodes[node.id]*/
                visjsGraph.data.nodes.update({id: node.id, shape: "star", size: 20, color: "orange", label: newLabel,})
            } else {
                visjsGraph.data.nodes.update({id: node.id, shape: "square", size: 15, color: "green"})
            }

            visjsGraph.data.edges.update({id: node.id, color: "green", width: 3})

            var parentNode = visjsGraph.data.nodes.get(node.data.objectId);
            if (parentNode && !self.queryNodes[parentNode.data.propId]) {
                self.queryNodes[parentNode.data.propId] = parentNode.data;
                self.setVisjsInitialNodeProperties(parentNode.data.propId);
                visjsGraph.data.nodes.update({id: parentNode.id, borderWidth: 5, color: {border: "green"}})
                visjsGraph.data.edges.update({id: parentNode.data.propId, color: "green", width: 3})
                visjsGraph.network.stopSimulation();
            }
            var grandParentNode = visjsGraph.data.nodes.get(parentNode.data.parentObjectId);
            if (grandParentNode && !self.queryNodes[grandParentNode.data.propId]) {
                self.queryNodes[grandParentNode.data.propId] = grandParentNode.data;
                self.setVisjsInitialNodeProperties(grandParentNode.data.propId);
                visjsGraph.data.nodes.update({id: grandParentNode.id, borderWidth: 5, color: {border: "green"}})
                visjsGraph.data.edges.update({id: grandParentNode.data.propId, color: "green", width: 3})
                visjsGraph.network.stopSimulation();
            }


            var html = "";
            html += "<table>"
            for (var key in self.queryNodes) {
                var text = self.queryNodes[key].objectLabel;
                if (!text)
                    text = self.queryNodes[key].propLabel
                if (self.queryNodes[key].filter)
                    text += self.queryNodes[key].filter.operator + " " + self.queryNodes[key].filter.value
                var id = key.substring(key.indexOf("#") + 1)
                html += "<tr><td><input type='checkbox' class='queryNodeCBX' id='queryNodeCBX_" + key + "'>" + text + "</td>"
            }
            $("#queryDiv").html(html);


        }

        self.addGraphPropertyFilterToQuery = function (id) {

            var id = $("#_Node_prop_" + id).html();
            var operator = $("#_Node_operator_" + id).val();
            var value = $("#_Node_value_" + id).val();
            var node = self.currentGraphNode;
            var data = node.data
            if (value != "") {
                node.data.filter = {property: node.id, operator: operator, value: value}

            }

            self.addGraphPropertyToQuery(node);
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
        self.clearQuery = function (ids) {
            var newNodes = [];
            for (var key in self.queryNodes) {
                if (!ids || (ids && ids.indexOf(key) > -1)) {
                    //reset visjs appearance
                    var newNode = {id: self.queryNodes[key].visjNodeId}
                    for (var prop in self.queryNodes[key].initalproperties) {

                        newNode[prop] = self.queryNodes[key].initalproperties[prop]
                    }
                    newNodes.push(newNode)

                }

            }
            visjsGraph.data.nodes.update(newNodes)
            self.queryNodes = {};
            $("#queryDiv").html("");


        }

        self.execDataQuery = function () {
            $("#graphPopupDiv").css("display", "none")
            //  var valueNodes = $("#jstreeClassDiv").jstree(true).get_checked(true);

            var querySelection = ""
            var queryProjection = "";
            var propIds = []
            var nodesMap = {};
            for (var key in self.queryNodes) {
                var queryNodeData = self.queryNodes[key];
                //  valueNodes.forEach(function (node, index) {
                /*    if (queryNodeData.propType != "http://www.w3.org/2002/07/owl#ObjectProperty")
                        return;*/
                var subjectLabel = queryNodeData.objectId.substring(queryNodeData.objectId.lastIndexOf("#") + 1)
                var predicateLabel = queryNodeData.propId;


                if (!nodesMap[key]) {
                    nodesMap[key] = subjectLabel

                    if (queryNodeData.type == "Litteral") {
                        var valueLabel = predicateLabel.substring(predicateLabel.lastIndexOf("#") + 1)
                        querySelection += " ?" + subjectLabel + " <" + predicateLabel + ">  ?" + valueLabel + "_value. "
                        querySelection += "optional  {?" + subjectLabel + "<http://sws.ifi.uio.no/vocab/npd-v2#name>  ?" + subjectLabel + "_name.} "

                        if (queryNodeData.filter) {
                            if (queryNodeData.filter.operator == "contains")
                                querySelection += " filter(regex(?" + valueLabel + "_value,'" + queryNodeData.filter.value + "','i'))";
                            else
                                querySelection += " filter(?" + valueLabel + "_value" + queryNodeData.filter.operator + queryNodeData.filter.value + ") ";

                        }
                    } else if (queryNodeData.type == "ObjectProperty") {
                        var valueLabel = predicateLabel.substring(predicateLabel.lastIndexOf("#") + 1)
                        querySelection += " ?" + subjectLabel + " <" + predicateLabel + ">  ?" + valueLabel + "_value" + ". "
                        querySelection += "optional  {?" + valueLabel + "_value <http://sws.ifi.uio.no/vocab/npd-v2#name>  ?" + valueLabel + "_name.} "

                        if (queryNodeData.filter) {
                            if (queryNodeData.filter.operator == "contains")
                                querySelection += " filter(regex(?" + valueLabel + "_name,'" + queryNodeData.filter.value + "','i'))";
                            else
                                querySelection += " filter(?" + valueLabel + "_name" + queryNodeData.filter.operator + queryNodeData.filter.value + ") ";

                        }

                    } else if (queryNodeData.type == "Class") {
                        var parentObjectId = queryNodeData.parentObjectId;
                        var objectLabel = parentObjectId.substring(parentObjectId.lastIndexOf("#") + 1)
                        querySelection += "optional{ ?" + subjectLabel + " <" + predicateLabel + ">  ?" + objectLabel + " . "
                        querySelection += "optional  {?" + objectLabel + "<http://sws.ifi.uio.no/vocab/npd-v2#name>  ?" + objectLabel + "_name.}} "


                    }


                }
            }


            /*    node.parents.forEach(function (parent, parentIndex) {
                    if (parent == "#" || parentIndex == 0)
                        return;
                    var parentNode = $("#jstreeClassDiv").jstree(true).get_node(parent);

                    if (parentNode.parent == "#")
                        return;
                    if (!nodesMap[parentNode.id]) {
                        var parentSubjectLabel = parentNode.parent.substring(parentNode.parent.lastIndexOf("#") + 1)
                        var parentPredicateId = parentNode.data.propId;
                        var parentPredicateLabel = parentPredicateId.substring(parentPredicateId.lastIndexOf("#") + 1)

                        if (nodesMap[parentNode.id])
                            return;
                        nodesMap[parentNode.id] = parentSubjectLabel

                        querySelection += " ?" + subjectLabel + "<" + parentPredicateId + "> ?" + parentPredicateLabel + ". "
                        querySelection += "optional { ?" + parentPredicateLabel + "<http://sws.ifi.uio.no/vocab/npd-v2#name>  ?" + parentPredicateLabel + "_name.} "


                    }
                })*/


            var query = "SELECT * from <http://sws.ifi.uio.no/data/npd-v2/>   WHERE {";
            query += querySelection + queryProjection +
                "} limit 10000"
            Sparql_facade.querySPARQL_proxy(query, null, null, null, function (err, result) {
                if (err) {
                    return self.setMessage(err);
                }
                self.showDataQueryResult(result);

                console.log(query)


            })
        }


        self.showDataQueryResult = function (result) {


            var colNames = result.head.vars
            var dataSet = []

            var cols = []
            colNames.forEach(function (colName) {
                cols.push({title: colName})
            })
            result.results.bindings.forEach(function (item) {
                var lineArray = [];
                colNames.forEach(function (colName) {
                    var value = ""
                    if (item[colName])
                        value = item[colName].value
                    lineArray.push(value)
                })
                dataSet.push(lineArray);

            })


            $('#queryResultDiv').html("<table id='dataTableDiv'></table>");

            $('#dataTableDiv').DataTable({
                data: dataSet,
                columns: cols,
                // async: false,
                dom: 'Bfrtip',
                buttons: [
                    'copy', 'csv', 'excel', 'pdf', 'print'
                ]


            });
            $("#rightTabs").tabs("option", 'active', 1)


        }


///***************************************************************************************************************************************************************
///***************************************************************************************************************************************************************
///***************************************************************************************************************************************************************
///***************************************************************************************************************************************************************


        /*
            self.contextMenu = function (node) {
              var items = {
                  selectNode: {
                      label: "selectNode",
                      action: function (obj) {

                          MainController.setPropertySelected(node)
                          ;
                      },

                  },
                  filterNode: {
                      label: "filterNode",
                      action: function (obj) {
                          MainController.showPropertyValueDialog(node);
                          ;
                      },

                  }
              }

              if (node.data.type == "Class") {
                  items.selectAllProperties = {
                      label: "selectAllProperties",
                      action: function (obj) {
                          MainController.setPropertyChildrenSelected(node);
                          ;
                      },
                  }
              }
              return items;
          }
           self.setPropertySelected = function (node) {
              node.data.selected = true;
          }

            self.setPropertyChildrenSelected = function (node) {
              var children = node.children;
              children.forEach(function (childId) {
                  var node = $("#jstreeClassDiv").jstree(true).get_node(childId)
                  node.data.selected = true;
              })

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
                      contextMenu: MainController.contextMenu
                  })

              })


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

                               if ( false && nodeIds.indexOf(prop1Id) < 0) {
                                   nodeIds.push(prop1Id);
                                   visjsData.nodes.push({id: prop1Id, label: prop1Label, shape: "box", color: self.getNodeColor("Litteral")})
                               }
                               if (edgeIds.indexOf(targetDomainId) < 0) {
                                   edgeIds.push(targetDomainId);
                                   visjsData.edges.push({id: prop1Id, from: sourceDomainId, to: targetDomainId, label: targetDomainId})
                               }

                           } else {
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





          self.onJstreeCheckClassNode = function (event, object) {
              $("#infosDiv").html(object.node.id);
              // self.showPropertyValueDialog(object.node)

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
                      contextMenu: MainController.contextMenu
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
                              var existingNodes = common.getJstreeAllNodes("jstreeClassDiv")
                              var jstreeData = []
                              var parent = object.node.id;

                              data.forEach(function (item) {
                                  var propId = item.prop.value;
                                  var rangeId = null;

                                  if (item.range)
                                      rangeId = item.range.value;
                                  else// cas des ObjectProperties
                                      rangeId = item.prop.value;
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
                                      if (existingNodes.indexOf(rangeId) > -1)
                                          return;

                                      jstreeData.push({
                                          id: rangeId,
                                          text: "<span class='tree_level_1' style='background-color: " + self.nodeColors[propType] + "'>" + rangeLabel + "</span>",
                                          children: [],
                                          data: {propType: propType, propId: propId, range: rangeId, domain: domainId, litteralType: litteralType},
                                          parent: "#"
                                      })
                                  } else {
                                      if (existingNodes.indexOf(rangeId) > -1)
                                          domainId;

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
                              self.showNodeInfos(object.node.id)
                              callbackSeries()

                          }


                      ], function (err) {
                          if (err)
                              return self.setMessage(err);
                          return;

                      })
              }
              return;

          }*/

        return self;


    }
)
()
