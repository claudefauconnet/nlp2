var fs=require('fs');
var request=require('request');

var elasticUrl="http://localhost:9200/";
var tulsaComparator={


    matchWithTehesaurus:function(thesaurus){


        var query={
            "query": {
             "match_all":{}
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
            },
            "from": 0,
            "size": 2000,
            "_source":["text","documents.entityOffsets.syn"]

        }
        var options = {
            method: 'POST',
            json: query,
            headers: {
                'content-type': 'application/json'
            },
            url: elasticUrl + thesaurus+"/_search"
        };
        request(options, function (error, response, body) {
            if (error)
                return callback(error);

          var  hits=body.hits.hits;


          hits.forEach(function(hit){
              var str="";
              var thesaurusEntity=hit._source.text;
              var tulsaEntity=""
              if(hit._source.documents ){
                  hit._source.documents.forEach(function(doc) {
                      if (doc.entityOffsets) {

                        doc.entityOffsets.forEach(function (offset) {
                            if(tulsaEntity.indexOf(offset.syn)<0)
                              tulsaEntity+= offset.syn;
                          })
                      }
                  })
          }
              str+=thesaurusEntity+"\t"+tulsaEntity+"\n"
              console.log(str)

          })



        })







    }





}



module.exports=tulsaComparator


tulsaComparator.matchWithTehesaurus("cgi_lithologies")
