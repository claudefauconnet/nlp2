var Sparql_skos_generic = (function () {
        var self = {};


        self.getTopConcepts = function (graphIri, callback) {
            var query = "PREFIX terms:<http://purl.org/dc/terms/>PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#>PREFIX rdf:<http://www.w3.org/1999/02/22-rdf-syntax-ns#>PREFIX skos:<http://www.w3.org/2004/02/skos/core#>" +
                "PREFIX elements:<http://purl.org/dc/elements/1.1/>" +
                "select distinct * " +
                " from <" + graphIri + ">" +
                "where{" +
                "?topConcept rdf:type ?type. filter(?type in( <http://www.w3.org/2004/02/skos/core#ConceptScheme>,<http://www.w3.org/2004/02/skos/core#Collection>))" +
                "?topConcept skos:prefLabel|rdfs:label|elements:title ?topConceptLabel." +
                "?concept skos:broader|skos:topConceptOf|rdfs:isDefinedBy|^terms:subject ?topConcept." +
                "?concept skos:prefLabel|rdfs:label ?conceptLabel."
            query += "  }ORDER BY ?conceptLabel ";
            query += "limit 10000 ";

            var url = Config.sparql_url + "?query=";// + query + queryOptions


            var queryOptions = "&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=20000&debug=off"
            Sparql_proxy.querySPARQL_GET_proxy(url, query, queryOptions, null, function (err, result) {
                if (err) {
                    return callback(err)
                }
                return callback(null, result.results.bindings)

            })
        }


        self.getNodeChildren = function (graphIri, conceptId, options, callback) {
            if (!options) {
                options = {depth: 0}
            }
            var query = "PREFIX terms:<http://purl.org/dc/terms/>PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#>PREFIX rdf:<http://www.w3.org/1999/02/22-rdf-syntax-ns#>PREFIX skos:<http://www.w3.org/2004/02/skos/core#>" +

                "select distinct * from <" + graphIri + ">" +
                "where{ ?child1 skos:broader ?concept."
                + " filter (?concept=<" + conceptId + ">) "
                + "?child1 skos:prefLabel ?child1Label."


            for (var i = 1; i <= options.depth; i++) {

                query += "OPTIONAL { ?child" + (i + 1) + " skos:broader ?child" + i + "." +
                    "?child" + (i + 1) + " skos:prefLabel ?child" + (i + 1) + "Label." +
                    "filter( lang(?child" + (i + 1) + "Label)=\"en\")"
            }
            for (var i = 1; i <= options.depth; i++) {
                query += "}"
            }
            query += "  }ORDER BY ?child1Label ";
            query += "limit 10000 ";


            var url = Config.sparql_url + "?query=";// + query + queryOptions
            var queryOptions = "&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=20000&debug=off"
            Sparql_proxy.querySPARQL_GET_proxy(url, query, queryOptions, null, function (err, result) {
                if (err) {
                    return callback(err)
                }
                return callback(null, result.results.bindings);
            })
        }


        self.searchConceptAndAncestors = function (graphIri, word,id, ancestorsDepth, options, callback) {
            if (!options) {
                options = {}
            }
            if (word) {
                var filter = "  regex(?conceptLabel, \"^" + word + "$\", \"i\")";
                if (!options.exactMatch) {
                    filter = "  regex(?conceptLabel, \"" + word + "\", \"i\")";
                }
            } else if(id) {

                    filter = "  ?concept =<" + id + ">";

            }else{
                callback("no word or id selected")
            }

            var query = "PREFIX skos:<http://www.w3.org/2004/02/skos/core#>" +
                "SELECT distinct * from <" + graphIri + ">" +
                "WHERE {" +
                "  ?concept skos:prefLabel ?conceptLabel . filter(" + filter + ")";


            for (var i = 1; i <= ancestorsDepth; i++) {
                if (i == 1) {
                    query += "  ?concept" + " skos:broader ?broader" + i + "." +
                        "?broader" + (i) + " skos:prefLabel ?broader" + (i) + "Label.";
                    "filter( lang(?broader" + (i) + ")=\"en\")"

                } else {
                    query += "OPTIONAL { ?broader" + (i - 1) + " skos:broader ?broader" + i + "." +
                        "?broader" + (i) + " skos:prefLabel ?broader" + (i) + "Label." +
                        "filter( lang(?broader" + (i) + ")=\"en\")"
                }
            }
            for (var i = 1; i < ancestorsDepth; i++) {
                query += "}"
            }

            if (options.optionalSPARQL)
                query += "OPTIONAL {" + options.optionalSPARQL + "}";

            query += "} LIMIT 10000"

            var graphIri = "";

            var url = Config.sparql_url + "?query=";// + query + queryOptions
            var queryOptions = "&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=20000&debug=off"
            Sparql_proxy.querySPARQL_GET_proxy(url, query, queryOptions, null, function (err, result) {
                if (err) {
                    return callback(err);
                }
                var bindings = [];
                var ids = [];
                return callback(null, result.results.bindings);
            })


        }


        self.getNodeInfos = function (graphIri, conceptId, options, callback) {

            var query = "select * from <" + graphIri + ">" +
                " where {<" + conceptId + "> ?prop ?value. } limit 500";


            var url = Config.sparql_url + "?query=";// + query + queryOptions
            var queryOptions = "&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=20000&debug=off"
            Sparql_proxy.querySPARQL_GET_proxy(url, query, queryOptions, null, function (err, result) {
                if (err) {
                    return callback(err);
                }
                return callback(null, result.results.bindings)


            })
        }


        return self;
    }
)()
