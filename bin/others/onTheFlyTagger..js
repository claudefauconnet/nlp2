var async = require('async')
var httpProxy = require('../httpProxy.')
var elasticRestProxy = require('../elasticRestProxy.')
var superagent = require('superagent')
var fs = require('fs')
var lemmatizer = require("lemmatizer");
var onTheFlyTagger = {
    mediawikistopWords: ["wikitable", "04b3eb47", "1.5em", "1.5x", "120px", "16px", "180px", "22em", "240px", "300px", "302px", "450px", "48px", "600px", "72px", "96px", "__mirage2", "aapg", "about", "action", "ajax.cloudflare.com", "align", "align:center", "also", "alt", "amp", "archives.datapages.com", "argument", "author", "available", "backlink", "basic", "beaumont", "bold", "book", "button.png", "bytes", "cache", "called", "can", "cdata", "cdn", "cellspacing", "cfsrc", "cgi", "chapter", "cite", "cite_note", "cite_ref", "class", "clip.png", "cloudflare", "code", "colspan", "common", "components", "composed", "content", "contents", "contentsub", "converted", "count", "courtesy", "cpu", "data", "datapages", "datapages_button.png", "decimal", "definition", "depth", "detail.aspx", "dir", "display:none", "div", "does", "edit", "elements", "enlarge", "examples", "exist", "expand", "expansion", "expensive", "exploring", "external", "external_links", "figure", "find", "float:right", "font", "for", "from", "fulltext", "function", "gas", "generated", "geology", "geoscienceworld", "geoscienceworld_button.png", "google", "google_button.png", "group", "gsw", "headline", "height", "high", "highest", "href", "htm", "http", "https", "image", "images", "img", "include", "index.php", "infobox", "internal", "interpreting", "javascript", "jump", "key", "land", "lang", "left", "limit", "line", "link", "links", "list", "literature", "ltr", "magnify", "marine", "may", "min.js", "mirage2", "nav", "navigation", "neither", "new", "newpp", "node", "nofollow", "nomobile", "noscript", "occurrence", "oil", "onepetro", "onepetro_button.png", "only", "original", "page", "parser", "part", "petok", "petroleum", "png", "position:relative", "post", "preprocessor", "printfoote", "quality", "rarely", "real", "redirect", "redlink", "reference", "references", "reflist", "rel", "report", "right", "saved", "scholar", "scholar.google.ca", "script", "scripts", "search", "search.html", "seconds", "section", "sections", "see", "see_also", "series", "several", "shows", "sitesub", "size", "skins", "sp.fulldoc", "span", "specpubs", "src", "srcset", "static", "store", "store.aapg.org", "style", "submit", "sup", "table", "template", "text", "the", "through", "thumb", "thumbcaption", "thumbimage", "thumbinner", "time", "timestamp", "title", "toc", "toclevel", "tocnumber", "tocsection", "toctext", "toctitle", "traps", "traps.png", "treatise", "tright", "type", "uniform", "usage", "visibility:hidden", "visited", "web", "weight", "width", "wiki", "wikidb:pcache:idhash", "window", "www.geoscienceworld.org", "www.onepetro.org", "yes"]
    ,
    tagWebPage: function (uri, thesaurusConcepts, callback) {


        var pageText = "";
        var pageWords = [];
        var pageConcepts = {};
        var intersection = []
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
                        var wordsMap = {};
                        result.tokens.forEach(function (item) {
                            var word = "" + item.token

                            if (word.length > 2 && isNaN(word)) {

                                word = word.toLowerCase()
                                if (!wordsMap[word] && onTheFlyTagger.mediawikistopWords.indexOf(word) < 0) {
                                    wordsMap[word] = 0;
                                    wordsMap[word] += 1;
                                    if (pageWords.indexOf(word) < 0)
                                        pageWords.push(word);
                                }
                            }
                        })
                        return callbackSeries()

                    })


                },
                //compare
                function (callbackSeries) {

                    var conceptLabels = [];
                    thesaurusConcepts.forEach(function (item) {
                        conceptLabels.push(item.label)
                    })
                    intersection = onTheFlyTagger.intersection_destructive(pageWords, conceptLabels);
                    //   var intersection = onTheFlyTagger.intersectArrays(pageWords, thesaurusConcepts);
                    return callbackSeries()

                }
            ]


            ,

            function (err) {
                return callback(err, intersection)

            }
        )


    },


    intersection_destructive: function (a, b) {
        a.sort();
        b.sort();
        var result = [];
        var resultMap = {};
        while (a.length > 0 && b.length > 0) {
            if (a[0] < b[0]) {
                a.shift();
            } else if (a[0] > b[0]) {
                b.shift();
            } else /* they're equal */
            {
                if (!resultMap[a[0]])
                    resultMap[a[0]] = 0;
                resultMap[a[0]] += 1;
                result.push(a[0]);
                // result.push(a.shift());
                a.shift()
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
    ,

    getThesaurusConcepts: function (thesaurusGraphUri, options, callback) {
        if (!options)
            options = {}
        var limit = 10000;
        var thesaurusConcepts = [];
        var query = "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>PREFIX skos: <http://www.w3.org/2004/02/skos/core#>" +
            "select distinct * from <" + thesaurusGraphUri + "> where{" +
            "  " +
            "  ?concept  rdf:type skos:Concept." +
            "  ?concept skos:prefLabel ?conceptLabel filter(lang(?conceptLabel)='en') " +
            "  " +
            "}limit " + limit;

        var offset = 0
        var length = 1
        var result = []
        async.whilst(
            function test(cb) {
                return cb(null, length > 0);
            },
            function iter(callbackWhilst) {
                var url = "http://51.178.139.80:8890/sparql/"

                //  query=query+" offset "+(""+offset);
                var params = {query: (query + " offset " + offset)}
                offset += limit;
                httpProxy.post(url, null, params, function (err, result) {
                    if (err)
                        return callbackWhilst(err);
                    length = result.results.bindings.length
                    result.results.bindings.forEach(function (item) {
                        if (options.withIds)
                            thesaurusConcepts.push({id: item.concept.value, label: item.conceptLabel.value.toLowerCase()})
                        else
                            thesaurusConcepts.push(item.conceptLabel.value.toLowerCase())

                    })
                    callbackWhilst()
                })
            },
            function (err, n) {
                if (err)
                    callback(err);
                callback(null, thesaurusConcepts);

            }
        )

    }

    , getpagesData: function () {
        var str = "" + fs.readFileSync("D:\\Total\\2020\\Stephanie\\AAPG-Pages.txt");
        var lines = str.split("\n");
        var pagesJson = [];
        var cols = [];

        lines[0].split("\t").forEach(function (cell) {
            cols.push(cell)
        })

        lines.forEach(function (line, lineIndex) {
            var cells = line.trim().split("\t");
            var obj = {}
            cells.forEach(function (cell, index) {
                if (lineIndex == 0)
                    cols.push(cell)
                else {
                    obj[cols[index]] = cell;
                }
            })
            pagesJson.push(obj)
        })
        return pagesJson;
    }

    ,
    setWikiCategoriesToThesaurus: function (options, thesaurusGraphUris, callback) {

        var categories = [];
        var pages = [];
        var thesaurusConceptsMap = {}


        async.series([


                //getCategories
                function (callbackSeries) {
                    if (options.categories) {
                        categories = options.categories;
                        return callbackSeries();
                    } else if (options.subjects) {
                        var pagesData = onTheFlyTagger.getpagesData();
                        pagesData.forEach(function (item) {
                            if (options.subjects.indexOf(item.subject) > -1)
                                categories.push(item.uri)
                        })


                        return callbackSeries();
                    }
                },

                //getWikiPages
                function (callbackSeries) {

                    //  async.eachSeries(categories,function (category,callbackEach){
                    var filter = "";
                    categories.forEach(function (category, index) {

                        if (index > 0)
                            filter += ","
                        filter += "<" + category + ">"

                    })

                    var query = "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>" +
                        "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>" +
                        "SELECT distinct * from <http://wiki.aapg.org/data/> WHERE {" +
                        "?page  ?x ?category. filter (?category in (" + filter + ")) ?page rdfs:label ?pageLabel} order by ?category limit 5000"

                    var url = "http://51.178.139.80:8890/sparql/"
                    var params = {query: (query)}
                    httpProxy.post(url, null, params, function (err, result) {
                        if (err)
                            return callbackSeries(err);
                        result.results.bindings.forEach(function (item) {
                            var uri = item.page.value.replace("Special:URIResolver", "")
                            pages.push({id: item.page.value, uri: uri, label: item.pageLabel.value, category: item.category.value})
                        })
                        callbackSeries()
                    })
                },
                //get thesaurus terms map
                function (callbackSeries) {

                    async.eachSeries(thesaurusGraphUris, function (thesaurusGraphUri, callbackEach) {
                        if (thesaurusConceptsMap[thesaurusGraphUri]) {
                            return callbackSeries();
                        }
                        onTheFlyTagger.getThesaurusConcepts(thesaurusGraphUri, {withIds: true}, function (err, result) {
                            thesaurusConceptsMap[thesaurusGraphUri] = {concepts: result, commonPagesTerms: {}};
                            callbackEach()
                        })

                    }, function (err) {
                        return callbackSeries(err)
                    })
                }
                ,
                //get intersections
                function (callbackSeries) {

                    var graphs = Object.keys(thesaurusConceptsMap)

                    async.eachSeries(graphs, function (graph, callbackEach1) {
                        async.eachSeries(pages, function (page, callbackEach2) {
console.log("processing page "+page.uri +" on graph "+graph)
                            onTheFlyTagger.tagWebPage(page.uri, thesaurusConceptsMap[graph].concepts, function (err, result) {
                                if (err)
                                    callbackEach2(err);

                                var clonedPage = JSON.parse(JSON.stringify(page));
                                clonedPage.commonTerms = [];
                                thesaurusConceptsMap[graph].concepts.forEach(function (item) {

                                    var p;
                                    if ((p = result.indexOf(item.label)) > -1)
                                        clonedPage.commonTerms.push({label: result[p], id: item.id})
                                })
                                // clonedPage.commonTerms = result;
                                thesaurusConceptsMap[graph].commonPagesTerms[page.uri] = clonedPage

                                callbackEach2()
                            })


                        }, function (err) {
                            return callbackEach1();
                        })
                    }, function (err) {
                        return callbackSeries()

                    })
                }
                , //synthetise data

                function (callbackSeries) {
                    var catStats = {}
                    var thesaurustermsMap = {}
                    for (var graph in thesaurusConceptsMap) {
                        thesaurustermsMap[graph] = {}
                        for (var page in thesaurusConceptsMap[graph].commonPagesTerms) {
                            var data = thesaurusConceptsMap[graph].commonPagesTerms[page];
                            data.commonTerms.forEach(function (term) {
                                if (!thesaurustermsMap[graph][term.label])
                                    thesaurustermsMap[graph][term.label] = {pages: [], categories: []}
                                thesaurustermsMap[graph][term.label].pages.push(page);

                                if (thesaurustermsMap[graph][term.label].categories.indexOf(data.category) < 0)
                                    thesaurustermsMap[graph][term.label].categories.push(data.category)


                                if (!catStats[data.category])
                                    catStats[data.category] = {}
                                if (!catStats[data.category][graph])
                                    catStats[data.category][graph] = {terms: []}
                                catStats[data.category][graph].terms.push(term)

                            })

                        }

                    }
                    fs.writeFileSync("D:\\Total\\2020\\Stephanie\\" + options.subjects.toString() + "_termsCategories.json", JSON.stringify(thesaurustermsMap, null, 2))
                    fs.writeFileSync("D:\\Total\\2020\\Stephanie\\" + options.subjects.toString() + "_categoriesStats.json", JSON.stringify(catStats, null, 2))
                    return callbackSeries()
                }

            ],

            function (err) {
                callback(err, {});
            })
    }
    , createCategoriesRDF: function (categoriesStatsFilePath) {
        var json = JSON.parse("" + fs.readFileSync(categoriesStatsFilePath));
        var str="";
        for (var category in json) {
            for (var graph in json[category]) {
                var terms = json[category][graph].terms;
                str += "INSERT DATA" +
                    "  { " +
                    "    GRAPH <" + graph + "> " +
                    "      {\n ";
                terms.forEach(function (term) {
                    var category2 = category.replace("Special:URIResolver/Category-3A", "Category:")
                    str += "<" + term.id + "> <http://souslesens.org/vocab#wikimedia-category> <" + category2 + ">.\n "
                })
                str += "}}\n\n**********************************************\n"
            }
        }
        console.log(str);
    }
}
module.exports = onTheFlyTagger


if (false
) {
    var wikiPageUri = "https://wiki.aapg.org/3-D_seismic_data_views"
    var thesaurusGraphUri = "http://souslesens.org/oil-gas/upstream/"
    var thesaurusGraphUri = "http://www.eionet.europa.eu/gemet/"

    var wikiPageUri = "https://wiki.aapg.org/Kerogen"
    onTheFlyTagger.tagWebPage(wikiPageUri, thesaurusGraphUri, function (err, result) {


    })
}


if (false) {
    var text = ""

    var regex = /Category:([^;.]*)&amp;[^>.]*>(.*)<\/a>/gm;
    var array = [];
    var str = ""
    while ((array = regex.exec(text)) != null) {
        str += array[1] + "\t" + array[2] + ""
    }
    console.log(str)


}

if (false) {

    var thesaurusGraphUris = ["http://souslesens.org/oil-gas/upstream/", "http://www.eionet.europa.eu/gemet/", "https://www2.usgs.gov/science/USGSThesaurus/", "http://data.15926.org/dm/"]
   // var thesaurusGraphUris = [ "http://www.eionet.europa.eu/gemet/"]
    var options = {
        subjects: ["structural geology","sedimentology"]
    }


    onTheFlyTagger.setWikiCategoriesToThesaurus(options, thesaurusGraphUris, function (err, result) {


    })


}

if (true) {

    onTheFlyTagger.createCategoriesRDF("D:\\Total\\2020\\Stephanie\\structural geology,sedimentology_categoriesStats.json")


}
