var sparql_DBpedia = (function () {


    var self = {};

    self.list = function (word, options, callback) {

        word = word.charAt(0).toUpperCase() + word.slice(1)
        var query = "PREFIX skos: <http://www.w3.org/2004/02/skos/core#>\n" +
            "SELECT DISTINCT *\n" +
            "WHERE {\n" +
            "?id skos:prefLabel ?prefLabel .\n" +
            " filter(str(?prefLabel)='" + word + "')\n" +
            "  ?id ?prop ?valueId .\n" +
            "  ?valueId skos:prefLabel ?value.\n" +
            "?id skos:broader ?broaderId .\n" +
            "  ?broaderId skos:prefLabel ?broader.\n" +
            "}\n" +
            "LIMIT 1000"
        //    console.log(query)
        query = encodeURIComponent(query)

        var queryOptions = "&format=application%2Fsparql-results%2Bjson&timeout=5000&should-sponge=&debug=on"
        var url = "http://fr.dbpedia.org/sparql?query=";// + query + queryOptions
        sparql_abstract.querySPARQL_GET(url, query, queryOptions, function (err, result) {
            if (err) {
                return callback(err);
            }
            var bindings=[];
            result.results.bindings.forEach(function(item){
                bindings.push({id:item.id.value,label:item.prefLabel.value,description:item.broader.value})
            })
            callback(null, bindings)
        })

    }

    self.getAncestors = function (id, options, callback) {


        var query = "PREFIX skos: <http://www.w3.org/2004/02/skos/core#>\n" +
            "SELECT DISTINCT *\n" +
            "WHERE {\n" +
            "<" + id + "> skos:prefLabel ?prefLabel ;\n" +
            "skos:broader ?broaderId1 . \n" +
            "  ?broaderId1 skos:prefLabel ?broader1\n"


        query +=
            "OPTIONAL {\n" +
            "    ?broaderId1 skos:broader ?broaderId2 .\n" +
            "    ?broaderId2 skos:prefLabel ?broader2 .\n" +
            "     OPTIONAL {\n" +
            "   \n" +
            "       ?broaderId2 skos:broader ?broaderId3 .\n" +
            "    \t?broaderId3 skos:prefLabel ?broader3 .\n" +
            "       OPTIONAL {\n" +
            "       ?broaderId3 skos:broader ?broaderId4 .\n" +
            "    \t?broaderId4 skos:prefLabel ?broader4 .\n" +
            "           OPTIONAL {\n" +
            "       ?broaderId4 skos:broader ?broaderId5 .\n" +
            "    \t?broaderId5 skos:prefLabel ?broader5 .\n" +
            "         OPTIONAL {   \n" +
            "       ?broaderId5 skos:broader ?broaderId6 .\n" +
            "    \t?broaderId6 skos:prefLabel ?broader6 .\n" +
            "               OPTIONAL {   \n" +
            "       ?broaderId6 skos:broader ?broaderId7 .\n" +
            "    \t?broaderId7 skos:prefLabel ?broader7 .\n" +
            "                 OPTIONAL {   \n" +
            "       ?broaderId7 skos:broader ?broaderId8 .\n" +
            "    \t?broaderId8 skos:prefLabel ?broader8 .\n" +
            "              }\n" +
            "            }\n" +
            "        }\n" +
            "        }\n" +
            "     \n" +
            "    }\n" +
            "    }\n" +
            " \n" +
            "  }\n" +
            "  }\n" +
            "ORDER BY ASC(?broaderId1)" +
            "LIMIT 1000"
        console.log(query)
        query = encodeURIComponent(query)

        var queryOptions = "&format=application%2Fsparql-results%2Bjson&timeout=5000&should-sponge=&debug=on"
        var url = "http://fr.dbpedia.org/sparql?query=";// + query + queryOptions
        sparql_abstract.querySPARQL_GET(url, query, queryOptions, function (err, result) {
            if (err) {
                return callback(err);
            }
            var json = self.processDataBNF(id,result.results.bindings)
            callback(null, json)

        })
    }

    self.getChildren = function (id, options, callback) {
        var query = " PREFIX skos: <http://www.w3.org/2004/02/skos/core#>\n" +
            "SELECT DISTINCT *\n" +
            "WHERE {\n" +
            "<" + id + "> skos:narrower ?narrowerId .\n" +
            "  ?narrowerId skos:prefLabel ?narrowerLabel .\n" +
            "}\n" +

            "LIMIT 1000"
        query = encodeURIComponent(query)

        var queryOptions = "&format=application%2Fsparql-results%2Bjson&timeout=5000&should-sponge=&debug=on"
        var url = "http://fr.dbpedia.org/sparql?query=";// + query + queryOptions
        sparql_abstract.querySPARQL_GET(url, query, queryOptions, function (err, result) {
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

    self.processDataBNF = function (id,bindings) {
        var nLevels = 8;

        var paths = []
        var str2 = "";
        var topNodes = {}
        bindings.forEach(function (binding) {

            for (var level = 0; level < nLevels; level++) {
                var bindingId = id;
                if (!topNodes[bindingId] && level == 0) {
                    var str0 = "|_" + id + ";" +"" ;
                    topNodes[bindingId] = {id:id, name:"", path: str0}
                }
                var str = ""
                var broaderName = "broader" + (level);
                var broaderIdName = "broaderId" + (level);
                if (binding[broaderName]) {
                    var sep = "|"
                    for (var j = 1; j <= level + 1; j++) {
                        sep += "_";
                    }
                    str = sep + binding[broaderIdName].value + ";" + binding[broaderName].value
                    if (topNodes[bindingId].path.indexOf(str) < 0)
                        topNodes[bindingId].path += str
                }
            }
        })
        for (var key in topNodes) {
            var topNode = topNodes[key]
            paths.push({
                "id": topNode.id,
                "prefLabels": topNode.name,
                "altLabels": "",
                "thesaurus": "BNF",
                "ancestors": topNode.path
            })
        }

        return paths;


    }


    return self;

})()
