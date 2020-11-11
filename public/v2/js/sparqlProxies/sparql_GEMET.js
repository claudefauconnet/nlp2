var Sparql_GEMET = (function () {
        var self = {};
        var elasticUrl = "/elastic";
        if (window.location.href.indexOf("https") > -1)
            elasticUrl = "../elastic";


        self.getTopConcepts = function (graphUri, options, callback) {
            var query = "PREFIX terms:<http://purl.org/dc/terms/>PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#>PREFIX rdfsyn:<http://www.w3.org/1999/02/22-rdf-syntax-ns#>PREFIX skos:<http://www.w3.org/2004/02/skos/core#>" +
                "select distinct * " +
                "where{" +
          "?scheme rdfsyn:type ?type. filter(?type in(<http://www.eionet.europa.eu/gemet/2004/06/gemet-schema.rdf#SuperGroup>))" +
                "?scheme skos:prefLabel ?schemeLabel. filter(lang(?schemeLabel )='en')" +

                "?scheme skos:member ?concept." +
                "?concept rdfsyn:type <http://www.eionet.europa.eu/gemet/2004/06/gemet-schema.rdf#Group>." +
                "?concept rdfs:label|skos:prefLabel ?conceptLabel. filter(lang(?conceptLabel )='en')"

            query += "  }ORDER BY ?schemeLabel ";
            query += "limit 10000 ";
            var conceptsGraphUri = "http://www.eionet.europa.eu/gemet/";
            var url = app_config.sparql_url + "?default-graph-uri=" + conceptsGraphUri + "&query=";// + query + queryOptions

            var queryOptions = "&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=20000&debug=off"
            sparql_abstract.querySPARQL_GET_proxy(url, query, queryOptions, null, function (err, result) {
                if (err) {
                    return callback(err);
                }
                return callback(null, result.results.bindings)

            })
        }


        self.getNodeChildren = function (graphUri, words, ids, descendantsDepth, options, callback) {


            var query = "PREFIX terms:<http://purl.org/dc/terms/>PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#>PREFIX rdfsyn:<http://www.w3.org/1999/02/22-rdf-syntax-ns#>PREFIX skos:<http://www.w3.org/2004/02/skos/core#>" +

                "select distinct *" ;
            if (conceptId.indexOf("/group/")>-1) {
                //  query +="where{ ?child1 <http://www.eionet.europa.eu/gemet/2004/06/gemet-schema.rdf#subGroupOf> ?concept.";
                query += "where{?concept skos:member ?child1." +
                   "filter(NOT EXISTS {?child1 skos:broader ?xx.})";
            }
            else
                query +="where{ ?child1 skos:broader|^skos:narrower ?concept.";
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

            var conceptsGraphUri = "http://www.eionet.europa.eu/gemet/";
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
            if(word) {
                var filter = "  regex(?conceptLabel, \"^" + word + "$\", \"i\")";
                if (!options.exactMatch) {
                    filter = "  regex(?conceptLabel, \"" + word + "\", \"i\")";

                }
            }else{
                if(options.conceptId){
                    filter = "  ?concept =<"+options.conceptId+">";
                }
            }

            var query = "PREFIX skos:<http://www.w3.org/2004/02/skos/core#>" +
                "SELECT distinct *" +
                "WHERE {" +
                "  ?concept skos:prefLabel ?conceptLabel . filter(" + filter+"&& lang(?conceptLabel)=\"en\")";



            for (var i = 1; i <= ancestorsDepth; i++) {
                if (i == 1) {
                    query += "  ?concept"  + " skos:broader|skos:member ?broader" + i + "." +
                        "?broader" + (i) + " skos:prefLabel ?broaderLabel" + (i) + "."+
                    "filter( lang(?broaderLabel" + (i) + ")=\"en\")"

                } else {
                    query += "OPTIONAL { ?broader" + (i - 1) + " skos:broader|skos:member ?broader" + i + "." +
                        "?broader" + (i) + " skos:prefLabel ?broaderLabel" + (i) + "." +
                        "filter( lang(?broaderLabel" + (i) + ")=\"en\")"
                }
            }




            for (var i = 1; i < ancestorsDepth; i++) {
                query += "}"
            }

            query += "} LIMIT 10000"


            var conceptsGraphUri = "http://www.eionet.europa.eu/gemet/";
            var url = app_config.sparql_url + "?default-graph-uri=" + encodeURIComponent(conceptsGraphUri) + "&query=";// + query + queryOptions
            var queryOptions = "&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=20000&debug=off"
            sparql.querySPARQL_GET_proxy(url, query, queryOptions, null, function (err, result) {
                if (err) {
                    return callback(err)
                }
                return callback(null, result.results.bindings);
            })
        }


        self.getNodeInfos = function (conceptId,options, callback) {

            var query = "select *" +
                " where {<" + conceptId + "> ?prop ?value. } limit 500";

            var conceptsGraphUri = "http://www.eionet.europa.eu/gemet/";
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
