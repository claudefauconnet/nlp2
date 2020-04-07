var projection = (function () {

    var self = {};

    self.onConceptAggrLevelSliderChange = function (evt) {
        var value = $(evt.target).slider("value");


    }


    self.onAggregateResourcesSelectChange = function (value) {


    }

    self.onShowResoucesParentsResourcesSelectChange = function (value) {


    }


    self.displayParagraphsGraph = function () {
        var conceptAggrLevel = $("#conceptAggrLevelSlider").val()
        var resourceAggrLevel = $("#resourcesAggrLevelSelect").val();
        var resourcesShowParentResources = $("#resourcesShowParentResourcesSelect").val();
        var conceptAncestorsMap = {}
        var corpusAncestorsMap = {}
        var allConcepts = {}
        var allParagraphs = [];
        var paragraphsInfos = {};
        var idCorpus = null;
        async.series([


                // get Concepts Ancestors
                function (callbackSeries) {
                    var selectedConcepts = $("#jstreeConceptDiv").jstree(true).get_checked(true);
                    selectedConcepts.forEach(function (concept, index) {
                        conceptAncestorsMap[concept.id] = [];
                        concept.parents.forEach(function (parent, index) {
                            if (parent != "#") {
                                var parentNode = $("#jstreeConceptDiv").jstree(true).get_node(parent);
                                conceptAncestorsMap[concept.id].push({text: parentNode.text, id: parent})
                            }
                        })

                    })
                    callbackSeries();
                },
                // get resources Ancestors
                function (callbackSeries) {
                    var selectedConcepts = $("#jstreeCorpusDiv").jstree(true).get_selected(true);
                    selectedConcepts.forEach(function (concept, index) {
                        corpusAncestorsMap[concept.id] = [];
                        concept.parents.forEach(function (parent, index) {
                            if (parent != "#") {
                                var parentNode = $("#jstreeCorpusDiv").jstree(true).get_node(parent);
                                corpusAncestorsMap[concept.id].push({text: parentNode.text, id: parent})
                            }
                        })

                    })
                    callbackSeries();
                },

                //getDescendants
                function (callbackSeries) {
                    thesaurus.getSelectedConceptDescendants(function (err, concepts) {
                        if (err)
                            return callbackSeries(err);
                        allConcepts = concepts
                        callbackSeries();
                    })

                },
                //getselectedResource
                function (callbackSeries) {
                    idCorpus = corpus.getSelectedResource();
                    callbackSeries();
                },
                //getParagraphs
                function (callbackSeries) {
                    paragraphs.sparql_getEntitiesParagraphs(idCorpus, allConcepts, {concepts_OR: 1}, function (err, result) {
                        if (err)
                            return callbackSeries(err);

                        if(result.length==0)
                          return  callbackSeries("No results")

                        allParagraphs = result;

                        callbackSeries();
                    })

                },
                //getParagraphsInfos
                function (callbackSeries) {

            return callbackSeries();
                    var allParagraphsIds = [];
                    allParagraphs.forEach(function (item, indexLine) {
                        allParagraphsIds.push(item.paragraph.value);
                    })
                    paragraphs.getParagraphsInfos(allParagraphsIds, {}, function (err, result) {
                        if (err)
                            return callbackSeries(err);
                        result.forEach(function (item) {
                            paragraphsInfos[item.paragraph.value] = item
                        })
                        self.currentParagraphsInfos = paragraphsInfos;

                        callbackSeries();
                    })

                },
                //getParagraphs
                function (callbackSeries) {
                    paragraphs.drawParagraphsEntitiesGraph(allParagraphs, paragraphsInfos, {
                            conceptAggrLevel: conceptAggrLevel,
                            resourceAggrLevel: resourceAggrLevel,
                            resourcesShowParentResources: resourcesShowParentResources
                        }
                    );
                    callbackSeries();
                }


            ],

            function (err) {
                if (err)
                    return common.message(err)
            }
        )


    }


    return self;
})
()
