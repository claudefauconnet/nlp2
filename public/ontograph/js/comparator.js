var Comparator = (function () {

        var self = {};


        self.showDialog = function () {

            var graphsUrisOptions = "";
            for (var key in app_config.ontologies) {
                var selected = ""
                if (key != app_config.currentOntology)
                    graphsUrisOptions += "<option " + selected + "value='" + app_config.ontologies[key].conceptsGraphUri + "'>" + key + "</option>";

            }
            var html = "<table>"
            html += "<tr><td> targetGraphUri</td><td> <select id='comparator_targetGraphUriSelect'>" + graphsUrisOptions + "</select></td></tr>"
            html += "<tr><td> outputType</td><td> <select id='comparator_outputTypeSelect'><option>graph</option><option>table</option><option>stats</option></option></select></td></tr>"
            html += "<tr><td>  <button onclick='Comparator.compareConcepts();'>Compare</button></td></tr>"
            html += "</table>"


            $("#dialogDiv").html(html);
            $("#dialogDiv").dialog("open")


        }


        self.compareConcepts = function () {


            self.targetThesaurusGraphURI = $("#comparator_targetGraphUriSelect").val()

            var output = $("#comparator_outputTypeSelect").val();

            var lang = "en"
            if (!self.targetThesaurusGraphURI)
                return;

            var sourceConceptAggrDepth = 6;
            var targetConceptAggrDepth = 6;
            var sliceSize = 20;

            var allSourceConcepts = [];
            var commonConceptsMap = {};
            $("#dialogDiv").dialog("close")

            if (output == "stats") {
                return self.getdescendantsMatchingStats(sourceConceptAggrDepth, targetConceptAggrDepth)


            }
            async.series([

                    //getDescendants
                    function (callbackSeries) {
                        //    return callbackSeries();

                        Concepts.getConceptDescendants({depth: sourceConceptAggrDepth, selectLabels: true}, function (err, conceptsSets) {
                            if (err)
                                return callbackSeries(err);


                            conceptsSets.forEach(function (conceptSet) {
                                conceptSet.labels.forEach(function (conceptLabel, index) {
                                    allSourceConcepts.push({
                                        id: conceptSet.ids[index],
                                        label: conceptLabel,
                                    });
                                    var id = conceptSet.ids[index];
                                    commonConceptsMap[conceptLabel.toLowerCase()] = {source: {id: conceptSet.ids[index], label: conceptLabel, broaders: []}}

                                })
                            })


                            callbackSeries();
                        })

                    },


                    //count matching target concept for each source concept
                    function (callbackSeries) {
                        if (output != "stats")
                            return callbackSeries();
                        var sourceConceptsSlices = common.sliceArray(allSourceConcepts, sliceSize)
                        async.eachSeries(sourceConceptsSlices, function (sourceConcepts, callbackEach) {

                            var regexStr = "("
                            sourceConcepts.forEach(function (concept, index) {
                                if (index > 0)
                                    regexStr += "|";
                                regexStr += concept.label;
                            })
                            regexStr += ")"


                            var filter = "  regex(?prefLabel, \"^" + regexStr + "$\", \"i\")";
                            if (false) {
                                filter = "  regex(?prefLabel, \"" + regexStr + "\", \"i\")";
                            }
                            var query = "PREFIX skos: <http://www.w3.org/2004/02/skos/core#>" +
                                "SELECT count(*) " +
                                "WHERE {" +
                                "?id skos:prefLabel ?prefLabel ." +
                                "FILTER (lang(?prefLabel) = '" + lang + "')" +
                                " filter " + filter+"} limit 10000";




                            var url = app_config.sparql_url + "?default-graph-uri=" + encodeURIComponent(self.targetThesaurusGraphURI) + "&query=";// + query + queryOptions
                            var queryOptions = "&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=20000&debug=off"
                            sparql.querySPARQL_GET_proxy(url, query, queryOptions, null, function (err, result) {
                                if (err) {
                                    return callbackEach(err);
                                }
                                var bindings = [];
                                var ids = [];
                                if (result.results.bindings.length > 0) {
                                    result.results.bindings.forEach(function (item) {
                                    })
                                }
                                return callbackEach(err);
                            })
                        }, function (err) {
                            callbackSeries(err)
                        })
                    },


                    //search selected concepts  and descendants in targetThesaurus
                    function (callbackSeries) {
                        if (output == "stats")
                            return callbackSeries();


                        var sourceConceptsSlices = common.sliceArray(allSourceConcepts, sliceSize)
                        async.eachSeries(sourceConceptsSlices, function (sourceConcepts, callbackEach) {

                            var regexStr = "("
                            sourceConcepts.forEach(function (concept, index) {
                                if (index > 0)
                                    regexStr += "|";
                                regexStr += concept.label;
                            })
                            regexStr += ")"


                            var filter = "  regex(?prefLabel, \"^" + regexStr + "$\", \"i\")";
                            if (false) {
                                filter = "  regex(?prefLabel, \"" + regexStr + "\", \"i\")";
                            }
                            var query = "PREFIX skos: <http://www.w3.org/2004/02/skos/core#>" +
                                "SELECT DISTINCT * " +
                                "WHERE {" +
                                "?id skos:prefLabel ?prefLabel ." +
                                "FILTER (lang(?prefLabel) = '" + lang + "')" +
                                " filter " + filter


                            for (var i = 1; i < targetConceptAggrDepth; i++) {
                                if (i == 1) {
                                    query += " OPTIONAL{ ?id" + " skos:broader ?broader" + i + ". ";
                                }

                                query += " OPTIONAL{ ?broader" + i + " skos:broader ?broader" + (i + 1) + ". ";

                                query += "?broader" + i + " skos:prefLabel ?broaderLabel" + (i) + ". " +
                                    "FILTER (lang(?broaderLabel" + i + ") = '" + lang + "')"


                            }
                            query += "?broader" + i + " skos:prefLabel ?broaderLabel" + (i) + ". " +
                                "FILTER (lang(?broaderLabel" + i + ") = '" + lang + "')"

                            for (var i = 0; i < targetConceptAggrDepth; i++) {
                                query += "}"
                            }


                            query += "}" +
                                "LIMIT 10000";

                            var url = app_config.sparql_url + "?default-graph-uri=" + encodeURIComponent(self.targetThesaurusGraphURI) + "&query=";// + query + queryOptions
                            var queryOptions = "&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=20000&debug=off"
                            sparql.querySPARQL_GET_proxy(url, query, queryOptions, null, function (err, result) {
                                if (err) {
                                    return callbackEach(err);
                                }
                                var bindings = [];
                                var ids = [];
                                if (result.results.bindings.length > 0) {
                                    result.results.bindings.forEach(function (item) {


                                        var targetObj = {
                                            id: item.id.value,
                                            label: item.prefLabel.value,
                                        }
                                        var targetBroaders = []
                                        for (var i = 1; i < targetConceptAggrDepth; i++) {
                                            var broaderId = item["broader" + i]
                                            if (typeof broaderId !== "undefined") {
                                                if (targetBroaders.indexOf(broaderId.value) < 0) {
                                                    var broaderLabel = item["broaderLabel" + i];
                                                    if (typeof broaderLabel !== "undefined")
                                                        broaderLabel = item["broaderLabel" + i].value
                                                    else
                                                        broaderLabel = broaderId.value
                                                    targetBroaders.push({level: i, id: broaderId.value, label: broaderLabel});
                                                }
                                            }
                                        }
                                        targetObj.broaders = targetBroaders;
                                        if (!commonConceptsMap[item.prefLabel.value.toLowerCase()]) {

                                            return callbackEach();
                                        }
                                        commonConceptsMap[item.prefLabel.value.toLowerCase()].target = targetObj

                                    })
                                } else {

                                }
                                return callbackEach();
                            })


                        }, function (err) {
                            if (Object.keys(commonConceptsMap).length == 0) {
                                alert(("no matching concepts"))
                            }

                            return callbackSeries(err);
                        })


                    },
                    //get source broaders
                    function (callbackSeries) {
                        if (output == "stats")
                            return callbackSeries();
                        var conceptIds = []

                        for (var key in commonConceptsMap) {
                            var sourceId = commonConceptsMap[key].source.id
                            if (conceptIds.indexOf(sourceId) < 0)
                                conceptIds.push(sourceId)
                        }
                        if (conceptIds.length == 0)
                            return callbackSeries();
                        Concepts.sparql_getAncestors(conceptIds, {}, function (err, result) {
                            var sourceBroaders = [];
                            result.forEach(function (item) {


                                var sourceBroaders = []
                                for (var i = 1; i < 8; i++) {
                                    var broaderId = item["broaderId" + i]
                                    if (typeof broaderId !== "undefined") {
                                        if (sourceBroaders.indexOf(broaderId.value) < 0) {
                                            sourceBroaders.push({level: i, id: broaderId.value, label: item["broader" + i].value});
                                        }
                                    }
                                }
                                if (item.conceptPrefLabel && item.conceptPrefLabel.value.toLowerCase() && commonConceptsMap[item.conceptPrefLabel.value.toLowerCase()]) {
                                    commonConceptsMap[item.conceptPrefLabel.value.toLowerCase()].source.broaders = sourceBroaders;
                                }
                            })

                            return callbackSeries();
                        })


                    }

                    ,
                    //draw commonConcepts
                    function (callbackSeries) {

                        if (output != "graph")
                            return callbackSeries();
                        var visjsData = {nodes: [], edges: []};
                        var uniqueNodes = [];
                        var uniqueEdges = [];
                        var currentX = 0;
                        var currentY = 50;
                        var xOffset = 150;
                        var yOffset = 30;


                        function addBroaderNodes(broaders, childId, startOffest, direction, color) {
                            broaders.forEach(function (itemBroader, index) {


                                if (uniqueNodes.indexOf(itemBroader.id) < 0) {
                                    uniqueNodes.push(itemBroader.id)

                                    var broaderSourceNode = {
                                        id: itemBroader.id,
                                        label: itemBroader.label,
                                        color: color,
                                        shape: "box",
                                        fixed: {x: true, y: false},
                                        x: direction * (startOffest + (xOffset * (index + 1))),

                                    }
                                    visjsData.nodes.push(broaderSourceNode);
                                } else {
                                    visjsData.nodes.forEach(function (node) {
                                        if (node.id == itemBroader.id) {
                                            node.x = direction * (startOffest + (xOffset * (index + 1)))
                                        }

                                    })

                                }
                                var edgeFromId;
                                if (index == 0)
                                    edgeFromId = childId;
                                else
                                    edgeFromId = broaders[index - 1].id;
                                var edgeId = edgeFromId + "_" + itemBroader.id

                                if (uniqueEdges.indexOf(edgeId) < 0) {
                                    uniqueEdges.push(edgeId)
                                    visjsData.edges.push({
                                        id: edgeId,
                                        from: edgeFromId,
                                        to: itemBroader.id

                                    })
                                }


                            })
                        }


                        for (var key in commonConceptsMap) {
                            var item = commonConceptsMap[key];

                            if (uniqueNodes.indexOf(item.source.id) < 0) {
                                uniqueNodes.push(item.source.id)
                                var sourceNode = {
                                    id: item.source.id,
                                    label: item.source.label,
                                    color: "#add",
                                    shape: "box",
                                    fixed: {x: true, y: true},
                                    x: currentX,
                                    y: currentY
                                }
                                visjsData.nodes.push(sourceNode);
                                if (item.target) {
                                    if (uniqueNodes.indexOf(item.target.id) < 0) {
                                        uniqueNodes.push(item.target.id)
                                        var targetNode = {
                                            id: item.target.id,
                                            label: item.target.label,
                                            color: "#dda",
                                            shape: "box",
                                            fixed: {x: true, y: true},
                                            x: currentX + xOffset,
                                            y: currentY
                                        }
                                        visjsData.nodes.push(targetNode);
                                    }
                                    var edgeId = item.source.id + "_" + item.target.id
                                    if (uniqueEdges.indexOf(edgeId) < 0) {
                                        uniqueEdges.push(edgeId)
                                        visjsData.edges.push({
                                            id: edgeId,
                                            from: item.source.id,
                                            to: item.target.id

                                        })
                                    }
                                }
                                addBroaderNodes(item.source.broaders, item.source.id, currentX, -1, "#add");
                                if (item.target && item.target.broaders)
                                    addBroaderNodes(item.target.broaders, item.target.id, currentX + xOffset, +1, "#dda")

                            }
                            currentY += yOffset;

                        }
                        visjsGraph.draw("graphDiv", visjsData, {onclickFn: Comparator.onClickNode})
                        return callbackSeries();
                    },


                    //draw table
                    function (callbackSeries) {

                        if (output != "table")
                            return callbackSeries();
                        var nSourceBroaders = 0;
                        var nTargetBroaders = 0;
                        for (var key in commonConceptsMap) {
                            var item = commonConceptsMap[key];
                            nSourceBroaders = Math.max(nSourceBroaders, item.source.broaders.length);
                            if (item.target)
                                nTargetBroaders = Math.max(nTargetBroaders, item.target.broaders.length);
                        }

                        var csv = "";
                        for (var key in commonConceptsMap) {
                            var item = commonConceptsMap[key];

                            /*   for( var i=nSourceBroaders;i>-1;i--){
                                   if(i>=item.source.broaders.length)
                                       csv +=  "\t";
                                   else
                                       csv += item.source.broaders[i].label+ "\t";
                               }*/
                            var sourceBroadersStr = ""
                            for (var i = 0; i < nSourceBroaders; i++) {
                                if (i >= item.source.broaders.length)
                                    sourceBroadersStr += "\t";
                                else
                                    sourceBroadersStr = item.source.broaders[i].label + "\t" + sourceBroadersStr
                                // csv += item.source.broaders[i].label+ "\t";
                            }
                            csv += sourceBroadersStr;
                            csv += item.source.label + "\t";


                            if (item.target) {

                                csv += item.target.label + "\t";

                                for (var i = 0; i < nTargetBroaders; i++) {
                                    if (i >= item.target.broaders.length)
                                        csv += "\t";
                                    else
                                        csv += item.target.broaders[i].label + "\t";
                                }
                            }

                            csv += "\n";

                        }
                        console.log(csv);

                    }


                ],

                function (err) {

                    if (err)
                        return common.message(err)

                }
            )


        }

        self.onClickNode = function (node, point) {
            if (!node) {
                return Infos.setInfosDivHeight(20)
            }
            var sourceThesaurusGraphURI = app_config.ontologies[app_config.currentOntology].conceptsGraphUri
            var query = "select *" +

                "FROM <" + sourceThesaurusGraphURI + ">" +
                "FROM <" + self.targetThesaurusGraphURI + ">" +
                " where {<" + node.id + "> ?prop ?value. } limit 200";

            var url = app_config.sparql_url + "?default-graph-uri=&query=";// + query + queryOptions
            var queryOptions = "&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=20000&debug=off"
            sparql.querySPARQL_GET_proxy(url, query, queryOptions, null, function (err, result) {
                if (err) {
                    return common.message(err);
                }
                var html = "<table>"
                result.results.bindings.forEach(function (item) {

                    html += "<tr><td>" + item.prop.value + "</td><td> " + item.value.value + "</td></tr>"
                })
                html += "</table>"
                $("#infosDiv").html(html);
                Infos.setInfosDivHeight(300);


            })


        }

        self.getdescendantsMatchingStats = function (sourceConceptAggrDepth, targetConceptAggrDepth) {
            var conceptLabelsMap = {};
            var matchingConceptsTreeArray=[];
            var uniqueConceptIds=[]
            async.series([
                    function (callbackSeries) {
                        Concepts.getConceptDescendants({depth: sourceConceptAggrDepth, selectLabels: true, rawData: true}, function (err, conceptsSets) {
                            if (err)
                                return callbackSeries(err);


                            var minIndex;
                            conceptsSets.forEach(function (conceptSet) {
                                conceptSet.forEach(function (item) {
                                    for (var i = 0; i < 10; i++) {
                                        if (typeof item["concept" + i] != "undefined") {
                                            if (!minIndex) {
                                                minIndex = i;
                                            }

                                            var parentId;
                                            var parentLabel;
                                            if (i == minIndex) {
                                                parentId = "#";
                                                parentLabel="#"
                                            }else {
                                                parentId = item["concept" + (i - 1)].value
                                                parentLabel= item["conceptLabel" + (i - 1)].value
                                            }
                                            var label = item["conceptLabel" + i].value;
                                            if (!conceptLabelsMap[label.toLowerCase()])
                                                conceptLabelsMap[label.toLowerCase()] = ({parentId: parentId, parentLabel:parentLabel, parentLabel,id: item["concept" + i].value, label: label, count: 0})


                                        }

                                    }
                                })


                            })
                            callbackSeries();
                        })
                    }

                            // get matching target concepts
                            , function (callbackSeries) {
                                var allSourceConcepts = Object.keys(conceptLabelsMap);
                                var sliceSize = 50;
                                var lang="en"
                                var sourceConceptsSlices = common.sliceArray(allSourceConcepts, sliceSize);
                                async.eachSeries(sourceConceptsSlices, function (sourceConcepts, callbackEach) {

                                    var regexStr = "("
                                    sourceConcepts.forEach(function (concept, index) {
                                        if (index > 0)
                                            regexStr += "|";
                                        regexStr += concept;
                                    })
                                    regexStr += ")"


                                    var filter = "  regex(?prefLabel, \"^" + regexStr + "$\", \"i\")";
                                    if (false) {
                                        filter = "  regex(?prefLabel, \"" + regexStr + "\", \"i\")";
                                    }
                                    var query = "PREFIX skos: <http://www.w3.org/2004/02/skos/core#>" +
                                        "SELECT ?id ?prefLabel  count(?id as ?count) " +
                                        "WHERE {" +
                                        "?id skos:prefLabel ?prefLabel ." +
                                        "FILTER (lang(?prefLabel) = '" + lang + "')" +
                                        " filter " + filter+"  } GROUP by ?id ?prefLabel   limit 10000"


                                    var url = app_config.sparql_url + "?default-graph-uri=" + encodeURIComponent(self.targetThesaurusGraphURI) + "&query=";// + query + queryOptions
                                    var queryOptions = "&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=20000&debug=off"
                                    sparql.querySPARQL_GET_proxy(url, query, queryOptions, null, function (err, result) {
                                        if (err) {
                                            return callbackEach(err);
                                        }
                                        var bindings = [];
                                        var ids = [];

                                        if (result.results.bindings.length > 0) {
                                            result.results.bindings.forEach(function (item) {
                                                var sourceConcept=conceptLabelsMap[item.prefLabel.value.toLowerCase()]
                                                if(sourceConcept && uniqueConceptIds.indexOf(sourceConcept.id)<0){
                                                    uniqueConceptIds.push(sourceConcept.id)
                                                    matchingConceptsTreeArray.push({
                                                        id:sourceConcept.id,
                                                        text :sourceConcept.label,
                                                        parent:sourceConcept.parentId,
                                                        data:{count:1,parentLabel:sourceConcept.parentLabel}


                                                    })

                                                }
                                            })
                                        }
                                        // add missing parents
                                        matchingConceptsTreeArray.forEach(function(item) {
                                            if(uniqueConceptIds.indexOf(item.parent)<0){

                                                var parentConcept=conceptLabelsMap[item.data.parentLabel]
                                                if(item.data.parentId=="#" || !parentConcept )
                                                    return;
                                                matchingConceptsTreeArray.push({
                                                    id:parentConcept.id,
                                                    text :parentConcept.label,
                                                    parent:parentConcept.parentId,
                                                    data:{count:0}
                                                })
                                            }

                                        })
                                                return callbackEach(err);

                                    })
                                }, function (err) {
                                //    var x=matchingConceptsTreeArray;
                                    callbackSeries(err)
                                })



                    },
                function(callbackSeries){

                console.log(JSON.stringify(matchingConceptsTreeArray,null,2))
                    $("#lefTabs").tabs("option", "active", 1);
                    common.loadJsTree("jstreeFilterConceptsDiv", matchingConceptsTreeArray, {
                        withCheckboxes: 1,
                        //  openAll: true,
                        selectDescendants: true,
                        searchPlugin: true,
                        onCheckNodeFn: function (evt, obj) {
                            filterGraph.alterGraph.onFilterConceptsChecked(evt, obj);
                        },
                        onUncheckNodeFn: function (evt, obj) {
                            filterGraph.alterGraph.onFilterConceptsChecked(evt, obj);
                        }

                    })




                }

                ], function (err) {
                    return common.message(err);
                }
            )
        }


        return self;
    }
)()
