var Mediawiki = (function () {

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

    self.colors = {
        Page: "#FF7D07",
        Category: "#a6f1ff"
    }

    function getLabelFromId(id) {
        return id.substring(id.lastIndexOf('/') + 1)
    }


    self.graphCategories = function () {


    }

    self.searchData = function (uri) {


        var word = $("#mediaWikiwordInput").val();
        var filter = "";
        if (uri) {
            if (uri.data.type == "Page")
                filter = " && ?page=<" + uri.id + ">"
            else
                filter = " && ?category=<" + uri.id + ">"

        } else {
            if (word != "")
                filter = " && regex(str(?page),\"" + word + "\",\"i\")"
        }
        var query = "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>" +
            "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>" +
            "SELECT distinct * from <http://wiki.aapg.org/data/> WHERE {" +
            "  ?page  ?x ?category. filter (regex(str(?category),\"category\",\"i\")" + filter + ")" +

            "} order by ?category limit 5000"

        Sparql_facade.querySPARQL_proxy(query, null, null, null, function (err, result) {

            if (err)
                return MainController.setMessage(err);
            var visjsData = {nodes: [], edges: []};
            var nodeIds = []

            var jstreeData = [];
            result.results.bindings.forEach(function (item) {
                var pageId = item.page.value;
                var categoryId = item.category.value


                if (nodeIds.indexOf(categoryId) < 0) {
                    nodeIds.push(categoryId)
                    var node = {
                        id: categoryId,
                        label: getLabelFromId(categoryId).replace("Category-3A", ""),
                        color: self.colors["Category"],
                        data: {type: "Category"},
                        shape: "box"
                    }

                    visjsData.nodes.push(node)
                    node.text = node.label;
                    node.parent = "#"
                    jstreeData.push(node)
                }


                if (nodeIds.indexOf(pageId) < 0) {
                    nodeIds.push(pageId)
                    var node = {
                        id: pageId,
                        label: getLabelFromId(pageId),
                        color: self.colors["Page"],
                        data: {type: "Page"},
                        shape: "dot"
                    }
                    visjsData.nodes.push(node)
                    node.text = node.label;
                    node.parent = categoryId

                    jstreeData.push(node)
                }


                visjsData.edges.push({from: pageId, to: categoryId, arrows: "to"})


            })
            visjsGraph.draw("graphDiv", visjsData, {
                onclickFn: Mediawiki.onGraphNodeClick

            })
            if (!uri) {
                common.loadJsTree("jstreeMediawikiClassDiv", jstreeData, {
                    // withCheckboxes: true,
                 selectNodeFn: Mediawiki.onJstreeNodeClick,
                    //  onCheckNodeFn: MainController.onJstreeCheckNode,
                    //  contextMenu: MainController.contextMenu
                })
            }

        })
    }
    self.onJstreeNodeClick = function (event, obj) {
        self.searchData(obj.node, null, {newGraph: true})
    }

    self.onGraphNodeClick = function (node, point, options) {
        if(!node)
            return;
        if (!options.ctrlKey)
            return Mediawiki.expandGraphNode(node,point,options);
        else {
            var html = "<table>" +
                "<tr><td><span onclick=Mediawiki.analyzePageContent('"+node.id+"')>showPageContent</span> </td></tr>" +
                "<tr><td><span onclick=Mediawiki.openWikiPage('"+node.id+"')>openWikiPage</span> </td></tr>" +
                "</table>"

            $("#graphPopupDiv").html(html)
            $("#graphPopupDiv").css("top", point.y)
            var left = point.x + $("#lefTabs").width()
            $("#graphPopupDiv").css("left", left)
            $("#graphPopupDiv").css("display", "block")
        }

    }
    self.analyzePageContent = function (node) {

    }
    self.openWikiPage = function (nodeId) {
        window.open(
            nodeId, "_blank");
    }


    self.expandGraphNode = function (obj, point, options) {

        var nodeIds = [];
        var edgeIds = [];
        if (!options.newGraph) {
            nodeIds = visjsGraph.data.nodes.getIds();
            edgeIds = visjsGraph.data.edges.getIds();
        }

        if (!obj || !obj.data)
            return;
//obj.id=obj.id.replace('https://wiki.aapg.org//','https://wiki.aapg.org/')
        if (obj.data.type == "Category") {

            var query = "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>" +
                "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>" +
                "SELECT distinct * from <http://wiki.aapg.org/data/> WHERE {" +
                "  ?page rdf:type  <" + obj.id + ">" +
                "} order by ?page limit 1000"
        } else if (obj.data.type == "Page") {

            var query = "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>" +
                "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>" +
                "SELECT distinct * from <http://wiki.aapg.org/data/> WHERE {" +
                "{?subject <http://semantic-mediawiki.org/swivt/1.0#page> ?page." +
                "  ?page ?prop ?object  filter(?subject =<" + obj.id + "> && ?prop in  (<http://www.w3.org/2000/01/rdf-schema#seeAlso>,<http://semantic-mediawiki.org/swivt/1.0#redirectsTo>))" +
                "}union{" +
                " ?page ?prop ?object  filter(?page =<" + obj.id + "> && ?prop in  (<http://www.w3.org/2000/01/rdf-schema#seeAlso>,<http://semantic-mediawiki.org/swivt/1.0#redirectsTo>))" +
                "  }" +
                "} "
            "} order by ?page limit 1000"
        }

        Sparql_facade.querySPARQL_proxy(query, null, null, null, function (err, result) {

            if (err)
                return MainController.setMessage(err);
            var visjsData = {nodes: [], edges: []};


            if (obj.data.type == "Category") {
                result.results.bindings.forEach(function (item) {
                    var pageId = item.page.value;
                    if (nodeIds.indexOf(pageId) < 0) {
                        nodeIds.push(pageId)
                        visjsData.nodes.push({
                            id: pageId,
                            label: getLabelFromId(pageId),
                            color: self.colors["Page"],
                            data: {type: "Page"},
                            shape: "dot"
                        })
                    }
                    var edgeId = obj.id + "_" + pageId
                    if (edgeIds.indexOf(pageId) < 0) {
                        visjsData.edges.push({id: edgeId, to: pageId, from: obj.id, arrows: "to"})
                    }
                })
            } else if (obj.data.type == "Page") {
                result.results.bindings.forEach(function (item) {
                    var objectId = item.object.value;
                    if (nodeIds.indexOf(objectId) < 0) {
                        nodeIds.push(objectId)
                        visjsData.nodes.push({
                            id: objectId,
                            label: getLabelFromId(objectId),
                            color: self.colors["Page"],
                            data: {type: "Page"},
                            shape: "dot"
                        })
                    }
                    var edgeId = obj.id + "_" + objectId
                    if (edgeIds.indexOf(objectId) < 0) {
                        //    visjsData.edges.push({id: edgeId, from: obj.id, to: objectId,label: getLabelFromId(item.prop.value),arrows:"to"})
                        visjsData.edges.push({id: edgeId, from: obj.id, to: objectId, color: "blue", arrows: "to"})
                    }
                })
            }
            if (options.newGraph) {
                visjsGraph.draw("graphDiv", visjsData, {
                    onclickFn: Mediawiki.expandGraphNode
                })

            } else {
                visjsGraph.data.nodes.add(visjsData.nodes);
                visjsGraph.data.edges.add(visjsData.edges);
            }
        })

    }


    return self;


})()

/* *******************************

PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

SELECT distinct * from <http://wiki.aapg.org/data/> WHERE { ?a  ?b ?c
  filter (regex(str(?a),"kerogen","i"))
} order by ?page limit 2000
 */
