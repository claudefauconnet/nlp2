var sparql = (function () {
    var self = {}
    self.source = {
        sparql_url: 'http://vps475829.ovh.net:8890/sparql',
        // graphIRI: 'http://onto.ctg.total.com/'
        graphIRI: "http://data.total.com/resource/ontology/ctg/"
    }

    self.listEntities = function (words, options, callback) {
        var url = self.source.sparql_url + "?default-graph-uri=" + encodeURIComponent(self.source.graphIRI) + "&query=";// + query + queryOptions

        var wordFilter = " FILTER ("
        words.split(" ").forEach(function (word, index) {
            if (index > 0)
                wordFilter += " || "
            wordFilter += "contains(lcase(str(?entityLabel )),\"" + word.toLowerCase() + "\")";
        })
        wordFilter += ")";


        var query = "PREFIX terms:<http://purl.org/dc/terms/>" +
            "PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#>" +
            "PREFIX rdfsyn:<http://www.w3.org/1999/02/22-rdf-syntax-ns#>" +
            "" +
            "select * " +
            "where {" +
            "?entity rdfs:label ?entityLabel ." +
            wordFilter +

            "FILTER (lang(?entityLabel)=\"en\")" +
            "" +
            "" +
            "?entity rdfsyn:type ?entityType ." +

            "" +
            "}" +
            "limit 100"
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


    self.queryEntitiesCooccurrences = function (entityIds, options, callback) {
        if (!options)
            options = {};
        var entityIdsStr = "";
        var entityTypesStr = "";
        entityIds.forEach(function (id, index) {
            if (index > 0)
                entityIdsStr += ","
            entityIdsStr += "<" + id + ">"
        })

        if (options.filterEntityTypes) {
            options.filterEntityTypes.forEach(function (type, index) {
                if (index > 0)
                    entityTypesStr += ","
                entityTypesStr += "<http://data.total.com/resource/ontology/ctg/EntityType/" + type + ">"
            })
        }

        var url = self.source.sparql_url + "?default-graph-uri=" + encodeURIComponent(self.source.graphIRI) + "&query=";// + query + queryOptions

        var query = "PREFIX terms:<http://purl.org/dc/terms/>" +
            "PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#>" +
            "PREFIX rdfsyn:<http://www.w3.org/1999/02/22-rdf-syntax-ns#>" +
            "" +
            // "select distinct *" +
            "select distinct ?entity1Type ?entity1 ?entity1Label ?entity2Type ?entity2 ?entity2Label (count (?paragraph) as?nOccurrences)" +
            "where{" +
            "" +
            "?paragraph terms:subject ?entity1 ." +
            "filter (?entity1 in(" + entityIdsStr + "))" +
            "?entity1 rdfs:label ?entity1Label ." +
            "FILTER (lang(?entity1Label)=\"en\")" +
            "?entity1 rdfsyn:type ?entity1Type ." +


            "?paragraph   terms:subject ?entity2 ." +
            "?entity2  rdfs:label ?entity2Label ." +
            "FILTER (lang(?entity2Label)=\"en\")" +
            "?entity2 rdfsyn:type ?entity2Type ." +
            "" +
            " FILTER(?entity1  != ?entity2)"

        if (options.filterEntityTypes) {
            query += "FILTER (?entity2Type  in (" + entityTypesStr + ")) "
        }

        query += "}" +
            "GROUP BY ?entity1Type ?entity1 ?entity1Label ?entity2Type ?entity2 ?entity2Label " +
            " ORDER BY  ?entity1 ?entity2Type " +
            "limit 10000" +
            ""


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
    self.queryParagraphsDetails = function (pargagraphsIds, options, callback) {
        var pargagraphsIdsStr = "";
        pargagraphsIds.forEach(function (id, index) {
            if (index > 0)
                pargagraphsIdsStr += ","
            pargagraphsIdsStr += "<" + id + ">"
        })

        var url = self.source.sparql_url + "?default-graph-uri=" + encodeURIComponent(self.source.graphIRI) + "&query=";// + query + queryOptions

        var query = "PREFIX terms:<http://purl.org/dc/terms/>" +
            "PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#>" +
            "PREFIX rdfsyn:<http://www.w3.org/1999/02/22-rdf-syntax-ns#>" +
            "PREFIX mime:<http://purl.org/dc/dcmitype/> " +
            "" +
            // "select distinct *" +
            "select distinct *" +
            "where{" +
            "?paragraph mime:Text ?paragraphText ." +
            " filter (?paragraph in(" + pargagraphsIdsStr + "))"
        if (options.offsets)
            query += "?paragraph <http://open.vocab.org/terms/hasOffset> ?offset ."
        if (options.containers) {
            query += "?paragraph <http://purl.org/dc/terms/isPartOf> ?container ." +
                " OPTIONAL {?container <http://www.w3.org/2000/01/rdf-schema#label> ?documentLabel .}"
        }
        query += "} limit 10000"


        var queryOptions = "&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=20000&debug=off"
        sparql.querySPARQL_GET_proxy(url, query, queryOptions, null, function (err, result) {
            if (err) {
                console.log(query)
                return callback(err);
            }
            var bindings = [];
            var ids = [];
            return callback(null, result.results.bindings);


        })
    }

    self.queryEntitiesCooccurrencesParagraphs = function (entityIds, options, callback) {
        var entityIdsStr = "";


        var url = self.source.sparql_url + "?default-graph-uri=" + encodeURIComponent(self.source.graphIRI) + "&query=";// + query + queryOptions


        var query = "   PREFIX terms:<http://purl.org/dc/terms/>" +
            "        PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#>" +
            "        PREFIX rdfsyn:<http://www.w3.org/1999/02/22-rdf-syntax-ns#>" +
            "PREFIX mime:<http://purl.org/dc/dcmitype/> " +
            "" +
            "        select *" +
            "        where{ "

        entityIds.forEach(function (id, index) {
            if (index >= options.minManadatoryEntities)
                query += "OPTIONAL {"
            query +=
                "  ?paragraph terms:subject ?entity" + index + " . " +
                "    FILTER (?entity" + index + " in(<" + id + ">))" +
                "  ?entity" + index + " rdfs:label ?entity" + index + "Label . " +
                "  FILTER (lang(?entity" + index + "Label)=\"en\") " +
                "  ?entity" + index + " rdfsyn:type ?entity" + index + "Type .  " +
                "    "

            if (index >= options.minManadatoryEntities)
                query += "}"

        })
        query += "    } limit 1000"
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

    self.queryEntitiesInfos = function (entityIds, options, callback) {
        var entityIdsStr = "";

        entityIds.forEach(function (id, index) {
            if (index > 0)
                entityIdsStr += ","
            entityIdsStr += "<" + id + ">"
        })

        var url = self.source.sparql_url + "?default-graph-uri=" + encodeURIComponent(self.source.graphIRI) + "&query=";// + query + queryOptions

        var query = "   PREFIX terms:<http://purl.org/dc/terms/>" +
            "        PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#>" +
            "        PREFIX rdfsyn:<http://www.w3.org/1999/02/22-rdf-syntax-ns#>" +
            "PREFIX mime:<http://purl.org/dc/dcmitype/> " +
            "PREFIX skos:<http://www.w3.org/2004/02/skos/core#>" +

            "        select *" +
            "        where{ "

        var index = "";
        query +=


            "  ?entity" + index + " rdfs:label ?entity" + index + "Label . " +
            "    FILTER (?entity" + index + " in(" + entityIdsStr + "))" +
            "  FILTER (lang(?entity" + index + "Label)=\"en\") " +
            "  ?entity" + index + " rdfsyn:type ?entity" + index + "Type .  " +

            "  OPTIONAL  { ?entity" + index + " skos:definition ?definition" + index + "Type .  }" +
            "    "


        query += "    } limit 1000"
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

    self.queryParagraphsEntities = function (paragraphIds, options, callback) {
        var paragraphIdsStr = "";
        paragraphIds.forEach(function (id, index) {
            if (index > 0)
                paragraphIdsStr += ","
            paragraphIdsStr += "<" + id + ">"
        })
        var url = self.source.sparql_url + "?default-graph-uri=" + encodeURIComponent(self.source.graphIRI) + "&query=";// + query + queryOptions

        var query = "PREFIX terms:<http://purl.org/dc/terms/>        PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#>        PREFIX rdfsyn:<http://www.w3.org/1999/02/22-rdf-syntax-ns#> " +
            "PREFIX mime:<http://purl.org/dc/dcmitype/> " +
            "select *        where{ " +
            "" +
            "  ?paragraph terms:subject ?entity0 . " +
            //     "?paragraph mime:Text ?paragraphText ." +
            "    FILTER (?paragraph in(" + paragraphIdsStr + "))  " +
            "?entity0 rdfs:label ?entity0Label .   FILTER (lang(?entity0Label)=\"en\") " +
            "  ?entity0 rdfsyn:type ?entity0Type ." +
            "" +
            "}" +
            "" +

            "limit 10000" +
            ""
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


    self.queryEntitiesRelations = function (startEntityIds, options, callback) {

        var startEntityIdsStr = "";
        startEntityIds.forEach(function (id, index) {
            if (index > 0)
                startEntityIdsStr += ","
            startEntityIdsStr += "<" + id + ">"
        })

        var url = self.source.sparql_url + "?default-graph-uri=" + encodeURIComponent("http://data.total.com/resource/ontology/ctg/relations/") + "&query=";// + query + queryOptions

        var query = "PREFIX terms:<http://purl.org/dc/terms/>        PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#>        PREFIX rdfsyn:<http://www.w3.org/1999/02/22-rdf-syntax-ns#> " +
            "PREFIX mime:<http://purl.org/dc/dcmitype/> " +
            "PREFIX rels:<http://data.total.com/resource/ontology/ctg/relation/> " +
            "select *        where{ " +
            "" +
            "  ?startEntity ?relationType ?endEntity . " +
            "    FILTER (?startEntity in(" + startEntityIdsStr + "))  " +

            "" +
            "}" +
            "" +

            "limit 10000" +
            ""
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


    self.querySPARQL_GET_proxy_cursor = function (url, query, queryOptions, options, callback) {
        var offset = 0;
        var limit = 5000;
        var resultSize = 1;
        var allData = {
            results: {bindings: []}
        }

        var p = query.toLowerCase().indexOf("limit")
        if (p > -1)
            var query = query.substring(0, p)
        query += " LIMIT " + limit;


        async.whilst(
            function (callbackTest) {//test
                return resultSize > 0;
            },
            function (callbackWhilst) {//iterate

                var queryCursor = query + " OFFSET " + offset


                var body = {
                    params: {query: queryCursor},
                    headers: {
                        "Accept": "application/sparql-results+json",
                        "Content-Type": "application/x-www-form-urlencoded"
                    }
                }


                $("#waitImg").css("display", "block");


                //   url="http://vps475829.ovh.net:8890/sparql"
                var payload = {
                    httpProxy: 1,
                    url: url,
                    body: body,
                    POST: true,

                }
                $.ajax({
                    type: "POST",
                    url: "/elastic",
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
                        callbackWhilst(null, data);
                        resultSize = data.results.bindings.length
                        allData.results.bindings = allData.results.bindings.concat(data.results.bindings);
                        offset += limit;

                    }
                    , error: function (err) {
                        $("#messageDiv").html(err.responseText);

                        $("#waitImg").css("display", "none");
                        console.log(JSON.stringify(err))
                        console.log(JSON.stringify(query))
                        return callbackWhilst(err)

                    }

                });

            }, function (err) {
                callback(err, allData)

            })
    }


    self.querySPARQL_GET_proxy = function (url, query, queryOptions, options, callback) {
        if (!options)
            options = {}
        if (!options.doNotEncode) {
            var query2 = encodeURIComponent(query);
            query2 = query2.replace(/%2B/g, "+").trim()
        }



        var body = {
            params: {query: query},
            headers: {
                "Accept": "application/sparql-results+json",
                "Content-Type": "application/x-www-form-urlencoded"
            }
        }


        $("#waitImg").css("display", "block");




        var payload = {
            httpProxy: 1,
            url: url,
            body: body,
            options:queryOptions


        }

        if (options.method && options.method=="GET")
            payload.GET=true;
        else
            payload.POST=true;

        $.ajax({
            type: "POST",
            url: "/elastic",
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
})()
