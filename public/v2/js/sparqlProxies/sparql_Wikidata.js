var Sparql_Wikidata = (function () {


    var self = {};

    self.list = function (source,word, options, callback) {
        var url = "https://www.wikidata.org/w/api.php?action=wbsearchentities&search=" +
            word + "&format=json&errorformat=plaintext&language=en&uselang=en&type=item&origin=*"
        sparql_abstract.querySPARQL_GET(url, "", "", function (err, result) {
            if (err)
                return callback(err);

            var bindings = [];
            result.search.forEach(function (item) {
                bindings.push({id: item.id, label: item.label, description: item.description})
            })
            return callback(null, bindings);
        })
    }

    self.getAncestors = function (source,id, options, callback) {
        var query = "SELECT\n" +
            "?prefLabel "+
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
            " wd:" + id + " rdfs:label ?prefLabel.\n" +
            "  FILTER (lang(?prefLabel)=\"en\")"+
            "  wd:" + id + " wdt:P31|wdt:P279 ?broaderId1 .\n" +
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
        sparql_abstract.querySPARQL_GET(url, query, "&origin=*", function (err, result) {
            if (err)
                return callback(err);
            var paths = self.processDataWikiData(id, result)
            return callback(null, paths)
        })
    }
    self.getChildren = function (source,id, options, callback) {
        var p = id.lastIndexOf("/")
        if (p > -1)
            id = id.substring(p + 1)
        var url = "https://query.wikidata.org/sparql?query="


        var query="select ?narrower ?narrowerLabel  (COUNT(?narrower2) AS ?countNarrowers2)\n" +
            "\n" +
            "WHERE \n" +
            "{\n" +
            " ?narrower wdt:P31|wdt:P279 wd:" + id + "  .\n" +
            "  optional{\n" +
            "    ?narrower2 wdt:P31|wdt:P279 ?narrower\n" +
            "    }\n" +
            "\n" +
            "  SERVICE wikibase:label{\n" +
            "     bd:serviceParam wikibase:language \"en\" .\n" +
            " }\n" +
            "  }\n" +
            "GROUP BY ?narrower ?narrowerLabel"
      /*  var query = "SELECT\n" +
            "\n" +
            "?narrower ?narrowerLabel \n" +
            "\n" +
            "WHERE \n" +
            "{\n" +
            " ?narrower wdt:P31|wdt:P279 wd:" + id + "  .\n" +
            "  \n" +
            "  SERVICE wikibase:label{\n" +
            "     bd:serviceParam wikibase:language \"en\" .\n" +
            " }\n" +
            "\n" +
            "  }\n" +
            "LIMIT 100"*/
        sparql_abstract.querySPARQL_GET(url, query, "&origin=*", function (err, result) {
            if (err)
                return callback(err);

            var bindings = [];
            result.results.bindings.forEach(function (item) {
             //   var data={source:"Wikidata",thesaurus:"Wikidata",parent:id}
                var data = {source: source, parent: id}
                var countNarrowers2=10
                if(item.countNarrowers2)
                    countNarrowers2=parseInt(item.countNarrowers2.value)
                bindings.push({id: id, narrowerId: item.narrower.value, narrowerLabel: item.narrowerLabel.value,countNarrowers2:countNarrowers2,data:data})
            })

            callback(null, bindings)
        })
    }

    self.getDetails = function (source,id, options, callback) {
        var count = 0
        id = id.substring(id.lastIndexOf("/") + 1)

        var url2 = "https://query.wikidata.org/sparql?query="
        var query2 = "\n" +
            "SELECT ?wd ?wdLabel ?ps ?ps_Label ?wdpqLabel ?pq_Label {\n" +
            "  VALUES (?company) {(wd:" + id + ")}\n" +
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
        //   console.log(query2);
        query2 = encodeURIComponent(query2);
        sparql_abstract.querySPARQL_GET(url2, query2, "&origin=*", function (err, result) {
            if (err)
                return callback(err);


            var obj = {label: options.label, id: options.id, description: options.description, properties: {}};
            result.results.bindings.forEach(function (item) {
                var propId = item.wd.value.substring(item.wd.value.lastIndexOf("/") + 1)
                obj.properties[propId] = {name: item.wdLabel.value, value: item.ps_Label.value, id: item.ps.value}

            })


            callback(null, obj)
        })
    }

    self.processDataWikiData = function (id, data) {
        var nLevels = 5;
        var bindings = data.results.bindings;
        var paths = []
        var str2 = "";
        var topNodes = {}
        bindings.forEach(function (binding) {

            for (var level = 1; level <= nLevels; level++) {
                var bindingId = id;
                var broaderName = "broaderId" + level + "Label";
                if (!topNodes[bindingId] && level == 1) {
                 //   var str0 = "|_" + id + ";" + "";
                    var str0 = "|_" + id + ";" + binding.prefLabel.value
                    topNodes[bindingId] = {id: id, name: "", path: str0}
                }
                var str = ""
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
                "source": "Wikidata",
                "ancestors": topNode.path
            })
        }
        return paths
    }


    return self;

})
()
