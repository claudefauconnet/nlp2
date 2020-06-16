var sparql_ISO_15926 = (function () {
        var self = {};

        self.getTopConcepts = function (callback) {
            var query = "PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#> "
            query += "select * where{?concept rdfs:subClassOf <http://data.15926.org/dm/Thing>."
            query += "?concept rdfs:label ?conceptLabel." +
                " " +
                "" +
                "}order by ?conceptLabel limit 5000"

            self.execute_GET_query(query, function (err, result) {
                if (err) {
                    return callback(err)
                }
                return callback(null, result.results.bindings);
            })

        }


        self.getNodeChildren = function (parentUri, options, callback) {
            var query = "PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#> " +
                "select distinct * where {";

            query += "?child1 rdfs:subClassOf ?concept. "
                + " filter (?concept=<" + parentUri + ">) "
            if (options.level && options.level < 2)
                query += "?concept rdf:type  ?type.  filter (?type in( <http://www.w3.org/2002/07/owl#Class>,<http://data.15926.org/dm/ClassOfRelationship>))"


            query += "?child1 rdfs:label ?childLabel1." +
                " " +
                "" +
                "}order by ?childLabel1 limit 5000"

            self.execute_GET_query(query, function (err, result) {
                if (err) {
                    return callback(err)
                }
                return callback(null, result.results.bindings);
            })


        }

        self.getNodeInfos = function (conceptId,options, callback) {

            var query = "select *" +
                " where {<" + conceptId + "> ?prop ?value. } limit 500";
            self.execute_GET_query(query, function (err, result) {
                if (err) {
                    return callback(err);
                }
                return callback(null, result.results.bindings)


            })
        }

        self.searchConceptAndAncestors = function (word, options, callback) {


            var filter = "  regex(?conceptLabel, \"^" + word + "$\", \"i\")";
            if (!options.exactMatch) {
                filter = "  regex(?conceptLabel, \"" + word + "\", \"i\")";
            }

            var query = "PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#> " +
                "select distinct * where {";

            query += "  ?concept rdfs:label ?conceptLabel . filter(" + filter + ")";


            for (var i = 1; i <= options.ancestorsDepth; i++) {
                if (i == 1) {
                    query += "  ?concept" + " rdfs:subClassOf ?broader" + i + "." +
                        "?broader" + (i) + " rdfs:label ?broaderLabel" + (i) + ".";

                } else {
                    query += "OPTIONAL { ?broader" + (i - 1) + " rdfs:subClassOf ?broader" + i + "." +
                        "?broader" + (i) + " skos:label ?broaderLabel" + (i) + ".";

                }
            }
            for (var i = 1; i < options.ancestorsDepth; i++) {
                query += "}"
            }
            query += "} LIMIT 2000"


            self.execute_GET_query(query, function (err, result) {
                if (err) {
                    return callback(err);
                }
                var bindings = [];
                var ids = [];
                return callback(null, result.results.bindings);
            })
        }


        self.execute_GET_query = function (query, callback) {
            var query2 = encodeURIComponent(query);
            query2 = query2.replace(/%2B/g, "+").trim()
            var url = "http://data.posccaesar.org/rdl/?output=json" + "&query=" + query2;
            var url = "http://68.71.136.105/sparql/?output=json" + "&query=" + query2;
//var url="http://51.178.139.80:8890/sparql?default-graph-uri=http%3A%2F%2Fdata.15926.org%2Fdm%2F&query="+query2
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


    }
)()
