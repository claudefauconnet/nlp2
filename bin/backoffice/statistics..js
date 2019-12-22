//d3-hierarchy
const request = require('request');
const elasticRestProxy = require('../elasticRestProxy..js')
var ml = require('machine_learning');
var fs=require("fs");
var async = require('async')
var statistics = {


    getEntitiesMatrix: function (thesaurus, query, callback) {
        if(!thesaurus)
            thesaurus="thesaurus_ctg";
        if(!query)
            query={
                "match_all": {}
            };
        var aggrQuery = {
            "query": {
                "bool": {
                    "must": [
                        query
                    ]
                }
            },
            "_source": "documents",
            "size": 0,
            "aggs": {
                "entities_": {
                    "terms": {
                        "field": "internal_id",
                        size: 5000,
                    },

                    "aggregations": {
                        "docs_": {
                            "terms": {
                                "field": "documents.id",
                                "order": {
                                    "_count": "desc",

                                },
                                size: 5000
                            }
                        }
                    }
                }
            }
        }
        var allDocs = [];

        elasticRestProxy.executePostQuery(thesaurus + "/_search", aggrQuery, function (err, result) {

            if(err)
                return callback(err);
            var buckets = result.aggregations["entities_"].buckets;
            var entities = {}
            buckets.forEach(function (bucketEntity, indexEntity) {
                entities[bucketEntity.key] = {docs: [], relatedEntities: {}};
                bucketEntity.docs_.buckets.forEach(function (bucketDoc, indexDoc) {
                    entities[bucketEntity.key].docs.push(bucketDoc.key);
                    if (allDocs.indexOf(bucketDoc.key) < 0)
                        allDocs.push(bucketDoc.key);
                })
            })

            var allValidEntities = [];
            for (var key in entities) {
                var x = [];
                entities[key].docs.forEach(function (doc) {
                    for (var key2 in entities) {

                        if (entities[key2].docs.indexOf(doc) > -1) {
                            if (allValidEntities.indexOf(key) < 0)
                                allValidEntities.push(key)
                            if (key != key2) {
                                if (!entities[key].relatedEntities[key2])
                                    entities[key].relatedEntities[key2] = 1
                                else
                                    entities[key].relatedEntities[key2] += 1
                            }
                            else{
                                entities[key].relatedEntities[key] = 1
                            }

                        }
                    }

                })
            }
            allValidEntities.sort();

            var max=0;
            var X = []
            var labels = []
            allValidEntities.forEach(function (key) {
                labels.push(key)
                var x = [];
                allValidEntities.forEach(function (key2) {
                    var count = 0;
                    if (entities[key].relatedEntities[key2])
                        if(key.indexOf(key2)<0 && key2.indexOf(key) <0)// to avoid entities having parent synonyms included in child (ex :Component-ProtectionSytem)
                        count = entities[key].relatedEntities[key2];

                    x.push(count);
                    max=Math.max(max,count)
                })
                X.push(x);
            })
            callback(null, {labels: labels, data: X,max:max})

        })


    },


    getQueryEntityBuckets: function (thesaurus, query, callback) {
        var aggrQuery = {
            "query": {
                "bool": {
                    "must": [
                        query
                    ]
                }
            },
            "aggregations": {

                ["entities_" + thesaurus]: {"terms": {"field": "entities_" + thesaurus, "size": 50, "order": {"_count": "desc"}}}

            }
        }
        elasticRestProxy.executePostQuery("gmec_par/_search", aggrQuery, function (err, result) {
            var buckets = result.aggregations["entities_" + thesaurus].buckets;
            callback(null, buckets)
        })


    }
    ,
    getQueryDocBuckets: function (thesaurus, query, callback) {
        var aggrQuery = {
            "query": {
                "bool": {
                    "must": [
                        query
                    ]
                }
            },
            "aggregations": {

                ["docs_"]: {"terms": {"field": "documents", "size": 5000, "order": {"_count": "desc"}}}

            }
        }
        console.log(JSON.stringify(aggrQuery, null, 2));
        elasticRestProxy.executePostQuery(thesaurus + "/_search", aggrQuery, function (err, result) {
            var buckets = result.aggregations["docs_"].buckets;
            callback(null, buckets)
        })


    }
    , getDocClusterByEntitites: function (query, nClusters, callback) {
        statistics.getQueryEntityBuckets("thesaurus_ctg", query, function (err, buckets) {
            if (err)
                return console.log(err);
            var size = 50;
            var topEntities = buckets.slice(0, size);


            var entityIds = [];
            topEntities.forEach(function (bucket) {
                entityIds.push(bucket.key)
            })
            var query = {
                query: {
                    terms: {internal_id: entityIds}
                },
                size: 1000,
                _source: ["internal_id", "documents"]
            }
            elasticRestProxy.executePostQuery("thesaurus_ctg/_search", query, function (err, result) {
                if (err)
                    return callback(err);
                var allDocIdsMap = {};
                var allEntities = [];
                result.hits.hits.forEach(function (hit) {
                    var entityName = hit._source.internal_id;
                    if (allEntities.indexOf(entityName) < 0)
                        allEntities.push(entityName)
                    hit._source.documents.forEach(function (doc) {
                        if (!allDocIdsMap[doc.id])
                            allDocIdsMap[doc.id] = {};
                        allDocIdsMap[doc.id][entityName] = doc
                    })


                })


                var data = [];
                var labels = [];
                var docIds = Object.keys(allDocIdsMap);
                docIds.forEach(function (id) {
                    var doc = allDocIdsMap[id];
                    var row = []
                    allEntities.forEach(function (entity) {
                        if (doc[entity])
                            row.push(doc[entity].score);
                        else
                            row.push(0)


                    })
                    data.push(row)
                })

                //  console.log(JSON.stringify(data,null,2))
                var result = ml.kmeans.cluster({
                    data: data,
                    k: nClusters,
                    epochs: 100,

                    distance: {type: "pearson"}
                    // default : {type : 'euclidean'}
                    // {type : 'pearson'}
                    // Or you can use your own distance function
                    // distance : function(vecx, vecy) {return Math.abs(dot(vecx,vecy));}
                });

                var clustersDocIds = [];
                result.clusters.forEach(function (cluster) {
                    var row = [];
                    cluster.forEach(function (row2) {
                        row.push(docIds[row2])
                    })
                    clustersDocIds.push(row)
                })

                /*    console.log("clusters : ", result.clusters);
                    console.log("means : ", result.means);*/
                var obj = {
                    clusters: clustersDocIds,
                    means: result.means,
                    entities: allEntities,
                    docIds: docIds

                }
                return callback(null, obj)

            })

        })
    }


}

module.exports = statistics;
var query = {
    "match_all": {}
};
var query = {
    "query_string": {
        "query": "valve",
        "default_field": "attachment.content",
        "default_operator": "AND"
    }
}


if (false) {
    statistics.getDocClusterByEntitites(query, 4, function (err, result) {
        var x = result;
        var i = 0
        async.eachSeries(result.clusters, function (cluster, callbackEach) {
            i++;
            var query = {
                query:
                    {
                        "terms": {_id: cluster}
                    }
                , _source: "",
                aggregations: {"entities_": {"terms": {"field": "entities_thesaurus_ctg", "size": 30, "order": {"_count": "desc"}}}},
                size: 0
            }
            console.log("------------------------------cluster " + i + "-----------------------------------------")
            elasticRestProxy.executePostQuery("gmec_par/_search", query, function (err, result) {
                var str = ""
                result.aggregations.entities_.buckets.forEach(function (bucket) {
                    str += bucket.key + "(" + bucket.doc_count + ");"
                })
                console.log(str)
                callbackEach()

            })
        })
    })
}

if (false) {

    var query = {
        "match_all": {}
    };
    statistics.getEntitiesMatrix("thesaurus_ctg", query, function (err, result) {

        fs.writeFileSync("D:\\NLP\\heatMap.json",JSON.stringify(result));
    })


}




