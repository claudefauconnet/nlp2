var request = require('request')


function search(query, index, callback) {
    var options = {
        method: 'POST',
        url: "http://localhost:9200/" + index + "/_search",
        json: query
    };
    request(options, function (error, response, body) {
        if (error)
            return callback(error);
        if (body.error)
            return callback(body.error);
        var hits = body.hits.hits;
        return callback(null, hits)
    })
}

var query = {

    "query": {
    "bool": {
        "must": [
            {
                "term": {
                    "entities_thesaurus_ctg.id": "Equipment-Turbine"
                }
            },
            {
                "term": {
                    "entities_thesaurus_ctg.id": "Events-Trip"
                }
            }
        ]
    }
},
    "size": 1000,
    "_source": "_id"
}
search(query, "gmec_par", function (err, hits) {
   var  docIds=[];
    hits.forEach(function (hit) {
        docIds.push(hit._id)

    })
    var query = {
        "query": {
            "bool": {
                "should":  [
                    {
                        "term": {
                            "internal_id": "Component-Shaft"
                        }
                    },
                    {
                        "term": {
                            "internal_id": "Characterisation-Current"
                        }
                    }
                ]
            }
        },
        "size": 1000,
       // "_source": "entities_"
    }

    search(query, "thesaurus_ctg", function (err, hits) {
        hits.forEach(function (hit) {
           var entityDocs= hit._source.documents;
           var ok=false
            entityDocs.forEach(function(doc){
                if(docIds.indexOf(doc.id)>-1)
                   ok=true

            })

            if(!ok)
                var x=3

        })

    })
})

