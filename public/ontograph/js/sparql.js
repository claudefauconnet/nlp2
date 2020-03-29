var sparql = (function () {
    var self = {}
    self.source = {
        sparql_url: 'http://vps475829.ovh.net:8890/sparql',
        graphIRI: 'http://onto.ctg.total.com/'
    }

    self.listEntities = function (words, options, callback) {
        var url = self.source.sparql_url + "?default-graph-uri=" + encodeURIComponent(self.source.graphIRI) + "&query=";// + query + queryOptions

        var wordFilter = " FILTER ("
        words.split(" ").forEach(function (word, index) {
            if (index > 0)
                wordFilter += " || "
            wordFilter += "contains(lcase(str(?entityLabel )),\"" + word + "\")";
        })
        wordFilter += ")";


        var query = "PREFIX terms:<http://purl.org/dc/terms/>" +
            "PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#>" +
            "PREFIX rdfsyn:<https://www.w3.org/1999/02/22-rdf-syntax-ns#>" +
            "" +
            "select * " +
            "where {" +
            "?entity rdfs:label ?entityLabel ." +
            wordFilter +

            "FILTER (lang(?entityLabel)=\"en\")" +
            "" +
            "" +
            "?entity rdfsyn:type ?entityType ." +
            "?entityType rdfs:label ?entityTypeLabel." +
            "FILTER (lang(?entityTypeLabel)=\"en\")" +
            "" +
            "}" +
            "limit 100"
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


    self.queryEntitiesCooccurrences = function (entityIds, options, callback) {
        var entityIdsStr = "";
        entityIds.forEach(function (id, index) {
            if (index > 0)
                entityIdsStr += ","
            entityIdsStr += "<" + id + ">"
        })

        var url = self.source.sparql_url + "?default-graph-uri=" + encodeURIComponent(self.source.graphIRI) + "&query=";// + query + queryOptions

        var query = "PREFIX terms:<http://purl.org/dc/terms/>" +
            "PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#>" +
            "PREFIX rdfsyn:<https://www.w3.org/1999/02/22-rdf-syntax-ns#>" +
            "" +
            // "select distinct *" +
            "select distinct ?entity1Type ?entity1 ?entity1Label ?entity2Type ?entity2 ?entity2Label (count (?paragraph) as?nOccurences)" +
            "where{" +
            "" +
            "?paragraph terms:subject ?entity1 ." +
            "filter (?entity1 in(" + entityIdsStr + "))" +
            "?entity1 rdfs:label ?entity1Label ." +
            "FILTER (lang(?entity1Label)=\"en\")" +
            "?entity1 rdfsyn:type ?entity1Type ." +
            "" +
            "" +
            "?paragraph   terms:subject ?entity2 ." +
            "?entity2  rdfs:label ?entity2Label ." +
            "FILTER (lang(?entity2Label)=\"en\")" +
            "?entity2 rdfsyn:type ?entity2Type ." +
            "" +
            " FILTER(?entity1  != ?entity2)" +
            "}" +
            "GROUP BY ?entity1Type ?entity1 ?entity1Label ?entity2Type ?entity2 ?entity2Label " +
            " ORDER BY  ?entity1 ?entity2Type " +
            "limit 10000" +
            ""
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

    self.queryEntitiesCooccurrencesParagraphs = function (entityIds, options, callback) {
        var entityIdsStr = "";


        var url = self.source.sparql_url + "?default-graph-uri=" + encodeURIComponent(self.source.graphIRI) + "&query=";// + query + queryOptions


        var query = "   PREFIX terms:<http://purl.org/dc/terms/>" +
            "        PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#>" +
            "        PREFIX rdfsyn:<https://www.w3.org/1999/02/22-rdf-syntax-ns#>" +
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

    self.querySPARQL_GET_proxy = function (url, query, queryOptions, options, callback) {
        if (!options)
            options = {}
        if (!options.doNotEncode) {
            query = encodeURIComponent(query);
            query = query.replace(/%2B/g, "+")
        }
        url = url + query + queryOptions;
        console.log(url)

        $("#waitImg").css("display", "block");

        var payload = {
            httpProxy: 1,
            url: url,
            options: JSON.stringify(options)
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
                callback(null, data)

            }
            , error: function (err) {
                $("#messageDiv").html(err.responseText);
                $("#waitImg").css("display", "none");
                console.log(JSON.stringify(err))
                if (callback) {
                    return callback(err)
                }
                return (err);
            }

        });
    }


    self.queryParagraphsEntities = function (paragraphIds, options, callback) {
        var paragraphIdsStr = "";
        paragraphIds.forEach(function (id, index) {
            if (index > 0)
                paragraphIdsStr += ","
            paragraphIdsStr += "<" + id + ">"
        })

        var url = self.source.sparql_url + "?default-graph-uri=" + encodeURIComponent(self.source.graphIRI) + "&query=";// + query + queryOptions

        var query = "PREFIX terms:<http://purl.org/dc/terms/>        PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#>        PREFIX rdfsyn:<https://www.w3.org/1999/02/22-rdf-syntax-ns#> " +
            "PREFIX mime:<http://purl.org/dc/dcmitype/> " +
            "select *        where{ " +
            "" +
            "  ?paragraph terms:subject ?entity0 . " +
            "?paragraph mime:Text ?paragraphText ." +
            "    FILTER (?paragraph in(" + paragraphIdsStr + "))  " +
            "?entity0 rdfs:label ?entity0Label .   FILTER (lang(?entity0Label)=\"en\") " +
            "  ?entity0 rdfsyn:type ?entity0Type ." +
            "" +
            "}" +
            "" +
            "limit 10"
        "limit 10000" +
        ""
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

    self.querySPARQL_GET_proxy = function (url, query, queryOptions, options, callback) {
        if (!options)
            options = {}
        if (!options.doNotEncode) {
            query = encodeURIComponent(query);
            query = query.replace(/%2B/g, "+")
        }
        url = url + query + queryOptions;
        console.log(url)

        $("#waitImg").css("display", "block");

        var payload = {
            httpProxy: 1,
            url: url,
            POST: true,
            options: JSON.stringify(options)
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
                callback(null, data)

            }
            , error: function (err) {
                $("#messageDiv").html(err.responseText);
                $("#waitImg").css("display", "none");
                console.log(JSON.stringify(err))
                if (callback) {
                    return callback(err)
                }
                return (err);
            }

        });
    }


    return self;
})()
