//http://ma-graph.org/schema-linked-dataset-descriptions/

var sparql_microsoft_accademic = (function () {


    var self = {};

    var headers = {

    }


    self.list = function (source, word, options, callback) {

        var filter = " (lcase(str(?prefLabel)) = \"" + word.toLowerCase() + "\")";
        if (!options.exactMatch) {
            filter = "contains(lcase(str(?prefLabel)),\"" + word.toLowerCase() + "\")";
        }


        var url = source.sparql_url + "?default-graph-uri=" + "&query=";// + query + queryOptions
        word = word.charAt(0).toUpperCase() + word.slice(1)
        var query = " PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> " +
            "PREFIX foaf: <http://xmlns.com/foaf/0.1/> " +
            "PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> " +
            "PREFIX map: <http://ma-graph.org/property/> " +
            " " +
            "SELECT distinct * " +
            "WHERE { " +
            " " +
            "?id foaf:name \""+word+"\"^^xsd:string . " +
            "?id  foaf:name ?prefLabel . " +
            "?id map:hasParent ?broaderId . " +
            "?broaderId foaf:name ?broader. }" + " LIMIT 100"
        //  query = encodeURIComponent(query);
        var queryOptions = "&format=application%2Fsparql-results%2Bjson&timeout=0&debug=off"

        sparql_abstract.querySPARQL_GET_proxy(url, query, queryOptions, {headers: headers}, function (err, result) {
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
        var url = source.sparql_url + "?default-graph-uri=" + "&query=";// + query + queryOptions

        var query = " PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> " +
            "PREFIX foaf: <http://xmlns.com/foaf/0.1/> " +
            "PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> " +
            "PREFIX map: <http://ma-graph.org/property/> " +
            " " +
            "SELECT distinct * " +
            "WHERE { " +
            " " +
       //     "?id foaf:name \"Corrosion\"^^xsd:string . " +
            //  "?id map:hasParent ?broaderId1 . " +
           "<"+id+"> foaf:name ?prefLabel . " +
            "<"+id+"> map:hasParent ?broaderId1 . " +
            "?broaderId1 foaf:name ?broader1 . " +
            "OPTIONAL{ " +
            "?broaderId1 map:hasParent ?broaderId2 . " +
            "?broaderId2 foaf:name ?broader2 . " +
            "OPTIONAL{ " +
            "?broaderId2 map:hasParent ?broaderId3 . " +
            "?broaderId3 foaf:name ?broader3 . " +
            " " +
            "OPTIONAL{ " +
            "?broaderId3 map:hasParent ?broaderId4 . " +
            "?broaderId4 foaf:name ?broader4 . " +
            " " +
            "OPTIONAL{ " +
            "?broaderId4 map:hasParent ?broaderId5 . " +
            "?broaderId5 foaf:name ?broader5 . " +
            "} " +
            "} " +
            "} " +
            "} " +
            " " +
            "}LIMIT 1000"
        console.log(query)


        var queryOptions = "&format=application%2Fsparql-results%2Bjson&timeout=0&debug=off"

        sparql_abstract.querySPARQL_GET_proxy(url, query, queryOptions, {headers: headers}, function (err, result) {
            if (err) {
                return callback(err);
            }
            var json = sparql_abstract.processData_SKOS("LOC", id, result.results.bindings)
            callback(null, json)

        })
    }

    self.getChildren = function (source, id, options, callback) {
        var url = source.sparql_url + "?default-graph-uri=" + "&query=";// + query + queryOptions

        /*  var query = " PREFIX skos: <http://www.w3.org/2004/02/skos/core#>" +
              "SELECT DISTINCT *" +
              "WHERE {" +
              "<" + id + "> skos:narrower ?narrowerId ." +
              "  ?narrowerId skos:prefLabel ?narrowerLabel ." +
              "}" +

              "LIMIT 1000"*/
var query=" PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> PREFIX foaf: <http://xmlns.com/foaf/0.1/> PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> PREFIX map: <http://ma-graph.org/property/> " +
    " SELECT DISTINCT ?narrowerId ?narrowerLabel (count(?narrowerId2) as ?countNarrowers2)" +
    "   WHERE { ?narrowerId map:hasParent <" + id + "> ." +
    "OPTIONAL{?narrowerId2  map:hasParent ?narrowerId .}" +
    "?narrowerId foaf:name ?narrowerLabel} LIMIT 100"
     /*   var query = " PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> " +
            "PREFIX foaf: <http://xmlns.com/foaf/0.1/> " +
            "PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> " +
            "PREFIX map: <http://ma-graph.org/property/> " +
            " SELECT DISTINCT * " +
            "  WHERE { "+

            "?narrowerId map:hasParent <" + id + "> ." +
            "?narrowerId foaf:name ?narrowerLabel" +

            "}LIMIT 100"*/


        var queryOptions = "&format=application%2Fsparql-results%2Bjson&timeout=0&debug=off"

        sparql_abstract.querySPARQL_GET_proxy(url, query, queryOptions, {headers: headers}, function (err, result) {
            if (err) {
                return callback(err);
            }
            var bindings = []
            result.results.bindings.forEach(function (item) {
                if (item.narrowerId) {
                    var data = {source: source, parent: id}
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
        var url = source.sparql_url + "?default-graph-uri=" + "&query=";// + query + queryOptions

        var query = "PREFIX skos: <http://www.w3.org/2004/02/skos/core#>" +
            "" +
            "select distinct *" +
            "" +
            "where {" +
            "<" + id + "> ?prop ?value ." +
            "" +
            " optional{ " +
            "?prop rdf:label ?propLabel . " +
            "} " +
            " optional{ " +
            "?value rdf:label ?valueLabel . " +
            "} " +
            " " +
            "}"
        "" +
        "}" +
        "limit 100"
        var queryOptions = "&format=application%2Fsparql-results%2Bjson&timeout=0&debug=off"

        sparql_abstract.querySPARQL_GET_proxy(url, query, queryOptions, {headers: headers}, function (err, result) {
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

})
()
