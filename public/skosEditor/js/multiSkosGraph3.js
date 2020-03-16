var multiSkosGraph2 = (function () {
    var self = {};

    var maxEdges = 200
    self.distinctThesaurus = {};
    self.context = {currentSelectdNode: null};

    var palette = [
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

    var colorsMap = {}


    self.setTheaurusList = function (thesaurusList) {
        var html = "<ul>"
        html += " <li><input type='checkbox' checked='checked' onchange='multiSkosGraph2.switchThesCbxs($(this))' class='thesCBXall' id='thes_all" + "'>"
        for (var key in thesaurusList) {
            //    console.log(thesaurusList);
            var color = thesaurusList[key]

            html += "<li><input type='checkbox' checked='checked' class='thesCBX' id='thes_" + key + "'><span style='color:" + color + "'>" + key + "</span></li>"

        }
        html += "</ul>"
        $("#thesaurusListDiv").html(html);
        $(".thesCBX").bind('change', multiSkosGraph2.onThesCBXChange);
    }


    self.drawConceptGraph = function (word, options) {

        self.context.currentWord = word
        if (!options)
            options = {};
        $("#waitImg").css("display", "block");
        $("#rigthDivWikidataSelect").html("")
        $("#rigthDivDetails").html("")
        $("#definitionsDiv").html("")
        var uniqueMatchingConcepts = {}
        var exactMatch = $("#exactMatchCBX").prop("checked")
        var rootNodeColor = "#dda";
        var rootNodeSize = 20
        $("#graphDiv").width($(window).width() - 600)

        var thesaurusMatching = []
        var visjsData = {nodes: [], edges: []}
        var uniqueNodes = []
        var uniqueEdges = [];
        var edgesCount = 0;
        var thesaurusNodeIds = [];


        self.rootNode = {
            label: word,
            id: word,
            color: rootNodeColor,
            size: rootNodeSize
        }
        visjsData.nodes.push(self.rootNode);


        var paths = [];
        async.series([


            // rootNode
            function (callbackSeries) {

                callbackSeries()
            },

            function (callbackSeries) {
                if (!$("#queryElasticCbx").prop("checked"))
                    return callbackSeries();
                self.queryElastic(word, options, function (err, result) {
                    if (err)
                        return console.log(err);
                    var hits = result.hits.hits;
                    hits.forEach(function (hit) {
                        paths.push(hit._source)
                    })
                    callbackSeries()

                })
            },
            function (callbackSeries) {
                paths.forEach(function (path) {

                    var thesaurus = path.thesaurus.replace(/\s/g, "_");

                    var color = self.distinctThesaurus[thesaurus];

                    if (!options.keepMatchingConcepts) {
                        var str3 = path.prefLabels.toLocaleLowerCase()
                        if (!uniqueMatchingConcepts[str3])
                            uniqueMatchingConcepts[str3] = ""
                        uniqueMatchingConcepts[str3] += thesaurus.substring(0, 5) + ","
                    }


                    if (exactMatch) {
                        var histWords = path.prefLabels.replace(/\*/g, "").toLowerCase().split(",")
                        if (histWords.indexOf(word.replace(/\*/g, "").toLowerCase()) < 0)
                            return;

                    }


                    var thesaurusNodeId = "TH_" + thesaurus
                    var theaurusNodeEdge = false;
                    if (false && thesaurusNodeIds.indexOf(thesaurusNodeId) < 0) {
                        thesaurusNodeIds.push(thesaurusNodeId);
                        var thesaurusNode = {
                            label: thesaurus,
                            id: thesaurusNodeId,
                            color: color,
                            size: 30,
                            shape: "star"
                        }
                        visjsData.nodes.push(thesaurusNode);

                    }

                    var newVisjsData = self.pathsToVisjsData(path)

                    newVisjsData.nodes.forEach(function (node) {
                        visjsData.nodes.push(node)
                    })
                    newVisjsData.edges.forEach(function (edge) {
                        visjsData.edges.push(edge)
                    })

                })


                callbackSeries()
            },


// draw graph with ElasticData
            function (callbackSeries) {

                var edgesCount = visjsData.edges.length;
                if (edgesCount > maxEdges) {
                    return alert("too many edges :select a specific value")
                }

                visjsGraph.draw("graphDiv", visjsData, {
                    onclickFn: multiSkosGraph2.onNodeClick,
                    afterDrawing: function () {
                        $("#waitImg").css("display", "none")
                    }
                })

                if (!options.selectedThesaurus)
                    self.setTheaurusList(self.distinctThesaurus);


                if (!options.keepMatchingConcepts) {
                    var array = [];
                    var keys = Object.keys(uniqueMatchingConcepts);
                    keys.sort();
                    keys.forEach(function (key) {

                        array.push({text: key + " : " + uniqueMatchingConcepts[key], value: key})
                    })
                    //   $("#matchingConceptsSelect").val("");
                    $("#matchingConceptsSelect").prop("size", 10)
                    common.fillSelectOptions("matchingConceptsSelect", array, false, "text", "value")
                }

                $(".thesCBX").parent().css("background-color", "none")
                $(".thesCBX").parent().css("border", "none")
                thesaurusMatching.forEach(function (thesaurus) {
                    thesaurus = "thes_" + thesaurus
                    $("#" + thesaurus).parent().css("background-color", "#ddd")
                })
                callbackSeries()
            },


            //get Wikidata and BNF -> show first items
            function (callbackSeries) {
                if (!$("#queryWikidataCbx").prop("checked"))
                    return callbackSeries();
                sparql_abstract.list("Wikidata", word, {}, function (err, bindings) {
                    if (err) {
                        console.log(err);
                        callbackSeries()
                    }

                    var index = 0;
                    async.eachSeries(bindings, function (item, callbackEach) {
                            sparql_abstract.getDetails("Wikidata", item.id, {}, function (err, details) {
                                bindings[index].FrenchVikidiaID = details.properties["P7818"]
                                bindings[index].parent = details.properties["P31"] || details.properties["P279"];
                                index++;
                                callbackEach()

                            })
                        }
                        ,

                        function (err) {
                            var wikiDatList = [];
                            bindings.forEach(function (item, index) {
                                var parent = "/";
                                wikiDatList.push({id: item.id, label: item.label + " / " + item.parent.value})
                            })
                            common.fillSelectOptions("rigthDivWikidataSelect", wikiDatList, null, "label", "id")
                        })






                })
                return callbackSeries();
            },
        ])


    }
    self.pathsToVisjsData = function (path) {
        var thesaurus = path.thesaurus
        var color = self.distinctThesaurus[thesaurus];
        var ancestorsStr = path.ancestors;
        var ancestorsStr = ancestorsStr.replace(/\|/g, "\n")

        var visjsData = {nodes: [], edges: []}
        var regex = /(_*)(.*);(.*)/g
        var array;
        var previouslLevel = 1;
        var uniqueNodesLevels = {}
        var uniqueNodes = []
        while ((array = regex.exec(ancestorsStr)) != null) {
            var level = array[1].length;
            var id = array[2];
            var name = array[3];


            if (uniqueNodes.indexOf(id) < 0) {
                uniqueNodes.push(id);
                if (!uniqueNodesLevels[level])
                    uniqueNodesLevels[level] = [];
                uniqueNodesLevels[level].push(id);


                if (level == 1) {
                    visjsData.edges.push({
                        from: self.rootNode.id,
                        to: id,
                        id:self.rootNode.id+"_" +id,
                        type: "match",
                        arrows: "to",
                        label: thesaurus,
                        font: {
                            color: color,
                            weight: "bold",
                            size: 12
                        }
                    })
                } else if (level == previouslLevel) {
                    var parent = uniqueNodesLevels[level - 1][uniqueNodesLevels[level - 1].length - 1]
                    visjsData.edges.push({
                        from: parent,
                        to: id,
                        type: "match",
                        arrows: "to",
                        id:parent+"_" +id


                    });
                } else if (level > previouslLevel) {
                    var from=uniqueNodes[uniqueNodes.length - 2];
                    visjsData.edges.push({
                        from: from,
                        to: id,
                        type: "match",
                        arrows: "to",
                        id:from+"_" +id


                    });
                } else if (level < previouslLevel) {

                    var parent = uniqueNodesLevels[level - 1][uniqueNodesLevels[level - 1].length - 1]
                    visjsData.edges.push({
                        from: parent,
                        to: id,
                        type: "match",
                        arrows: "to",
                        id:parent+"_" +id

                    });
                }

                if (level == 1) {
                    shape = "dot";
                    //   color = rootNodeColor;
                    size = 10;
                } else {
                    color = self.distinctThesaurus[thesaurus];
                    var shape = "box";
                    var size = 20;
                }


                var visjNode = {
                    label: name,
                    id: id,
                    color: color,
                    data: {thesaurus: thesaurus, ancestors: ancestorsStr},
                    shape: shape,
                    size: size,

                }

                visjsData.nodes.push(visjNode);

            }
            previouslLevel = level;


        }


        return visjsData;

    }


    self.onNodeClick = function (obj, point) {
        $(".thesCBX").parent().css("border-style", "none")
        $("#" + "thes_" + obj.data.thesaurus).parent().css("border", "2px blue solid")

        var webThesaurus=["Wikidata","BNF"]
        if(webThesaurus.indexOf(obj.data.thesaurus)>-1){
            self.showNodeChildren(obj);
        } else {
            self.showNodeInfosElastic(obj);
        }
    }


    self.showBNFgraph = function (item) {
        sparql_abstract.getAncestor("BNF", item.id, {exectMatch: exactMatch}, function (err, result) {

            if (err)
                return console.log(err);
            var existingNodes = visjsGraph.data.nodes.getIds()
            result.forEach(function (item) {
                var newVisjsData = self.pathsToVisjsData(item)

                newVisjsData.nodes.forEach(function (node) {
                    if (existingNodes.indexOf(node.id < 0))
                        visjsGraph.data.nodes.add(node)
                })
                newVisjsData.edges.forEach(function (edge) {
                    visjsGraph.data.edges.add(edge)
                })
            })

        })
    }

    self.onThesCBXChange = function (ev) {

        var checked = $(this).prop("checked")
        self.filterGraphByThesaurus();

    }

    self.showNodeInfosElastic = function (node) {
        $("#infosDiv").html("")
        var str = node.id;
        str=str.replace(/[:\/\.@#]/g," ")
        var queryString = "*" + str;

        self.queryElastic(queryString, {default_field: "ancestors"}, function (err, result) {
            if (err)
                return console.log(err);
            var hits = result.hits.hits;

            var children = [];
            hits.forEach(function (hit) {
                var ancestors=hit._source.ancestors;
               var p=ancestors.indexOf(node.id)
                   var childrenStr=ancestors.substring(0,p);
               var q=childrenStr.lastIndexOf("|")
                if(q>-1){
                    var q2=childrenStr.lastIndexOf("|")
                    if(q2>-1){
                        var array=childrenStr.split(";")
                        children.push({id:nodeId,narrowerId:array[0],narrowerLabel:array[1]});

                    }
                }
            })
            self.addChildrenNodesToGraph(obj,children)
        })
    }


    self.showNodeChildren = function (obj) {
        sparql_abstract.getChildren(obj.data.thesaurus, obj.id, {}, function (err, children) {
            if (err)
                return console.log(err);
            self.addChildrenNodesToGraph(obj,children)

        })
    }




    self.addVisJsDataToGraph=function(newVisjsData){

        var existingNodes = visjsGraph.data.nodes.getIds();
        var existingEdges = visjsGraph.data.edges.getIds();
        newVisjsData.nodes.forEach(function (node) {
            if (existingNodes.indexOf(node.id) < 0) {
                visjsGraph.data.nodes.add(node)
            }
        })
        newVisjsData.edges.forEach(function (edge) {
            if (existingEdges.indexOf(edge.from+"_"+edge.to) < 0) {
                visjsGraph.data.edges.add(edge)
            }
        })



    }
    self.addChildrenNodesToGraph=function(parent,children){

        if (self.context.selectedNode && self.context.selectedNode.id == parent.id) {//bascule
            visjsGraph.data.nodes.remove(self.newNodes)
            visjsGraph.data.edges.remove(self.newEdges)
            self.context.selectedNode.id = null;

        } else {


            self.context.newNodes = [];
            self.context.newEdges = [];
            var existingNodes = visjsGraph.data.nodes.getIds();
            var existingEdges = visjsGraph.data.edges.getIds();

            var color = parent.color;
            children.forEach(function (item) {
                if (existingNodes.indexOf(item.narrowerId) < 0) {
                    self.context.newNodes.push({
                        label: item.narrowerLabel,
                        id: item.narrowerId,
                        shape: "triangle",
                        data: {thesaurus: parent.data.thesaurus, parent: parent.id},
                        color: color
                    })
                    if (existingEdges.indexOf(parent.id+"_"+item.narrowerId) < 0) {
                        self.context.newEdges.push({
                            from: parent.id,
                            to: item.narrowerId,
                            id: parent.id + "_" + item.narrowerId

                        })
                    }
                }
            })
            visjsGraph.data.nodes.add(self.context.newNodes)
            visjsGraph.data.edges.add(self.context.newEdges)
            self.context.selectedNode = parent;
        }

    }


    self.showNodeInfosWikidata = function (obj) {

    }


    self.queryElastic = function (queryString, options, callback) {
        var default_field = "prefLabels";
        if (options.default_field)
            default_field = options.default_field
        var query = {

            "query": {
                "bool": {
                    "must": [
                        {
                            "query_string": {
                                "query": queryString,
                                "default_field": default_field,
                                "default_operator": "AND"
                            }
                        }
                    ]
                }
            },
            "from": 0,
            "size": 1000,
        }

        if (options.selectedThesaurus) {
            query.query.bool.must.push({terms: {thesaurus: options.selectedThesaurus}})
        }


        var strQuery = JSON.stringify(query, null, 2);
        console.log(strQuery)
        var payload = {
            executeQuery: strQuery,
            indexes: JSON.stringify(["flat_thesaurus2"])

        }
        $.ajax({
            type: "POST",
            url: "/elastic",
            data: payload,
            dataType: "json",
            success: function (data, textStatus, jqXHR) {
                var xx = data;
                callback(null, data)

            }
            , error: function (err) {
                $("#waitImg").css("display", "none");
                console.log(err.responseText)
                if (callback) {
                    return callback(err)
                }
                return (err);
            }

        });


    }

    self.switchThesCbxs = function (cbx) {
        var checked = ($(cbx).prop('checked'));
        $(".thesCBX").each(function () {
            $(this).prop("checked", checked)
        })
        self.filterGraphByThesaurus();
    }
    self.filterGraphByThesaurus = function () {
        var selectedThesaurus = [];
        $(".thesCBX").each(function () {

            if ($(this).prop("checked")) {
                selectedThesaurus.push($(this).attr("id").substring(5))
            }

        })

        var nodesToHide = []
        self.drawConceptGraph(self.context.currentWord, {selectedThesaurus: selectedThesaurus});

        /*  var nodes = visjsGraph.data.nodes.get()
           nodes.forEach(function (node) {

               if (node.data && selectedThesaurus.indexOf("thes_" + node.data.thesaurus) < 0) {
                   node.hidden = true;
               } else {
                   node.hidden = false;
               }
           })
           visjsGraph.network.stopSimulation();
           visjsGraph.simulationOn = false;
           visjsGraph.data.nodes.update(nodes)*/


    }
    self.zoomOnSelectedMatchingConcept = function () {
        var value = $("#matchingConceptsSelect").val();
        self.drawConceptGraph(value, {keepMatchingConcepts: true});
    }

    self.loadThesaurusList = function (callback) {

        var query = {
            "aggs": {
                "thesaurus": {
                    "terms": {
                        "field": "thesaurus"
                    }
                }
            }
            , "size": 0
        }
        var payload = {
            executeQuery: JSON.stringify(query),
            indexes: JSON.stringify(["flat_thesaurus2"])

        }

        $.ajax({
            type: "POST",
            url: "/elastic",
            data: payload,
            dataType: "json",

            success: function (data, textStatus, jqXHR) {
                var items = data.aggregations.thesaurus.buckets;
                items.forEach(function (item) {
                    self.distinctThesaurus[item.key] = palette[Object.keys(self.distinctThesaurus).length]
                })

                self.distinctThesaurus["BNF"] = palette[Object.keys(self.distinctThesaurus).length]
                self.distinctThesaurus["Wikidata"] = palette[Object.keys(self.distinctThesaurus).length]


            }
            , error: function (err) {
                $("#waitImg").css("display", "none");
                console.log(err.responseText)
                if (callback) {
                    return callback(err)
                }
                return (err);
            }

        });
    }

    self.removeThesaurusNodes = function (thesaurus) {
        var allNodes = visjsGraph.data.nodes.get();
        var thesaurusNodes = [];
        allNodes.forEach(function (item) {
            if (item.data && item.data.thesaurus == thesaurus)
                thesaurusNodes.push(item.id)

        });
        visjsGraph.data.nodes.remove(thesaurusNodes)

    }

    self.showWikiDataDetailsAndAncestors = function (id) {
        var BNFid = null;
        var LOCid=null;
        async.series([
            //draw ancestors
            function (callbackSeries) {
                sparql_abstract.getAncestor("Wikidata", id, {}, function (err, result) {
                    if (err)
                        return callbackSeries(err);

                    self.removeThesaurusNodes("Wikidata")
                    result.forEach(function (item) {
                        var newVisjsData = self.pathsToVisjsData(item);
                        self.addVisJsDataToGraph(newVisjsData);

                    })
                })

                return callbackSeries()
            },
            //showDetails
            function (callbackSeries) {
                sparql_abstract.getDetails("Wikidata", id,{}, function (err, result) {
                    var str = ""
                    for (var key in result.properties) {
                        if (key == "P268")
                            BNFid = result.properties[key].value
                        if(key=="P244")
                            LOCid= result.properties[key].value

                        if (key.indexOf('image') > -1) {
                            str += "<img src='" +  result.properties[key].value + "' width='200px'/></br>"
                        } else {
//var link="<a target='_blank' href='"+result.properties[key].id+"'>"
                            str += "<span style='font-style: italic'>" + result.properties[key].name + " : </span>" + "<span style='font-weight: bold'>" +  result.properties[key].value + "</span><br>";
                        }
                    }

                    $("#rigthDivDetails").html(str)
                    return callbackSeries()
                })

            },

            //show BNF ancestors
            function (callbackSeries) {
                if (!BNFid)
                    return callbackSeries()

                sparql_abstract.getAncestor("BNF", "http://data.bnf.fr/ark:/12148/cb"+BNFid, {}, function (err, bindings) {
                    if (err)
                        return callbackSeries();
                    self.removeThesaurusNodes("BNF")
                    bindings.forEach(function (item) {
                        var newVisjsData = self.pathsToVisjsData(item)
                        self.addVisJsDataToGraph(newVisjsData);


                    })



                    return callbackSeries()
                })


            }
,
            //show BNF ancestors
            function (callbackSeries) {
                if (!LOCid)
                    return callbackSeries()

                sparql_abstract.getAncestor("LOC", LOCid, {}, function (err, bindings) {
                    if (err)
                        return callbackSeries();


                    return
                    self.addVisJsDataToGraph(newVisjsData);
                    self.removeThesaurusNodes("BNF")
                    bindings.forEach(function (item) {
                        var newVisjsData = self.pathsToVisjsData(item)



                        newVisjsData.nodes.forEach(function (node) {
                            visjsGraph.data.nodes.add(node)
                        })
                        newVisjsData.edges.forEach(function (edge) {
                            visjsGraph.data.edges.add(edge)
                        })
                    })



                    return callbackSeries()
                })


            }


        ], function (err) {
            if (err)
                return console.log(err);
        })

    }

    return self;

})
()


