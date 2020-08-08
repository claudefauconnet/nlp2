var httpProxy = require('../../httpProxy.')
var elasticRestProxy = require('../../elasticRestProxy.')
//var superagent = require('superagent')
var request = require('request');
var fs = require('fs')
var async = require('async')
var thesauriiConcepts = {};
var mediaWikiTagger = {
    sparqlUrl: "http://51.178.139.80:8890/sparql/",

    indexPage: function (wikiUri, pageName, elasticUrl, indexName, callback) {
        var rawPageText = "";
        var pageText = "";
        var pageCategories = [];

        var categoriesRdfTriples = "";
        async.series([

                //get Page content
                function (callbackSeries) {

                    httpProxy.get(wikiUri + pageName, {}, function (err, result) {
                        if (err)
                            return callbackSeries(err);
                        rawPageText = result;
                        return callbackSeries()
                    })
                },
                //get usefullTextcontent
                function (callbackSeries) {
                    var strartMark = "bodyContent"
                    var endMark = "printfooter";
                    var startIndex = rawPageText.indexOf(strartMark) + 10;
                    var endIndex = rawPageText.indexOf(endMark) + 10;
                    pageText = rawPageText.substring(startIndex, endIndex);
                    return callbackSeries()


                },
                //getPageCategories
                function (callbackSeries) {
                    var regex = /wgCategories":\[([^\].]*)/m
                    var regex=/wgCategories":([^\]]*)/m
                  //  var strCats = regex.exec(rawPageText)
                    var strCats = regex.exec(rawPageText)[1];
                    var x = strCats
                    pageCategories = strCats.replace(/[\[\]]/g,"").replace(/"/g, "").split(",")
                    callbackSeries();
                },

                //indexPageAndCategories
                function (callbackSeries) {
                    var doc = {content: pageText, uri: wikiUri + pageName, categories: pageCategories}
                    var bulkStr = "";
                    bulkStr += JSON.stringify({index: {_index: indexName, _type: "mediawiki-page", _id: doc.uri}, "uri": doc.uri}) + "\r\n"
                    bulkStr += JSON.stringify(doc) + "\r\n";


                    var options = {
                        method: 'POST',
                        body: bulkStr,
                        encoding: null,
                        headers: {
                            'content-type': 'application/json'
                        },
                        url: elasticUrl + "_bulk?refresh=wait_for"
                    };

                    request(options, function (error, response, body) {
                        if (error)
                            return callbackSeries(error)
                        elasticRestProxy.checkBulkQueryResponse(body, function (err, result) {
                            if (err)
                                return callbackSeries(err);
                        })

                        callbackSeries();
                    })
                }],

            function (err) {

                callback(err)

            }
        )


    },
    tagPages: function (thesaurusGraphUris,elasticUrl, indexName,wikiUri,callback) {

        var x=3

        async.series([
            //getThesaurusTerms
            function (callbackSeries) {


                //  var conceptsWords=["area","example","central","control","exploration","liner","center","development","effect","energy","interpretation","lateral","archean","block","coefficient","crust","displacement","distance","forward","fundamental","impact","information","intensity","interface","accuracy","acquisition","amplitude","attenuation","borehole","calculating","change","communication","comparison","computer","conference","convolution","correlation","cube","density","error","fracturing","frequency","impedance","interest","landsat","deformation","earth","activity","black","boundary","color","competition","distribution","evolution","float","history","kinematics","academic","africa","amorphous","application","asia","coast","constant","cretaceous","differential","drift","east","environment","extension","facies","faulting","four","friction","geometry","growth","human","ice","level","light","administration","anhydrite","anisotropy","anomaly","antarctica","anticline","array","astronomy","astrophysics","atlas","atmosphere","axial","azimuth","bahrain","basin","belt","bend","cap","carbon","carbonate","carboniferous","chart","circuit","cleavage","coal","collision","column","component","composition","compression","concentration","concrete","conservation","continent","continuous","convection","convergent","crest","crystal","current","cutting","cycle","damage","decrease","dependent","determining","devonian","diagenesis","diagram","dip","dipmeter","direction","dynamics","earthquake","eccentricity","efficiency","eocene","equator","equilibrium","erosion","europe","evaporite","fabric","factor","fluid","force","foreland","forming","geochemistry","geophysics","glossary","gondwanaland","graptolite","hazard","heat","heating","hook","horizontal","increase","india","input","insolation","integration","iron","island","japan","jurassic","laurasia","layer","lead","liquid","lithology","abandonment","absorption","acceleration","accretion","acoustics","actinolite","activation","air","alignment","alteration","analog","anatase","anchor","anchoring","apatite","applying","appraisal","approximation","aquifer","association","australia","averaging","bali","barite","barrier","battery","beach","bearing","bedding","bibliography","bid","biodegradation","biostratigraphy","bitumen","brazil","breakthrough","brine","brittleness","bubble","budget","buildings","buoy","buoyancy","buried","cable","calcium","calibration","california","caliper","canyon","capacity","carrier","cause","cement","cenozoic","chain","chalcedony","chalk","channel","characteristic","characterization","chemical","chemistry","chert","chlorine","chlorite","circumference","classification","clay","claystone","clinoform","collar","colombia","colorado","company","compound","compressibility","computing","condensate","conglomerate","connection","construction","contouring","contractor","conversion","copper","coring","correction","cost","cristobalite","croatia","crossover","database","decentralization","decollement","deconvolution","deepening","deflection","delta","demand","depletion","deposit","desert","design","detection","detector","device","dewatering","diameter","diatomite","digital","dipole","discriminator","document","domain","dome","downward","drawdown","drop","ductility","dynamite","education","egypt","electrode","electronics","elevation","elongation","embayment","engineer","engineering","entropy","equalizing","equation","equipment","evaluation","examination","explosion","explosive","exsolution","extrapolation","failure","fan","fiber","filling","film","filter","filtrate","fire","focusing","foraminifera","france","generator","geologist","geophone","glass","goethite","government","graben","gradient","granite","graph","gravity","greenland","guinea","gun","gypsum","handling","head","helicopter","hematite","heterogeneity","hinge","histogram","hydrogen","hydrology","hydrophone","identification","illite","imaging","inclination","indicator","industry","injection","inorganic","instrument","instrumentation","inter","interference","interpolation","ireland","isolation","isostasy","isotope","keyboard","laboratory","lake","laser","latitude","length","leon","lidar","lignite","limestone","limonite","linear","abundance","alaska","ambient","avulsion","bentonite","biogeography","bioturbation","borneo","boundstone","breccia","brunei","canada","capsule","cathodoluminescence","cave","cavern","cementing","chenier","china","climate","contamination","cooling","crystallization","decision","diffusion","dolomitization","drainage","dune","electron","flood","gold","grainstone","gravel","halite","indonesia","inlet","intercrystalline","ion","italy","karst","lagoon","lime"]
                // thesauriiConcepts["test"]={conceptsWords:conceptsWords};

                async.eachSeries(thesaurusGraphUris, function (graphUri, callbackEach) {
                    if (thesauriiConcepts[graphUri]) {
                        return callbackEach();
                    } else {
                        mediaWikiTagger.getThesaurusConcepts(graphUri, {withIds: true}, function (err, thesaurusConcepts) {
                            if (err) {
                                return callbackEach(err)
                            }
                            thesauriiConcepts[graphUri] = {concepts: thesaurusConcepts};
                            callbackEach()


                        })

                    }
                }, function (err) {
                    callbackSeries(err);


                })


            },


                //extract TheasurusPageWords in    categoriesRdfTriples and store them
                function (callbackSeries) {
                    //   return callbackSeries();
                    var bulkStr = "";
                    var synonyms;
                    //  thesauriiConcepts["test"].conceptsWords.forEach(function (conceptWord) {
                    async.eachSeries(thesaurusGraphUris, function (graphUri, callbackEach) {
                        bulkStr = "";
                        thesauriiConcepts[graphUri].concepts.forEach(function (concept) {

                            var queryString = "";
                            var shouldQuery = [];
                            concept.synonyms.forEach(function (synonym, indexSynonym) {


                                if (indexSynonym > 0)
                                    queryString += " OR "
                                queryString += "\\\\\"" + synonym + "\\\\\"";

                            })


                            var queryLine = {
                                "query": {
                                    "query_string": {
                                        "query": queryString,
                                        // "fields": ["content"],

                                    }
                                }

                                ,
                                "from": 0,
                                "size": 10000,
                                "_source": ["uri","categories"],
                                /*  "highlight": {
                                      "number_of_fragments": 0,
                                      "fragment_size": 0,
                                    //  "fields": ["content"],
                                      "pre_tags": ["|"],
                                      "post_tags": ["|"]


                                  }*/
                            }
                            bulkStr += JSON.stringify(({index: indexName})) + "\r\n"
                            bulkStr += JSON.stringify(queryLine) + "\r\n"


                        })
                        var options = {
                            method: 'POST',
                            body: bulkStr,
                            headers: {
                                'content-type': 'application/json'
                            },

                            url: elasticUrl + "_msearch"
                        };

                        request(options, function (error, response, body) {
                            if (error)
                                return callbackSeries(error);
                            var json = JSON.parse(response.body);
                            if (json.error) {
                                return callback(json.error);
                            }
                            var responses = json.responses;


                            var splittedtTriples = [];
                            var triples = [];

                            responses.forEach(function (response, responseIndex) {


                                if (response.hits.hits.length > 0) {

                                    var page = response.hits.hits[0]._id
                                    var concept = thesauriiConcepts[graphUri].concepts[responseIndex];
                                    var categories= response.hits.hits[0]._source.categories
                                   categories.forEach(function (category) {
                                       var categoryUri=category.replace(/[\r\n ]/g, "_")
                                        triples.push("<" + concept.id + "> <http://souslesens.org/vocab#wikimedia-category> <" + wikiUri + "Category:" + categoryUri + "> . ");
                                    })
                                    //  triples.push("<" + concept.id + "> <http://souslesens.org/vocab#wikimedia-page> <" + page + "> . ");


                                    if (triples.length > 1000) {
                                        splittedtTriples.push(triples);
                                        triples = [];
                                    }

                                }

                            })
                            splittedtTriples.push(triples);


                            async.eachSeries(splittedtTriples, function (triples, callbackResponse) {
                                mediaWikiTagger.storeTriples(graphUri, triples, function (err, result) {
                                    callbackResponse(err);

                                })
                            }, function (err) {
                                callbackEach(err);
                            })

                        })
                    })
                }


                , function (callbackSeries) {
                callbackSeries();


            }


            ],

            function (err) {
                callback(err)
            })

    },


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
            function (callbackTest) {//test
                return callbackTest(null, length > 0);
            },
            function iter(callbackWhilst) {
                var params = {query: (query + " offset " + offset)}
                offset += limit;

                httpProxy.post(mediaWikiTagger.sparqlUrl, null, params, function (err, result) {
                    if (err) {
                        console.log(params.query)
                        return callback(err);
                    }
                    length = result.results.bindings.length
                    result.results.bindings.forEach(function (item) {
                        var prefLabel = item.conceptLabel.value.toLowerCase()
                        if (options.withIds)
                            thesaurusConcepts.push({id: item.concept.value, prefLabel: prefLabel, synonyms: [prefLabel]})
                        else
                            thesaurusConcepts.push(prefLabel)

                    })
                    callbackWhilst()
                })

            },
            function (err, n) {
                if (err)
                    return callback(err);
                callback(null, thesaurusConcepts);

            })

    }

    ,

    storeTriples: function (graphUri, triples, callback) {

        var triplesStr = "";
        triples.forEach(function (triple) {
            triplesStr += triple
        })


        var query = "INSERT DATA" +
            "  { " +
            "    GRAPH <" + graphUri + "> "+
        "      { " + triplesStr + "}}"
        var params = {query: (query)}

        httpProxy.post(mediaWikiTagger.sparqlUrl, null, params, function (err, result) {
            if (err) {
                console.log(params.query)
                return callback(err);
            }

            /*
            {
    "head": {
    "link": [],
    "vars": [
      "callret-0"
    ]
    },
    "results": {
    "distinct": false,
    "ordered": true,
    "bindings": [
      {
        "callret-0": {
          "type": "literal",
          "value": "Insert into <http://www.eionet.europa.eu/gemet/>, 328 (or less) triples -- done"
        }
      }
    ]
    }
    }
             */
            console.log(result.results.bindings[0]["callret-0"].value)
            return callback()
        })

    }
    ,

    createMediawikiIndex: function (elasticUrl, indexName, callback) {

        var mappings = {
            "mediawiki-pages": {
                "properties": {

                    "categories": {
                        "type": "keyword"
                    },
                    "uri": {
                        "type": "keyword"
                    },
                    "content": {
                        "type": "text",
                        "term_vector": "with_positions_offsets_payloads",
                        "store": false,
                        //  "analyzer": "lowercase_asciifolding",

                        "fielddata": true,
                        "fields": {
                            "raw": {
                                "type": "keyword",
                                "ignore_above": 256,
                                //  "search_analyzer": "case_insentisitive",
                            }
                        }
                    }


                }

            },


        }
        var json =
            {
                "settings": {
                    "number_of_shards": 1
                },
                "mappings": mappings
            }


        var options = {
            method: 'PUT',
            description: "create index",
            url: elasticUrl + indexName,
            json: json
        };

        request(options, function (error, response, body) {
            if (error)
                return callback(error);
            if (body.error)
                return callback(body.error);
            var message = "index " + index + " created"

            return callback();

        })

    }
    ,
    deleteTriples: function (graph) {
        var query = "DELETE WHERE  {\n" +
            "  GRAPH <http://souslesens.org/oil-gas/upstream/>\n" +
            "  { ?concept <http://souslesens.org/vocab#wikimedia-category> ?category} }"


    }
    ,


    indexPages: function (elasticUri,indexName, filePath, from, to, callack) {
        var json = JSON.parse("" + fs.readFileSync(filePath));
        var index = -1;
        var t1 = new Date();
        async.eachSeries(json.pages, function (page, callbackEach) {

            if ((index++) < from)
                return callbackEach();
            if (index > to)
                return callack();
            var t3 = new Date();
            // processPage: function (wikiUri, pageName, elasticUrl, indexName, thesaurusGraphUris, callback) {
            mediaWikiTagger.indexPage(json.wikiUri,escape( page.replace(/ /g, "_")), elasticUri, indexName, function (err, result) {
                if (err) {
                    console.log(err)
                    return callbackEach()
                }

                var t2 = new Date();
                console.log("processed " + page + " in " + (t3 - t2) + " msec.")
                callbackEach()
            })


        }, function (err) {
            var t2 = new Date();
            console.log("processed " + (to - from) + "pages in " + (t2 - t1) + " msec.")
            return callack(err)
        })


    },



}


module.exports = mediaWikiTagger


//mediaWikiTagger.createMediawikiIndex()

var elasticUri = "http://localhost:9200/"
var thesaurusGraphUris = ["http://souslesens.org/oil-gas/upstream/", "http://www.eionet.europa.eu/gemet/", "http://data.total.com/resource/thesaurus/ctg/", "https://www2.usgs.gov/science/USGSThesaurus/"]
//var thesaurusGraphUris = ["http://data.total.com/resource/thesaurus/ctg/", "https://www2.usgs.gov/science/USGSThesaurus/"]

//var thesaurusGraphUris = ["http://souslesens.org/oil-gas/upstream/", "http://www.eionet.europa.eu/gemet/"]

var indexName="mediawiki-pages-seg"
if (false) {
    var filePath = "D:\\Total\\2020\\Stephanie\\pagesAAPG.json"
    var filePath = "D:\\Total\\2020\\Stephanie\\pagesPETROWIKI.json"
    var filePath = "D:\\Total\\2020\\Stephanie\\pagesSEG.json"
    var from = 0;
    var to = 5000
//mediaWikiTagger.processPage("https://wiki.aapg.org/", "Kerogen", elasticUri, "mediawiki", thesaurusGraphUris, function (err, result) {
    mediaWikiTagger.indexPages(elasticUri,indexName, filePath, from, to, function (err, result) {
        if (err)
            console.log(err);
        console.log("Done " + filePath + "from " + from + " to " + to);

    })
}

if (true) {
var  wikiUrl="https://wiki.aapg.org/"
    var wikiUrl="https://petrowiki.spe.org/"
    var wikiUrl="https://wiki.seg.org/wiki/"

        mediaWikiTagger.tagPages(thesaurusGraphUris, elasticUri,indexName, wikiUrl,function (err, result) {
        if (err)
            console.log(err);
        console.log("Done " + filePath + "from " + from + " to " + to);

    })
}
//mediaWikiTagger.createMediawikiIndex(elasticUri,"mediawiki");
