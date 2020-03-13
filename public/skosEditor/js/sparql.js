var sparql = (function () {

    var self = {};

    self.queryBNF = function (word, options, callback) {
        word = word.charAt(0).toUpperCase() + word.slice(1)
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
            "LIMIT 100"
        console.log(query)
        query = encodeURIComponent(query)

        var queryOptions = "&format=application%2Fsparql-results%2Bjson&timeout=5000&should-sponge=&debug=on"
        var url = "https://data.bnf.fr/sparql?default-graph-uri=&query=";// + query + queryOptions
        self.querySPARQL_GET(url, query, queryOptions, function (err, result) {
            if (err) {
                return callback(err);
            }
            var json = self.processData(result)
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
        var nLevels = 8;

        var bindings = data.results.bindings;
        var paths = []
        var rootNodes = {};
        var X = {};


        var currentPathTree = {}


        function recurseChildren(parent, level) {
            if (level > nLevels)
                return;
            if (!parent.children)
                parent.children = {};
            var broaderName = "broader" + (level);
            var broaderIdName = "broaderId" + (level);
            bindings.forEach(function (binding, bindingIndex) {
                if (binding[broaderName]) {
                    //  var str= sep + binding[broaderIdName].value + ";" + binding[broaderName].value;
                    var child = {level: level, id: binding[broaderIdName].value, name: binding[broaderName].value, children: {}}
                    if (!parent.children[binding[broaderIdName].value])
                        parent.children[binding[broaderIdName].value] = child

                    recurseChildren(child, level + 1)
                }
            })


        }


        var str = "";

        function recursePath(node, str,level) {
            var sep = "|"
            for (var j = 1; j <= node.level + 1; j++) {
                sep += "_";
            }
            var str2=sep + node.id + ";" + node.name
            if(str.indexOf(str2)<0)
                str+=str2

            for (var key in node.children) {
                var child = node.children[key]


          str= recursePath(child, str,level+1)

            }
            return str;



        }

        var tree = {path: "", children: []}
        recurseChildren(tree, 1);
        var paths = [];
        for (var key in tree.children) {
            var child = tree.children[key]
       var ancestors= recursePath(child, "",1);

         //   console.log(ancestors)
            paths.push({
                "id": child.id,
                "prefLabels": child.name,
                "altLabels": "",
                "thesaurus": "BNF",
                "ancestors": ancestors
            })

        }
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
})
();
