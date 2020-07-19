//https://ontology101tutorial.readthedocs.io/en/latest/OWL_ClassRestrictions.html


var Sparql_facade = (function () {
        var self = {};


        self.proxyUrl = "http://51.178.139.80:8890/sparql"

        self.getClasses = function (onlyTopClass, callback) {

            var query = "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>" +
                "prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>" +
                "select   distinct * from <http://sws.ifi.uio.no/data/npd-v2/>  where {?class\trdf:type rdfs:Class.  ?class rdfs:label ?classLabel."

            if (onlyTopClass) {
                query += " filter( not EXISTS {?class <http://www.w3.org/2000/01/rdf-schema#subClassOf> ?d} )"
            }
            query += "} order by ?classLabel limit 1000";

            self.querySPARQL_proxy(query, null, null, null, function (err, result) {
                if (err) {
                    return callback(err);
                }
                return callback(null, result.results.bindings);


            })


        }

        self.searchClasses = function (word, callback) {


            var query = "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>" +
                "prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>" +
                "select   distinct * from <http://sws.ifi.uio.no/data/npd-v2/>  where {?class rdf:type rdfs:Class.?class rdfs:label ?classLabel filter  regex(?classLabel, \"" + word + "\", \"i\")}"

            self.querySPARQL_proxy(query, null, null, null, function (err, result) {
                if (err) {
                    return callback(err);
                }
                return callback(null, result.results.bindings);


            })


        }


        self.getOwlClassesAndObjectProperties = function (owlPropType, callback) {
            var query = "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>" +
                "prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>" +
                "prefix owl: <http://www.w3.org/2002/07/owl#>" +
                "" +
                "select   distinct * from <http://sws.ifi.uio.no/vocab/npd-v2/>  where {" +
                " ?prop   rdf:type owl:ObjectProperty." +
                "  ?prop rdfs:domain ?domain." +
                "   ?prop rdfs:range ?range." +
                "  " +
                " " +
                "}limit 1000"

            self.querySPARQL_proxy(query, null, null, null, function (err, result) {
                if (err) {
                    return callback(err);
                }
                return callback(null, result.results.bindings);


            })
        }

        self.getOwlDataTypeProperties = function (callback) {
            var query = "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>prefix owl: <http://www.w3.org/2002/07/owl#>" +
                "select   distinct * from <http://sws.ifi.uio.no/vocab/npd-v2/>  where {" +
                "  ?prop   rdf:type owl:DatatypeProperty.  ?prop rdfs:domain ?domain.   ?prop rdfs:range ?range.   }limit 1000"
            self.querySPARQL_proxy(query, null, null, null, function (err, result) {
                if (err) {
                    return callback(err);
                }
                return callback(null, result.results.bindings);
            })
        }

        self.getOwlSubClasses = function (id, callback) {
            var query = "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>" +
                "prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>" +
                "prefix owl: <http://www.w3.org/2002/07/owl#>" +
                "" +
                "select   distinct * from <http://sws.ifi.uio.no/vocab/npd-v2/>  where {" +
                "?subClassId   rdfs:subClassOf <" + id + ">." +
                "}limit 1000"

            self.querySPARQL_proxy(query, null, null, null, function (err, result) {
                if (err) {
                    return callback(err);
                }
                return callback(null, result.results.bindings);


            })
        }

        self.getOwlPropertiesPath = function (sourceDomain, targetDomain, options, callback) {
            if (!options)
                options = {}
            if (!sourceDomain)
                return callback("no sourceDomain")
            var filterTargetDomain = "";
            if (targetDomain)
                filterTargetDomain = " filter (?targetDomain=<" + targetDomain + ">)";

            var query = "PREFIX owl: <http://www.w3.org/2002/07/owl#>" +
                "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>" +
                "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>" +
                "SELECT * from  <http://sws.ifi.uio.no/vocab/npd-v2/> WHERE {" +

                " ?prop1 rdfs:domain  ?sourceDomain. filter (?sourceDomain=<" + sourceDomain + ">)." +
                "  ?prop1 rdfs:range ?range1."

            if (!options.withLitterals)
                query += "filter(regex(str(?range1),\"http://sws.ifi.uio.no/vocab/\",\"i\"))"

            if (options.depth == 0) {
                query += " bind(?range1 as ?targetDomain)"
            }

            if (options.depth == 1) {
                query += "    OPTIONAL{" +
                    "     ?prop2 rdfs:range ?range1 ." +
                    "  ?prop2 rdfs:domain ?targetDomain." + filterTargetDomain +
                    "  " +
                    "    " +
                    "  }"
            }
            if (options.depth > 1)
                query += "    OPTIONAL{" +
                    "     ?prop2 rdfs:range ?range1 ." +
                    "  ?prop2 rdfs:domain ?domain2." +
                    "     ?prop3 rdfs:domain  ?targetDomain." +
                    "  " + filterTargetDomain +

                    "  " +
                    "    " +
                    "  }"

            query += "}  LIMIT 1000"

            self.querySPARQL_proxy(query, null, null, null, function (err, result) {
                if (err) {
                    return callback(err);
                }
                return callback(null, result.results.bindings);


            })
        }

        self.getOwlRestrictionsOnProperties = function (sourceDomain, callback) {

            var query =

                "PREFIX owl: <http://www.w3.org/2002/07/owl#>" +
                "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>" +
                "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>" +
                "SELECT * from  <http://sws.ifi.uio.no/vocab/npd-v2/> WHERE {" +
                " ?sourceDomain rdfs:subClassOf ?prop1. filter (?sourceDomain=<" + sourceDomain + ">)." +
                " ?prop1 owl:onProperty ?targetDomain."+

            "OPTIONAL {?targetDomain  owl:onProperty  ?prop1 .}"



            query += "}  LIMIT 1000"

            self.querySPARQL_proxy(query, null, null, null, function (err, result) {
                if (err) {
                    return callback(err);
                }
                return callback(null, result.results.bindings);


            })


        }


        self.querySPARQL_proxy = function (query, url, queryOptions, options, callback) {
            console.log(query)
            if (!url) {
                url = self.proxyUrl;
            }
            if (!queryOptions) {
                queryOptions = "&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=20000&debug=off"
            }
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
                options: queryOptions


            }

            if (options.method && options.method == "GET")
                payload.GET = true;
            else
                payload.POST = true;

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
