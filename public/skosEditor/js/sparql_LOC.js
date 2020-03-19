var sparql_LOC = (function () {


    var self = {};
var url = "http://vps475829.ovh.net:8890/sparql?default-graph-uri=&query=";// + query + queryOptions
    self.list = function (word, options, callback) {

        word = word.charAt(0).toUpperCase() + word.slice(1)
        var query = "PREFIX skos: <http://www.w3.org/2004/02/skos/core#>" +
            "SELECT DISTINCT *" +
            "WHERE {" +
            "?id skos:prefLabel ?prefLabel ." +
            " filter(str(?prefLabel)='" + word + "')" +
            "  ?id ?prop ?valueId ." +
            "  ?valueId skos:prefLabel ?value." +
            "?id skos:broader ?broaderId ." +
            "  ?broaderId skos:prefLabel ?broader." +
            "}" +
            "LIMIT 1000"

        var queryOptions = "&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=5000&debug=on"

        sparql_abstract.querySPARQL_GET_proxy(url, query,queryOptions, function (err, result) {
            if (err) {
                return callback(err);
            }
            var bindings=[];
            var ids=[];
            result.results.bindings.forEach(function(item){
                if(ids.indexOf(item.id<0)){
                    ids.push(item.id)
                    bindings.push({id:item.id.value,label:item.prefLabel.value,description:item.broader.value})
                }

            })
            callback(null, bindings)
        })

    }

    self.getAncestors = function (id, options, callback) {


        var query = "PREFIX skos: <http://www.w3.org/2004/02/skos/core#>" +
            "SELECT DISTINCT *" +
            "WHERE {" +
            "<" + id + "> skos:prefLabel ?prefLabel ;" +
            "skos:broader ?broaderId1 . " +
            "  ?broaderId1 skos:prefLabel ?broader1"


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

        sparql_abstract.querySPARQL_GET_proxy(url, query, queryOptions, function (err, result) {
            if (err) {
                return callback(err);
            }
            var json = sparql_abstract.processData_SKOS("LOC",id,result.results.bindings)
            callback(null, json)

        })
    }

    self.getChildren = function (id, options, callback) {
        var query = " PREFIX skos: <http://www.w3.org/2004/02/skos/core#>" +
            "SELECT DISTINCT *" +
            "WHERE {" +
            "<" + id + "> skos:narrower ?narrowerId ." +
            "  ?narrowerId skos:prefLabel ?narrowerLabel ." +
            "}" +

            "LIMIT 1000"


        var queryOptions = "&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=5000&debug=on"

        sparql_abstract.querySPARQL_GET_proxy(url, query, queryOptions, function (err, result) {
            if (err) {
                return callback(err);
            }
            var bindings=[]
            result.results.bindings.forEach(function(item){
                bindings.push({id:id,narrowerId:item.narrowerId.value,narrowerLabel:item.narrowerLabel.value})
            })
            callback(null, bindings)

        })


    }


    self.getDetails = function (id, options, callback) {
        callback(null, [])
    }




    return self;

})()
