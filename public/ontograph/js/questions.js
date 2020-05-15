var Questions = (function () {


    var self = {}

    self.respond = function (question, tokens) {


        question = "http://localhost:9200/gmec_par/_analyze";
        var tokenConceptsMap = {}
        var allConceptIds = [];


        var matchingTokens = [];
        var matchingConceptIds = []
        var matchingParagraphs = [];
        var paragraphIds = []
        async.series([

            //count matching concepts
            function (callbackSeries) {


                if (tokens) {
                    return callbackSeries()
                }
                var sentence = $("#searchQuestionInput").val();
                var payload = {
                    analyzeSentence: sentence,
                }
                $.ajax({
                    type: "POST",
                    url: "/elastic",
                    data: payload,
                    dataType: "json",
                    success: function (data, textStatus, jqXHR) {
                        self.currentTokens = data.tokens;
                        tokens = data.tokens
                        callbackSeries();
                    }
                    , error: function (err,) {
                        callbackSeries(err);
                    }
                })
            },
            //count matching concepts
            function (callbackSeries) {


                var selectCountStr = ""
                var whereConceptStr = "{"

                tokens.forEach(function (token, index) {
                    selectCountStr += " count(?conceptLabel" + index + ") as ?countEntity" + index + " "
                    if (index > 0)
                        whereConceptStr += "UNION"
                    whereConceptStr += "{" +
                        "?paragraph  terms:subject ?concept" + index + "." +
                        "?concept" + index + "   skos:prefLabel ?conceptLabel" + index + ". filter( (contains(lcase(?conceptLabel" + index + "),\"" + token.token + "\"))) " +
                        "}"
                })
                whereConceptStr += "}"


                var query = "  PREFIX terms:<http://purl.org/dc/terms/>        PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#>        PREFIX rdfsyn:<http://www.w3.org/1999/02/22-rdf-syntax-ns#>PREFIX mime:<http://purl.org/dc/dcmitype/> PREFIX mime:<http://www.w3.org/2004/02/skos/core#>  " +
                    "       select " + selectCountStr + "        where {" +
                    "?paragraph  <http://purl.org/dc/dcmitype/Text> ?text ."

                query += whereConceptStr
                query += "} limit 100000"

                var url = sparql.source.sparql_url + "?default-graph-uri=";// + query + queryOptions

                var queryOptions = "&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=20000&debug=off"
                sparql.querySPARQL_GET_proxy(url, query, queryOptions, null, function (err, result) {
                    if (err)
                        return callbackSeries();
                    var data = result.results.bindings[0]
                    tokens.forEach(function (token, index) {
                        var count = parseInt(data["countEntity" + index].value);
                        if (count > 0)
                            matchingTokens.push({token: tokens[index].token, countConcepts: count});


                    })


                    return callbackSeries();
                })


            },


            // count paragraphs matching all concept together  matching individually >0
            // if 0 paragraphs ask to remove tokens
            function (callbackSeries) {


                var selectStr = "?paragraph "
                var selectStr = "*"
                var whereConceptStr = "";

                matchingTokens.forEach(function (token, index) {
                    //selectStr += " ?concept" + index

                    whereConceptStr += "?paragraph  terms:subject ?concept" + index + "." +
                        "?concept" + index + "   skos:prefLabel ?conceptLabel" + index + " ." +
                   //     "  ?concept" + index + "   rdfsyn:type ?conceptType" + index + "."+
                        " filter( (contains(lcase(?conceptLabel" + index + "),\"" + token.token + "\"))) "


                })


                var query = "  PREFIX terms:<http://purl.org/dc/terms/>        PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#>        PREFIX rdfsyn:<http://www.w3.org/1999/02/22-rdf-syntax-ns#>PREFIX mime:<http://purl.org/dc/dcmitype/> PREFIX mime:<http://www.w3.org/2004/02/skos/core#>  " +
                    "       select " + selectStr + "        where {" +
                    "?paragraph  <http://purl.org/dc/dcmitype/Text> ?text ."

                query += whereConceptStr
                query += "} limit 100000"

                var url = sparql.source.sparql_url + "?default-graph-uri=";// + query + queryOptions

                var queryOptions = "&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=20000&debug=off"
                sparql.querySPARQL_GET_proxy(url, query, queryOptions, null, function (err, result) {
                    if (err)
                        return callbackSeries();
                    matchingParagraphs = result.results.bindings;


                    if (matchingParagraphs.length == 0) {
                        return callbackSeries("NO_RESULT")

                    }


                    return callbackSeries();
                })


                //draw graph
            }, function (callbackSeries) {

                var paragraphIds = []
                if (matchingParagraphs.length == 0)
                    return callbackSeries("no result")
                var html = "<ul>";
                matchingParagraphs.forEach(function (item) {
                    paragraphIds.push([item.paragraph.value])
                    for (var i = 0; i < matchingTokens.length; i++) {
                        var conceptId = item["concept" + i].value
                        var conceptLabel = item["conceptLabel" + i].value
                        if (matchingConceptIds.indexOf(conceptId)) {
                            matchingConceptIds.push(conceptId)
                            html += "<li>" + conceptLabel + "</li>"
                        }


                    }


                })
                $("#question_matchingTokensDiv").html(html)
                self.previousConceptsFilter=null;
                Selection.displayParagraphsGraph(null, paragraphIds, matchingConceptIds)
            $("#corpusAggrLevelSelect").val("paragraph")

                return callbackSeries();

            }
        ], function (err) {

            if (err)
                if (err == "NO_RESULT") {
                    var html = "No result remove tokens and retry" +
                        "<div style='width: 200px'></div> <ul>"
                    matchingTokens.forEach(function (token, index) {
                        html += "<li></li><input type='checkbox' class='question_tokenSelect' value='T_" + token.token + "'>" + token.token + "</li>"
                    })
                    html += "</ul>";
                    html += "<button onclick=' $(\"#dialogDiv\").dialog(\"close\")'>Cancel</button>";
                    html += "<button onclick=' Questions.tryAgain();'>Try again</button>";
                    $("#dialogDiv").html(html);

                    $("#dialogDiv").dialog("open")


                } else {
                    common.message(err);
                }
        })


    }
    self.tryAgain = function () {
        var newTokens = []
        $(".question_tokenSelect").each(function () {
            if (!$(this).prop("checked") == true)
                newTokens.push({token: $(this).val().substring(2)})

        })
        $("#dialogDiv").dialog("close")
        Questions.respond(null, newTokens)

    }


    return self;


})()
