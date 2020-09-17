var sparql_ISO_15926 = (function () {


    var self = {};


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
        var query = "PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#> " +
            "select distinct * where {  ?id rdfs:label ?prefLabel . filter(" + filter + ") ?id rdfs:subClassOf ?broaderId ." +
            "  ?broaderId rdfs:label ?broader." +
            "}" +
            "LIMIT 1000"


        var queryOptions = "&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=200000&debug=off"

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


        var query = "PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#> " +
            "select distinct * where {";

        query += "  ?id rdfs:label ?prefLabel . filter( ?id=<" + id + ">)";

        var depth = 8
        for (var i = 1; i <= depth; i++) {
            if (i == 1) {
                query += "  ?id" + " rdfs:subClassOf ?broaderId" + i + "." +
                    "?broaderId" + (i) + " rdfs:label ?broader" + (i) + ".";

            } else {
                query += "OPTIONAL { ?broaderId" + (i - 1) + " rdfs:subClassOf ?broaderId" + i + "." +
                    "?broaderId" + (i) + " rdfs:label ?broader" + (i) + ".";

            }
        }
        for (var i = 1; i < depth; i++) {
            query += "}"
        }
        query += "} LIMIT 1000"


        var queryOptions = "&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=20000&debug=off"

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

    self.getChildren = function (source, id, options, callback) {
        var url = source.sparql_url + "?default-graph-uri=" + encodeURIComponent(source.graphIRI) + "&query=";// + query + queryOptions

        /*  var query = " PREFIX skos: <http://www.w3.org/2004/02/skos/core#>" +
              "SELECT DISTINCT *" +
              "WHERE {" +
              "<" + id + "> skos:narrower ?narrowerId ." +
              "  ?narrowerId skos:prefLabel ?narrowerLabel ." +
              "}" +

              "LIMIT 1000"*/

        var query = "PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#> " +
            "SELECT DISTINCT ?narrowerId ?narrowerLabel  (count(?narrowerId2) as ?countNarrowers2) WHERE {" +
            "OPTIONAL{" +
            "?narrowerId rdfs:subClassOf <" + id + "> ." +
            "?narrowerId rdfs:label ?narrowerLabel ." + "" +
            "OPTIONAL{" +
            "?narrowerId2 rdfs:subClassOf ?narrowerId." +
            "}" +
            "}" +
            "OPTIONAL{" +
            "<" + id + ">  rdfs:superClass ?narrowerId ." +
            "?narrowerId rdfs:label ?narrowerLabel ." +
            "OPTIONAL{" +
            "?narrowerId2 rdfs:subClassOf ?narrowerId." +
            "}" +
            "}" +
            "" +
            "}LIMIT 1000"


        var queryOptions = "&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=20000&debug=off"

        sparql_abstract.querySPARQL_GET_proxy(url, query, queryOptions, null, function (err, result) {
            if (err) {
                return callback(err);
            }
            var bindings = []
            result.results.bindings.forEach(function (item) {
                if (item.narrowerId) {

                    var parts = item.narrowerId.value.split("/");
                    var part = parts[parts.length - 2];
                    item.narrowerLabel.value = part + "." + item.narrowerLabel.value


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

        var query = "PREFIX skos: <http://www.w3.org/2004/02/skos/core#>" +
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
        var queryOptions = "&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=20000&debug=off"

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
