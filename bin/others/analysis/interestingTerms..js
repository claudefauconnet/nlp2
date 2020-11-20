var httpProxy = require('../../httpProxy.')
var fs = require('fs')
var async = require('async')
var elasticServer = "http://vps254642.ovh.net:2009/"
var util = require("../../backoffice/util.")
var interestingTerms = {


    wikimediaTermFreq: function (indexName, byCategory, callback) {


        var query;
        if (byCategory) {
            query = {
                "query":
                    {
                        "match_all": {}
                    }
                , "_source": "",
                "size": 0,
                "aggs": {
                    "categories": {
                        "terms": {
                            "field": "categories",
                            "size": 20000,
                        },
                        "aggregations": {
                            "words":
                                {
                                    "terms":
                                        {
                                            "field": "content",
                                            "size": 20000,
                                            "order": {"_count": "desc"},
                                            "exclude": ".*[0-9].*"
                                        }
                                }
                        }


                    }
                }
            }
        } else {
            query = {
                "query":
                    {
                        "match_all": {}
                    }
                , "_source": "",
                "size": 0,
                "aggs": {
                    "words":
                        {
                            "terms":
                                {
                                    "field": "content",
                                    "size": 20000,
                                    "order": {"_count": "desc"},
                                    "exclude": ".*[0-9].*"
                                }
                        }

                }
            }
        }
        var url = elasticServer + indexName + "/_search"
        var headers = {
            accept: "application/json",
            //     "accept-encoding": "gzip, deflate",
            //   "accept-language": "en-US,en;q=0.8",
            "content-type": "application/json"
        }
        httpProxy.post(url, headers, query, function (err, result) {
            if (err)
                return console.log(err);
            callback(err, result)

        })

    },
    wordsVariances: function (file) {

        var inputMap = JSON.parse(fs.readFileSync(file));
        var outputMap = {}
        for (var word in inputMap) {

            if (inputMap["bulk"]) {

                var n = Object.keys(inputMap[word]).length
                if (n != 1) {
                    var bulkFreq = 0
                    var sommeEcarts = 0
                    for (var category in inputMap[word]) {
                        if (category != "bulk") {
                            var freq = (inputMap[word][category])
                            bulkFreq += freq
                        }
                    }
                    for (var category in inputMap[word]) {
                        if (category != "bulk") {
                            var freq = (inputMap[word][category])
                            sommeEcarts += freq - bulkFreq
                        }
                    }

                    var variance = Math.pow(sommeEcarts, 2) / n;
                    var stdVar = Math.pow(variance, .5)

                    outputMap[word] = stdVar


                } else {
                    console.log(JSON.stringify(inputMap[word]))
                }
            }


        }
        var array = []
        for (var word in outputMap) {
            array.push({word: word, stdVar: outputMap[word]})
        }

        array.sort(function (a, b) {
            if (a.stdVar > b.stdVar)
                return 1;
            if (a.stdVar < b.stdVar)
                return -1;
            return 0;
        })


        var str = JSON.stringify(array, null, 2)
        fs.writeFileSync(file.replace(".json", "wordsVariance.json"), str)
    }
    ,
    categoriesWordFreqs: function (file) {

        var inputMap = JSON.parse(fs.readFileSync(file));
        var outputMap = {}
        var commonWords = []
        var specificWords = []
        for (var word in inputMap) {


            var bulkWordFreq = inputMap[word]["bulk"]
            if (bulkWordFreq && bulkWordFreq < 500) {
                for (var category in inputMap[word]) {
                    if (category != "bulk") {
                        if (!outputMap[category])
                            outputMap[category] = []
                        var freq = inputMap[word][category]
                        var ecart = 1 - ((bulkWordFreq - freq) / bulkWordFreq)

                        outputMap[category].push({word: word, freq: freq, ecart: ecart, bulkFreq: bulkWordFreq})
                        if (ecart <= 0.02) {
                            if (commonWords.indexOf(word) < 0)
                                commonWords.push(word)
                        } else {
                            if (specificWords.indexOf(word) < 0)
                                specificWords.push(word)
                        }

                    }
                }
            }
        }
        var count = 0;
        for (var category in outputMap) {
            count++;
            outputMap[category].sort(function (a, b) {
                if (a.ecart > b.ecart)
                    return 1;
                if (a.ecart < b.ecart)
                    return -1;
                return 0;
            })
        }


        var str = JSON.stringify(outputMap, null, 2)
        fs.writeFileSync(file.replace(".json", "Frequencies.json"), str)
        fs.writeFileSync(file.replace(".json", "commonWords.json"), commonWords)
        fs.writeFileSync(file.replace(".json", "specificWords.json"), specificWords)

    },


    getThesaurusConceptsByCategory: function (mapFile, selectedSources) {
        var sources = JSON.parse(fs.readFileSync("D:\\GitHub\\nlp2\\public\\v2\\config\\sources.json"));
        var map = JSON.parse(fs.readFileSync(mapFile));
        //  var wordSlices = util.sliceArray(Object.keys(map), 10000)
        var wordsByThesaurus = {}

        async.eachSeries(selectedSources, function (sourceLabel, callbackEachSource) {
            var source = sources[sourceLabel];
            wordsByThesaurus[sourceLabel] = {}
            var categories = Object.keys(map);
            async.eachSeries(categories, function (category, callbackEachCategory) {
                wordsByThesaurus[sourceLabel][category] = []

                var wordsFilter = ""
                var wordsSlices = util.sliceArray(map[category], 50)
                async.eachSeries(wordsSlices, function (wordsSlice, callbackEachWords) {
                    wordsSlice.forEach(function (item, index) {
                        if (index > 0)
                            wordsFilter += "|"
                        wordsFilter += "^" + item.word + "$";
                    })


                    var query = "prefix skos: <http://www.w3.org/2004/02/skos/core#>" +
                        "select distinct ?prefLabel   from <" + source.graphUri + "> " +
                        " where {?concept skos:prefLabel|skos:altLabel ?prefLabel  " +
                        "filter (lang(?prefLabel)=\"en\" && regex(?prefLabel,\" " + wordsFilter + "\", \"i\"))" +
                        "} limit 10000"

                    var params = {query: query}
                    var headers = {
                        "Accept": "application/sparql-results+json",
                        "Content-Type": "application/x-www-form-urlencoded"
                    }
                    httpProxy.post(source.sparql_url + "?query=&format=json", headers, params, function (err, result) {
                        if (err) {
                            console.log(params.query)
                            return callbackEachWords(err);
                        }

                        result.results.bindings.forEach(function (item) {
                            wordsByThesaurus[sourceLabel][category].push(item.prefLabel.value.toLowerCase());
                        })

                        console.log(sourceLabel + "  " + category + " " + wordsByThesaurus[sourceLabel][category].length)
                        callbackEachWords()


                    })
                }, function (err) {
                    callbackEachCategory(err)
                })

            }), function (err) {
                callbackEachSource(err)
            }, function (err) {

                var str = JSON.stringify(wordsByThesaurus);
                fs.writeFileSync(mapFile.replace(".json", "_wordsByThesaurus.json"), str)
            }

        })
    }
}


if (false) {// BULK

    interestingTerms.wikimediaTermFreq("mediawiki-pages-spe", false, function (err, result) {
        var map = {}
        result.aggregations.words.buckets.forEach(function (item) {
            if (item.doc_count < result.hits.total && item.key.length > 1) {
                map[item.key] = {bulk: item.doc_count}
            }

        })

        var str = JSON.stringify(map);
        fs.writeFileSync("D:\\NLP\\lab\\wordsSPE.json", str)

    })
}

if (false) {// by category
    var inputMapFile = "D:\\NLP\\lab\\wordsSPE.json";
    var indexName = "mediawiki-pages-spe"
    interestingTerms.wikimediaTermFreq(indexName, true, inputMapFile, function (err, result) {

        var map = JSON.parse(fs.readFileSync(inputMapFile))
        result.aggregations.categories.buckets.forEach(function (category) {
            category.words.buckets.forEach(function (word) {
                if (word.doc_count < category.doc_count && word.key.length > 1) {


                    if (map[word.key]) {
                        map[word.key][category.key] = word.doc_count
                    } else {
                        //;   map[word.key]=[category.key]= word.doc_count}
                    }
                }
            })


        })

        var str = JSON.stringify(map);
        fs.writeFileSync(inputMapFile.replace(".json", "_categories.json"), str)

    })
}
if (false) {
    interestingTerms.wordsVariances("D:\\NLP\\lab\\wordsAAPG_categories.json")
}

if (false) {
    interestingTerms.categoriesWordFreqs("D:\\NLP\\lab\\wordsAAPG_categories.json")
    interestingTerms.categoriesWordFreqs("D:\\NLP\\lab\\wordsSPE_categories.json")
}

module.exports = interestingTerms

if (true) {
    var sources = [
        "Total-CTG",
        "Oil&Gas-Upstream",
        "Gaia",
        "GEMET",
        "USGS",
        "GEOSCMIL",
        "TermSciences",
        "ThesaurusIngenieur",
    ]
    var sources = [
       // "USGS",
        "GEOSCMIL",
    ]

    interestingTerms.getThesaurusConceptsByCategory("D:\\NLP\\lab\\wordsAAPG_categoriesFrequencies.json", sources)
}
