


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
            , topConceptbroader: "skos:broader"
            , broader: "skos:broader"
            , prefLabel: "skos:prefLabel"
            , altLabel: "skos:altLabel",
            limit: 1000,
            optionalDepth:5


        }

        var source = "";
        var graphIri = "";
        var predicates = "";
        var prefixesStr = "";
        var fromStr = "";
        var topConceptFilter = "";
        var broaderPredicate = "";
        var prefLabelPredicate = "";
        var topConceptLangFilter = "";
        var conceptLangFilter = "";
        var limit = "";
        var optionalDepth=0
        var lang ="";
        var url = "";
        var queryOptions = "&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=20000&debug=off"


        setVariables = function (sourceLabel) {
            source = ""
            graphIri = ""
            predicates = ""
            prefixesStr = ""
            fromStr = "";
            topConceptFilter = ""
            broaderPredicate = ""
            prefLabelPredicate = ""
            limit = "";
            url = ""
            source = Config.sources[sourceLabel]
            graphIri = source.graphIri;
            predicates = defaultPredicates;
            if (source.predicates)
                predicates = source.predicates


            var prefixes = predicates.prefixes || defaultPredicates.prefixes
            prefixes.forEach(function (item) {
                prefixesStr += "PREFIX " + item + " "
            })

            if (graphIri && graphIri != "")
                fromStr = " FROM <" + graphIri + "> "


            topConceptFilter = predicates.topConceptFilter || defaultPredicates.topConceptFilter;
            broaderPredicate = predicates.topConceptbroader || defaultPredicates.topConceptbroader;
            prefLabelPredicate = predicates.prefLabel || defaultPredicates.prefLabel;
            lang = predicates.lang ;
            limit = predicates.limit || defaultPredicates.limit;
            optionalDepth=predicates.optionalDepth ||defaultPredicates.optionalDepth;
            url = Config.sources[sourceLabel].sparql_url + "?query=&format=json";
        }


        setFilter = function (varName, ids, words,options) {
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
               return  "";
            }
            return filter ;
        }


        self.getTopConcepts = function (sourceLabel, callback) {
            setVariables(sourceLabel);


            var query = "";
            query += prefixesStr
            query += " select distinct * " + fromStr + "  WHERE {"
            query += topConceptFilter;
            query += "?topConcept " + prefLabelPredicate + " ?topConceptLabel." ;
            if(lang)
                query +=  "filter(lang(?topConceptLabel )='" + lang + "')"
            if (false) {
                query += "?concept " + broaderPredicate + " ?topConcept." +
                    "?concept " + prefLabelPredicate + " ?conceptLabel."
                if(lang)
                    query +=  "filter(lang(?conceptLabel )='" + lang + "')"
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



            var filterStr = setFilter("concept", ids, words,options)

            if (!options) {
                options = {depth: 0}
            }

            var query = "";
            query += prefixesStr;
            query += " select distinct * " + fromStr + "  WHERE {"

            query += "?child1 " + broaderPredicate + " ?concept." +
                "?child1 " + prefLabelPredicate + " ?child1Label. ";
            if(lang)
                query+="filter( lang(?child1Label)=\""+lang+"\")"
            query+=filterStr;

            descendantsDepth=Math.min(  descendantsDepth,optionalDepth);
            for (var i = 1; i < descendantsDepth; i++) {

                query += "OPTIONAL { ?child" + (i + 1)+" " + broaderPredicate +" ?child" + i + "." +
                    "?child" + (i + 1) + " " + prefLabelPredicate +"  ?child" + (i + 1) + "Label."
                if(lang)
                    query+="filter( lang(?child" + (i + 1) + "Label)=\""+lang+"\")"
            }
            for (var i = 1; i <descendantsDepth; i++) {
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
            var filterStr = setFilter("concept", ids, words,options)

            var query = "";
            query += prefixesStr;
            query += " select distinct * " + fromStr + "  WHERE {"

            query += "?concept " + prefLabelPredicate + " ?conceptLabel. ";
            if(lang)
                query+="filter( lang(?conceptLabel)=\""+lang+"\")"
            query+=filterStr;


            ancestorsDepth=Math.min(  ancestorsDepth,optionalDepth);
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

        self.getNodeInfos = function (sourceLabel, conceptId, options, callback) {
            setVariables(sourceLabel);

           var query= " select distinct * " + fromStr + "  WHERE {"+
                " <" + conceptId + "> ?prop ?value. } limit 500";


            Sparql_proxy.querySPARQL_GET_proxy(url, query, queryOptions, null, function (err, result) {
                if (err) {
                    return callback(err);
                }
                return callback(null, result.results.bindings)


            })
        }


        self.update=function(sourceLabel,triples,callback) {
            var graphUri=Config.sources[sourceLabel].graphIri
            var deleteTriplesStr="";
            var insertTriplesStr="";
            triples.forEach(function(item,index){
                var valueStr=""
                if(item.valueType=="uri")
                    valueStr="<"+item.object+">"
                else {
                    var langStr="";
                    if(item.lang)
                        langStr="@"+item.lang
                    valueStr = "'" + item.object + "'"+langStr
                }




                insertTriplesStr+="<"+item.subject+'> <'+item.predicate+'> '+valueStr+'.';
                deleteTriplesStr+= "<"+item.subject+'> <'+item.predicate+'> '+"?o_"+index+'.';
                
            })
            var query = " WITH GRAPH  <"+graphUri+">  " +
                "DELETE" +
                "{  " +
                    deleteTriplesStr+
                "  }" +
                "WHERE" +
                "  {" +
                    deleteTriplesStr+
                "  };" +
                "" +
                "INSERT DATA" +
                "  {" +
                    insertTriplesStr+
                "  }"


           // console.log(query)
            url = Config.sources[sourceLabel].sparql_url + "?query=&format=json";
            Sparql_proxy.querySPARQL_GET_proxy(url,query, null,null, function(err, result){
                return callback(err);
            })
        }

        return self;
    }
)()
