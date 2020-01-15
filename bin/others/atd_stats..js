var request = require("request");


var elasticUrl = "http://localhost:9200/"

var atd_stats = {


    elasticStatsVersement: {

        "query": {
            "range": {
                "dateVersement": {
                    "gte": "now-3y",
                    "lt": "now"
                }
            }
        },
        "size": 0,


        "aggs": {
            "annees": {
                "date_histogram": {
                    "field": "dateVersement",
                    "format": "MM-yyyy",
                    "interval": "year"


                }
                , "aggs": {
                    "metrage": {"sum": {"field": "metrage"}},
                    "nVersements": {"cardinality": {"field": "id"}},
                    "nBoites": {"sum": {"field": "nbBoites"}},
                    "volumeGO": {"sum": {"field": "volumeGO"}},
                    "nbreElements": {"sum": {"field": "nbreElements"}}
                }
            }
        }

    },
    elasticStatsVersementParEtatTraitement: {
        "query": {
            "range": {
                "dateVersement": {
                    "gte": "now-3y",
                    "lt": "now"
                }
            }
        },
        "size": 0,


        "aggs": {
            "annees": {
                "date_histogram": {
                    "field": "dateVersement",
                    "format": "MM-yyyy",
                    "interval": "year"


                },
                "aggs": {
                    "etatTraitement": {
                        "terms": {
                            "field": "etatTraitement"

                        }

                    }
                }
            }
        }

    },

    processVersementStats: function (callback) {

        var options = {
            method: 'POST',
            json: atd_stats.elasticStatsVersement,
            headers: {
                'content-type': 'application/json'
            },
            url: elasticUrl + "bailletarchives/" + "_search"
        };

        request(options, function (error, response, result) {
            if (error) {
                return callback(error)

            }

            var aggregations = result.aggregations;
            var str="annee\tmetrage\tnVersement\tnBoites\tnbreElements\tvolumeGO\n";
            aggregations.annees.buckets.forEach(function (bucket) {
                str+=bucket.key_as_string+"\t"+bucket.metrage.value+"\t"+bucket.nVersements.value+"\t"+bucket.nBoites.value+"\t"+bucket.nbreElements.value+"\t"+bucket.volumeGO.value+"\n"


            })
console.log(str)

            return callback()

        })


    },

    processVersementParEtatVersementStats: function (callback) {

        var options = {
            method: 'POST',
            json: atd_stats.elasticStatsVersementParEtatTraitement,
            headers: {
                'content-type': 'application/json'
            },
            url: elasticUrl + "bailletarchives/" + "_search"
        };

        request(options, function (error, response, result) {
            if (error) {
                return callback(error)

            }

            var aggregations = result.aggregations;
            var str=""
            aggregations.annees.buckets.forEach(function (bucket) {
                bucket.etatTraitement.buckets.forEach(function(etat){
                    str+=bucket.key_as_string+"\t"+etat.key+"\t"+etat.doc_count+"\n"
                })


            })
            console.log(str)

            return callback()

        })


    }


}

module.exports = atd_stats

atd_stats.processVersementParEtatVersementStats(function (err, result) {

})
