var sparql_skos_generic = (function () {
        var self = {};


        self.getTopConcepts = function (conceptsGraphUri, callback) {
            var query = "PREFIX terms:<http://purl.org/dc/terms/>PREFIX rdf:<http://www.w3.org/2000/01/rdf-schema#>PREFIX rdfsyn:<http://www.w3.org/1999/02/22-rdf-syntax-ns#>PREFIX skos:<http://www.w3.org/2004/02/skos/core#>" +
                "select distinct * " +
                "where{" +
                "?scheme rdfsyn:type <http://www.w3.org/2004/02/skos/core#ConceptScheme>." +
                "?scheme skos:prefLabel ?schemeLabel." +
                "?concept skos:broader|skos:topConceptOf ?scheme." +
                "?concept skos:prefLabel ?conceptLabel."
            query += "  }ORDER BY ?conceptLabel ";
            query += "limit 5000 ";

            var url = app_config.sparql_url + "?default-graph-uri=" + encodeURIComponent(conceptsGraphUri) + "&query=";// + query + queryOptions


            var queryOptions = "&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=20000&debug=off"
            sparql.querySPARQL_GET_proxy(url, query, queryOptions, null, function (err, result) {
                if (err) {
                    return callback(err)
                }
                return callback(null, result.results.bindings)

            })
        }


        self.getNodeChildren = function (conceptId, depth, callback) {

            var query = "PREFIX terms:<http://purl.org/dc/terms/>PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#>PREFIX rdfsyn:<http://www.w3.org/1999/02/22-rdf-syntax-ns#>PREFIX skos:<http://www.w3.org/2004/02/skos/core#>" +

                "select distinct *" +
                "where{ ?child1 skos:broader ?concept."
                + " filter (?concept=<" + conceptId + ">) "
                + "?child1 skos:prefLabel ?childLabel1 ."


            for (var i = 1; i <= depth; i++) {

                query += "OPTIONAL { ?child" + (i + 1) + " skos:broader ?child" + i + "." +
                    "?child" + (i + 1) + " skos:prefLabel ?childLabel" + (i + 1) + "." +
                    "filter( lang(?childLabel" + (i + 1) + ")=\"en\")"
            }
            for (var i = 1; i <= depth; i++) {
                query += "}"
            }
            query += "  }ORDER BY ?childLabel1 ";
            query += "limit 1000 ";

            var conceptsGraphUri = app_config.ontologies[app_config.currentOntology].conceptsGraphUri
            var url = app_config.sparql_url + "?default-graph-uri=" + encodeURIComponent(conceptsGraphUri) + "&query=";// + query + queryOptions
            var queryOptions = "&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=20000&debug=off"
            sparql.querySPARQL_GET_proxy(url, query, queryOptions, null, function (err, result) {
                if (err) {
                    return callback(err)
                }
                return callback(null, result.results.bindings);
            })
        }



        self.searchConceptAndAncestors = function (word, ancestorsDepth, options, callback) {


            var filter = "  regex(?conceptLabel, \"^" + word + "$\", \"i\")";
            if (!options.exactMatch) {
                filter = "  regex(?conceptLabel, \"" + word + "\", \"i\")";
            }

            var query = "PREFIX skos:<http://www.w3.org/2004/02/skos/core#>" +
                "SELECT distinct *" +
                "WHERE {" +
                "  ?concept skos:prefLabel ?conceptLabel . filter(" + filter+")";


            for (var i = 1; i <= ancestorsDepth; i++) {
                if (i == 1) {
                    query += "  ?concept"  + " skos:broader ?broader" + i + "." +
                        "?broader" + (i) + " skos:prefLabel ?broaderLabel" + (i) + ".";
                    "filter( lang(?broader" + (i) + ")=\"en\")"

                } else {
                    query += "OPTIONAL { ?broader" + (i - 1) + " skos:broader ?broader" + i + "." +
                        "?broader" + (i) + " skos:prefLabel ?broaderLabel" + (i) + "." +
                        "filter( lang(?broader" + (i) + ")=\"en\")"
                }
            }
            for (var i = 1; i < ancestorsDepth; i++) {
                query += "}"
            }

            query += "} LIMIT 2000"

            var conceptsGraphUri = app_config.ontologies[app_config.currentOntology].conceptsGraphUri
            var url = app_config.sparql_url + "?default-graph-uri=" + encodeURIComponent(conceptsGraphUri) + "&query=";// + query + queryOptions
            var queryOptions = "&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=20000&debug=off"
            sparql.querySPARQL_GET_proxy(url, query, queryOptions, null, function (err, result) {
                if (err) {
                    return callback(err);
                }
                var bindings = [];
                var ids = [];
                return callback(null, result.results.bindings);
            })


        }



        self.getNodeInfos = function (conceptId,options, callback) {

            var query = "select *" +
                " where {<" + conceptId + "> ?prop ?value. } limit 500";

            var conceptsGraphUri = app_config.ontologies[app_config.currentOntology].conceptsGraphUri
            var url = app_config.sparql_url + "?default-graph-uri=" + encodeURIComponent(conceptsGraphUri) + "&query=";// + query + queryOptions
            var queryOptions = "&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=20000&debug=off"
            sparql.querySPARQL_GET_proxy(url, query, queryOptions, null, function (err, result) {
                if (err) {
                    return callback(err);
                }
                return callback(null, result.results.bindings)


            })
        }


        return self;
    }
)()
