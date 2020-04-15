var Questions = (function () {


    var self = {}

    self.respond = function (question) {


        question = "http://localhost:9200/gmec_par/_analyze";
        var tokenConceptsMap = {}
        var allConceptIds = [];

        var tokens =
            [
                {
                    "token": "what",
                    "start_offset": 0,
                    "end_offset": 4,
                    "type": "word",
                    "position": 0
                },
                {
                    "token": "response",
                    "start_offset": 12,
                    "end_offset": 20,
                    "type": "word",
                    "position": 3
                },
                {
                    "token": "time",
                    "start_offset": 21,
                    "end_offset": 25,
                    "type": "word",
                    "position": 4
                },
                {
                    "token": "anti",
                    "start_offset": 32,
                    "end_offset": 36,
                    "type": "word",
                    "position": 7
                },
                {
                    "token": "surge",
                    "start_offset": 37,
                    "end_offset": 42,
                    "type": "word",
                    "position": 8
                },
                {
                    "token": "system",
                    "start_offset": 43,
                    "end_offset": 49,
                    "type": "word",
                    "position": 9
                }
            ]

        var tokens =
            [

                {
                    "token": "response",
                    "start_offset": 12,
                    "end_offset": 20,
                    "type": "word",
                    "position": 3
                },
                {
                    "token": "time",
                    "start_offset": 21,
                    "end_offset": 25,
                    "type": "word",
                    "position": 4
                },

                {
                    "token": "surge",
                    "start_offset": 37,
                    "end_offset": 42,
                    "type": "word",
                    "position": 8
                }

            ]


        var  matchingTokens=[];
        var matchingParagraphs=[];
        var paragraphIds=[]
        async.series([

            //count matching concepts
            function (callbackSeries) {
                var sentence=$("#searchQuestionInput").val();
                var payload = {
                    analyzeSentence:sentence,
                }
                $.ajax({
                    type: "POST",
                    url: "/elastic",
                    data: payload,
                    dataType: "json",
                    success: function (data, textStatus, jqXHR) {
                        var xx = data;
tokens=data.tokens
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
                    selectCountStr += " count(?entityLabel" + index + ") as ?countEntity" + index + " "
                    if(index>0)
                        whereConceptStr += "UNION"
                    whereConceptStr += "{" +
                        "?paragraph  terms:subject ?entity" + index + "." +
                        "?entity" + index + "   skos:prefLabel ?entityLabel" + index + ". filter( (contains(lcase(?entityLabel" + index + "),\"" + token.token + "\"))) " +
                        "}"
                })
                whereConceptStr +="}"


                var query = "  PREFIX terms:<http://purl.org/dc/terms/>        PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#>        PREFIX rdfsyn:<https://www.w3.org/1999/02/22-rdf-syntax-ns#>PREFIX mime:<http://purl.org/dc/dcmitype/> PREFIX mime:<http://www.w3.org/2004/02/skos/core#>  " +
                    "       select " + selectCountStr + "        where {" +
                    "?paragraph  <http://purl.org/dc/dcmitype/Text> ?text ."

                query += whereConceptStr
                query += "} limit 100000"

                var url = sparql.source.sparql_url + "?default-graph-uri=";// + query + queryOptions

                var queryOptions = "&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=5000&debug=on"
                sparql.querySPARQL_GET_proxy(url, query, queryOptions, null, function (err, result) {
                    if (err)
                        return callbackSeries();
                    var data=result.results.bindings[0]
                        tokens.forEach(function (token, index) {
                            var count=parseInt(data["countEntity"+index].value);
                            if(count>0)
                            matchingTokens.push({token:[tokens[index].token],countConcepts:count});


                        })


                    return callbackSeries();
                })


            },


            // count paragraphs matching all concept together  matching individually >0
            function (callbackSeries) {
               var x= matchingTokens;

                var selectCountStr = "count(?paragraph) as ?countParagraphs "
                var selectCountStr = "?paragraph "
                var whereConceptStr = ""

                matchingTokens.forEach(function (token, index) {

                    whereConceptStr +=
                        "?paragraph  terms:subject ?entity" + index + "." +
                        "?entity" + index + "   skos:prefLabel ?entityLabel" + index + ". filter( (contains(lcase(?entityLabel" + index + "),\"" + token.token + "\"))) "

                })



                var query = "  PREFIX terms:<http://purl.org/dc/terms/>        PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#>        PREFIX rdfsyn:<https://www.w3.org/1999/02/22-rdf-syntax-ns#>PREFIX mime:<http://purl.org/dc/dcmitype/> PREFIX mime:<http://www.w3.org/2004/02/skos/core#>  " +
                    "       select " + selectCountStr + "        where {" +
                    "?paragraph  <http://purl.org/dc/dcmitype/Text> ?text ."

                query += whereConceptStr
                query += "} limit 100000"

                var url = sparql.source.sparql_url + "?default-graph-uri=";// + query + queryOptions

                var queryOptions = "&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=5000&debug=on"
                sparql.querySPARQL_GET_proxy(url, query, queryOptions, null, function (err, result) {
                    if (err)
                        return callbackSeries();
                 matchingParagraphs=result.results.bindings

                    return callbackSeries();
                })



                //draw graph
            }, function (callbackSeries) {
            if(matchingParagraphs.length==0)
                return callbackSeries("no result")

                matchingParagraphs.forEach(function(paragraph){
                    paragraphIds.push(paragraph.paragraph.value)




                })

                projection.displayParagraphsGraph(null, paragraphIds, null)




                return callbackSeries();

            }
        ], function (err) {

            if (err)
                common.message(err);
        })


    }


    return self;


})()
