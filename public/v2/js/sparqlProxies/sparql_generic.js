//biblio
//https://www.iro.umontreal.ca/~lapalme/ift6281/sparql-1_1-cheat-sheet.pdf
var Sparql_generic = (function () {
        var self = {};
        var defaultPredicates = {
            prefixes: [" terms:<http://purl.org/dc/terms/>",
                " rdfs:<http://www.w3.org/2000/01/rdf-schema#>",
                " rdf:<http://www.w3.org/1999/02/22-rdf-syntax-ns#>",
                " skos:<http://www.w3.org/2004/02/skos/core#>",
                " elements:<http://purl.org/dc/elements/1.1/>"

            ],
            topConceptFilter: "?topConcept rdf:type ?type. filter(?type in( <http://www.w3.org/2004/02/skos/core#ConceptScheme>,<http://www.w3.org/2004/02/skos/core#Collection>))"
            , broaderPredicate: "skos:broader"
            , broader: "skos:broader"
            , prefLabel: "skos:prefLabel"
            , altLabel: "skos:altLabel",
            limit: 1000,
            optionalDepth: 5


        }

        var source = "";
        var graphUri = "";
        var predicates = "";
        var prefixesStr = "";
        var fromStr = "";
        var topConceptFilter = "";
        var broaderPredicate = "";
        var prefLabelPredicate = "";
        var topConceptLangFilter = "";
        var conceptLangFilter = "";
        var limit = "";
        var optionalDepth = 0
        var lang = "";
        var url = "";
        var queryOptions = "&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=20000&debug=off"


        setVariables = function (sourceLabel) {
            source = ""
            graphUri = ""
            predicates = ""
            prefixesStr = ""
            fromStr = "";
            topConceptFilter = ""
            broaderPredicate = ""
            prefLabelPredicate = ""
            limit = "";
            url = ""
            source = Config.sources[sourceLabel]
            graphUri = source.graphUri;
            predicates = defaultPredicates;
            if (source.predicates)
                predicates = source.predicates


            var prefixes = predicates.prefixes || defaultPredicates.prefixes
            prefixes.forEach(function (item) {
                prefixesStr += "PREFIX " + item + " "
            })

            if (graphUri && graphUri != "") {
                if (!Array.isArray(graphUri))
                    graphUri = [graphUri];
                graphUri.forEach(function (item) {
                    fromStr += " FROM <" + item + "> "
                })
            }


            topConceptFilter = predicates.topConceptFilter || defaultPredicates.topConceptFilter;
            broaderPredicate = predicates.broaderPredicate || defaultPredicates.broaderPredicate;
            prefLabelPredicate = predicates.prefLabel || defaultPredicates.prefLabel;
            lang = predicates.lang;
            limit = predicates.limit || defaultPredicates.limit;
            optionalDepth = predicates.optionalDepth || defaultPredicates.optionalDepth;
            url = Config.sources[sourceLabel].sparql_url + "?query=&format=json";
        }


        setFilter = function (varName, ids, words, options) {
            var filter = ";"
            if (words) {
                if (Array.isArray(words)) {
                    var conceptWordStr = ""
                    words.forEach(function (word, index) {
                        if (index > 0)
                            conceptWordStr += "|"
                        if (options.exactMatch)
                            conceptWordStr += "  \"^" + word + "$\"";
                        else
                            conceptWordStr += "  \"" + word + "\"";
                    })
                    filter = " filter( regex(?" + varName + "Label in( " + conceptWordStr + "))) ";
                } else {
                    var filter = "  filter( regex(?" + varName + "Label, \"^" + words + "$\", \"i\"))";
                    if (!options.exactMatch) {
                        filter = " filter( regex(?" + varName + "Label, \"" + words + "\", \"i\"))";

                    }
                }
            } else if (ids) {
                if (Array.isArray(ids)) {
                    var conceptIdsStr = ""
                    ids.forEach(function (id, index) {
                        if (index > 0)
                            conceptIdsStr += ","
                        conceptIdsStr += "<" + id + ">"
                    })
                    filter = "filter(  ?" + varName + " in( " + conceptIdsStr + "))";
                } else {
                    filter = " filter( ?" + varName + " =<" + ids + ">)";
                }

            } else {
                return "";
            }
            return filter;
        }

        function getUriFilter(varName, uri) {
            var filterStr = ""
            if (Array.isArray(uri)) {
                var str = ""
                uri.forEach(function (item, index) {
                    if (index > 0)
                        str += ","
                    str += "<" + item + ">"
                })
                filterStr = "filter (?" + varName + " in (" + str + "))"

            } else {
                filterStr += "filter( ?" + varName + "=<" + uri + ">)."
            }
            return filterStr;
        }


        self.getTopConcepts = function (sourceLabel, callback) {
            setVariables(sourceLabel);


            var query = "";
            query += prefixesStr
            query += " select distinct ?topConcept ?topConceptLabel ?type " + fromStr + "  WHERE {"
            query += topConceptFilter;
            query += "?topConcept " + prefLabelPredicate + " ?topConceptLabel.";
            if (lang)
                query += "filter(lang(?topConceptLabel )='" + lang + "')"
            query += "?topConcept rdf:type ?type."
            if (false) {
                query += "?concept " + broaderPredicate + " ?topConcept." +
                    "?concept " + prefLabelPredicate + " ?conceptLabel."
                if (lang)
                    query += "filter(lang(?conceptLabel )='" + lang + "')"
            }
            query += "  } ORDER BY ?topConceptLabel ";
            query += "limit " + limit + " ";


            Sparql_proxy.querySPARQL_GET_proxy(url, query, queryOptions, null, function (err, result) {
                if (err) {
                    return callback(err)
                }
                return callback(null, result.results.bindings)

            })
        }


        self.getNodeChildren = function (sourceLabel, words, ids, descendantsDepth, options, callback) {
            setVariables(sourceLabel);


            var filterStr = setFilter("concept", ids, words, options)

            if (!options) {
                options = {depth: 0}
            }

            var query = "";
            query += prefixesStr;
            query += " select distinct * " + fromStr + "  WHERE {"

            query += "?child1 " + broaderPredicate + " ?concept." +
                "OPTIONAL{ ?child1 " + prefLabelPredicate + " ?child1Label. ";
            if (lang)
                query += "filter( lang(?child1Label)=\"" + lang + "\")"
            query += "}"
            query += filterStr;
            query += "OPTIONAL{?child1 rdf:type ?type.}"
            descendantsDepth = Math.min(descendantsDepth, optionalDepth);
            for (var i = 1; i < descendantsDepth; i++) {

                query += "OPTIONAL { ?child" + (i + 1) + " " + broaderPredicate + " ?child" + i + "." +
                    "OPTIONAL{?child" + (i + 1) + " " + prefLabelPredicate + "  ?child" + (i + 1) + "Label."
                if (lang)
                    query += "filter( lang(?child" + (i + 1) + "Label)=\"" + lang + "\")"
                query += "}"
                query += "OPTIONAL {?child" + (i + 1) + " rdf:type ?type.}"
            }
            for (var i = 1; i < descendantsDepth; i++) {
                query += "} "
            }
            query += "  }ORDER BY ?child1Label ";
            query += "limit " + limit + " ";


            Sparql_proxy.querySPARQL_GET_proxy(url, query, queryOptions, null, function (err, result) {
                if (err) {
                    return callback(err)
                }
                return callback(null, result.results.bindings);
            })
        }

        self.getNodeParents = function (sourceLabel, words, ids, ancestorsDepth, options, callback) {
            if (!options) {
                options = {depth: 0}
            }
            setVariables(sourceLabel);
            var filterStr = setFilter("concept", ids, words, options)

            var query = "";
            query += prefixesStr;
            query += " select distinct * " + fromStr + "  WHERE {"

            query += "?concept " + prefLabelPredicate + " ?conceptLabel. ";
            if (lang)
                query += "filter( lang(?conceptLabel)=\"" + lang + "\")"
            query += filterStr;
            query += "OPTIONAL{?concept rdf:type ?type.}"

            ancestorsDepth = Math.min(ancestorsDepth, optionalDepth);
            for (var i = 1; i <= ancestorsDepth; i++) {
                if (i == 1) {
                    query += "  ?concept " + broaderPredicate + " ?broader" + i + "." +
                        "?broader" + (i) + " " + prefLabelPredicate + " ?broader" + (i) + "Label."
                    if (lang)
                        query += "filter( lang(?broader" + (i) + "Label)=\"" + lang + "\")"

                } else {
                    query += "OPTIONAL { ?broader" + (i - 1) + " " + broaderPredicate + " ?broader" + i + "." +
                        "?broader" + (i) + " " + prefLabelPredicate + " ?broader" + (i) + "Label."
                    if (lang)
                        query += "filter( lang(?broader" + (i) + "Label)=\"" + lang + "\")"

                }
                query += "?broader" + (i) + " rdf:type ?type."

            }


            for (var i = 1; i < ancestorsDepth; i++) {
                query += "} "
            }


            query += "  }";
            query += "limit " + limit + " ";


            Sparql_proxy.querySPARQL_GET_proxy(url, query, queryOptions, null, function (err, result) {
                if (err) {
                    return callback(err)
                }
                return callback(null, result.results.bindings);
            })
        }

        self.getSingleNodeAllAncestors = function (sourceLabel, id, callback) {
            setVariables(sourceLabel);
            var query = "";
            query += prefixesStr;
            query += " select distinct * " + fromStr + "  WHERE {"
            query += "  ?concept " + broaderPredicate + "* ?broader." +
                "filter (?concept=<" + id + ">) " +
                "?broader " + prefLabelPredicate + " ?broaderLabel." +
                "?broader rdf:type ?type."
            if (lang)
                query += "filter( lang(?broaderLabel)=\"" + lang + "\")"
            query += "  }";
            query += "limit " + limit + " ";


            Sparql_proxy.querySPARQL_GET_proxy(url, query, queryOptions, null, function (err, result) {
                if (err) {
                    return callback(err)
                }
                return callback(null, result.results.bindings);
            })

        }

        self.getSingleNodeAllDescendants = function (sourceLabel, id, callback) {
            setVariables(sourceLabel);
            var query = "";
            query += prefixesStr;
            query += " select distinct * " + fromStr + "  WHERE {"
            query += "  ?concept ^" + broaderPredicate + "* ?narrower." +
                "filter (?concept=<" + id + ">) " +
                "?narrower " + prefLabelPredicate + " ?narrowerLabel." +
                "?narrower rdf:type ?type."
            if (lang)
                query += "filter( lang(?narrowerLabel)=\"" + lang + "\")"
            query += "  }";
            query += "limit " + limit + " ";


            Sparql_proxy.querySPARQL_GET_proxy(url, query, queryOptions, null, function (err, result) {
                if (err) {
                    return callback(err)
                }
                return callback(null, result.results.bindings);
            })

        }

        self.getNodeLabel = function (sourceLabel, id, callback) {
            setVariables(sourceLabel);

            var query = "";
            query += prefixesStr;
            query += " select distinct * " + fromStr + "  WHERE {" +
                "?concept   rdf:type   ?type." +
                "?concept " + prefLabelPredicate + " ?conceptLabel." +
                "filter (?concept=<" + id + ">) "
            if (lang)
                query += "filter( lang(?conceptLabel)=\"" + lang + "\")"

            query += "}limit " + limit + " ";


            Sparql_proxy.querySPARQL_GET_proxy(url, query, queryOptions, null, function (err, result) {
                if (err) {
                    return callback(err)
                }
                return callback(null, result.results.bindings);
            })
        }


        self.getNodeInfos = function (sourceLabel, conceptId, options, callback) {
            setVariables(sourceLabel);
            var filter = getUriFilter("id", conceptId);

            var query = " select distinct * " + fromStr + "  WHERE {" +
                " ?id ?prop ?value. " + filter + "} limit 500";


            Sparql_proxy.querySPARQL_GET_proxy(url, query, queryOptions, null, function (err, result) {
                if (err) {
                    return callback(err);
                }
                return callback(null, result.results.bindings)


            })
        }


        self.getNodesAllTriples = function (sourceLabel, subjectIds, callback) {
            setVariables(sourceLabel);
            var sliceSize = 2000;
            var slices = common.sliceArray(subjectIds, sliceSize);
            var triples = [];
            async.eachSeries(slices, function (slice, callbackEach) {
                var filterStr = "(";
                slice.forEach(function (item, index) {
                    if (index > 0)
                        filterStr += ","
                    filterStr += "<" + item + ">"
                })
                filterStr += ")"

                var query = " select    distinct * " + fromStr + "  WHERE {" +
                    "?subject ?prop ?value. FILTER (?subject in" + filterStr + ")} limit " + sliceSize + 1;
                Sparql_proxy.querySPARQL_GET_proxy(url, query, queryOptions, null, function (err, result) {
                    if (err) {
                        return callbackEach(err);
                    }
                    triples = triples.concat(result.results.bindings)
                    return callbackEach()


                })

            }, function (err) {
                return callback(err, triples)
            })
        }


        self.deleteTriples = function (sourceLabel, subjectUri, predicateUri, objectUri, callback) {
            if (!subjectUri && !subjectUri && !subjectUri)
                return call("no subject predicate and object filter : cannot delete")

            var filterStr = "";
            if (subjectUri)
                filterStr += getUriFilter("s", subjectUri)
            if (predicateUri)
                filterStr += getUriFilter("p", predicateUri)
            if (objectUri)
                filterStr += getUriFilter("o", objectUri)

            var query = "with <" + Config.sources[sourceLabel].graphUri + "> " +
                " DELETE {?s ?p ?o} WHERE{ ?s ?p ?o " + filterStr + "}"

            url = Config.sources[sourceLabel].sparql_url + "?query=&format=json";
            Sparql_proxy.querySPARQL_GET_proxy(url, query, queryOptions, null, function (err, result) {
                if (err) {
                    return callback(err);
                }
                return callback(null, result.results.bindings)

            })

        }

        self.update = function (sourceLabel, triples, callback) {
            var graphUri = Config.sources[sourceLabel].graphUri
            var deleteTriplesStr = "";
            var insertTriplesStr = "";
            triples.forEach(function (item, index) {
                var valueStr = ""
                if (item.valueType == "uri")
                    valueStr = "<" + item.object + ">"
                else {
                    var langStr = "";
                    if (item.lang)
                        langStr = "@" + item.lang
                    valueStr = "'" + item.object + "'" + langStr
                }


                insertTriplesStr += "<" + item.subject + '> <' + item.predicate + '> ' + valueStr + '.';
                deleteTriplesStr += "<" + item.subject + '> <' + item.predicate + '> ' + "?o_" + index + '.';

            })
            var query = " WITH GRAPH  <" + graphUri + ">  " +
                "DELETE" +
                "{  " +
                deleteTriplesStr +
                "  }" +
                "WHERE" +
                "  {" +
                deleteTriplesStr +
                "  };" +
                "" +
                "INSERT DATA" +
                "  {" +
                insertTriplesStr +
                "  }"


            // console.log(query)
            url = Config.sources[sourceLabel].sparql_url + "?query=&format=json";
            Sparql_proxy.querySPARQL_GET_proxy(url, query, null, null, function (err, result) {
                return callback(err);
            })
        }

        self.deleteGraph = function (sourceLabel, callback) {
            graphUri = Config.sources[sourceLabel].graphUri


            var query = " WITH <" + graphUri + "> DELETE {?s ?p ?o}"
            url = Config.sources[sourceLabel].serverUrl + "?query=&format=json";
            Sparql_proxy.querySPARQL_GET_proxy(url, query, null, null, function (err, result) {
                return callback(err);
            })
        }

        self.copyGraph = function (fromSourceLabel, toGraphUri, callback) {
            var fromGraphUri = Config.sources[fromSourceLabel].graphUri;
            var query = " COPY <" + fromGraphUri + "> TO <" + toGraphUri + ">;"
            url = Config.sources[fromSourceLabel].sparql_url + "?query=&format=json";
            Sparql_proxy.querySPARQL_GET_proxy(url, query, null, null, function (err, result) {
                return callback(err);
            })

        }
        /**
         *
         *
         * @param fromSourceLabel
         * @param toGraphUri
         * @param sourceIds
         * @param options :
            * setSubjectFn : function to transform target subjects
         * setPredicateFn : function to transform target predicates
         * setObjectFn : function to transform target objects
         * properties :  optional properties to copy
         *
         * @param callback
         */




        self.copyNodes = function (fromSourceLabel, toGraphUri, sourceIds, options, callback) {
            if (!options) {
                options = {}
            }
            var newTriples = [];
            async.series([
                // get sources nodes properties
                function (callbackSeries) {
                    self.getNodeInfos(fromSourceLabel, sourceIds, null, function (err, result) {
                        if (err)
                            return callbackSeries(err);
                        result.forEach(function (item) {
                            var subject = item.id.value
                            if (options.setSubjectFn)
                                subject = options.setSubjectFn(item)
                            var prop = item.prop.value;
                            if (options.setPredicateFn)
                                prop = options.setPredicateFn(item)
                            if (options.setObjectFn)
                                valueStr = options.setObjectFn(item)
                            if (!options.properties || options.properties.indexOf(item.prop.value) > -1) {


                                    var valueStr = ""
                                    if (item.value.valueType == "uri")
                                        valueStr = "<" + item.value.value + ">"
                                    else {
                                        var langStr = "";
                                        if (item.lang)
                                            langStr = "@" + item.value.lang
                                        valueStr = "'" + item.value.value + "'" + langStr
                                    }

                                newTriples.push("<" + subject + "> <" + prop + "> " + valueStr + ".")
                            }

                        })
                        return callbackSeries()
                    })


                },

                //write new triples
                function (callbackSeries) {

                    var insertTriplesStr = "";
                    newTriples.forEach(function (item) {
                        insertTriplesStr += item;
                    })
                    var query = " WITH GRAPH  <" + toGraphUri + ">  " +
                        "INSERT DATA" +
                        "  {" +
                        insertTriplesStr +
                        "  }"

                    url = Config.sources[fromSourceLabel].sparql_url + "?query=&format=json";
                    Sparql_proxy.querySPARQL_GET_proxy(url, query, null, null, function (err, result) {
                        return callbackSeries(err);
                    })
                }

            ], function (err) {
                return callback(err, newTriples.length)

            })

        }


        return self;
    }
)()
