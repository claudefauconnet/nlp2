var async = require('async')
var httpProxy = require('../httpProxy.')
var elasticRestProxy = require('../elasticRestProxy.')
var superagent = require('superagent')
var onTheFlyTagger = {


    tagWebPage: function (uri, thesaurusGraph, callback) {
        var pageText = "";
        var pageWords = [];
        var thesaurusConcepts = []
        var pageConcepts = {};
        async.series([

            //getPage
            function (callbackSeries) {
                httpProxy.get(uri, {}, function (err, result) {
                    if (err)
                        return callbackSeries(err);
                    pageText = result;
                    return callbackSeries()
                })


            },

            //lemmatize pagecontent
            function (callbackSeries) {
                var strartMark = "bodyContent"
                var endMark = "printfooter";
                var startIndex = pageText.indexOf(strartMark) + 10;
                var endIndex = pageText.indexOf(endMark) + 10;
                pageText = pageText.substring(startIndex, endIndex);

                var json = {
                    "tokenizer": "standard",
                    "filter": ["stop"],
                    "text": pageText
                }


                elasticRestProxy.executePostQuery('http://localhost:9200/_analyze', json, function (err, result) {
                    if (err)
                        return callbackSeries(err);
                    result.tokens.forEach(function (item) {
                        if (item.token.length > 2)
                            pageWords.push(item.token.toLowerCase())
                    })

                })

                return callbackSeries()

            },


            //getConcepts

            function (callbackSeries) {
                var limit = 10000;
                var query = "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>PREFIX skos: <http://www.w3.org/2004/02/skos/core#>" +
                    "select distinct ?conceptLabel from <http://souslesens.org/oil-gas/upstream/> where{" +
                    "  " +
                    "  ?concept  rdf:type skos:Concept." +
                    "  ?concept skos:prefLabel ?conceptLabel " +
                    "  " +
                    "}limit " + limit;

                var offset=0
                var length=1
                var result=[]
                async.whilst(
                    function test(cb) {
                        return cb(null, length > 0);
                    },
                    function iter(callbackWhilst) {
                        var url = "http://51.178.139.80:8890/sparql/"

                      //  query=query+" offset "+(""+offset);
                        var params = {query: (query+" offset "+offset)}
                        offset+=limit;
                        httpProxy.post(url, null, params, function (err, result) {
                            if (err)
                                return callbackWhilst(err);
                            length = result.results.bindings.length
                            result.results.bindings.forEach(function (item) {
                                thesaurusConcepts.push(item.conceptLabel.value.toLowerCase())

                            })
                            callbackWhilst()
                        })
                    },
                    function (err, n) {
                        if(err)
                            callbackSeries(err);
                        callbackSeries();

                    }
                )



    },
    //compare
    function(callbackSeries) {
        var intersection = onTheFlyTagger.intersection_destructive(pageWords, thesaurusConcepts);
        var x = intersection;


    }
]


,

function (err) {


}

)


},


intersection_destructive:function (a, b) {
    a.sort();
    b.sort();
    var result = [];
    while (a.length > 0 && b.length > 0) {
        if (a[0] < b[0]) {
            a.shift();
        } else if (a[0] > b[0]) {
            b.shift();
        } else /* they're equal */
        {

            result.push(a.shift());
            b.shift();
        }
    }

    return result;
}
,
intersectArrays:

    function (a, b) {
        a.sort();
        b.sort();
        var out = [], ai = 0, bi = 0, acurr, bcurr, last = Number.MIN_SAFE_INTEGER;
        while ((acurr = a[ai]) !== undefined && (bcurr = b[bi]) !== undefined) {
            if (acurr < bcurr) {
                if (last === acurr) {
                    out.push(acurr);
                }
                last = acurr;
                ai++;
            } else if (acurr > bcurr) {
                if (last === bcurr) {
                    out.push(bcurr);
                }
                last = bcurr;
                bi++;
            } else {
                out.push(acurr);
                last = acurr;
                ai++;
                bi++;
            }
        }
        return out;
    }


}
module.exports = onTheFlyTagger
var wikiPageUri = "https://wiki.aapg.org/Kerogen"
var thesaurusGraphUri = "http://souslesens.org/oil-gas/upstream/"
onTheFlyTagger.tagWebPage(wikiPageUri, thesaurusGraphUri, function (err, result) {


})
