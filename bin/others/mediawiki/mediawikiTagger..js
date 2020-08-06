var httpProxy = require('../../httpProxy.')
var elasticRestProxy = require('../../elasticRestProxy.')
//var superagent = require('superagent')
var request = require('request');
var fs = require('fs')
var async = require('async')

var mediaWikiTagger = {
    sparqlUrl: "http://51.178.139.80:8890/sparql/",
    indexPage: function (wikiUri, pageName, elasticUrl, indexName, thesaurusGraphUris, callback) {
        var rawPageText = "";
        var pageText = "";
        var pageCategories = [];
        var thesauriiConcepts = {};
        var categoriesRdfTriple="";
        async.series([

                //get Page content
                function (callbackSeries) {
                    httpProxy.get(wikiUri+pageName, {}, function (err, result) {
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
                    var strCats = regex.exec(rawPageText)[1];
                    var x = strCats
                    pageCategories = strCats.replace(/"/g, "").split(",")
                    callbackSeries();
                },

                //indexPageAndCategories
                function (callbackSeries) {
                    return callbackSeries();
                    var doc = {content: pageText, uri: pageUri, categories: pageCategories}
                    var bulkStr = "";
                    bulkStr += JSON.stringify({index: {_index: indexName, _type: "mediawikis", _id: doc.uri}}) + "\r\n"
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
                },

                //getThesaurusTerms
                function (callbackSeries) {
                    //  var conceptsWords=["area","example","central","control","exploration","liner","center","development","effect","energy","interpretation","lateral","archean","block","coefficient","crust","displacement","distance","forward","fundamental","impact","information","intensity","interface","accuracy","acquisition","amplitude","attenuation","borehole","calculating","change","communication","comparison","computer","conference","convolution","correlation","cube","density","error","fracturing","frequency","impedance","interest","landsat","deformation","earth","activity","black","boundary","color","competition","distribution","evolution","float","history","kinematics","academic","africa","amorphous","application","asia","coast","constant","cretaceous","differential","drift","east","environment","extension","facies","faulting","four","friction","geometry","growth","human","ice","level","light","administration","anhydrite","anisotropy","anomaly","antarctica","anticline","array","astronomy","astrophysics","atlas","atmosphere","axial","azimuth","bahrain","basin","belt","bend","cap","carbon","carbonate","carboniferous","chart","circuit","cleavage","coal","collision","column","component","composition","compression","concentration","concrete","conservation","continent","continuous","convection","convergent","crest","crystal","current","cutting","cycle","damage","decrease","dependent","determining","devonian","diagenesis","diagram","dip","dipmeter","direction","dynamics","earthquake","eccentricity","efficiency","eocene","equator","equilibrium","erosion","europe","evaporite","fabric","factor","fluid","force","foreland","forming","geochemistry","geophysics","glossary","gondwanaland","graptolite","hazard","heat","heating","hook","horizontal","increase","india","input","insolation","integration","iron","island","japan","jurassic","laurasia","layer","lead","liquid","lithology","abandonment","absorption","acceleration","accretion","acoustics","actinolite","activation","air","alignment","alteration","analog","anatase","anchor","anchoring","apatite","applying","appraisal","approximation","aquifer","association","australia","averaging","bali","barite","barrier","battery","beach","bearing","bedding","bibliography","bid","biodegradation","biostratigraphy","bitumen","brazil","breakthrough","brine","brittleness","bubble","budget","buildings","buoy","buoyancy","buried","cable","calcium","calibration","california","caliper","canyon","capacity","carrier","cause","cement","cenozoic","chain","chalcedony","chalk","channel","characteristic","characterization","chemical","chemistry","chert","chlorine","chlorite","circumference","classification","clay","claystone","clinoform","collar","colombia","colorado","company","compound","compressibility","computing","condensate","conglomerate","connection","construction","contouring","contractor","conversion","copper","coring","correction","cost","cristobalite","croatia","crossover","database","decentralization","decollement","deconvolution","deepening","deflection","delta","demand","depletion","deposit","desert","design","detection","detector","device","dewatering","diameter","diatomite","digital","dipole","discriminator","document","domain","dome","downward","drawdown","drop","ductility","dynamite","education","egypt","electrode","electronics","elevation","elongation","embayment","engineer","engineering","entropy","equalizing","equation","equipment","evaluation","examination","explosion","explosive","exsolution","extrapolation","failure","fan","fiber","filling","film","filter","filtrate","fire","focusing","foraminifera","france","generator","geologist","geophone","glass","goethite","government","graben","gradient","granite","graph","gravity","greenland","guinea","gun","gypsum","handling","head","helicopter","hematite","heterogeneity","hinge","histogram","hydrogen","hydrology","hydrophone","identification","illite","imaging","inclination","indicator","industry","injection","inorganic","instrument","instrumentation","inter","interference","interpolation","ireland","isolation","isostasy","isotope","keyboard","laboratory","lake","laser","latitude","length","leon","lidar","lignite","limestone","limonite","linear","abundance","alaska","ambient","avulsion","bentonite","biogeography","bioturbation","borneo","boundstone","breccia","brunei","canada","capsule","cathodoluminescence","cave","cavern","cementing","chenier","china","climate","contamination","cooling","crystallization","decision","diffusion","dolomitization","drainage","dune","electron","flood","gold","grainstone","gravel","halite","indonesia","inlet","intercrystalline","ion","italy","karst","lagoon","lime"]
                    // thesauriiConcepts["test"]={conceptsWords:conceptsWords};

                   async.eachSeries( thesaurusGraphUris,function (graphUri,callbackEach) {
                        if (thesauriiConcepts[graphUri]) {
                          return  callbackEach();
                        }else{
                            if (!options)
                                options = {withIds:true}
                            var limit = 10000;
                            var thesaurusConcepts = [];
                            var query = "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>PREFIX skos: <http://www.w3.org/2004/02/skos/core#>" +
                                "select distinct * from <" + graphUri + "> where{" +
                                "  " +
                                "  ?concept  rdf:type skos:Concept." +
                                "  ?concept skos:prefLabel ?conceptLabel filter(lang(?conceptLabel)='en') " +
                                "  " +
                                "}limit " + limit;

                            var offset = 0
                            var length = 1
                            var result = []
                            /*  async.whilst(
                                  function (callbackTest) {//test
                                      return callbackTest(null, length>0);
                                  },
                                  function iter(callbackWhilst) {*/


                            //  query=query+" offset "+(""+offset);
                            var params = {query: (query + " offset " + offset)}
                            offset += limit;
                            var options = {
                                method: 'POST',
                                form: params,
                                headers: {
                                    'content-type': 'application/x-www-form-urlencoded',
                                    'accept': 'application/json'
                                },
                                url: mediaWikiTagger.sparqlUrl,
                            };

                            request(options, function (error, response, body) {
                                if (error)
                                    return callbackEach(error);

                                    var result = JSON.parse(body);
                                    length = result.results.bindings.length
                                    result.results.bindings.forEach(function (item) {
                                        var prefLabel= item.conceptLabel.value.toLowerCase()
                                        if (options.withIds)
                                            thesaurusConcepts.push({id: item.concept.value, prefLabel:prefLabel,synonyms:[prefLabel]})
                                        else
                                            thesaurusConcepts.push(prefLabel)

                                    })
                                thesauriiConcepts[graphUri]=thesaurusConcepts;
                                callbackEach()



                            })

                        }
                    },function(err){
                       callbackSeries();


                   })


                },


                //extract TheasurusPageWords in    categoriesRdfTriple and store them
                function (callbackSeries) {
         //   return callbackSeries();
                    var bulkStr = "";
                    var synonyms;
                    //  thesauriiConcepts["test"].conceptsWords.forEach(function (conceptWord) {
                    async.eachSeries(thesaurusGraphUris, function (graphUri, callbackEach) {
                        thesauriiConcepts[graphUri].forEach(function (concept) {

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
                                "_source": "",
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
                                var x = str;
                                return callback(json.error);
                            }
                            var responses = json.responses;

                            if (!responses || !responses.forEach)
                                var x = 3
                            categoriesRdfTriple="";
                            responses.forEach(function s(response, responseIndex) {
                                if (response.hits.hits.length > 0) {
                                    var conceptId = thesauriiConcepts["test"].concepts[responseIndex].id;
                                    pageCategories.forEach(function (category) {
                                        categoriesRdfTriple += "<" + conceptId + "> <http://souslesens.org/vocab#wikimedia-category> <" + wikiUri + "/Category:" + category.replace(/ /g, "_") + "> . \n"
                                    })
                                }


                            })
                            
                            mediaWikiTagger.storeTriples(graphUri,categoriesRdfTriple,function(err,result){
                                    callbackEach(err);

                                
                            })

                        })
                    },function(err){
                        callbackSeries(err);
                    })
                }
                

                ,function (callbackSeries){
                    callbackSeries();

            
                }
                


            ],

            function (err) {

                callback(err)

            }
        )


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
      /*  async.whilst(
            function (callbackTest) {//test
                return callbackTest(null, length>0);
            },
            function iter(callbackWhilst) {*/


                //  query=query+" offset "+(""+offset);
                var params = {query: (query + " offset " + offset)}
                offset += limit;
                var options = {
                    method: 'POST',
                    form: params,
                    headers: {
                        'content-type': 'application/x-www-form-urlencoded',
                        'accept': 'application/json'
                    },
                    url: mediaWikiTagger.sparqlUrl,
                };

                request(options, function (error, response, body) {
                    if (error)
                        return callback(error);
                    try {
                        var result = JSON.parse(body);
                        length = result.results.bindings.length
                        result.results.bindings.forEach(function (item) {
                            if (options.withIds)
                                thesaurusConcepts.push({id: item.concept.value, label: item.conceptLabel.value.toLowerCase()})
                            else
                                thesaurusConcepts.push(item.conceptLabel.value.toLowerCase())
                            callback(null, obj)
                        })
                    }
                    catch(e){
                        callback(e)
                    }

                    return;
                })

            /*    httpProxy.post(mediaWikiTagger.sparqlUrl, null, params, function (err, result) {
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
                })*/
            /*,
            function (err, n) {
                if (err)
                    return callback(err);
                callback(null, thesaurusConcepts);

            }*/


    },

    storeTriples:function(graphUri,categoriesRdfTriple,callback){

       var query = "INSERT DATA" +
            "  { " +
            "    GRAPH <" + graphUri + "> " +
            "      { " + categoriesRdfTriple + "}}"
        var params = {query: (query)}

        httpProxy.post(mediaWikiTagger.sparqlUrl, null, params, function (err, result) {
            if (err) {
                console.log(params.query)
                return callback(err);
            }
            return callback()
        })

    },

    createMediawikiIndex: function (elasticUrl, indexName, callback) {

        var mappings = {
            "mediawikis": {
                "properties": {
                    "source": {
                        "type": "keyword"
                    },
                    "categories": {
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


}

module.exports = mediaWikiTagger

var elasticUri = "http://localhost:9200/"
var thesaurusGraphUris = ["http://souslesens.org/oil-gas/upstream/", "http://www.eionet.europa.eu/gemet/", "https://www2.usgs.gov/science/USGSThesaurus/"]
var thesaurusGraphUris = [ "http://www.eionet.europa.eu/gemet/", "https://www2.usgs.gov/science/USGSThesaurus/"]
mediaWikiTagger.indexPage("https://wiki.aapg.org/","Kerogen", elasticUri, "mediawiki", thesaurusGraphUris,function (err, result) {

})
//mediaWikiTagger.createMediawikiIndex(elasticUri,"mediawiki");
