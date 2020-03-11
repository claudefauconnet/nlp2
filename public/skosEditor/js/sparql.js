var sparql = (function () {

    var self = {};

    self.queryBNF = function (word, options, callback) {

        var query = "SELECT DISTINCT ?original_rameau ?prefLabel ?uri_a ?label_a ?uri_b ?label_b\n" +
            "WHERE {\n" +
            "?original_rameau skos:prefLabel ?prefLabel ;\n" +
            " skos:narrower ?uri_a .\n" +
            "MINUS {?original_rameau foaf:focus ?focus .}\n" +
            "?uri_a skos:prefLabel ?label_a . \n" +
            "     filter contains(?prefLabel,\"" + word + "\")  \n" +
            "OPTIONAL {\n" +
            "?uri_a skos:narrower ?uri_b .\n" +
            "?uri_b skos:prefLabel ?label_b .\n" +
            " \n" +
            "}\n" +
            "}\n" +
            "\n" +
            "LIMIT 1000";

        var labelQuery = ""
        if (options.exactMatch)
            labelQuery = "filter(str(LCASE(?prefLabel))=\"" + word + "\")"
        else
            labelQuery = " filter contains(?prefLabel,\"" + word + "\") ";

        var query = "PREFIX skos: <http://www.w3.org/2004/02/skos/core#>\n" +
            "SELECT DISTINCT *\n" +
            "WHERE {\n" +
            "?id skos:prefLabel ?prefLabel ;\n" +
            "skos:broader ?broaderId1 . \n" +
            "  ?broaderId1 skos:prefLabel ?broader1\n"

        query += labelQuery + "\n";
        query += "OPTIONAL {\n" +
            "?broaderId1 skos:broader ?broaderId2 .\n" +
            "?broaderId2 skos:prefLabel ?broader2 .\n" +
            " ?broaderId2 skos:broader ?broaderId3 .\n" +
            "?broaderId3 skos:prefLabel ?broader3 .\n" +
            "    ?broaderId3 skos:broader ?broaderId4 .\n" +
            "?broaderId4 skos:prefLabel ?broader4 .\n" +
            "     ?broaderId4 skos:broader ?broaderId5 .\n" +
            "?broaderId5 skos:prefLabel ?broader5 .\n" +
            "     ?broaderId5 skos:broader ?broaderId6 .\n" +
            "?broaderId6 skos:prefLabel ?broader6 .\n" +
            "       ?broaderId6 skos:broader ?broaderId7 .\n" +
            "?broaderId7 skos:prefLabel ?broader7 .\n" +
            "        ?broaderId7 skos:broader ?broaderId8 .\n" +
            "?broaderId8 skos:prefLabel ?broader8 .\n" +
            "        ?broaderId8 skos:broader ?broaderId9 .\n" +
            "?broaderId9 skos:prefLabel ?broader9 .\n" +
            "            ?broaderId9 skos:broader ?broaderId10 .\n" +
            "?broaderId10 skos:prefLabel ?broader10 .\n" +
            "}\n" +
            "}\n" +
            "\n" +
            "LIMIT 100"


        query = encodeURIComponent(query)

        var queryOptions = "&format=application%2Fsparql-results%2Bjson&timeout=5000&should-sponge=&debug=on"
        var url = "https://data.bnf.fr/sparql?default-graph-uri=&query=" + query + queryOptions

        $.ajax({
            type: "GET",
            url: url,
            dataType: "json",
            success: function (data, textStatus, jqXHR) {
                var xx = data;
                var json = self.processData(data)
                callback(null, json)

            }
            , error: function (err) {
                $("#waitImg").css("display", "none");
                console.log(err.responseText)
                if (callback) {
                    return callback(err)
                }
                return (err);
            }

        });


    }

    self.processData = function (data) {


        var bindings = data.results.bindings;
        var paths = []
        var str = "";
        bindings.forEach(function (binding) {

            str += "|";
            str += "_" + binding.id.value + ";" + binding.prefLabel.value
            for (var i = 1; i <11; i++) {
                var broaderName = "broader" + i;
                var broaderIdName = "broaderId" + i;
                if (binding[broaderName]) {
                    var sep = "|"
                    for (var j = 1; j <=i+1; j++) {
                        sep += "_";
                    }
                    str += sep + binding[broaderIdName].value + ";" + binding[broaderName].value

                }
            }



            var path = {
                "id": binding.id.value,
                "prefLabels": binding.prefLabel.value,
                "altLabels": "",
                "thesaurus": "BNF",
                "ancestors": str
            }
            paths.push(path)

        })
        return paths;


    }


    return self;
})();
