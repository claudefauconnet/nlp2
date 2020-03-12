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
        var url = "https://data.bnf.fr/sparql?default-graph-uri=&query=";// + query + queryOptions
        self.querySPARQL_GET(url, query, queryOptions, function (err, result) {
            if (err) {
                return callback(err);
            }
            var json = self.processDataOld(result)
            callback(null, json)

        })


    }


    self.processDataOld = function (data) {


        var bindings = data.results.bindings;
        var paths = []
        var str = "";
        bindings.forEach(function (binding) {

            str += "|";
            str += "_" + binding.id.value + ";" + binding.prefLabel.value
            for (var i = 1; i < 11; i++) {
                var broaderName = "broader" + i;
                var broaderIdName = "broaderId" + i;
                if (binding[broaderName]) {
                    var sep = "|"
                    for (var j = 1; j <= i + 1; j++) {
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
    self.processData = function (data) {


        var bindings = data.results.bindings;
        var paths = []

        var X = [];
        bindings.forEach(function (binding) {
            var array = []
            for (var i = 0; i < 11; i++) {
                array.push([])
            }
            X.push(array)
        })
        bindings.forEach(function (binding, bindingIndex) {

            var str = "";
            str += "|";
            str += "_" + binding.id.value + ";" + binding.prefLabel.value;
            if (X[bindingIndex][0].indexOf(str) < 0)
                X[bindingIndex][0].push(str)

            for (var i = 1; i < 11; i++) {
                var str = "";
                str += "|";
                var broaderName = "broader" + i;
                var broaderIdName = "broaderId" + i;
                if (binding[broaderName]) {
                    var sep = ""
                    for (var j = 1; j <= i + 1; j++) {
                        sep += "_";
                    }

                    str += sep + binding[broaderIdName].value + ";" + binding[broaderName].value
                    if (!X[bindingIndex][i] || !X[bindingIndex][i].indexOf)
                        var x = 3
                    if (X[bindingIndex][i].indexOf(str) < 0)
                        X[bindingIndex][i].push(str)
                }
            }
        })


        function getPath(binding, str) {
            var path = {
                "id": binding.id.value,
                "prefLabels": binding.prefLabel.value,
                "altLabels": "",
                "thesaurus": "BNF",
                "ancestors": str
            }
            return path
        }


        var str = "";
        //    console.log(JSON.stringify(X,null,2))
        X.forEach(function (x, bindingIndex) {

            for (var i = 0; i < 11; i++) {
                if (x[i].length == 0)
                    return;
                if (i == 0) {
                    paths.push(getPath(bindings[bindingIndex], x[i]))
                } else {
                    if (i == 3)
                        var x = 3
                    paths[paths.length - 1].ancestors += x[i]
                }
            }
        })


        return paths;


    }


    self.queryWikidata = function (word, callback) {
        /*   var query="SELECT ?wdwork\n" +
               "WHERE {\n" +
               "?wdwork wdt:P268 ?idbnf\n" +
               "FILTER CONTAINS(?idbnf, \""+idBNF+"\") .\n" +
               "}"
                 var url="https://query.wikidata.org/sparql?query="
               */
        var url = "https://www.wikidata.org/w/api.php?action=wbsearchentities&search=" + word + "&format=json&errorformat=plaintext&language=en&uselang=en&type=item&origin=*"

        self.querySPARQL_GET(url, "", "", function (err, result) {
            if (err)
                return callback(err);
            var wikidataArray = [];
            var count = 0
            async.eachSeries(result.search, function (item, callbackEach) {
                var url2 = "https://query.wikidata.org/sparql?query="
                var query2 = "\n" +
                    "SELECT ?wdLabel ?ps_Label ?wdpqLabel ?pq_Label {\n" +
                    "  VALUES (?company) {(wd:" + item.id + ")}\n" +
                    "\n" +
                    "  ?company ?p ?statement .\n" +
                    "  ?statement ?ps ?ps_ .\n" +
                    "\n" +
                    "  ?wd wikibase:claim ?p.\n" +
                    "  ?wd wikibase:statementProperty ?ps.\n" +
                    "\n" +
                    "  OPTIONAL {\n" +
                    "  ?statement ?pq ?pq_ .\n" +
                    "  ?wdpq wikibase:qualifier ?pq .\n" +
                    "  }\n" +
                    "\n" +
                    "  SERVICE wikibase:label { bd:serviceParam wikibase:language \"en\" }\n" +
                    "} ORDER BY ?wd ?statement ?ps_";
                query2 = encodeURIComponent(query2);
                self.querySPARQL_GET(url2, query2, "&origin=*", function (err, result) {
                    if (err)
                        return callbackEach(err);
                    var obj = {id: item.id};
                    result.results.bindings.forEach(function (item2) {
                        obj[item2.wdLabel.value] = item2.ps_Label.value
                    })

                    wikidataArray.push(obj);
                    count++;
                    callbackEach(err)
                })

            }, function (err) {
                if (err)
                    return callback();


                return callback(null, wikidataArray);
            })

        })


    }
    self.querySPARQL_GET = function (url, query, queryOptions, callback) {

        var url = url + query + queryOptions
        // var url="https://www.wikidata.org/w/api.php?action=wbsearchentities&search=zinc&format=json&errorformat=plaintext&language=en&uselang=en&type=item"
        $.ajax({
            type: "GET",
            url: url,
            dataType: "json",
            /*   headers: {
                   "accept": "application/json",
                   "accept-encoding": "gzip, deflate",
                   "accept-language": "en-US,en;q=0.8",
                   "content-type": "application/json",
                   "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36",
               },*/
            success: function (data, textStatus, jqXHR) {
                var xx = data;
                callback(null, data)

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


    return self;
})();
