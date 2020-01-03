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
        var allMeasurementUnits = [];
        var docEntities = [];
        var measurementEntities = {};
        var allUnits = []
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
                            annotator_regex.extractRegexEntities(hits, globalOptions, function (err, result) {
                                if (err)
                                    return callbackSeries(err);
                                for (var key in result) {
                                    if (!measurementEntities[key])
                                        measurementEntities[key] = {documents: []}
                                    measurementEntities[key].documents = measurementEntities[key].documents.concat(result[key].documents);
                                }
                                return callbackSeries()
                            })
                        },


                        //normalize values
                        function (callbackSeries) {

                            for (var key in measurementEntities) {
                                var conversion = globalOptions.conversions[key];

                                measurementEntities[key].documents.forEach(function (doc) {

                                    if (conversion && conversion.sources[doc.unit])
                                        doc.normalizedValue = doc.value * conversion.sources[doc.unit]


                                })

                            }
                            return callbackSeries();
                        },

                        // create /update mappings for entity field
                        function (callbackSeries) {
                            if (globalOptions.append)
                                return callbackSeries();
                            var json = {
                                [globalOptions.corpusIndex]: {
                                    "properties": {
                                        ["entities_measurement_units"]: {

                                            "properties": {

                                                id: {type: "keyword"},
                                                offsets: {
                                                    "properties": {
                                                        start: {type: "integer"},
                                                        value: {type: "float"},
                                                        unit: {type: "keyword"},
                                                        normalizedValue: {type: "float"},

                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            var options = {
                                method: 'POST',
                                json: json,
                                headers: {
                                    'content-type': 'application/json'
                                },
                                url: globalOptions.elasticUrl + globalOptions.corpusIndex + "/" + globalOptions.corpusIndex + "/_mappings"
                            };
                            request(options, function (error, response, body) {
                                    if (error)
                                        return callbackSeries(error);
                                    const indexer = require('./indexer..js')
                                    elasticRestProxy.checkBulkQueryResponse(body, function (err, result) {
                                        if (err)
                                            return callbackSeries(err);
                                        var message = "mappings updated "+globalOptions.corpusIndex;
                                        socket.message(message)
                                        return callbackSeries()

                                    })
                                }
                            )


                        },


                        function (callbackSeries) {// set document entities

                            var docEntitiesMap = {}
                            for (var key in measurementEntities) {

                                measurementEntities[key].documents.forEach(function (doc) {
                                    if(!docEntitiesMap[doc.id]){
                                        docEntitiesMap[doc.id]={ id:doc.id, entities:[]}
                                    }
                                    docEntitiesMap[doc.id].entities.push({id:key, offsets:{
                                        start:doc.start,
                                            value:doc.value,
                                            unit:doc.unit,
                                            normalizedValue:doc.normalizedValue
                                        }
                                    })


                                    })


                            }
                            docEntities=[]
                            for(var key in docEntitiesMap){
                                docEntities.push(docEntitiesMap[key])
                            }
                            callbackSeries();
                        },



                        function (callbackSeries) {// update corpus index with entities


                            var ndjsonStr = ""
                            var serialize = ndjson.serialize();
                            serialize.on('data', function (line) {
                                ndjsonStr += line; // line is a line of stringified JSON with a newline delimiter at the end
                            })



                            docEntities.forEach(function (item) {

                               // var queryString = JSON.stringify(item.entities);
                                var elasticQuery = {
                                    "doc": {
                                        ["entities_measurement_units"]: item.entities
                                    }
                                }

                                serialize.write({update: {_id: item.id, _index: globalOptions.corpusIndex, _type: globalOptions.corpusIndex}})
                                serialize.write(elasticQuery)
                            })



                            serialize.end();

                            var options = {
                                method: 'POST',
                                body: ndjsonStr,
                                headers: {
                                    'content-type': 'application/json'
                                },
                                url: globalOptions.elasticUrl + "_bulk"
                            };

                            request(options, function (error, response, body) {
                                    if (error)
                                        return callbackSeries(error);
                                    const indexer = require('./indexer..js')
                                    elasticRestProxy.checkBulkQueryResponse(body, function (err, result) {
                                        if (err)
                                            return callbackSeries(err);
                                        var message = "indexed " + result.length + " records ";
                                        socket.message(message)
                                        return callbackSeries()

                                    })
                                }
                            )
                        }
,

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

                var y = measurementEntities;
                return callback(null, "Done")
            }
        );

    }
    , extractRegexEntities: function (hits, globalOptions, callback) {

        var measurementEntities = {};
        for (var key in globalOptions.measurementUnits) {
            var regexStr = globalOptions.measurementUnits[key];
            var entityHits = {id: key, internal_id: "measurement-" + key, documents: []}
            var regex = new RegExp(regexStr, "gmi");

            hits.forEach(function (hit, hitIndex) {

                var array = [];
                var str = hit._source[globalOptions.contentField];
                if (!str)
                    return;
                while ((array = regex.exec(str)) != null) {
                    if (array.length == 3) {
                        var start = regex.lastIndex - array[0].length
                        var obj = {id: hit._id, value: array[1], unit: array[2], start: start}

                        entityHits.documents.push(obj);

                    }
                }
            })

            measurementEntities[key] = entityHits;

        }
        return callback(null, measurementEntities)


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

const path = require('path');
var measurementUnitsPath = path.resolve("../../config/elastic/regex/measurementUnits.json")
var measurementUnits = fs.readFileSync(measurementUnitsPath)
measurementUnits = JSON.parse("" + measurementUnits)

var options = {

    elasticUrl: "http://localhost:9200/",
    corpusIndex: "gmec_par",
    measurementEntitiesIndex: "measurementEntities",
    measurementUnits: measurementUnits.measurementUnits,
    conversions: measurementUnits.conversions,
    contentField: "text"
}
annotator_regex.annotateCorpus(options, function (err, result) {
    var x = result;
})


//  regex: /(\d*\.?\d+)\s?(µg|dag|dg|kg|g|cg|t|dt|dtn|mg|hg|kt|Mg|lb|gr|oz|ton+)/gmi,
/*   regex: /(\d*\.?\d+)\s?(g\/cm³|t\/m³|g\/ml|kg\/l or kg\/L|g\/l|g\/m³|mg\/m³|Mg\/m³|kg\/dm³|mg\/g|µg\/l|mg\/l|µg\/m³|api|°api|g\/mol+)/gmi,
   regex: /(\d*\.?\d+)\s?(N|MN|kN|mN|µN|dyn|lbf|kgf|kp|ozf|ton.sh-force|lbf\/ft|lbf\/in|N·m²\/kg²|N·m|N\/A|MN·m|kN·m|mN·m|µN·m|dN·m|cN·m|N·cm|N·m\/A|Nm\/°|N·m\/kg|N\/mm|N·m·W⁻⁰‧⁵|kgf·m|in·lb|oz·in|oz·ft|lbf·ft\/A|lbf·in|lbf·ft\/lb|dyn·cm|ozf·in+)/gmi,
   regex: /(\d*\.?\d+)\s?(psi|psia|psig|mPa|MPa|Pa|kPa|bar|hbar|mbar|kbar|atm|GPa|µPa|hPa|daPa|µbar|N\/m²|N\/mm²|hPa\/bar|MPa\/bar|mbar\/bar|Pa\/bar|Pa·s\/bar|hPa·m³\/s|hPa·l\/s|hPa\/K|kPa\/bar|kPa\/K|MPa·m³\/s|MPa·l\/s|MPa\/K|Pa\/bar|Pa·s\/bar|mbar·m³\/s|mbar·l\/s|mbar\/K|Pa·m³\/s|Pa·l\/s|Pa.s\/K|MPa\/K|lb\/ft²|lbf\/in²|kgf\/m²|Torr|at|lb\/in²|cm H₂O|mm H₂O|mm Hg|inHg|inH₂O|cm Hg|ft H₂O|ft Hg|gf\/cm²|kgf\/cm²|kgf·m\/cm²|lbf\/ft²|bar\/bar|psi\/°F|psi\/psi+)/gmi,

   regex: /(\d*\.?\d+)\s?(W|kW|MW|GW|mW|µW|erg\/s|ft·lbf\/s|kgf·m\/s|metric hp|CV|BHP+)/gmi,
   regex: /(\d*\.?\d+)\s?(s|min|h|d|ks|ms|ps|µs|ns|wk|mo|y|year|hours|minute|month|year|second+)/gmi,*/
// regex: /(\d*\.?\d+)\s?(bbl|bbls|Mbbl|cf,Mcf,MMscf,m3+)/gmi,
//  regex: /(\d*\.?\d+)\s?( +)/gmi,
//  regex: /(\d*\.?\d+)\s?( +)/gmi,
// regex: /(\d*\.?\d+)\s?([a-z\/°]{1,6}\d?)/gmi,


/*var str="30 kg 378 psi 53.3 °C"
var array = [];

while ((array = options.regexConfig.regex.exec(str)) != null) {
   var x=array;
}
*/











