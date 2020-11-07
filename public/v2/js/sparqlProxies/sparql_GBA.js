var Sparql_GBA = (function () {
        var self = {};
        var elasticUrl = "/elastic";
        if (window.location.href.indexOf("https") > -1)
            elasticUrl = "../elastic";


        self.getTopConcepts = function (graphUri, callback) {
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




            var conceptsGraphUri = "";



            query="SELECT ?s ?p ?o " +
                " WHERE" +
                "{ ?s ?p ?o" +
                "} LIMIT 50 OFFSET 0"
            var queryOptions = "&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=20000&debug=off"
            self.execute_GET_query(query, function (err, result) {
                if (err) {
                    return callback(err)
                }
                return callback(null, result.results.bindings);
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
            sparql_skos_generic.getNodeParents(word, ancestorsDepth, options, callback)
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
        self.execute_GET_query = function (query, callback) {
            var query2 = encodeURIComponent(query);
            query2 = query2.replace(/%2B/g, "+").trim()

            var url = "https://resource.geolba.ac.at/PoolParty/sparql/tectonicunit" + "&query=" + query2;

            var body = {
                headers: {
                    "Accept": "application/sparql-results+json",
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            }
            var payload = {
                httpProxy: 1,
                url: url,
                body: body,
                options: {a: 1},
                GET: true


            }

            $.ajax({
                type: "POST",
                url: elasticUrl,
                data: payload,
                dataType: "json",
                /* beforeSend: function(request) {
                     request.setRequestHeader('Age', '10000');
                 },*/

                success: function (data, textStatus, jqXHR) {

                    var xx = data;
                    //  $("#messageDiv").html("found : " + data.results.bindings.length);
                    $("#waitImg").css("display", "none");
                    /*  if (data.results.bindings.length == 0)
                          return callback({data.results.bindings:},[])*/
                    callback(null, data)

                }
                , error: function (err) {
                    $("#messageDiv").html(err.responseText);

                    $("#waitImg").css("display", "none");
                    console.log(JSON.stringify(err))
                    console.log(JSON.stringify(query))
                    if (callback) {
                        return callback(err)
                    }
                    return (err);
                }

            });
        }

        return self;
    }
)()
