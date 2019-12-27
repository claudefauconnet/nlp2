
//https://www.bp.com/content/dam/bp/country-sites/en_az/azerbaijan/home/pdfs/esias/sd/sd2/units_and_abbreviations.pdf
//https://www.spe.org/authors/docs/symbols.pdf

var fs = require('fs');
var async = require('async');
var request = require('request');
var ndjson = require('ndjson');
const socket = require('../../routes/socket.js');
const elasticRestProxy = require('../elasticRestProxy..js')


var annotator_regex = {


    annotateCorpus: function (globalOptions, callback) {
        var count = 0;
        var i = 0;
        var fetchSize = 200;
        var from = 0;
        var allMeasurementUnits = []
        async.whilst(
            function test(cb) {
                cb(null, count > 0 || (i++) == 0)
            },
            function iter(callbackIter) {
                var query = {
                    query: {match_all: {}},
                    size: fetchSize,
                    from: from
                }
                from += fetchSize;

                var options = {
                    method: 'POST',
                    json: query,
                    headers: {
                        'content-type': 'application/json'
                    },

                    url: globalOptions.elasticUrl + globalOptions.corpusIndex + "/_search"
                };

                request(options, function (error, response, body) {
                    if (error)
                        return callbackIter(error);
                    var hits = body.hits.hits;
                    var annotatedHits = [];
                    async.series([

                        //extract regex arrays
                        function (callbackSeries) {
                            annotator_regex.extractRegexEntities(hits, globalOptions.regexConfig, function (err, result) {
                                if (err)
                                    return callbackSeries(err);
                                annotatedHits = annotatedHits.concat(result);
                                return callbackSeries()
                            })
                        },

                        function (callbackSeries) {
                            var xx = annotatedHits;
                            annotatedHits.forEach(function (hit) {
                                var entities = hit.regexEntities.extracted;
                                entities.forEach(function (entity) {
                                    var str=entity.groups.prefix+"\t"+entity.groups.unit
                                    if (allMeasurementUnits.indexOf(str)<0)
                                        allMeasurementUnits.push(str)
                                })

                            })
                            return callbackSeries();
                        },
                        function (callbackSeries) {
                            return callbackSeries();
                        },
                        function (callbackSeries) {
                            return callbackSeries();
                        },
                    ], function (err) {
                        if (err)
                            return callbackIter(err);
                        count = hits.length;
                        return callbackIter()

                    })

                })


            },
            function (err, n) {
                if (err)
                    return callback(err);
                var xx=allMeasurementUnits;
                return callback(null, "Done")
            }
        );

    }
    , extractRegexEntities: function (hits, regexConfig, callback) {

        var regex = regexConfig.regex
        var annotatedHits = [];
        hits.forEach(function (hit, hitIndex) {
            var array = [];
            var regexEntities = [];
            var str = hit._source[regexConfig.contentField];
            while ((array = regex.exec(str)) != null) {
                if (array.groups.value && (array.groups.prefix || array.groups.unit)) {

                    regexEntities.push({index: array.index, groups: array.groups})
                }

            }
            if (regexEntities.length > 0)
                annotatedHits.push({id: hit._id, index: hit._index, regexEntities: {extracted: regexEntities}});
        })
        return callback(null, annotatedHits)


    }


}


module.exports = annotator_regex;

var options = {

    elasticUrl: "http://localhost:9200/",
    corpusIndex: "gmec_par",
    regexConfig: {
        regex: /(?<value>([\+-]?((\d*\.\d+)|\d+))(E[\+-]?\d+)?)( (?<prefix>[PTGMkmunpf  °])?(?<unit>[a-zA-Z]+)?)?/gm,
        contentField: "attachment.content"
    }
}

/*var str="30 kg 378 psi 53.3 °C"
var array = [];

while ((array = options.regexConfig.regex.exec(str)) != null) {
   var x=array;
}
*/

annotator_regex.annotateCorpus(options, function (err, result) {
    var x = allMeasurementUnits;
})









