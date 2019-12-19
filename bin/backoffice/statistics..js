
const request=require('request');
const elasticRestProxy=require('../elasticRestProxy..js')
var ml = require('machine_learning');
var async=require('async')
var statistics={

    getQueryEntityBuckets:function(thesaurus,query,callback) {
        var aggrQuery = {
            "query": {
                "bool": {
                    "must": [
                        query
                       ]
                }
            },
            "aggregations": {

                ["entities_"+thesaurus]: {"terms": {"field": "entities_"+thesaurus, "size": 50, "order": {"_count": "desc"}}}

            }
        }
        elasticRestProxy.executePostQuery("gmec_par/_search",aggrQuery,function(err, result){
            var buckets= result.aggregations["entities_"+thesaurus].buckets;
            callback(null,buckets)
        })




    }
    ,getDocClusterByEntitites:function(query,nClusters,callback){
        statistics.getQueryEntityBuckets("thesaurus_ctg",query,function(err, buckets){
            if( err)
                return console.log(err);
            var size=50;
            var topEntities=buckets.slice(0,size);


            var entityIds=[];
            topEntities.forEach(function(bucket){
                entityIds.push(bucket.key)
            })
            var query={query:{
                    terms:{internal_id:entityIds}
                },
                size:1000,
                _source:["internal_id","documents"]
            }
            elasticRestProxy.executePostQuery("thesaurus_ctg/_search",query,function(err, result) {
                if(err)
                    return  callback(err);
                var allDocIdsMap={};
                var allEntities=[];
                result.hits.hits.forEach(function(hit){
                    var entityName=hit._source.internal_id;
                    if(allEntities.indexOf(entityName)<0)
                        allEntities.push(entityName)
                    hit._source.documents.forEach(function(doc){
                        if(!allDocIdsMap[doc.id])
                            allDocIdsMap[doc.id]={};
                        allDocIdsMap[doc.id][entityName]=doc
                    })



                })



                var data=[];
                var labels=[];
                var docIds=Object.keys(allDocIdsMap);
                docIds.forEach(function(id){
                    var doc= allDocIdsMap[id];
                    var row=[]
                    allEntities.forEach(function(entity){
                        if(doc[entity])
                            row.push(doc[entity].score);
                        else
                            row.push(0)


                    })
                    data.push(row)
                })

                //  console.log(JSON.stringify(data,null,2))
                var result = ml.kmeans.cluster({
                    data : data,
                    k : nClusters,
                    epochs: 100,

                    distance : {type : "pearson"}
                    // default : {type : 'euclidean'}
                    // {type : 'pearson'}
                    // Or you can use your own distance function
                    // distance : function(vecx, vecy) {return Math.abs(dot(vecx,vecy));}
                });

                var clustersDocIds=[];
                result.clusters.forEach(function(cluster){
                    var row=[];
                  cluster.forEach(function(row2){
                      row.push(docIds[row2])
                  })
                    clustersDocIds.push(row)
                })

            /*    console.log("clusters : ", result.clusters);
                console.log("means : ", result.means);*/
                var obj={
                    clusters:clustersDocIds,
                    means:result.means,
                    entities:allEntities,
                    docIds:docIds

                }
                return callback(null,obj)

            })

        })
    }




}

module.exports=statistics;
var query= {
    "match_all": {}
};
var query= {
    "query_string": {
        "query": "valve",
        "default_field": "attachment.content",
        "default_operator": "AND"
    }
}

statistics.getDocClusterByEntitites(query,4,function(err,result){
    var x=result;
    var i=0
    async.eachSeries(result.clusters,function(cluster,callbackEach) {
        i++;
        var query = {
            query:
                {
                    "terms": {_id: cluster}
                }
            , _source: "",
            aggregations:[{"entities_": {"terms": {"field": "entities_thesaurus_ctg" , "size": 30, "order": {"_count": "desc"}}}}],
            size: 0
        }
        console.log("------------------------------cluster "+i+"-----------------------------------------")
        elasticRestProxy.executePostQuery("gmec_par/_search",query,function(err, result){
            var str=""
            result.aggregations.forEach(function(bucket){
              str+=bucket.key+"("+bucket.doc_count+");"
            })
            console.log(str)

callbackEach()
        })
    })




})

