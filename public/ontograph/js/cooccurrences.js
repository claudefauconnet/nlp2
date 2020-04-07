var cooccurrences = (function () {

    var self = {};






    self.showFilteredEntityCooccurrencesGraph = function () {
        $("#dialogDiv").dialog("close");
        uniqueNodeIds = [];
        var uniqueEdgesIds = [];
        var totalTypeOccurences = {}
        var visjsData = {nodes: [], edges: []}
        var filteredEntityTypes = [];

        $(".filteredGraphEntityCBX").each(function () {
            if ($(this).prop("checked")) {
                filteredEntityTypes.push($(this).val())
            }

        })
        var selectedEntities = ontograph.context.selectedEntities;

        sparql.queryEntitiesCooccurrences(selectedEntities, {filterEntityTypes: filteredEntityTypes}, function (err, result) {


            result.forEach(function (item, indexLine) {

                var obj1 = {id: item.entity1.value, label: item.entity1Label.value, type: ontograph.getTypeFromEntityUri(item.entity1.value)}

                if (uniqueNodeIds.indexOf(obj1.id) < 0) {
                    uniqueNodeIds.push(obj1.id)
                    var type1 = obj1.type.substring(obj1.type.lastIndexOf("/") + 1)

                    var vijsNode = {
                        label: obj1.label,
                        id: obj1.id,
                        color: ontograph.entityTypeColors[type1],
                        data: {type: "Entity", entityType: type1},
                        shape: "box",

                    }
                    visjsData.nodes.push(vijsNode)
                }
                var nOccurences = parseInt(item.nOccurrences.value)
                var obj2 = {id: item.entity2.value, label: item.entity2Label.value, type: ontograph.getTypeFromEntityUri(item.entity2.value)};
                selectedEntities.push(obj2.id)

                if (uniqueNodeIds.indexOf(obj2.id) < 0) {
                    uniqueNodeIds.push(obj2.id)
                    var type2 = obj2.type.substring(obj2.type.lastIndexOf("/") + 1)
                    var vijsNode = {
                        label: obj2.label,
                        id: obj2.id,
                        color: ontograph.entityTypeColors[type2],
                        data: {type: "Entity", entityType: type2},
                        shape: "box",

                    }
                    visjsData.nodes.push(vijsNode)
                }

                var edgeId = obj1.id + "_" + obj2.id
                if (!totalTypeOccurences[edgeId])
                    totalTypeOccurences[edgeId] = 0
                totalTypeOccurences[edgeId] += nOccurences
                if (uniqueEdgesIds.indexOf(edgeId) < 0) {
                    uniqueEdgesIds.push(edgeId)
                    var edgeType = {
                        from: obj1.id,
                        to: obj2.id,
                        id: edgeId,
                        value: nOccurences,
                        smooth: true,

                    }
                    visjsData.edges.push(edgeType)
                }


            })
            ontograph.drawGraph(visjsData)

        })
    }

    /************************************************************************************************************/

    self.displayGraphEntitiesCooccurrences = function (entities, options) {

        ontograph.context.currentGraphType = "displayGraphEntitiesCooccurrences"
        ontograph.context.currentParagraphs = {};

        $("#graphDiv").html("")
        $("#tableDiv").html("")





        var allResults = []
        var allDescendantConcepts = [];
        var idCorpus=corpus.getSelectedResource();
        async.series([


                //selection of concepts and sdescendants (can be large)
                function (callbackSeries) {
            thesaurus.getSelectedConceptDescendants(function(err,result){
                if (err)
                    return callbackSeries(err);
                allDescendantConcepts=result;
                callbackSeries();
            })



                },

                // getCooccurences
                function (callbackSeries) {
                    var slicedDescendantConcepts = common.sliceArray(allDescendantConcepts, 25);

                    async.eachSeries(slicedDescendantConcepts, function (concepts, callbackEach) {
                        self.sparql_getCooccurrences(idCorpus, concepts, options, function (err, result) {
                            if (err)
                                return callbackEach(err)
                            allResults = allResults.concat(result);
                            callbackEach();
                        })
                    }, function (err) {
                        callbackSeries(err);
                    })
                }
            ]
            , function (err) {
                if (err)
                    return common.message(err)
                self.showCooccurrencesList(allResults);
                paragraphs.sparql_getEntitiesParagraphs(idCorpus, selectedEntities, null, function (err, result) {
                    if (err)
                        common.message(err)
                    paragraphs.drawEntitiesParagraphsGraph(selectedEntities, result)
                })
                self.drawCooccurrencesGraph(allResults);
            })

    }


    self.sparql_getCooccurrences = function (idCorpus, idConcepts, options, callback) {
        var queryCorpus = ""
        var queryConcept = ""
        var countParagraphMin = 0
        if (idCorpus) {
            if (idCorpus.indexOf("/Domain/") > -1) {
                countParagraphMin = 10;
                queryCorpus += "?paragraph  skos:broader ?chapter ."
                queryCorpus += "?chapter  skos:broader ?document ."
                queryCorpus += "?document  skos:broader ?document_type ."
                queryCorpus += "?document_type  skos:broader ?branch."
                queryCorpus += "?branch   skos:broader <" + idCorpus + ">."
            }
            if (idCorpus.indexOf("/Branch/") > -1) {
                countParagraphMin = 5;
                queryCorpus += "?paragraph  skos:broader ?chapter ."
                queryCorpus += "?chapter  skos:broader ?document ."
                queryCorpus += "?document  skos:broader ?documentType ."
                queryCorpus += "?documentType   skos:broader <" + idCorpus + ">."
            }
            if (idCorpus.indexOf("/Document-type/") > -1) {
                countParagraphMin = 2;
                queryCorpus += "?paragraph  skos:broader ?chapter ."
                queryCorpus += "?chapter  skos:broader ?document ."
                queryCorpus += "?document   skos:broader <" + idCorpus + ">."
            }
            if (idCorpus.indexOf("/Document/") > -1) {
                countParagraphMin = 1;
                queryCorpus += "?paragraph  skos:broader ?chapter ."
                queryCorpus += "?chapter   skos:broader <" + idCorpus + ">."
            }
            if (idCorpus.indexOf("/Chapter/") > -1) {
                countParagraphMin = 1;
                queryCorpus += "?paragraph  skos:broader <" + idCorpus + ">."
            }


        }

        if (idConcepts && idConcepts.length>0) {
            var entityIdsStr = ""
            idConcepts.forEach(function (id, index) {
                if (index > 0)
                    entityIdsStr += ","
                entityIdsStr += "<" + id + ">"
            })
            queryConcept += " filter (?entity1 in(" + entityIdsStr + "))"
        }
        var url = sparql.source.sparql_url + "?default-graph-uri=&query=";// + query + queryOptions
        var query = "PREFIX terms:<http://purl.org/dc/terms/>PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#>PREFIX rdfsyn:<https://www.w3.org/1999/02/22-rdf-syntax-ns#>" +
            "" +
            "PREFIX skos:<http://www.w3.org/2004/02/skos/core#>" +
            "" +
            "select distinct ?entity1Type ?entity1 ?entity1Label ?entity2Type ?entity2 ?entity2Label (count (?paragraph) as?nOccurrences)" +
            "where{" +
            "?paragraph terms:subject ?entity1 ."

        query += queryCorpus
        query += queryConcept;
        query += "?entity1 rdfs:label ?entity1Label .FILTER (lang(?entity1Label)=\"en\")?entity1 rdfsyn:type ?entity1Type .?paragraph   terms:subject ?entity2 .?entity2  rdfs:label ?entity2Label .FILTER (lang(?entity2Label)=\"en\")?entity2 rdfsyn:type ?entity2Type . FILTER(?entity1  != ?entity2)}GROUP BY ?entity1Type ?entity1 ?entity1Label ?entity2Type ?entity2 ?entity2Label  "
        query += "having( count (?paragraph)>" + countParagraphMin + ")" +
            "order by desc (count (?paragraph))"
        query += "limit 1000"
        var queryOptions = "&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=5000&debug=on"
        sparql.querySPARQL_GET_proxy(url, query, queryOptions, null, function (err, result) {
            if (err) {
                return callback(err);
            }
            var bindings = [];
            var ids = [];
            return callback(null, result.results.bindings);


        })

    }

    self.showCooccurrencesList = function (data) {

        data.sort(function (a, b) {
            if (a.nOccurrences > b.nOccurrences)
                return -1
            if (a.nOccurrences < b.nOccurrences)
                return 1
            return 0;


        })
        self.currentData = data;
        var dataSet = []
        data.forEach(function (item) {
            var type1 = item.entity1Type.value.substring(item.entity1Type.value.lastIndexOf("/") + 1)
            var type2 = item.entity2Type.value.substring(item.entity2Type.value.lastIndexOf("/") + 1)
            var color1 = ontograph.entityTypeColors[type1]
            var color2 = ontograph.entityTypeColors[type2]
            var line = [];
            //   line.push("<span class='entity-cell' style='background-color:"+color1+"'>"+type1+":"+item.entity1Label.value+"</span>")
            //   line.push("<span class='entity-cell' style='background-color:"+color2+"'>"+type2+":"+item.entity2Label.value+"</span>")
            line.push("<span class='entity-cell' style='background-color:" + color1 + "'>" + item.entity1Label.value + "</span>")
            line.push("<span class='entity-cell' style='background-color:" + color2 + "'>" + item.entity2Label.value + "</span>")
            line.push(item.nOccurrences.value)
            dataSet.push(line)


        })


        var html = "<table id=\"example\" class=\"display\" width=\"100%\"></table>"
        $("#tableDiv").html(html);
        var table = $('#example').DataTable({
            data: dataSet,
            select: true,
            columns: [
                {title: "entity 1", width: "50px"},
                {title: "entity 2", width: "50px"},
                {title: "nPar.", type: "num", width: "20px"},


            ],
            "order": [[2, "desc"]],
            "pageLength": 20,

        });
        table.on('select', function (e, dt, type, indexes) {
            if (type === 'row') {
                var data = table.rows(indexes).data().pluck('id');

                // do something with the ID of the selected items
            }
        });

        $("#example").on('click', 'td', function (event) {
            var x = this

            //    this.selectedRow = listController.table.row(this);
            var dataTable = $("#example").DataTable();


            var rowIndex = dataTable.cell(this).index().row;
            var colIndex = dataTable.cell(this).index().column;
            var line = dataTable.row(rowIndex).data();
            var data = self.currentData;

            var selectedEntities = [];
            selectedEntities.push(data[rowIndex].entity1.value);
            selectedEntities.push(data[rowIndex].entity2.value);
            var idCorpus = null;
            var selectedCorpusResources = $("#jstreeCorpusDiv").jstree(true).get_selected()
            if (selectedCorpusResources.length > 0)
                idCorpus = selectedCorpusResources[0]
            paragraphs.sparql_getEntitiesParagraphs(idCorpus, selectedEntities, null, function (err, result) {
                if (err)
                    common.message(err)
                paragraphs.drawEntitiesParagraphsGraph(selectedEntities, result)
            })


        })
    }







    self.showEntitiesFilteringPanel = function (endEntityTypes) {
        var typesMap = []
        var html = "<ul>";
        for (var entityType in endEntityTypes) {
            var checkedStr = "";

            html += "<li  style='background-color: " + ontograph.entityTypeColors[entityType] + "'><input type='checkbox' class='filteredGraphEntityCBX' value='" + ontograph.entityTypeDictionary[entityType] + checkedStr + "'>" + entityType + " (" + endEntityTypes[entityType] + ")</li>"

        }
        html += "</ul>";
        html += "<div>"
        html += "<button onclick='ontograph.showSearchDialog(true)'>Search</button>"
        html += "<button onclick='cooccurrences.showFilteredEntityCooccurrencesGraph()'>show graph</button>";
        html += "</html"


        $('#dialogDiv').dialog('open')
        $("#filteredEntitiesPanel").html(html);
        $("#filteredEntitiesPanel").css("display", "flex");
        $("#searchPanel").css("display", "none");


    }


    return self;


})();
