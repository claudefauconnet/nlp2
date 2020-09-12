//https://ontology101tutorial.readthedocs.io/en/latest/OWL_ClassRestrictions.html

//https://gitlab.com/logid/npd-factpages/-/tree/develop/ontology


var Sparql_facade = (function () {
        var self = {};

        //gestion des url de routage node (index.js) avec nginx
        var elasticUrl = "/elastic";
        if (window.location.href.indexOf("https") > -1)
            elasticUrl = "../elastic";

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

        /*   self.searchClasses = function (word, callback) {


               var query = "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>" +
                   "prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>" +
                   "select   distinct * from <http://sws.ifi.uio.no/data/npd-v2/>  where {" +
                   "?class rdf:type rdfs:Class." +
                   "?class rdfs:label ?classLabel filter  regex(?classLabel, \"" + word + "\", \"i\")}"

               self.querySPARQL_proxy(query, null, null, null, function (err, result) {
                   if (err) {
                       return callback(err);
                   }
                   return callback(null, result.results.bindings);


               })


           }*/


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

        self.getOwlClassesObjectProperties = function (classId, callback) {
            var query = "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>" +
                "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>" +
                "SELECT ?class ?property ?range ?domain ?propType from <http://sws.ifi.uio.no/vocab/npd-v2/>   WHERE {" +
                " ?bNode rdf:type <http://www.w3.org/2002/07/owl#Restriction>." +
                " ?class rdfs:subClassOf ?bNode." +
                " ?bNode <http://www.w3.org/2002/07/owl#onProperty> ?property." +
                "  filter (?class=<" + classId + ">)" +
                "  ?property rdfs:domain ?domain." +
                "   ?property rdfs:range ?range." +
                " ?property rdf:type ?propType" +
                "}order by ?q LIMIT 1000";
            self.querySPARQL_proxy(query, null, null, null, function (err, result) {
                if (err) {
                    return callback(err);
                }
                return callback(null, result.results.bindings);


            })
        }
        self.getOwlClassesDataProperties = function (propId, callback) {
            var query = "PREFIX owl: <http://www.w3.org/2002/07/owl#>PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>" +
                "SELECT * from  <http://sws.ifi.uio.no/vocab/npd-v2/>" +
                "WHERE" +
                "{" +
                "  ?property rdf:type ?type." +
                "  ?property rdfs:domain ?domain." +
                "   ?property rdfs:range ?range." +
                "   filter (?property =<" + propId + ">)" +
                "}  LIMIT 1000"

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
                " ?prop1 owl:onProperty ?targetDomain." +

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
            $("#waitImg").css("display","block")
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

        self.listDataValues = function (domain, prop, value, callback) {


            var query =

                "PREFIX owl: <http://www.w3.org/2002/07/owl#>" +
                "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>" +
                "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>" +
                "SELECT * from  <http://sws.ifi.uio.no/vocab/npd-v2/> from <http://sws.ifi.uio.no/data/npd-v2/> WHERE {" +
                " ?x <" + prop + ">  ?y";
            if (value)
                query += " filter(regex(?y,'" + value + "','i'))"


            query += "}order by ?y  LIMIT 1000"

            self.querySPARQL_proxy(query, null, null, null, function (err, result) {
                if (err) {
                    return callback(err);
                }
                return callback(null, result.results.bindings);


            })


        }

        self.searchData = function (word, callback) {

            var query = "PREFIX owl: <http://www.w3.org/2002/07/owl#>" +
                "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>" +
                "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>" +
                "SELECT distinct ?id ?name ?class " +
                "from  <http://sws.ifi.uio.no/vocab/npd-v2/>" +
                "from <http://sws.ifi.uio.no/data/npd-v2/>" +
                "from <http://resource.geoscimlx.org/>" +
                "WHERE { ?id <http://sws.ifi.uio.no/vocab/npd-v2#name>  ?name. filter(regex(?name,'" + word + "','i'))  ?id ?p ?class." +
                "?class rdf:type rdfs:Class }order by ?class ?name LIMIT 1000"

            self.querySPARQL_proxy(query, null, null, null, function (err, result) {
                if (err) {
                    return callback(err);
                }
                return callback(null, result.results.bindings);


            })


        }

        self.searchClasses = function (word, callback) {
            var word2 = "XXXX"
          //  word2 =word
            var filterClass=""
            var filterProp=""
            if(word && word!="") {
                filterClass = " filter(regex(str(?classProp),'" + word + "','i')) ";
                filterProp = " filter(regex(str(?classProp),'" + word2 + "','i')) ";
            }

            var query = "PREFIX owl: <http://www.w3.org/2002/07/owl#>PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>" +
                "SELECT  ?classProp ?propId ?type ?parent (count(?z) as ?countInstances) from  <http://sws.ifi.uio.no/vocab/npd-v2/>from <http://sws.ifi.uio.no/data/npd-v2/>from <http://resource.geoscimlx.org/>WHERE {" +
                "  {" +
                "  ?classProp rdf:type ?type. "+filterClass+" filter(?type in(rdfs:Class))" +
                "  ?classProp rdfs:subClassOf ?nNode. ?nNode owl:someValuesFrom ?parent. ?parent rdf:type owl:Class.?nNode owl:onProperty ?propId. ?z ?w ?classProp." +
                "  }" +
             /*   "  UNION{" +
                "      ?classProp rdf:type ?type."+filterProp+" filter(?type in(rdf:Property))" +
                "  ?classProp rdfs:range ?parent. ?parent rdf:type owl:Class. ?z ?w ?classProp" +
                "  }" +*/
                "} group by ?classProp ?propId ?type ?parent LIMIT 10000"

            self.querySPARQL_proxy(query, null, null, null, function (err, result) {
                if (err) {
                    return callback(err);
                }
                return callback(null, result.results.bindings);


            })
        }

        self.getObjectPropertyValues = function (objectPropertyId, callback) {
            var query = "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>" +
                "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> " +
                "prefix owl: <http://www.w3.org/2002/07/owl#>" +
                "SELECT * from <http://sws.ifi.uio.no/vocab/npd-v2/>   WHERE { " +
                " ?bNode owl:onProperty ?objectProperty ." +
                " ?bNode rdf:type owl:Restriction ." +
                "  ?bNode owl:someValuesFrom ?someValue." +
                "  ?someValue rdf:type ?someValueType." +
                "  filter (?objectProperty=<" + objectPropertyId + ">)  } LIMIT 1000"

            self.querySPARQL_proxy(query, null, null, null, function (err, result) {
                if (err) {
                    return callback(err);
                }
                return callback(null, result.results.bindings);


            })


        }

        self.getLinkedClasses = function (word, direction, callback) {





var filter="";
            if (word.indexOf("http") > -1) {
                if (direction == 0)
                    filter += "  filter (?domain=<" + word + ">  || ?range=<" + word + ">) "
                else if (direction > 0)
                    filter += "  filter (?domain=<" + word + "> ) "
                else
                    filter += "  filter ( ?range=<" + word + ">) "


            } else {
                if (direction == 0)
                    filter += "  filter (regex(?range,'" + word + "','i')|| regex(?domain,'" + word + "','i')) "
                else if (direction > 0)
                    filter += "  filter (regex(?range,'" + word + "','i')) "
                else
                    filter += "  filter ( regex(?domain,'" + word + "','i')) "
            }

            var query = "SELECT distinct * from <http://sws.ifi.uio.no/vocab/npd-v2/>   WHERE {{?domain rdfs:subClassOf ?bNode. " +
                filter+
                "  ?bNode  owl:onProperty  ?prop." +
                "    ?prop rdf:type ?propType." +
                "  optional{ ?prop ?xx ?range. filter(?xx in( rdfs:range))}"+
                "  }" +
                "  UNION" +
                "     {?prop rdfs:domain ?domain.?prop rdfs:range ?range.?prop rdf:type ?propType.  " +filter+
                "    }"

            query += " } LIMIT 1000"

            self.querySPARQL_proxy(query, null, null, null, function (err, result) {
                if (err) {
                    return callback(err);
                }
                return callback(null, result.results.bindings);


            })


        }

        self.getOwlObjInfos = function (objId, callback) {
            var query = "  PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>SELECT * from <http://sws.ifi.uio.no/vocab/npd-v2/>  " +
                " WHERE {?id ?prop ?value filter(?id=<" + objId + ">)  } LIMIT 1000";
            self.querySPARQL_proxy(query, null, null, null, function (err, result) {
                if (err) {
                    return callback(err);
                }
                return callback(null, result.results.bindings);


            })

        }


        return self;
    }
)()


/* ***************************************
contenu des restrictions


PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
SELECT * from <http://sws.ifi.uio.no/data/npd-v2/> from <http://sws.ifi.uio.no/vocab/npd-v2/>   WHERE {

 ?q rdf:type <http://www.w3.org/2002/07/owl#Restriction>.
 ?xx ?yy ?q.
   ?q 	<http://www.w3.org/2002/07/owl#onProperty> ?qq.
}order by ?q LIMIT 1000



/* *********************************
Object properties

PREFIX owl: <http://www.w3.org/2002/07/owl#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
SELECT distinct * from <http://sws.ifi.uio.no/vocab/npd-v2/>  from <http://sws.ifi.uio.no/data/npd-v2/> WHERE {
 ?pred rdf:type owl:ObjectProperty.
  ?a ?pred ?c.
// filter (?pred=<http://sws.ifi.uio.no/vocab/npd-v2#inLithostratigraphicUnit>)
} LIMIT 1000
/


/* *******************************************
 FunctionalProperties (only idNPD)

PREFIX owl: <http://www.w3.org/2002/07/owl#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
SELECT distinct ?pred from <http://sws.ifi.uio.no/vocab/npd-v2/>  from <http://sws.ifi.uio.no/data/npd-v2/> WHERE {
 ?pred rdf:type owl:FunctionalProperty.


} LIMIT 100
 */


/* *************************************************
DataTypeProperty (s'applique aux blancq nodes)
PREFIX owl: <http://www.w3.org/2002/07/owl#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
SELECT distinct * from <http://sws.ifi.uio.no/vocab/npd-v2/>  from <http://sws.ifi.uio.no/data/npd-v2/> WHERE {
 ?pred rdf:type owl:DatatypeProperty.
 ?x ?y ?pred

} LIMIT 1000

/* **************************************************
AnnotationProperty

PREFIX owl: <http://www.w3.org/2002/07/owl#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
SELECT distinct * from <http://sws.ifi.uio.no/vocab/npd-v2/>  from <http://sws.ifi.uio.no/data/npd-v2/> WHERE {
 ?pred rdf:type owl:AnnotationProperty.


} LIMIT 100
 */








