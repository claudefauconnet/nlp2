var sparql = (function () {

    var self = {};

    self.queryBNF_ancestors = function (item, options, callback) {
        var word = item.label.charAt(0).toUpperCase() + item.label.slice(1)
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
            "}\n" +
            "}\n" +
            "\n" +
            "LIMIT 1000";

        var labelQuery = ""
        if (options.exactMatch)
            labelQuery = "filter(str(?prefLabel)=\"" + word + "\")"
        else
            labelQuery = " filter contains(?prefLabel,\"" + word + "\") ";

        var query = "PREFIX skos: <http://www.w3.org/2004/02/skos/core#>\n" +
            "SELECT DISTINCT *\n" +
            "WHERE {\n" +
            "?id skos:prefLabel ?prefLabel ;\n" +
            "skos:broader ?broaderId1 . \n" +
            "  ?broaderId1 skos:prefLabel ?broader1\n"

        query += labelQuery + "\n";
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
        var url = "https://data.bnf.fr/sparql?default-graph-uri=&query=";// + query + queryOptions
        self.querySPARQL_GET(url, query, queryOptions, function (err, result) {
            if (err) {
                return callback(err);
            }
            var json = self.processDataBNF(result)
            callback(null, json)

        })


    }
    self.queryBNF_list = function (word, callback) {
        word = word.charAt(0).toUpperCase() + word.slice(1)
        var query = "PREFIX skos: <http://www.w3.org/2004/02/skos/core#>\n" +
            "SELECT DISTINCT *\n" +
            "WHERE {\n" +
            "?id skos:prefLabel ?prefLabel .\n" +
            " filter(str(?prefLabel)='" + word + "')\n" +
            "  ?id ?prop ?valueId .\n" +
            "  ?valueId skos:prefLabel ?value.\n" +
            "\n" +
            "}\n" +
            "\n" +
            "LIMIT 1000"
        console.log(query)
        query = encodeURIComponent(query)

        var queryOptions = "&format=application%2Fsparql-results%2Bjson&timeout=5000&should-sponge=&debug=on"
        var url = "https://data.bnf.fr/sparql?default-graph-uri=&query=";// + query + queryOptions
        self.querySPARQL_GET(url, query, queryOptions, function (err, result) {
            if (err) {
                return callback(err);
            }

            callback(null, result.results.bindings)

        })
    }


    self.processDataBNF = function (data) {
        var nLevels = 8;
        var bindings = data.results.bindings;
        var paths = []
        var str2 = "";
        var topNodes = {}
        bindings.forEach(function (binding) {

            for (var level = 0; level < nLevels; level++) {
                var bindingId = binding.id.value;
                if (!topNodes[bindingId] && level == 0) {
                    var str0 = "|_" + binding.id.value + ";" + binding.prefLabel.value;
                    topNodes[bindingId] = {id: binding.id.value, name: binding.prefLabel.value, path: str0}
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

    self.queryBNFchildren = function (id, callback) {
        var query = " PREFIX skos: <http://www.w3.org/2004/02/skos/core#>\n" +
            "SELECT DISTINCT *\n" +
            "WHERE {\n" +
            "<"+id+"> skos:narrower ?narrowerId .\n" +
            "  ?narrowerId skos:prefLabel ?narrowerLabel .\n" +
            "}\n" +

            "LIMIT 1000"
        query = encodeURIComponent(query)

        var queryOptions = "&format=application%2Fsparql-results%2Bjson&timeout=5000&should-sponge=&debug=on"
        var url = "https://data.bnf.fr/sparql?default-graph-uri=&query=";// + query + queryOptions
        self.querySPARQL_GET(url, query, queryOptions, function (err, result) {
            if (err) {
                return callback(err);
            }

            callback(null, result.results.bindings)

        })
    }




self.queryWikidataList = function (word, callback) {

    var url = "https://www.wikidata.org/w/api.php?action=wbsearchentities&search=" + word + "&format=json&errorformat=plaintext&language=en&uselang=en&type=item&origin=*"

    self.querySPARQL_GET(url, "", "", function (err, result) {
        if (err)
            return callback(err);
        var wikidataArray = [];
        var count = 0
        async.eachSeries(result.search, function (item, callbackEach) {
            var url2 = "https://query.wikidata.org/sparql?query="
            var query2 = "\n" +
                "SELECT ?wd ?wdLabel  ?ps_Label ?wdpqLabel ?pq_Label {\n" +
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
            console.log(query2);
            query2 = encodeURIComponent(query2);
            self.querySPARQL_GET(url2, query2, "&origin=*", function (err, result) {
                if (err)
                    return callbackEach(err);


                var obj = {label: item.label, id: item.id, linkedData: {}, others: {}, names: {}, description: item.description};
                var linkedDataIds = ['Q18618628',
                    'Q19595382',
                    'Q19829908',
                    'Q19833377',
                    'Q19833835',
                    'Q21745557',
                    'Q23673786',
                    'Q24075706',
                    'Q24575337',
                    'Q26696664',
                    'Q26883022',
                    'Q27048688',
                    'Q42396390',
                    'Q42415497',
                    'Q52063969',
                    'Q55586529',
                    'Q56216056',
                ]
                result.results.bindings.forEach(function (item2) {

                    var propId = item2.wd.value.substring(item2.wd.value.lastIndexOf("/") + 1)

                    if (item2.ps_Label.value.indexOf(word) > -1) {
                        obj.names[item2.wdLabel.value] = item2.ps_Label.value
                    } else if (linkedDataIds.indexOf(propId) > -1) {
                        obj.linkedData[item2.wdLabel.value] = item2.ps_Label.value
                    } else if (true) {
                        obj.others[item2.wdLabel.value] = item2.ps_Label.value
                    }
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

self.getWikidataDetails = function (word) {
    var query = ""
}

self.getWikidataAncestors = function (wikidataObj, callback) {
    var query = "SELECT\n" +
        "?broaderId1 ?broaderId1Label \n" +
        "?broaderId2 ?broaderId2Label\n" +
        "?broaderId3 ?broaderId3Label\n" +
        "?broaderId4 ?broaderId4Label\n" +
        "?broaderId5 ?broaderId5Label\n" +
        "?broaderId6 ?broaderId6Label\n" +
        "?broaderId7 ?broaderId7Label\n" +
        "?broaderId8 ?broaderId8Label\n" +
        "WHERE \n" +
        "{\n" +
        "\n" +
        "  wd:" + wikidataObj.id + " wdt:P31|wdt:P279 ?broaderId1 .\n" +
        "  OPTIONAL {\n" +
        "     ?broaderId1 wdt:P279 ?broaderId2 .\n" +
        "      OPTIONAL {\n" +
        "     ?broaderId2 wdt:P279 ?broaderId3 .\n" +
        "           OPTIONAL {\n" +
        "     ?broaderId3 wdt:P279 ?broaderId4 .\n" +
        " OPTIONAL {\n" +

        "     ?broaderId4 wdt:P279 ?broaderId5 .\n" +

        "           OPTIONAL {\n" +
        "     ?broaderId5 wdt:P279 ?broaderId6 .\n" +
        "                 OPTIONAL {\n" +
        "     ?broaderId6 wdt:P279 ?broaderId7 .\n" +

        "                 OPTIONAL {\n" +
        "     ?broaderId7 wdt:P279 ?broaderId8 .\n" +
        "  }\n" +
        "  }\n" +
        "  }\n" +
        "    }\n" +
        "  }\n" +
        "  }\n" +
        " }\n" +

        "\n" +
        "  \n" +
        "  SERVICE wikibase:label{\n" +
        "     bd:serviceParam wikibase:language \"en\" .\n" +
        " }\n" +
        "\n" +
        "  \n" +
        "  \n" +
        "\n" +
        "  }"
    query = encodeURIComponent(query);
    var url = "https://query.wikidata.org/sparql?query="
    self.querySPARQL_GET(url, query, "&origin=*", function (err, result) {
        if (err)
            return callback(err);
        var paths = self.processDataWikiData(wikidataObj, result)
        return callback(null, paths)
    })


}

self.processDataWikiData = function (wikidataObj, data) {
    var nLevels = 8;
    var bindings = data.results.bindings;
    var paths = []
    var str2 = "";
    var topNodes = {}
    bindings.forEach(function (binding) {

        for (var level = 1; level <= nLevels; level++) {
            var bindingId = wikidataObj.id;
            if (!topNodes[bindingId] && level == 1) {
                var str0 = "|_" + wikidataObj.id + ";" + wikidataObj.label;
                topNodes[bindingId] = {id: wikidataObj.id, name: wikidataObj.label, path: str0}
            }
            var str = ""
            var broaderName = "broaderId" + level + "Label";
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
            "thesaurus": "Wikidata",
            "ancestors": topNode.path
        })
    }

    return paths


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
})
();
