var async = require('async')
var httpProxy = require('../httpProxy.')
var elasticRestProxy = require('../elasticRestProxy.')
var superagent = require('superagent')
var fs = require('fs')
var lemmatizer = require("lemmatizer");
var onTheFlyTagger = {
    mediawikistopWords: ["wikitable", "04b3eb47", "1.5em", "1.5x", "120px", "16px", "180px", "22em", "240px", "300px", "302px", "450px", "48px", "600px", "72px", "96px", "__mirage2", "aapg", "about", "action", "ajax.cloudflare.com", "align", "align:center", "also", "alt", "amp", "archives.datapages.com", "argument", "author", "available", "backlink", "basic", "beaumont", "bold", "book", "button.png", "bytes", "cache", "called", "can", "cdata", "cdn", "cellspacing", "cfsrc", "cgi", "chapter", "cite", "cite_note", "cite_ref", "class", "clip.png", "cloudflare", "code", "colspan", "common", "components", "composed", "content", "contents", "contentsub", "converted", "count", "courtesy", "cpu", "data", "datapages", "datapages_button.png", "decimal", "definition", "depth", "detail.aspx", "dir", "display:none", "div", "does", "edit", "elements", "enlarge", "examples", "exist", "expand", "expansion", "expensive", "exploring", "external", "external_links", "figure", "find", "float:right", "font", "for", "from", "fulltext", "function", "gas", "generated", "geology", "geoscienceworld", "geoscienceworld_button.png", "google", "google_button.png", "group", "gsw", "headline", "height", "high", "highest", "href", "htm", "http", "https", "image", "images", "img", "include", "index.php", "infobox", "internal", "interpreting", "javascript", "jump", "key", "land", "lang", "left", "limit", "line", "link", "links", "list", "literature", "ltr", "magnify", "marine", "may", "min.js", "mirage2", "nav", "navigation", "neither", "new", "newpp", "node", "nofollow", "nomobile", "noscript", "occurrence", "oil", "onepetro", "onepetro_button.png", "only", "original", "page", "parser", "part", "petok", "petroleum", "png", "position:relative", "post", "preprocessor", "printfoote", "quality", "rarely", "real", "redirect", "redlink", "reference", "references", "reflist", "rel", "report", "right", "saved", "scholar", "scholar.google.ca", "script", "scripts", "search", "search.html", "seconds", "section", "sections", "see", "see_also", "series", "several", "shows", "sitesub", "size", "skins", "sp.fulldoc", "span", "specpubs", "src", "srcset", "static", "store", "store.aapg.org", "style", "submit", "sup", "table", "template", "text", "the", "through", "thumb", "thumbcaption", "thumbimage", "thumbinner", "time", "timestamp", "title", "toc", "toclevel", "tocnumber", "tocsection", "toctext", "toctitle", "traps", "traps.png", "treatise", "tright", "type", "uniform", "usage", "visibility:hidden", "visited", "web", "weight", "width", "wiki", "wikidb:pcache:idhash", "window", "www.geoscienceworld.org", "www.onepetro.org", "yes"]
    ,
    sparqlUrl: "http://51.178.139.80:8890/sparql/",
    pageWordsMap: {},
    getPageWords: function (pageUri, callback) {


        var pageText = "";
        var pageWords = [];
        var intersection = [];

        async.series([

                //ask cache
                function (callbackSeries) {
                    if (onTheFlyTagger.pageWordsMap[pageUri] != null) {
                        pageWords = onTheFlyTagger.pageWordsMap[pageUri];
                        return callback(null, pageWords)
                    } else {
                        return callbackSeries()
                    }
                },
                //getPage
                function (callbackSeries) {
                    httpProxy.get(pageUri, {}, function (err, result) {
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


                }
            ]


            ,

            function (err) {
                onTheFlyTagger.pageWordsMap[pageUri] = pageWords
                return callback(err, pageWords)

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
              

                //  query=query+" offset "+(""+offset);
                var params = {query: (query + " offset " + offset)}
                offset += limit;
                httpProxy.post(onTheFlyTagger.sparqlUrl, null, params, function (err, result) {
                    if (err) {
                        console.log(params.query)
                        return callbackWhilst(err);
                    }
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
                    return callback(err);
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
                    if (options.pages) {
                        pages = options.pages;
                        return callbackSeries();
                    }
                    if (options.categories) {
                        categories = options.categories;
                        return callbackSeries();
                    } else if (options.subjects) {
                        var pagesData = onTheFlyTagger.getpagesData();
                        pagesData.forEach(function (item) {
                            if (options.subjects.length == 0 || options.subjects.indexOf(item.subject) > -1)
                                categories.push(item.uri)
                        })


                        return callbackSeries();
                    }
                },

                //getWikiPages
                function (callbackSeries) {
                    if (options.pages) {
                        return callbackSeries();
                    }
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

                   
                    var params = {query: (query)}
                    httpProxy.post(onTheFlyTagger.sparqlUrl, null, params, function (err, result) {
                        if (err)
                            return callbackSeries(err);
                        result.results.bindings.forEach(function (item) {
                            var uri = item.page.value.replace("Special:URIResolver", "");
                            // if (uri.indexOf(",") < 0)
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
                        console.log("loading thesaurus " + thesaurusGraphUri)
                        onTheFlyTagger.getThesaurusConcepts(thesaurusGraphUri, {withIds: true}, function (err, result) {
                            thesaurusConceptsMap[thesaurusGraphUri] = {concepts: result, commonPagesTerms: {}};
                            console.log(" thesaurus loaded" + thesaurusGraphUri + "  : " + result.length + " concepts")
                            callbackEach()
                        })

                    }, function (err) {
                        return callbackSeries(err)
                    })
                }
                ,
                //get commonWords
                function (callbackSeries) {

                    var graphs = Object.keys(thesaurusConceptsMap)


                    //   graphs.forEach(function(graph){
                    async.eachSeries(pages, function (page, callbackEach1) {
                        console.log("-----------------processing page----------- " + page.uri);
                        onTheFlyTagger.getPageWords(page.uri, function (err, result) {
                            if (err) {
                                console.log("ERROR on " + page.uri + " : " + err)
                                return callbackEach1();
                            }
                            var currentpageWords = result
                            async.eachSeries(graphs, function (graph, callbackEach2) {
                                console.log(" on graph " + graph)

                                var conceptLabels = [];
                                thesaurusConceptsMap[graph].concepts.forEach(function (item) {
                                    conceptLabels.push(item.label)
                                })
                                var commonWords = onTheFlyTagger.intersection_destructive(JSON.parse(JSON.stringify(currentpageWords)), conceptLabels);
                                //   var intersection = onTheFlyTagger.intersectArrays(pageWords, thesaurusConcepts);


                                var clonedPage = JSON.parse(JSON.stringify(page));
                                clonedPage.commonTerms = [];
                                thesaurusConceptsMap[graph].concepts.forEach(function (item) {

                                    var p;
                                    if ((p = commonWords.indexOf(item.label)) > -1)
                                        clonedPage.commonTerms.push({label: commonWords[p], id: item.id})
                                })
                                // clonedPage.commonTerms = result;
                                thesaurusConceptsMap[graph].commonPagesTerms[page.uri] = clonedPage

                                callbackEach2()
                            }, function (err) {
                                return callbackEach1();
                            })

                        })
                    }, function (err) {
                        return callbackSeries()

                    })
                }
                , //synthetise data

                function (callbackSeries) {
                    var catStats = {}
                    var thesaurusTermsMap = {}
                    for (var graph in thesaurusConceptsMap) {
                        thesaurusTermsMap[graph] = {}
                        for (var page in thesaurusConceptsMap[graph].commonPagesTerms) {
                            var data = thesaurusConceptsMap[graph].commonPagesTerms[page];
                            data.commonTerms.forEach(function (term) {
                                if (!thesaurusTermsMap[graph][term.label])
                                    thesaurusTermsMap[graph][term.label] = {pages: [], categories: []}
                                thesaurusTermsMap[graph][term.label].pages.push(page);

                                if (thesaurusTermsMap[graph][term.label].categories.indexOf(data.category) < 0)
                                    thesaurusTermsMap[graph][term.label].categories.push(data.category)


                                if (!catStats[data.category])
                                    catStats[data.category] = {}
                                if (!catStats[data.category][graph])
                                    catStats[data.category][graph] = {terms: []}
                                catStats[data.category][graph].terms.push(term)

                            })

                        }

                    }
                    fs.writeFileSync("D:\\Total\\2020\\Stephanie\\pagesWords.json", JSON.stringify(onTheFlyTagger.pageWordsMap, null, 2))
                    fs.writeFileSync("D:\\Total\\2020\\Stephanie\\" + options.subjects.toString() + "_termsCategories.json", JSON.stringify(thesaurusTermsMap, null, 2))
                    fs.writeFileSync("D:\\Total\\2020\\Stephanie\\" + options.subjects.toString() + "_categoriesStats.json", JSON.stringify(catStats, null, 2))
                    return callbackSeries()
                }

            ],

            function (err) {
                callback(err, {});
            })
    }
    , printCategoriesTriples: function (categoriesStatsFilePath) {
        var json = JSON.parse("" + fs.readFileSync(categoriesStatsFilePath));
        onTheFlyTagger.maxInsertCategories=5000
        var graphCategoriesTriplesMap={}
        for (var category in json) {
            for (var graph in json[category]) {
                if (!graphCategoriesTriplesMap[graph])
                    graphCategoriesTriplesMap[graph] = [];

                var terms = json[category][graph].terms;
                var strs = [];

                terms.forEach(function (term,index) {

                    var category2 = category.replace("Special:URIResolver/Category-3A", "Category:")

                    strs.push("<" + term.id + "> <http://souslesens.org/vocab#wikimedia-category> <" + category2 + ">. ")
                    if(strs.length>=onTheFlyTagger.maxInsertCategories) {
                        graphCategoriesTriplesMap[graph].push(strs)
                        strs=[];
                    }

                })
                graphCategoriesTriplesMap[graph].push(strs);
            }
        }
       return graphCategoriesTriplesMap;
    }
    
    

    ,insertGraphCategories:function(graphCategoriesTriplesMap,callback) {
        var graphs = Object.keys(graphCategoriesTriplesMap);
        
        async.eachSeries(graphs, function (graph, callbackEach) {
            var query = "WITH <" + graphs + ">" +
                "DELETE { ?a ?property ?b } " +
                "WHERE " +
                "{ ?a ?property ?b. filter(?property=<http://souslesens.org/vocab#wikimedia-category>) } "
            var params = {query: (query)}

            httpProxy.post(onTheFlyTagger.sparqlUrl, null, params, function (err, result) {
                if (err) {
                    console.log(err)
                    return callbackEach(err);
                }

                var queries = graphCategoriesTriplesMap[graph];
                async.eachSeries(queries, function (queryArray, callbackEach2) {
                    var query="";
                    queryArray.forEach(function(item){
                        query+=item
                    })
                query= "INSERT DATA" +
                    "  { " +
                    "    GRAPH <" + graph + "> " +
                    "      { "+query+  "}}"
                var params = {query: (query)}

                httpProxy.post(onTheFlyTagger.sparqlUrl, null, params, function (err, result) {
                    if (err) {
                        console.log(params.query)
                        return callbackEach2(err);
                    }
                    return callbackEach2()
                })
            },function(err){
                    return callbackEach();
                })
            })


        }, function (err) {
            return callback(err);
        })
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

    var thesaurusGraphUris = ["http://souslesens.org/oil-gas/upstream/", "http://www.eionet.europa.eu/gemet/", "https://www2.usgs.gov/science/USGSThesaurus/"]
    //  var thesaurusGraphUris = [ "https://www2.usgs.gov/science/USGSThesaurus/"]


    var errorPages1 = [' https://wiki.aapg.org/Borehole_gravity_applications:_examples',
        ' https://wiki.aapg.org/Borehole_gravity:_uses,_advantages,_and_disadvantages',
        ' https://wiki.aapg.org/Ellesmerian(-21)_petroleum_system',
        ' https://wiki.aapg.org/Gravity_applications:_examples',
        ' https://wiki.aapg.org/Log_analysis:_lithology',
        ' https://wiki.aapg.org/Magnetic_field:_local_variations',
        ' https://wiki.aapg.org/Magnetics:_interpreting_residual_maps',
        ' https://wiki.aapg.org/Magnetics:_petroleum_exploration_applications',
        ' https://wiki.aapg.org/Magnetics:_total_intensity_and_residual_magnetic_maps',
        ' https://wiki.aapg.org/Magnetotelluric_survey_case_history:_volcanic_terrain_(Columbia_River_Plateau)',
        ' https://wiki.aapg.org/Magnetotellurics_case_history:_frontier_basin_analysis_(Amazon_Basin,_Colombia)',
        ' https://wiki.aapg.org/Magnetotellurics_case_history:_Precambrian_overthrust_(Northwestern_Colorado)',
        ' https://wiki.aapg.org/Magnetotellurics_case_history:_rugged_carbonate_terrain_(Highlands_of_Papua_New_Guinea)',
        ' https://wiki.aapg.org/Mandal-2DEkofisk(-21)_petroleum_system',
        ' https://wiki.aapg.org/Mudlogging:_the_mudlog',
        ' https://wiki.aapg.org/Petroleum_system_concept:_examples_of_application',
        ' https://wiki.aapg.org/Petroleum_system:_geographic,_stratigraphic,_and_temporal_extent',
        ' https://wiki.aapg.org/Procedure_for_basin-2Dfill_analysis',
        ' https://wiki.aapg.org/Quick-2Dlook_lithology_from_logs',
        ' https://wiki.aapg.org/Seismic_data_-2D_creating_an_integrated_structure_map',
        ' https://wiki.aapg.org/Seismic_data_interpretation_-2D_recurring_themes',
        ' https://wiki.aapg.org/Seismic_data:_building_a_stratigraphic_model',
        ' https://wiki.aapg.org/Seismic_data:_identifying_reflectors',
        ' https://wiki.aapg.org/Synthetic_seismograms:_correlation_to_other_data',
        ' https://wiki.aapg.org/Tight_gas_reservoirs:_evaluation',
    ]
    var options = {
        // subjects: ["structural geology"],
         subjects: [],
      //  pages: errorPages1

    }


    onTheFlyTagger.setWikiCategoriesToThesaurus(options, thesaurusGraphUris, function (err, result) {


    })


}

if (true) {

   var graphCategoriesTriplesMap= onTheFlyTagger.printCategoriesTriples("D:\\Total\\2020\\Stephanie\\_categoriesStats.json");
   onTheFlyTagger.insertGraphCategories(graphCategoriesTriplesMap,function(err, result){
       if(err)
           return console.log(err);
       console.log("DONE !!!")
   })




}
