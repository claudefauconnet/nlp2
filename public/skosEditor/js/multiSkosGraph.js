var multiSkosGraph = (function () {
    var self = {};
    self.distinctThesaurus = {};
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
        for (var key in thesaurusList) {

            var color = thesaurusList[key]

            html += "<li><input type='checkbox' checked='checked' class='thesCBX' id='thes_" + key + "'><span style='color:" + color + "'>" + key + "</span></li>"

        }
        html += "</ul>"
        $("#thesaurusListDiv").html(html);
    }

    self.drawConceptGraph = function (word, keepMatchingConcepts) {

        var uniqueMatchingConcepts = []
        var exactMatch = $("#exactMatchCBX").prop("checked")
        self.distinctThesaurus = {};
        var rootNodeColor = "#dda";
        var rootNodeSize = 20
        $("#graphDiv").width($(window).width() - 300)
        self.queryElastic(word, function (err, result) {
            if (err)
                return console.log(err);
            var hits = result.hits.hits;


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
            visjsData.nodes.push(rooNode)


            hits.forEach(function (hit) {

                var thesaurus
                if (hit._source.thesaurus)
                    thesaurus = hit._source.thesaurus.replace(/\s/g, "_");
                else
                    thesaurus = "LOC"

                if (!self.distinctThesaurus[thesaurus]) {

                    self.distinctThesaurus[thesaurus] = palette[Object.keys(self.distinctThesaurus).length]
                }

                var ancestorsStr = hit._source.ancestors;
                ancestorsStr = thesaurus + "," + ancestorsStr;
                var nodes = ancestorsStr.split(",");

                var ancestorsIdsStr = hit._source.ancestorsIds;
                ancestorsIdsStr = "TH_" + thesaurus + "," + ancestorsIdsStr
                var ancestorsIds = ancestorsIdsStr.split(",");


                var lastNode = nodes[nodes.length - 1];
                if (!keepMatchingConcepts) {
                    if (uniqueMatchingConcepts.indexOf(lastNode.toLocaleLowerCase()) < 0)
                        uniqueMatchingConcepts.push(lastNode.toLocaleLowerCase())
                }
                if (exactMatch) {

                    if (word.toLowerCase() != lastNode.toLowerCase())
                        return;

                }


                nodes.forEach(function (node, index) {


                    var id = ancestorsIds[index];


                    var color = self.distinctThesaurus[thesaurus];


                    if (thesaurusMatching.indexOf(thesaurus) < 0)
                        thesaurusMatching.push(thesaurus)
                    if (uniqueNodes.indexOf(id) < 0) {
                        uniqueNodes.push(id)

                        var shape = "box";
                        var size = 20;
                        if (("" + id).indexOf("TH_") == 0)
                            shape = "star";
                        size = 30;

                        if (index == nodes.length - 1) {
                            shape = "dot";
                            color = rootNodeColor;
                            size = 10;
                        }

                        var visjNode = {
                            label: node,
                            id: id,
                            color: color,
                            data: {thesaurus: thesaurus},
                            shape: shape,
                            size: size,
                            /*  length:index*30,
                              physics:true*/
                        }

                        visjsData.nodes.push(visjNode)
                    }
                    if (index > 0) {

                        var edge = (
                            {
                                from: ancestorsIds[index - 1],
                                to: id,
                                type: parent
                            }
                        )
                        if (uniqueEdges.indexOf(edge.from + "-" + edge.to) < 0) {
                            uniqueEdges.push(edge.from + "-" + edge.to)
                            visjsData.edges.push(edge)
                        }
                    } else {

                        //   visjsData.edges.push({from:word,to:id})
                    }
                    if (index == nodes.length - 1) {
                        visjsData.edges.push({from: word, to: id})
                    }

                })

            })


            //edges transverses
            if (false) {
                visjsData.nodes.forEach(function (node1) {
                    visjsData.nodes.forEach(function (node2) {
                        if (node1.id > node2.id && node1.label.toLowerCase() == node2.label.toLowerCase())
                            visjsData.edges.push({from: node1.id, to: node2.id, color: "grey"})

                    })
                })
            }


            visjsGraph.draw("graphDiv", visjsData, {onclickFn: multiSkosGraph.onNodeClick})


            self.setTheaurusList(self.distinctThesaurus);
            if(!keepMatchingConcepts) {
                //   $("#matchingConceptsSelect").val("");
                common.fillSelectOptions("matchingConceptsSelect",uniqueMatchingConcepts)
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
        $(".thesCBX").parent().css("border-style", "none")
        $("#" + "thes_" + obj.data.thesaurus).parent().css("border", "2px blue solid")
    }

    self.onThesCBXChange = function (ev) {

        var checked = $(this).prop("checked")
        self.filterGraphByThesaurus();

    }


    self.queryElastic = function (queryString, callback) {
        var query = {

            "query": {
                "bool": {
                    "must": [
                        {
                            "query_string": {
                                "query": queryString,
                                "default_field": "prefLabels",
                                "default_operator": "AND"
                            }
                        }
                    ]
                }
            },
            "from": 0,
            "size": 1000,
        }

        var strQuery = JSON.stringify(query, null, 2);
        console.log(strQuery)
        var payload = {
            executeQuery: strQuery,
            indexes: JSON.stringify(["flat_thesaurus"])

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

                console.log(err.responseText)
                if (callback) {
                    return callback(err)
                }
                return (err);
            }

        });


    }
    self.filterGraphByThesaurus = function () {
        var selectedThesaurus = [];
        $(".thesCBX").each(function () {

            if ($(this).prop("checked")) {
                selectedThesaurus.push($(this).attr("id"))
            }

        })

        var nodesToHide = []
        var nodes = visjsGraph.data.nodes.get()
        nodes.forEach(function (node) {

            if (node.data && selectedThesaurus.indexOf("thes_" + node.data.thesaurus) < 0) {
                node.hidden = true;
            } else {
                node.hidden = false;
            }
        })

        visjsGraph.data.nodes.update(nodes)


    }
    self.zoomOnSelectedMatchingConcept = function () {
        var value = $("#matchingConceptsSelect").val();
        self.drawConceptGraph(value,true);
    }


    return self;

})()


