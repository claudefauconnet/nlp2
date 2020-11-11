var Sparql_WORDNET = (function () {


    var self = {};
    self.getTopConcepts = function (graphUri, options, callback) {

    }

    self.list = function (source, word, options, callback) {

        /*  var filter = " (lcase(str(?prefLabel)) = \"" + word.toLowerCase() + "\")";
          if (!options.exactMatch) {
              filter = "contains(lcase(str(?prefLabel)),\"" + word.toLowerCase() + "\")";
          }*/

        var filter = "  regex(?prefLabel, \"^" + word + "$\", \"i\")";
        if (!options.exactMatch) {
            filter = "  regex(?prefLabel, \"" + word + "\", \"i\")";
        }

        var url = source.sparql_url + "?default-graph-uri=" + encodeURIComponent(source.graphIRI) + "&query=";// + query + queryOptions
        word = word.charAt(0).toUpperCase() + word.slice(1);
        var query = "PREFIX rdf:<http://www.w3.org/2000/01/rdf-schema#> PREFIX wordnet: <http://www.w3.org/2006/03/wn/wn20/schema/>" +
            "select distinct * where {  ?id rdf:label ?prefLabel . filter(" + filter + ") ?id wordnet:hyponymOf ?broaderId ." +
            "  ?broaderId rdf:label ?broader." +
            "}" +
            "LIMIT 1000"


        var queryOptions = "&format=json"; //"&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=200000&debug=off"

        sparql_abstract.querySPARQL_GET_proxy(url, query, queryOptions, null, function (err, result) {
            if (err) {
                return callback(err);
            }
            var bindings = [];
            var ids = [];
            result.results.bindings.forEach(function (item) {

                if (ids.indexOf(item.id < 0)) {
                    var parts = item.id.value.split("/");
                    var part = parts[parts.length - 2]
                    ids.push(item.id)
                    bindings.push({id: item.id.value, label: part + "_" + item.prefLabel.value, description: item.broader.value})
                }

            })
            callback(null, bindings)
        })

    }

    self.getAncestors = function (source, id, options, callback) {
        var url = source.sparql_url + "?default-graph-uri=" + encodeURIComponent(source.graphIRI) + "&query=";// + query + queryOptions


        var query = "PREFIX rdf:<http://www.w3.org/2000/01/rdf-schema#> PREFIX wordnet: <http://www.w3.org/2006/03/wn/wn20/schema/>" +
            "select distinct * where {";

        query += "  ?id rdf:label ?prefLabel . filter( ?id=<" + id + ">)";

        var depth = 4// erreur sparql si plus d'un optional
        for (var i = 1; i <= depth; i++) {
            if (i == 1) {
                query += "  ?id" + " wordnet:hyponymOf ?broaderId" + i + "." +
                    "?broaderId" + (i) + " rdf:label ?broader" + (i) + ".";

            } else {
                if (i == depth - 1)// erreur sparql si plus d'un optional
                    query += "OPTIONAL { ?broaderId" + (i - 1) + "  wordnet:hyponymOf ?broaderId" + i + ".";
                else
                    query += "  ?broaderId" + (i - 1) + "  wordnet:hyponymOf ?broaderId" + i + ".";

                query += "?broaderId" + (i) + " rdf:label ?broader" + (i) + ".";

            }
        }
        for (var i = 1; i < 2; i++) {
            query += "}"
        }
        query += "} LIMIT 1000"


        var queryOptions = "&format=json";

        sparql_abstract.querySPARQL_GET_proxy(url, query, queryOptions, null, function (err, result) {
            if (err) {
                return callback(err);
            }
            result.results.bindings.forEach(function (item) {

                for (var i = 1; i <= depth; i++) {
                    if (typeof item["broaderId" + i] != "undefined") {
                        var parts = item["broaderId" + i].value.split("/");
                        var part = parts[parts.length - 2];
                        item["broader" + i].value = part + "." + item["broader" + i].value
                    }
                }

            })

            var json = sparql_abstract.processData_SKOS(source, id, result.results.bindings)
            callback(null, json)

        })
    }

    self.getNodeChildren = function (graphUri, words, ids, descendantsDepth, options, callback) {
        var url = source.sparql_url + "?default-graph-uri=" + encodeURIComponent(source.graphIRI) + "&query=";// + query + queryOptions

        var query = "PREFIX rdf:<http://www.w3.org/2000/01/rdf-schema#> PREFIX wordnet: <http://www.w3.org/2006/03/wn/wn20/schema/>" +
        "SELECT DISTINCT ?narrowerId ?narrowerLabel   WHERE {"

        query += "  ?id rdf:label ?prefLabel . filter( ?id=<" + id + ">)";


        var i = 1
        query += "  ?narrowerId wordnet:hyponymOf ?id ." +
            "?narrowerId"  + " rdf:label ?narrowerLabel .";



        query += "} LIMIT 1000"


        var queryOptions = "&format=json";

        sparql_abstract.querySPARQL_GET_proxy(url, query, queryOptions, null, function (err, result) {
            if (err) {
                return callback(err);
            }
            var bindings = []
            result.results.bindings.forEach(function (item) {
                if (item.narrowerId) {




                    var countNarrowers2 = 10
                    if (item.countNarrowers2)
                        countNarrowers2 = parseInt(item.countNarrowers2.value)
                    var data = {source: source, parent: id}
                    bindings.push({id: id, narrowerId: item.narrowerId.value, narrowerLabel: item.narrowerLabel.value, countNarrowers2: countNarrowers2, data: data})
                }
            })
            callback(null, bindings)

        })


    }


    self.getDetails = function (source, id, options, callback) {
        var url = source.sparql_url + "?default-graph-uri=" + encodeURIComponent(source.graphIRI) + "&query=";// + query + queryOptions

        var query = "PREFIX rdf:<http://www.w3.org/2000/01/rdf-schema#>" +
            "" +
            "select distinct *" +
            "" +
            "where {" +
            "?id ?prop ?value . filter(?id= <" + id + ">)" +
            "" +
            " optional{\n" +
            "?prop rdf:label ?propLabel .\n" +
            "}\n" +
            " optional{\n" +
            "?value rdf:label ?valueLabel .\n" +
            "}\n" +
            "\n" +
            "}"
        "" +
        "}" +
        "limit 100"
        var queryOptions = "&format=json";
        sparql_abstract.querySPARQL_GET_proxy(url, query, queryOptions, null, function (err, result) {
            if (err) {
                return callback(err);
            }
            var bindings = []
            var obj = {label: options.label, id: id, properties: {}};
            result.results.bindings.forEach(function (item) {
                var propName = item.prop.value
                var p = propName.lastIndexOf("#")
                if (p == -1)
                    var p = propName.lastIndexOf("/")
                if (p > -1)
                    var propName = item.prop.value.substring(p + 1)
                obj.properties[item.prop.value] = {name: propName, value: item.value.value}

            })
            obj.properties[id] = {name: "UUID", value: obj.id}
            callback(null, obj)
        })
    }


    return self;

})()
