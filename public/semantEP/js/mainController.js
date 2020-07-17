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


    }

    self.initClasses = function () {


        Sparql_facade.getClasses(function (err, result) {
            if (err)
                return self.setMessage(err)
            var color = "#ddd";
            var nodes = [];
            result.forEach(function (item) {

                nodes.push({id: item.class.value, text: "<span class='tree_level_1' style='background-color: " + color + "'>" + item.classLabel.value + "</span>", children: [], parent: "#"})
            })

            if ($('#jstreeClassDiv').jstree)
                $('#jstreeClassDiv').jstree("destroy")
            $("#jstreeClassDiv").jstree({

                "checkbox": {
                    "keep_selected_style": false
                },
                "plugins": ["checkbox"],
                "core": {
                    'check_callback': true,
                    'data': nodes
                }


            });


        })


    }


    self.drawPropAndClassesGraph = function () {

        Sparql_facade.getOwlClassesAndProperties(null, function (err, result) {

            if (err)
                return self.setMessage(err);

            function getNodeColor(nodeLabel) {
                var nodeColor = "grey"
                for (var key in self.mainObjsColorsMap) {
                    if (nodeLabel.indexOf(key) == 0)
                        nodeColor = self.mainObjsColorsMap[key]
                }
                return nodeColor;
            }

            var visjsData = {nodes: [], edges: []};
            var nodeIds = [];
            var edgeIds = [];
            result.forEach(function (item) {
                var rangeId = item.range.value;
                var rangeLabel = rangeId.substring(rangeId.lastIndexOf("#") + 1);
                var domainId = item.domain.value;
                var domainLabel = domainId.substring(domainId.lastIndexOf("#") + 1)
                var propId = item.prop.value;
                var propLabel = propId.substring(propId.lastIndexOf("#") + 1);


                if (nodeIds.indexOf(rangeId) < 0) {
                    nodeIds.push(rangeId);
                    visjsData.nodes.push({id: rangeId, label: rangeLabel, shape: "box", color: getNodeColor(rangeLabel)})
                }

                if (nodeIds.indexOf(domainId) < 0) {
                    nodeIds.push(domainId);
                    visjsData.nodes.push({id: domainId, label: domainLabel, shape: "box", color: getNodeColor(domainLabel)})
                }
                if (edgeIds.indexOf(propId) < 0) {
                    edgeIds.push(propId);
                    visjsData.edges.push({id: propId, from: domainId, to: rangeId, label: propLabel})
                }


            })
            visjsGraph.draw("graphDiv", visjsData, {onclickFn: MainController.onGraphNodeClick})

        })


    }


    self.onGraphNodeClick = function (node, point, options) {

        self.setGraphNodeInfos(node)

    }


    self.setGraphNodeInfos = function (node) {

            Sparql_facade.getOwlSubClasses(node.id, function (err, result) {
                if (err)
                    return self.setMessage(err);
                var html="<b>"+node.id+"</b>"
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


        self.setMessage = function (message) {
            $("#messageDiv").html(message)
        }

        return self;


    }
)()
