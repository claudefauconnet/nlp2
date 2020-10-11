//https://babelnet.org/sparql/
//https://www.w3.org/community/bpmlod/wiki/Converting_BabelNet_as_Linguistic_Linked_Data#Retrieve_textual_definitions_in_all_languages




var Sparql_babelNet= (function () {

    var key="a7371c22-6f58-40d0-b3ae-85ae3a33923e"

    /*

    bn:00006861n_anchor
    SELECT DISTINCT ?gloss ?license ?sourceurl WHERE {
     ?url a skos:Concept .
     ?url bn-lemon:synsetID ?synsetID .
     OPTIONAL {
          ?url bn-lemon:definition ?definition .
          ?definition lemon:language "EN" .
          ?definition bn-lemon:gloss ?gloss .
          ?definition dcterms:license ?license .
          ?definition dc:source ?sourceurl .
     }

}
LIMIT 100



     */
    var self = {};

    var headers = {

    }


    self.list = function (source, word, options, callback) {

        var filter = " (lcase(str(?prefLabel)) = \"" + word.toLowerCase() + "\")";
        if (!options.exactMatch) {
            filter = "contains(lcase(str(?prefLabel)),\"" + word.toLowerCase() + "\")";
        }



     //  var url="https://babelnet.org/v1/completer?"
        var url = "https://babelnet.io/v5/getSynsetIds?"
     // var query = "lemma="+word+"&searchLang=EN&POS=NOUN&key="+key+"&source=BABELNET"
        var query = "lemma="+word+"&searchLang=EN&POS=NOUN&key="+key;
      //  var query="lang=EN&term="+word
        sparql_abstract.querySPARQL_GET_proxy(url, query,"", {doNotEncode:true}, function (err, result) {
            if (err) {
                return callback(err);
            }
            var bindings = [];
            var ids = [];
            if(!result)
                callback(null, bindings)
            result.forEach(function (item) {
                if (ids.indexOf(item.id < 0)) {
                    ids.push(item.id)
                    bindings.push({id: item.id, label: word, description: item.pos})
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
            "?id foaf:name \"Corrosion\"^^xsd:string . " +
            "?id  foaf:name ?prefLabel . " +
            "?id map:hasParent ?broaderId1 . " +
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

        var query = " PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> " +
            "PREFIX foaf: <http://xmlns.com/foaf/0.1/> " +
            "PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> " +
            "PREFIX map: <http://ma-graph.org/property/> " +
            " SELECT DISTINCT * " +
            "  WHERE { "+

            "?narrowerId map:hasParent <" + id + "> ." +
            "?narrowerId foaf:name ?narrowerLabel" +

            "}LIMIT 100"


        var queryOptions = "&format=application%2Fsparql-results%2Bjson&timeout=0&debug=off"

        sparql_abstract.querySPARQL_GET_proxy(url, query, queryOptions, {headers: headers}, function (err, result) {
            if (err) {
                return callback(err);
            }
            var bindings = []
            result.results.bindings.forEach(function (item) {
                if (item.narrowerId) {
                    var data = {source: source, parent: id}
                    bindings.push({id: id, narrowerId: item.narrowerId.value, narrowerLabel: item.narrowerLabel.value, data: data})
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
