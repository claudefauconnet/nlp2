var multiSkosGraph2 = (function () {
    var self = {};
    self.distinctThesaurus = {};
    self.context = {}
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
            console.log(thesaurusList);
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
        var uniqueMatchingConcepts = {}
        var exactMatch = $("#exactMatchCBX").prop("checked")
        self.distinctThesaurus = {};
        var rootNodeColor = "#dda";
        var rootNodeSize = 20
        $("#graphDiv").width($(window).width() - 300)
        self.queryElastic(word, options, function (err, result) {
            if (err)
                return console.log(err);
            var hits = result.hits.hits;
            var thesaurusNodeIds = [];


            var thesaurusMatching = []
            var visjsData = {nodes: [], edges: []}
            var uniqueNodes = []
            var uniqueEdges = [];
            var rooNode = {
                label: word,
                id: word,
                color: rootNodeColor,
                size: rootNodeSize

            }
            visjsData.nodes.push(rooNode);


            hits.forEach(function (hit) {

                var thesaurus = hit._source.thesaurus.replace(/\s/g, "_");
                if (!self.distinctThesaurus[thesaurus]) {

                    self.distinctThesaurus[thesaurus] = palette[Object.keys(self.distinctThesaurus).length]
                }
                var color = self.distinctThesaurus[thesaurus];


                if (exactMatch) {
                    var histWords=hit._source.prefLabels.replace(/\*/g, "").toLowerCase().split(",")
                    if (histWords.indexOf(word.replace(/\*/g, "").toLowerCase())<0 )
                        return;

                }

                if (!options.keepMatchingConcepts) {
                    var str3 = hit._source.prefLabels.toLocaleLowerCase()
                    if (!uniqueMatchingConcepts[str3])
                        uniqueMatchingConcepts[str3] = ""
                    uniqueMatchingConcepts[str3] += thesaurus.substring(0, 5) + ","
                }

                var thesaurusNodeId = "TH_" + thesaurus
                var theaurusNodeEdge = false;
                if (false && thesaurusNodeIds.indexOf(thesaurusNodeId) < 0) {
                    thesaurusNodeIds.push(thesaurusNodeId);
                    var theasaurusNode = {
                        label: thesaurus,
                        id: thesaurusNodeId,
                        color: color,
                        size: 30,
                        shape: "star"
                    }
                    visjsData.nodes.push(theasaurusNode);

                }


                var ancestorsStr = hit._source.ancestors;

                var ancestorsStr = ancestorsStr.replace(/\|/g, "\n")


                var regex = /(_*)(.*);(.*)/g
                var array;
                var previouslLevel = 1;
                var uniqueNodesLevels = {}
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
                                from: rooNode.id,
                                to: id,
                                type: "match"
                            })
                        } else if (level == previouslLevel) {
                            var parent = uniqueNodesLevels[level - 1][uniqueNodesLevels[level - 1].length - 1]
                            visjsData.edges.push({
                                from: parent,
                                to: id,
                                type: "match",
                                arrow: "to"

                            });
                        } else if (level > previouslLevel) {
                            visjsData.edges.push({
                                from: uniqueNodes[uniqueNodes.length - 2],
                                to: id,
                                type: "match",
                                arrow: "to"

                            });
                        } else if (level < previouslLevel) {
                            var parent = uniqueNodesLevels[level - 1][uniqueNodesLevels[level].length]
                            visjsData.edges.push({
                                from: parent,
                                to: id,
                                type: "match",
                                arrow: "to"

                            });
                            if (false && theasaurusNode && theasaurusNode.id && level > 1) {
                                var thesEdge = {
                                    from: id,
                                    to: theasaurusNode.id,
                                    type: "inThesaurus"
                                }
                                if (!theaurusNodeEdge)
                                    theaurusNodeEdge = true;
                                else
                                    thesEdge.physics = false;
                                visjsData.edges.push(thesEdge);
                            }

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
                if (false && theasaurusNode && theasaurusNode.id && level > 1) {
                    var thesEdge = {
                        from: uniqueNodes[uniqueNodes.length - 1],
                        to: theasaurusNode.id,
                        type: "inThesaurus"
                    }
                    visjsData.edges.push(thesEdge);
                }


            })


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


        })


    }


    self.onNodeClick = function (obj, point) {

        self.showNodeInfos(obj);
        $(".thesCBX").parent().css("border-style", "none")
        $("#" + "thes_" + obj.data.thesaurus).parent().css("border", "2px blue solid")
    }

    self.onThesCBXChange = function (ev) {

        var checked = $(this).prop("checked")
        self.filterGraphByThesaurus();

    }

    self.showNodeInfos = function (node) {
        var str=node.id;
        var p;
        if((p=str.indexOf("."))>-1)
           str=str.substring(p+1)
        if((p=str.indexOf("/"))>-1)
            str=str.substring(p+1)
        if((p=str.indexOf("#"))>-1)
            str=str.substring(p+1)
        str=str.replace(/[-_]/g," ")
        var queryString = "*" +str;


        self.queryElastic(queryString, {default_field: "ancestors"}, function (err, result) {
            if (err)
                return console.log(err);
            var hits = result.hits.hits;
            hits.sort(function(a,b){
                if(a._source.prefLabels>b._source.prefLabels)
                    return 1
                if(b._source.prefLabels>a._source.prefLabels)
                    return -1
                return 0;
            })
            var childrenStr = "<ul>"
            hits.forEach(function (hit) {
                var id=hit._source.prefLabels.split(",")[0]
                if(id!="")
                childrenStr += "<li onclick='multiSkosGraph2.drawConceptGraph(\"" + id+ "\")'>" + hit._source.prefLabels + "</li>"

            })
            childrenStr += "</ul>"

            var str = "<span class='title'>" + node.prefLabels + "</span>";
            var str = "<span class='title'>" + node.id + "</span>";
            str += childrenStr;

            $("#infosDiv").html(str)
        })
    }


    self.queryElastic = function (queryString, options, callback) {
        var default_field = "prefLabels";
        if (options.default_field)
            default_field =options.default_field
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


    return self;

})
()


