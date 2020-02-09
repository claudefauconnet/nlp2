var multiSkosGraph=(function(){
    var self={};
    var palette = [
        "#0072d5",
        '#FF7D07',
        "#c00000",
        '#FFD900',
        '#B354B3',
        "#a6f1ff",
        "#007aa4",
        "#584f99",
        "#cd4850",
        "#005d96",
        "#ffc6ff",
        '#007DFF',
        "#ffc36f",
        "#ff6983",
        "#7fef11",
        '#B3B005',
    ]

    var colorsMap={}


   self.drawConceptGraph=function(word){

       self.queryElastic(word,function(err, result) {
          if(err)
              return console.log(err);
           var hits=result.hits.hits;

           var visjsData={nodes:[],edges:[]}
           var uniqueNodes=[]
           var uniqueEdges=[];
           var rooNode={
               label:word,
               id:word,
               color:"#dda",
               size:20

           }
           visjsData.nodes.push(rooNode)
           hits.forEach(function(hit){

               if(!colorsMap[hit._source.thesaurus])
                   colorsMap[hit._source.thesaurus]=palette[Object.keys(colorsMap).length];




               var path=hit._source.path;
               var nodes=path.split("|");
               var ids=hit._source.pathIds;



               nodes.forEach(function(node,index){
                   var id=ids[index];
                   var color=colorsMap[hit._source.thesaurus]
                   if(uniqueNodes.indexOf(id)<0) {
                       uniqueNodes.push(id)
                       var color

                       var visjNode = {
                           label: node,
                           id: id,
                           color: color
                       }
                       visjsData.nodes.push(visjNode)
                   }
                   if(index>0) {

                     var edge=(
                           {
                               from: ids[index - 1],
                               to: id,
                               type: parent
                           }
                       )
                       if(uniqueEdges.indexOf(edge.from+"-"+edge.to)<0) {
                           uniqueEdges.push(edge.from+"-"+edge.to)
                           visjsData.edges.push(edge)
                       }
                   }
                   else{
                       visjsData.edges.push({from:word,to:id})
                   }

               })


           })

           visjsGraph.draw("graphDiv",visjsData,{})

       })


   }





    self.queryElastic=function(queryString,callback){
        var query={

            "query": {
                "bool": {
                    "must": [
                        {
                            "query_string": {
                                "query": queryString,
                                "default_field": "attachment.content",
                                "default_operator": "AND"
                            }
                        }
                    ]
                }
            },
            "from": 0,
            "size": 1000,
        }

        var strQuery = JSON.stringify(query);
        var payload = {
            executeQuery: strQuery,
            indexes: JSON.stringify(["flat_thesaurus"])

        }
        $.ajax({
            type: "POST",
            url:"/elastic",
            data: payload,
            dataType: "json",
            success: function (data, textStatus, jqXHR) {
                var xx = data;
                callback(null, data)

            }
            , error: function (err) {

                console.log(err.responseText)
                if (callback) {
                    return callback(err)
                }
                return (err);
            }

        });



    }




    return self;

})()


