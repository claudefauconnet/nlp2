var fs = require('fs');
var request = require('request');
var async = require('async')

var elasticUrl = "http://localhost:9200/";
var tulsaComparator = {


    getEpEntitiesArray: function () {
        var epEntitiesPath = "D:\\Total\\2020\\Stephanie\\tulsaEntitesByDomains.txt";
        var epEntitiesStr = "" + fs.readFileSync(epEntitiesPath);

        var array = epEntitiesStr.split("\n");
        var epEntities = [];
        array.forEach(function (line, index) {
            var array2 = line.trim().split("\t")
            if (index > 0)
                epEntities.push({domain: array2[0], term: array2[1]})
        })
        return epEntities
    },
    getThesaurusHits: function (thesaurus, _query, callback) {
        var allHits = []
        var fetchHitsLength = 1
        var offset = 0;
        var fetchSize = 2000
        async.whilst(
            function (callbackTest) {//test
                return callbackTest(null, fetchHitsLength > 0);
            },
            function (callbackWhilst) {//iterate
                var query = {
                    query: _query,
                    "from": offset,
                    "size": fetchSize,
                    // "_source": ["text", "documents.entityOffsets.syn"]

                }
                var options = {
                    method: 'POST',
                    json: query,
                    headers: {
                        'content-type': 'application/json'
                    },
                    url: elasticUrl + thesaurus + "/_search"
                };
                request(options, function (error, response, body) {
                    if (error)
                        return callbackWhilst(error);
                    if (!body.hits)
                        return callback(null, allHits);
                    var hits = body.hits.hits;
                    fetchHitsLength = hits.length;

                    allHits = allHits.concat(hits);
                    offset += fetchSize


                    callbackWhilst();


                })
            }, function (err) {
                if (err)
                    return callback(err);
                return callback(null, allHits)

            })
    },


    matchTulsaEP: function () {
        var query = {

            "match_all": {}
            /*  "bool": {
                   "must": [
                       {
                           "query_string": {
                               "query": "documents.index:thesaurus_tulsa",

                               "default_operator": "AND"
                           }
                       }

                   ]
               }*/


        }

        tulsaComparator.getThesaurusHits("thesaurus_tulsa", query, function (err, result) {
            var tulsaEntitiesHits = result;
            var epEntities = tulsaComparator.getEpEntitiesArray();
            tulsaTerms = []
            tulsaEntitiesHits.forEach(function (hit, index) {
                var tulsaTerm = hit._source.text;
                tulsaTerms.push(tulsaTerm)
            })


            var EPterms = [];
            epEntities.forEach(function (epEntity) {
                EPterms.push(epEntity.term)
                var p;
                if ((p = tulsaTerms.indexOf(epEntity.term)) > -1)
                    if (tulsaEntitiesHits[p]._source) {

                        epEntity.tulsaScheme = tulsaEntitiesHits[p]._source.schemes[0]

                        epEntity.tulsaSynonyms = tulsaEntitiesHits[p]._source.synonyms.toString()
                    }

            })
            TulsaNonEPentities = []
            tulsaEntitiesHits.forEach(function (hit, index) {
                var tulsaTerm = hit._source.text;
                if (EPterms.indexOf(tulsaTerm) < 0)
                    TulsaNonEPentities.push({term: tulsaTerm, scheme: hit._source.schemes[0]})
                else
                    var x = 3;
            })
            var str = "";
            TulsaNonEPentities.forEach(function (item) {
                str += item.term + "\t" + item.scheme + "\n"
            })
            fs.writeFileSync("D:\\Total\\2020\\Stephanie\\tulsaEntitiesNonEP.txt", str);
            var str = ""
            epEntities.forEach(function (epEntity, index) {
                str += index + "\t" + epEntity.domain + "\t" + epEntity.term + "\t" + epEntity.tulsaScheme + "\t" + epEntity.tulsaSynonyms + "\n"
            })

            fs.writeFileSync("D:\\Total\\2020\\Stephanie\\tulsaEntitesByDomainsMatched.txt", str);
        })
    },


    matchCgiLitho_EP: function () {
        var query = {

            "match_all": {}
        }

        tulsaComparator.getThesaurusHits("cgi_lithologies", query, function (err, result) {
            var cgiEntitiesHits = result;
            var epEntities = tulsaComparator.getEpEntitiesArray();
            cgiTerms = [];
            EPterms = [];
            cgiEntitiesHits.forEach(function (hit, index) {
                var term = hit._source.text;
                if (term)
                    cgiTerms.push(term.toLowerCase());
            })
            epEntities.forEach(function (hit, index) {
                var term = hit.term;
                if (term)
                    EPterms.push(term.toLowerCase());
            })
            var intersection = tulsaComparator.intersection(EPterms, cgiTerms)

            var x = 3


        })
    },


    matchCgiLitho_TULSA: function () {
        var queryTulsa = {

          //  "match_all": {}
            match:{schemes:  "MATERIAL"}
        }
        var queryCgi = {

             "match_all": {}

        }

        tulsaComparator.getThesaurusHits("cgi_lithologies", queryCgi, function (err, resultCgi) {
            tulsaComparator.getThesaurusHits("thesaurus_tulsa", queryTulsa, function (err, resultTulsa) {


                cgiTerms = tulsaComparator.getThesaurusTerms(resultCgi);
                tulsaterms = tulsaComparator.getThesaurusTerms(resultTulsa);

                var intersection = tulsaComparator.intersection(tulsaterms, cgiTerms)

                var x = 3


            })
        })

    }
    ,

    getThesaurusTerms: function (entities) {
        var terms = []
        entities.forEach(function (hit, index) {
            var term = hit._source.text;
            if (term)
                terms.push(term.toLowerCase());
        })
        return terms;
    },

    intersection: function (array1, array2) {
        return array1.filter(function (item) {
            if (array2.indexOf(item) > -1)
                return true;
            return false

        })

    },
    difference: function (array1, array2) {
        return array1.filter(function (item) {
            if (array2.indexOf(item) < 0)
                return true;
            return false

        })

    }
}

module.exports = tulsaComparator


//tulsaComparator.matchTulsaEP()
//tulsaComparator.matchCgiLitho_EP()
tulsaComparator.matchCgiLitho_TULSA()
