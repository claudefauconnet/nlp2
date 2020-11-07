var Sparql_USGS = (function () {
        var self = {};


        self.getTopConcepts = function (graphUri, callback) {
            var query = "PREFIX terms:<http://purl.org/dc/terms/>PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#>PREFIX rdfsyn:<http://www.w3.org/1999/02/22-rdf-syntax-ns#>PREFIX skos:<http://www.w3.org/2004/02/skos/core#>select distinct * where{" +
                "?scheme skos:broader <https://www2.usgs.gov/science/USGSThesaurus/Categories>." +
                "?scheme skos:prefLabel ?schemeLabel. filter(lang(?schemeLabel )='en') ?scheme skos:narrower ?concept.?concept rdfs:label|skos:prefLabel ?conceptLabel. filter(lang(?conceptLabel )='en')  } limit 1000"

            var conceptsGraphUri = "https://www2.usgs.gov/science/USGSThesaurus/";
            var url = app_config.sparql_url + "?default-graph-uri=" + conceptsGraphUri + "&query=";// + query + queryOptions

            var queryOptions = "&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=20000&debug=off"
            sparql.querySPARQL_GET_proxy(url, query, queryOptions, null, function (err, result) {
                if (err) {
                    return callback(err);
                }
                return callback(null, result.results.bindings)

            })
        }


        self.getNodeChildren = function (graphUri, words, ids, descendantsDepth, options, callback) {


            var query = "PREFIX terms:<http://purl.org/dc/terms/>PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#>PREFIX rdfsyn:<http://www.w3.org/1999/02/22-rdf-syntax-ns#>PREFIX skos:<http://www.w3.org/2004/02/skos/core#>" +

                "select distinct *" ;

                query +="where{ ?child1 skos:broader ?concept.";
               // query +="where{ ?child1 skos:broader|^skos:narrower ?concept.";

            query += " filter (?concept=<" + conceptId + ">) "+
                "?child1 skos:prefLabel ?childLabel1 ." +
                "filter(lang(?childLabel1)='en')"


            for (var i = 1; i < options.depth; i++) {

                query += "OPTIONAL { ?child" + (i + 1) + " skos:broader ?child" + i + "." +
                    "?child" + (i + 1) + " skos:prefLabel ?childLabel" + (i + 1) + "." +
                    "filter( lang(?childLabel" + (i + 1) + ")=\"en\")"
            }
            for (var i = 1; i < options.depth; i++) {
                query += "}"
            }
            query += "  }ORDER BY ?childLabel1 ";
            query += "limit 10000 ";

            var conceptsGraphUri = "https://www2.usgs.gov/science/USGSThesaurus/";
            var url = app_config.sparql_url + "?default-graph-uri=" + encodeURIComponent(conceptsGraphUri) + "&query=";// + query + queryOptions
            var queryOptions = "&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=20000&debug=off"
            sparql.querySPARQL_GET_proxy(url, query, queryOptions, null, function (err, result) {
                if (err) {
                    return callback(err)
                }
                return callback(null, result.results.bindings);
            })
        }


        self.getNodeParents = function (word, ancestorsDepth, options, callback) {
            options.conceptsGraphUri="https://www2.usgs.gov/science/USGSThesaurus/";
            sparql_skos_generic.getNodeParents(word, ancestorsDepth, options, callback)
        }


        self.getNodeInfos = function (conceptId,options, callback) {

            var query = "select *" +
                " where {<" + conceptId + "> ?prop ?value. } limit 500";

            var conceptsGraphUri = "https://www2.usgs.gov/science/USGSThesaurus/";
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
