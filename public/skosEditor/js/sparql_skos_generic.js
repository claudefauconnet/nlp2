

var sparql_skos_generic = (function () {


    var self = {};

    self.list = function (source, word, options, callback) {

        var filter = " (lcase(str(?prefLabel)) = \"" + word.toLowerCase() + "\")";
        if (!options.exactMatch) {
            filter = "contains(lcase(str(?prefLabel)),\"" + word.toLowerCase() + "\")";
        }


        var url = source.sparql_url + "?default-graph-uri=" + encodeURIComponent(source.graphIRI) + "&query=";// + query + queryOptions
        word = word.charAt(0).toUpperCase() + word.slice(1)
        var query = "PREFIX skos: <http://www.w3.org/2004/02/skos/core#>" +
            "SELECT DISTINCT * " +
            "WHERE {" +
            "?id skos:prefLabel ?prefLabel ." +
            " filter " + filter +
            "  ?id ?prop ?valueId ." +
            "  ?valueId skos:prefLabel ?value." +
            "?id skos:broader ?broaderId ." +
            "  ?broaderId skos:prefLabel ?broader." +
            "}" +
            "LIMIT 1000"

        var queryOptions = "&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=5000&debug=on"

        sparql_abstract.querySPARQL_GET_proxy(url, query, queryOptions,null, function (err, result) {
            if (err) {
                return callback(err);
            }
            var bindings = [];
            var ids = [];
            result.results.bindings.forEach(function (item) {
                if (ids.indexOf(item.id < 0)) {
                    ids.push(item.id)
                    bindings.push({id: item.id.value, label: item.prefLabel.value, description: item.broader.value})
                }

            })
            callback(null, bindings)
        })

    }

    self.getAncestors = function (source, id, options, callback) {
        var url = source.sparql_url + "?default-graph-uri=" + encodeURIComponent(source.graphIRI) + "&query=";// + query + queryOptions

        var query = "PREFIX skos: <http://www.w3.org/2004/02/skos/core#>" +
            "SELECT DISTINCT *" +
            "WHERE {" +
            "<" + id + "> skos:prefLabel ?prefLabel ;" +
            "skos:broader ?broaderId1 . " +
            "  ?broaderId1 skos:prefLabel ?broader1 ."


        query +=
            "OPTIONAL {" +
            "    ?broaderId1 skos:broader ?broaderId2 ." +
            "    ?broaderId2 skos:prefLabel ?broader2 ." +
            "     OPTIONAL {" +
            "   " +
            "       ?broaderId2 skos:broader ?broaderId3 ." +
            "    \t?broaderId3 skos:prefLabel ?broader3 ." +
            "       OPTIONAL {" +
            "       ?broaderId3 skos:broader ?broaderId4 ." +
            "    \t?broaderId4 skos:prefLabel ?broader4 ." +
            "           OPTIONAL {" +
            "       ?broaderId4 skos:broader ?broaderId5 ." +
            "    \t?broaderId5 skos:prefLabel ?broader5 ." +
            "         OPTIONAL {   " +
            "       ?broaderId5 skos:broader ?broaderId6 ." +
            "    \t?broaderId6 skos:prefLabel ?broader6 ." +
            "               OPTIONAL {   " +
            "       ?broaderId6 skos:broader ?broaderId7 ." +
            "    \t?broaderId7 skos:prefLabel ?broader7 ." +
            "                 OPTIONAL {   " +
            "       ?broaderId7 skos:broader ?broaderId8 ." +
            "    \t?broaderId8 skos:prefLabel ?broader8 ." +
            "              }" +
            "            }" +
            "        }" +
            "        }" +
            "     " +
            "    }" +
            "    }" +
            " " +
            "  }" +
            "  }" +
            "ORDER BY ASC(?broaderId1)" +
            "LIMIT 1000"
        console.log(query)


        var queryOptions = "&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=5000&debug=on"

        sparql_abstract.querySPARQL_GET_proxy(url, query, queryOptions,null, function (err, result) {
            if (err) {
                return callback(err);
            }
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

        var query = "PREFIX skos: <http://www.w3.org/2004/02/skos/core#>" +
            "SELECT DISTINCT ?narrowerId ?narrowerLabel  (count(?narrowerId2) as ?countNarrowers2) WHERE {" +
            "OPTIONAL{" +
            "?narrowerId skos:broader <" + id + "> ." +
            "?narrowerId skos:prefLabel ?narrowerLabel ." +"" +
            "OPTIONAL{" +
            "?narrowerId2 skos:broader ?narrowerId." +
            "}"+
            "}" +
            "OPTIONAL{" +
            "<" + id + ">  skos:narrower ?narrowerId ." +
            "?narrowerId skos:prefLabel ?narrowerLabel ." +
                "OPTIONAL{" +
            "?narrowerId2 skos:broader ?narrowerId." +
            "}"+
            "}" +
            "" +
            "}LIMIT 1000"


        var queryOptions = "&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=5000&debug=on"

        sparql_abstract.querySPARQL_GET_proxy(url, query, queryOptions,null, function (err, result) {
            if (err) {
                return callback(err);
            }
            var bindings = []
            result.results.bindings.forEach(function (item) {
                if (item.narrowerId) {
                 var countNarrowers2=10
                    if(item.countNarrowers2)
                    countNarrowers2=parseInt(item.countNarrowers2.value)
                    var data = {source: source, parent: id}
                    bindings.push({id: id, narrowerId: item.narrowerId.value, narrowerLabel: item.narrowerLabel.value,countNarrowers2:countNarrowers2, data: data})
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
            "<" + id + "> ?prop ?value ." +
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
        var queryOptions = "&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=5000&debug=on"

        sparql_abstract.querySPARQL_GET_proxy(url, query, queryOptions,null, function (err, result) {
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
            callback(null, obj)
        })
    }




    return self;

})()
