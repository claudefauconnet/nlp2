var AncestorsComparator = (function () {
    var self = {};

    self.palette = [
        "#0072d5",
        '#FF7D07',
        "#c00000",
        '#FFD900',
        '#B354B3',
        "#a6f1ff",
        "#007aa4",
        "#584f99",
        "#cd4850",
        "#005d96",
        "#ffc6ff",
        '#007DFF',
        "#ffc36f",
        "#ff6983",
        "#7fef11",
        '#B3B005',
    ],

    self.compare = function () {


        var conceptsSelected = Concepts.currentConceptsSelection
        if (!conceptsSelected || conceptsSelected.length == 0 || conceptsSelected[0].length == 0)
            return common.message("select a concept");

        var word = conceptsSelected[0][0].label;
        var conceptId = conceptsSelected[0][0].id;

        var fromStr = "";
        var indexOntology = 0
        var graphUrisMap = {}
        for (var key in app_config.ontologies) {
            if (!ontologyDesc.isExternal) {


                app_config.ontologies[key].color = self.palette[indexOntology++];

                fromStr += "FROM <" + app_config.ontologies[key].conceptsGraphUri + "> "
                graphUrisMap[app_config.ontologies[key].conceptsGraphUri] = key;
            }
            var query = "PREFIX skos: <http://www.w3.org/2004/02/skos/core#>" +
                "SELECT DISTINCT *" + fromStr + " " +
                "WHERE {" +
                " GRAPH ?graph {" +

                "?id skos:prefLabel ?prefLabel ." +
                "  filter regex(?prefLabel,\"^" + word + "$\",\"i\")" +

                "?id skos:broader ?broaderId1 . " +
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
                "  }" +
                "ORDER BY ASC(?broaderId1)" +
                "LIMIT 10000";

            var url = app_config.sparql_url + "?default-graph-uri=&query=";// + query + queryOptions
            var queryOptions = "&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=20000&debug=off"
            sparql.querySPARQL_GET_proxy(url, query, queryOptions, null, function (err, result) {
                if (err) {
                    return common.message(err)
                }


                multiSkosGraph3.drawRootNode(word)

                result.results.bindings.forEach(function (binding) {
                    binding.source = binding.graph.value;

                    var thesaurus = graphUrisMap[binding.graph.value];
                    binding = sparql_abstract.processData_SKOS(thesaurus, binding.id.value, [binding])

                    binding[0].thesaurus = thesaurus;
                    binding[0].color = app_config.ontologies[thesaurus].color;

                    var visjsData = multiSkosGraph3.pathsToVisjsData(binding[0])

                    multiSkosGraph3.addVisJsDataToGraph(visjsData)

                })


            })
        }
    }

    return self;


})()
