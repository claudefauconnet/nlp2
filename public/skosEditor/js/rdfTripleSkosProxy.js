var rdfTripleSkosProxy = (function () {

    var self = {}
    self.sparqlServerUrl = 'http://51.178.139.80:8890/sparql/';
    var graphsMap = {
        "http://PetroleumAbstractsThesaurus/": {color: "#a6f1ff", label: "Tulsa"},
        "http://www.eionet.europa.eu/gemet/": {color: '#FF7D07', label: "Gemet"},
        "http://data.total.com/resource/vocabulary/": {color: "#7fef11", label: "CTG"},
        "https://www2.usgs.gov/science/USGSThesaurus/": {color: '#FFD900', label: "USGS"}
    }

    self.loadThesaurus = function (graphUri) {

        var query = "PREFIX schema: <http://schema.org/>" +
            "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>" +
            "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>" +
            "prefix skos: <http://www.w3.org/2004/02/skos/core#>" +
            "prefix foaf: <http://xmlns.com/foaf/0.1/>" +
            "prefix shema: <http://schema.org/>" +
            "SELECT distinct * from <http://souslesens.org/data/total/ep/> WHERE {" +
            "" +
            "  ?concept skos:topConceptOf <http://souslesens.org/vocab/scheme/mediawiki-ep> ." +
            //  "  ?concept skos:prefLabel ?conceptLabel" +
            "  " +
            " " +
            "} LIMIT 1000"

        self.querySPARQL_proxy(query, self.sparqlServerUrl, {}, {}, function (err, result) {

            if (err) {
                return console.log(err);
            }
            var nodes = [];
            result.results.bindings.forEach(function (item) {

                var id = item.concept.value;
                // var prefLabel = item.conceptLabel.value;
                var prefLabel = id.substring(id.lastIndexOf("/") + 1)

                var node = {
                    data: {
                        altLabels: [],
                        broaders: [],
                        definitions: [],
                        id: id,
                        notes: [],
                        prefLabels: [{lang: "en", value: prefLabel}],

                        relateds: [],
                    },
                    treeDivId: "treeDiv1",
                    icon: "concept-icon.png",
                    id: id,
                    parent: "#",
                    text: prefLabel,
                }
                nodes.push(node);

            })

            common.loadJsTree("treeDiv1", nodes, {selectNodeFn: rdfTripleSkosProxy.onTreeClikNode});

        })


    }


    self.onTreeClikNode = function (evt, obj) {
        $("#messageDiv").html("");
        self.currentTreeNode = obj.node


        if (obj.event.ctrlKey)
            self.showNodeConceptsGraph(obj.node)
        if (obj.event.altKey) {
            if (obj.node.data && obj.node.data.type == "wikiPage")
                return self.getWikiPagesWords(obj.node)
            else
                return self.addWikiPagesToTree(obj.node)
        }

        if (obj.node.children.length > 0)
            return;

        self.addTreeChildrenNodes(obj.node.id);


    }

    self.addTreeChildrenNodes = function (broaderId) {


        var query = "PREFIX schema: <http://schema.org/>" +
            "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>" +
            "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>" +
            "prefix skos: <http://www.w3.org/2004/02/skos/core#>" +
            "prefix foaf: <http://xmlns.com/foaf/0.1/>" +
            "prefix shema: <http://schema.org/>" +
            "SELECT distinct * from <http://souslesens.org/data/total/ep/> WHERE {" +
            "" +
            "  ?concept skos:broader ?broader .  filter (?broader=<" + broaderId + ">)" +
            //  "  ?concept skos:prefLabel ?conceptLabel" +
            "  " +
            " " +
            "} LIMIT 1000"

        self.querySPARQL_proxy(query, self.sparqlServerUrl, {}, {}, function (err, result) {

            if (err) {
                return console.log(err);
            }
            var nodes = [];
            result.results.bindings.forEach(function (item) {

                var id = item.concept.value;
                // var prefLabel = item.conceptLabel.value;
                var prefLabel = id.substring(id.lastIndexOf("/") + 1)
                var node = {
                    data: {
                        altLabels: [],
                        broaders: [broaderId],
                        definitions: [],
                        id: id,
                        notes: [],
                        prefLabels: [{lang: "en", value: prefLabel}],

                        relateds: [],
                    },
                    treeDivId: "treeDiv1",
                    icon: "concept-icon.png",
                    id: id,
                    parent: broaderId,
                    text: prefLabel,
                }
                nodes.push(node);

            })

            common.addNodesToJstree("treeDiv1", broaderId, nodes);

        })
    }

    self.showNodeConceptsArray = function (nodeId) {
        var query = "prefix skos: <http://www.w3.org/2004/02/skos/core#>" +
            "prefix foaf: <http://xmlns.com/foaf/0.1/>" +
            "prefix schema: <http://schema.org/>" +
            "SELECT  ?catId  ?subject  ?concept ?conceptLabelLower (count(?category) as ?nCategories) WHERE{" +
            "    ?catId foaf:topic ?subject ." +
            "    ?category schema:about ?catId. " +
            "    ?concept ?x ?category." +
            "  ?concept skos:prefLabel ?conceptLabel filter(lang(?conceptLabel)='en')" +
            "    filter ( ?catId=<" + nodeId + ">)" +
            "BIND (LCASE(?conceptLabel) as ?conceptLabelLower)" +

            "} group by  ?catId  ?subject  ?concept ?conceptLabelLower order by ?conceptLabelLower limit 1000"
        self.querySPARQL_proxy(query, self.sparqlServerUrl, {}, {}, function (err, result) {

            if (err) {
                return console.log(err);
            }
            var nodes = [];
            result.results.bindings.forEach(function (item) {

                //     var catId = item.catId.value;
                var subject = item.subject.value;
                var concept = item.concept.value;
                var conceptLabel = item.conceptLabelLower.value;
                // var graph = item.g.value;
                var nCategories = item.nCategories.value;
                nodes.push({catId: catId, subject: subject, concept: concept, conceptLabel: conceptLabel, nCategories: nCategories})

            })


            var str = "<table>";
            nodes.forEach(function (item) {
                str += "<tr><td><span class='clickableResult' id='" + item.concept + "'>" + item.conceptLabel + "</span></td><td>" + item.nCategories + "</td></tr>"
            })
            $("#editorDivId").html(str)
        })
    }

    self.showNodeConceptsGraph = function (node) {
        if (!node)
            node = self.currentTreeNode;
        if (!node)
            return;

        var countPagesMax = $("#countPagesMax").val();
        var countAllPages = $("#countAllPages").prop("checked")
        var countPagesMaxFilter = ""
        if (!countAllPages) countPagesMaxFilter = " filter(?countPages<" + countPagesMax + ")"


        var parentCategoriesFilter = " filter (?category not in("
        node.parents.forEach(function (parent, index) {

            if (parent != "#") {
                if (index > 0)
                    parentCategoriesFilter += ","
                parentCategoriesFilter += "<" + parent + ">";
            }
        })
        parentCategoriesFilter += "))"


        $("#messageDiv").html("Searching...");
        var query = "prefix skos: <http://www.w3.org/2004/02/skos/core#>prefix foaf: <http://xmlns.com/foaf/0.1/>prefix schema: <http://schema.org/>SELECT distinct  * WHERE{ " +
            " ?concept  <http://souslesens.org/vocab#wikimedia-category>  ?category." + parentCategoriesFilter +
            "  ?category  <http://souslesens.org/vocab/countPages> ?countPages . " + countPagesMaxFilter +
            "  ?category foaf:topic ?subject.  filter ( ?subject=<" + node.id + ">)" +
            "  " +
            "  ?concept skos:prefLabel ?conceptLabel. filter(lang(?conceptLabel)='en')    " +
            "  BIND (LCASE(?conceptLabel) as ?conceptLabelLower)  " +
            "  optional{ ?concept skos:broader ?broader1. ?broader1 skos:prefLabel ?broader1Label  filter(lang(?broader1Label)='en')      optional{ ?broader1 skos:broader ?broader2. ?broader2 skos:prefLabel ?broader2Label  filter(lang(?broader2Label)='en')      optional{ ?broader2 skos:broader ?broader3. ?broader3 skos:prefLabel ?broader3Label  filter(lang(?broader3Label)='en')         optional{ ?broader3 skos:broader ?broader4. ?broader4 skos:prefLabel ?broader4Label  filter(lang(?broader4Label)='en') }    }    }  }     } order by ?concept limit 1000"
        self.querySPARQL_proxy(query, self.sparqlServerUrl, {}, {}, function (err, result) {

            if (err) {
                return console.log(err);
            }

            var allnodes = [];
            var allEdges = [];
            var visjsData = {nodes: [], edges: []}
            var similarNodes = {}
            var offsetY = -400


            var maxPages = 0;
            var minPages = 1000000;

            if (result.results.bindings.length == 0)
                return $("#messageDiv").html("no concepts matching");

            if (result.results.bindings.length > 200)
                return $("#messageDiv").html("too many concepts to show :" + result.results.bindings.length);


            result.results.bindings.forEach(function (item) {
                $("#messageDiv").html(node.text + " concepts :" + result.results.bindings.length);

                var subject = item.subject.value;
                var conceptId = item.concept.value;
                var countPages = parseInt(item.countPages.value);

                maxPages = Math.max(maxPages, countPages)
                minPages = Math.min(minPages, countPages)


                var graphLabel = "";
                var color = "#ddd";
                for (var key in graphsMap) {
                    if (conceptId.indexOf(key) > -1) {
                        color = graphsMap[key].color;
                        graphLabel = graphsMap[key].label
                    }

                }
                if (graphLabel == "")
                    var x = 3


                var conceptLabel = item.conceptLabelLower.value;

                if (!similarNodes[conceptLabel])
                    similarNodes[conceptLabel] = [];
                if (similarNodes[conceptLabel].indexOf(conceptId) < 0)
                    similarNodes[conceptLabel].push(conceptId)


                if (allnodes.indexOf(graphLabel) < 0) {
                    allnodes.push(graphLabel)
                    visjsData.nodes.push({id: graphLabel, label: graphLabel, shape: "ellipse", color: color, fixed: {x: true}, x: 500, y: offsetY, data: {type: "graph"}})

                }
                if (allnodes.indexOf(conceptId) < 0) {
                    allnodes.push(conceptId)
                    // visjsData.nodes.push({id: conceptId, label: conceptLabel, shape: "text", color: color,size:Math.round(20/countPages), fixed: {x: true, y: true}, x: -500, y: offsetY})
                    visjsData.nodes.push({id: conceptId, label: conceptLabel, shape: "box", color: color, fixed: {x: true, y: true}, x: -500, y: offsetY, data: {type: "leafConcept"}})

                    offsetY += 30 + (20 / countPages);
                    //  visjsData.edges.push({id: nodeId + "_" + conceptId, from: nodeId, to: conceptId, color: color})
                }
                for (var i = 1; i < 5; i++) {
                    var broaderId = item["broader" + i]
                    if (broaderId) {
                        broaderId = broaderId.value;
                        if (allnodes.indexOf(broaderId) < 0) {
                            allnodes.push(broaderId)
                            var broaderLabel = item["broader" + i + "Label"].value
                            visjsData.nodes.push({id: broaderId, label: broaderLabel, color: color, data: {type: "broaderConcept"}})
                        }
                        if (i == 1) {
                            var edgeId = conceptId + "_" + broaderId
                            if (allEdges.indexOf(edgeId) < 0) {
                                allEdges.push(edgeId);
                                visjsData.edges.push({id: edgeId, from: conceptId, to: broaderId, arrows: "to"})
                            }

                        } else {

                            var previousBroaderId = item["broader" + (i - 1)].value
                            var edgeId = previousBroaderId + "_" + broaderId
                            if (allEdges.indexOf(edgeId) < 0) {
                                allEdges.push(edgeId);
                                visjsData.edges.push({id: edgeId, from: previousBroaderId, to: broaderId, arrows: "to"})
                            }

                        }
                        var nextBroaderId = item["broader" + (i + 1)]
                        if (!nextBroaderId) {
                            //  var previousBroaderId = item["broader" + (i - 1)].value
                            var edgeId = graphLabel + "_" + broaderId
                            if (allEdges.indexOf(edgeId) < 0) {
                                allEdges.push(edgeId);
                                visjsData.edges.push({id: edgeId, from: broaderId, to: graphLabel, arrows: "to"})
                            }


                        }
                    }


                }


            })

            for (var key in similarNodes) {
                var length = similarNodes[key].length;
                if (length > 1) {
                    visjsData.nodes.push({id: key, label: key, shape: "box", color: "#ddd", fixed: {x: false}, x: -650})
                    for (var i = 0; i < length; i++) {
                        var edgeId = key + "_" + similarNodes[key][i]
                        if (allEdges.indexOf(edgeId) < 0) {
                            allEdges.push(edgeId)
                            visjsData.edges.push({id: edgeId, from: key, to: similarNodes[key][i], arrows: "to"})
                        }
                    }
                }
            }
            visjsGraph.draw("graphDiv", visjsData, {onclickFn: rdfTripleSkosProxy.onGraphNodeClick})
            $("#sliderCountPagesMax").slider("option", "max", maxPages);
            $("#sliderCountPagesMax").slider("option", "mmin", minPages);
            $("#minPages").html(minPages)
            $("#maxPages").html(maxPages)
            //  $( "#sliderCountPagesMax" ).slider( "option", "value", maxPages );
        })
    }

    self.onGraphNodeClick = function (node, point, options) {
        self.currentGraphNode = node;
        if (!node || !node.id)
            return
        self.hightlightPath(node);

        var html = "<table>" +
            "  <tr>"
        if (node.data && node.data.type == "broaderConcept")
            html += "      <td><span onclick=\"rdfTripleSkosProxy.graphActions.showConceptChildren()\">show children Nodes</span></td>"

        html += "  </tr>" +
            "</table>"
        if (html != "")
            self.graphActions.showPopup(point)
        $("#graphPopupDiv").html(html)


    }

    self.graphActions = {
        showPopup: function (point) {
            $("#graphPopupDiv").css("left", point.x + 400)
            $("#graphPopupDiv").css("top", point.y)
            $("#graphPopupDiv").css("display", "flex")
        },
        hidePopup: function () {
            $("#graphPopupDiv").css("display", "none")
        },
        showConceptChildren: function () {
            self.graphActions.hidePopup()
            self.showConceptChildren(self.currentGraphNode)
        }
    }


    self.showConceptChildren = function (node) {

        var query = "prefix skos: <http://www.w3.org/2004/02/skos/core#>" +
            "SELECT   distinct ?conceptLabel ?concept ?childConcept ?childConceptLabel WHERE {" +
            "    " +
            "" +
            "  ?childConcept skos:broader|^skos:narrower ?concept." +
            "?concept skos:prefLabel ?conceptLabel filter(lang(?conceptLabel)='en')" +
            "  filter(?concept=<" + node.id + ">)" +
            "?childConcept skos:prefLabel ?childConceptLabel filter(lang(?childConceptLabel)='en')" +

            "} limit 1000"
        self.querySPARQL_proxy(query, self.sparqlServerUrl, {}, {}, function (err, result) {

            if (err) {
                return console.log(err);
            }

            var allnodes = visjsGraph.data.nodes.getIds()
            var allEdges = visjsGraph.data.edges.getIds()
            var visjsData = {nodes: [], edges: []}
            var similarNodes = {}


            //   visjsData.nodes.push({id: nodeId, label: nodeId, shape: "box"})
            result.results.bindings.forEach(function (item) {


                var conceptId = item.concept.value;
                var conceptLabel = item.conceptLabel.value;
                var childConceptLabel = item.childConceptLabel.value;
                var childConceptId = item.childConcept.value;
                if (allnodes.indexOf(childConceptId) < 0) {
                    allnodes.push(childConceptId)
                    visjsData.nodes.push({id: childConceptId, label: childConceptLabel, color: "green"})
                    var edgeId = conceptId + "_" + childConceptId
                    visjsData.edges.push({id: edgeId, from: conceptId, to: childConceptId, arrow: {to: true}})
                }

            })

            visjsGraph.data.edges.update(visjsData.edges)
            visjsGraph.data.nodes.update(visjsData.nodes)
        })
    }

    self.hightlightPath = function (node) {
        var newNodeIds = [];
        var newEdgeIds = [];

        function recurse(nodeId) {
            var edgeIds = visjsGraph.network.getConnectedEdges(nodeId);
            var edges = visjsGraph.data.edges.get(edgeIds);
            edges.forEach(function (edge) {
                if (newEdgeIds.indexOf(edge.id) < 0 && nodeId == edge.from) {
                    newEdgeIds.push(edge.id)
                    if (newNodeIds.indexOf(edge.from))
                        newNodeIds.push(edge.from)
                    recurse(edge.to)
                }
            })
        }

        recurse(node.id)

        var oldEdges = visjsGraph.data.edges.getIds();
        var newEdges = [];
        oldEdges.forEach(function (edgeId) {
            if (newEdgeIds.indexOf(edgeId) > -1)
                newEdges.push({id: edgeId, width: 6})
            else
                newEdges.push({id: edgeId, width: 1})


        })
        var oldNodes = visjsGraph.data.nodes.getIds();
        var newNodes = [];
        oldNodes.forEach(function (nodeId) {
            if (newNodeIds.indexOf(nodeId) > -1)
                newNodes.push({id: nodeId, font: {color: "blue"}})
            else
                newNodes.push({id: nodeId, font: {color: "black"}})
        })
        visjsGraph.data.edges.update(newEdges)
        visjsGraph.data.nodes.update(newNodes)
    }


    self.querySPARQL_proxy = function (query, url, queryOptions, options, callback) {
        console.log(query)
        $("#waitImg").css("display", "block")
        if (!url) {
            url = self.proxyUrl;
        }
        if (!queryOptions) {
            queryOptions = "&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=20000&debug=off"
        }
        if (!options)
            options = {}
        if (!options.doNotEncode) {
            var query2 = encodeURIComponent(query);
            query2 = query2.replace(/%2B/g, "+").trim()
        }


        var body = {
            params: {query: query},
            headers: {
                "Accept": "application/sparql-results+json",
                "Content-Type": "application/x-www-form-urlencoded"
            }
        }


        $("#waitImg").css("display", "block");


        var payload = {
            httpProxy: 1,
            url: url,
            body: body,
            options: queryOptions


        }

        if (options.method && options.method == "GET")
            payload.GET = true;
        else
            payload.POST = true;

        $.ajax({
            type: "POST",
            url: "/elastic",
            data: payload,
            dataType: "json",
            /* beforeSend: function(request) {
                 request.setRequestHeader('Age', '10000');
             },*/

            success: function (data, textStatus, jqXHR) {
                var xx = data;
                //  $("#messageDiv").html("found : " + data.results.bindings.length);
                $("#waitImg").css("display", "none");
                /*  if (data.results.bindings.length == 0)
    return callback({data.results.bindings:},[])*/
                callback(null, data)

            }
            , error: function (err) {
                $("#messageDiv").html(err.responseText);

                $("#waitImg").css("display", "none");
                console.log(JSON.stringify(err))
                console.log(JSON.stringify(query))
                if (callback) {
                    return callback(err)
                }
                return (err);
            }

        });
    }

    self.addWikiPagesToTree = function (subject) {
        var query = "prefix skos: <http://www.w3.org/2004/02/skos/core#>  prefix foaf: <http://xmlns.com/foaf/0.1/>" +
            "SELECT  * WHERE {" +
            "  ?category foaf:page ?page. ?category foaf:topic ?subject  " +
            "  filter(?subject=<" + subject.id + ">)" +
            "} limit 1000"
        self.querySPARQL_proxy(query, self.sparqlServerUrl, {}, {}, function (err, result) {

            if (err) {
                return console.log(err);
            }
            var nodes = []
            result.results.bindings.forEach(function (item) {
                var page = item.page.value;
                // var prefLabel = item.conceptLabel.value;
                var pageLabel = page.substring(page.lastIndexOf("/") + 1)
                var node = {
                    data: {
                        type: "wikiPage",
                    },
                    treeDivId: "treeDiv1",
                    icon: "concept-icon.png",
                    id: page,
                    parent: subject.id,
                    text: pageLabel,
                }
                nodes.push(node);

            })

            common.addNodesToJstree("treeDiv1", subject.id, nodes);


        })
    }

    self.getWikiPagesWords = function (page) {
        var query = {
            "query": {
                "match": {pageName: page.text}
            },
            "_source": ["content"],
            "from": 0,
            "size": 100
        }
        var payload = {
            executeQuery: JSON.stringify(query),
            indexes: JSON.stringify(["mediawiki-pages-*"]),
            url: "http://vps254642.ovh.net:2009/"

        }


        $.ajax({
            type: "POST",
            url: "/elastic",
            data: payload,
            dataType: "json",

            success: function (data, textStatus, jqXHR) {
                var xx = data;

                var content = data.hits.hits[0]._source.content;


                var url = "http://vps254642.ovh.net:2009/_analyze";
                var body = {
                    headers: JSON.stringify({
                        headers: {
                           // 'content-type': 'application/json'
                        }
                    }),
                    params: {
                        "tokenizer": "standard",
                        "filter": [
                            "stop"
                        ],
                        "text": content
                    }
                }


                var payload = {
                    httpProxy: 1,
                    POST: 1,
                    url: url,
                    body: body

                }


                $.ajax({
                    type: "POST",
                    url: "/elastic",
                    data: payload,
                    dataType: "json",
                    success: function (data, textStatus, jqXHR) {
                        var xx = data;


                    }
                    , error: function (err) {
                        $("#messageDiv").html(err.responseText);


                    }
                })

            }
        })
    }


            return self;


    })
        ()
