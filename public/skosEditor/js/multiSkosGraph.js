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


    self.setTheaurusList=function(){
        var html="<ul>"
        thesaurusList.forEach(function(thesaurus){
            if(thesaurus.indexOf("D:\\NLP")>-1) {
                thesaurus = thesaurus.substring(thesaurus.lastIndexOf("\\") + 1)
                thesaurus = thesaurus.substring(0, thesaurus.lastIndexOf("."))
                var thesaurusId = thesaurus.replace(/\s/g, "_");
                if (!colorsMap[thesaurusId])
                    colorsMap[thesaurusId] = palette[Object.keys(colorsMap).length];

                html += "<li><input type='checkbox' checked='checked' class='thesCBX' id='thes_" + thesaurusId + "'><span style='color:" + colorsMap[thesaurusId] + "'>" + thesaurus + "</span></li>"
            }
        })
        html+="</ul>"

        $("#thesaurusListDiv").html(html);
    }

   self.drawConceptGraph=function(word){

       self.queryElastic(word,function(err, result) {
          if(err)
              return console.log(err);
           var hits=result.hits.hits;


           var thesaurusMatching=[]
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






               var path=hit._source.path;
               var nodes=path.split("|");
               var ids=hit._source.pathIds;



               nodes.forEach(function(node,index){
                   var id=ids[index];
                   var thesaurus=hit._source.thesaurus.replace(/\s/g,"_");
                   var color=colorsMap[thesaurus]

                   if(thesaurusMatching.indexOf(thesaurus)<0)
                       thesaurusMatching.push(thesaurus)
                   if(uniqueNodes.indexOf(id)<0) {
                       uniqueNodes.push(id)
                       var color

                       var visjNode = {
                           label: node,
                           id: id,
                           color: color,
                           data:{thesaurus:thesaurus},
                           shape: "box"
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


           //edges transverses
           if(false) {
               visjsData.nodes.forEach(function (node1) {
                   visjsData.nodes.forEach(function (node2) {
                       if (node1.id > node2.id && node1.label.toLowerCase() == node2.label.toLowerCase())
                           visjsData.edges.push({from: node1.id, to: node2.id, color: "grey"})

                   })
               })
           }


           visjsGraph.draw("graphDiv",visjsData,{onclickFn:multiSkosGraph.onNodeClick})

           $(".thesCBX").parent().css("background-color","none")
           $(".thesCBX").parent().css("border","none")
           thesaurusMatching.forEach(function(thesaurus){
               thesaurus="thes_"+thesaurus
               $("#"+thesaurus).parent().css("background-color","#ddd")

           })

       })


   }


   self.onNodeClick=function(obj,point){
       $(".thesCBX").parent().css("border-style","none")
       $("#"+"thes_"+obj.data.thesaurus).parent().css("border","2px blue solid")
   }

   self.onThesCBXChange=function(ev){

        var checked=$(this).prop("checked")
self.filterGraphByThesaurus();

   }





    self.queryElastic=function(queryString,callback){
        var query={

            "query": {
                "bool": {
                    "must": [
                        {
                            "query_string": {
                                "query": queryString,
                                "default_field": "path",
                                "default_operator": "AND"
                            }
                        }
                    ]
                }
            },
            "from": 0,
            "size": 1000,
        }

        var strQuery = JSON.stringify(query,null,2);
        console.log(strQuery)
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
    self.filterGraphByThesaurus=function(){
        var selectedThesaurus=[];
        $(".thesCBX").each(function(){

            if($(this).prop("checked")){
                selectedThesaurus.push($(this).attr("id"))
            }

        })

        var nodesToHide=[]
        var nodes=visjsGraph.data.nodes.get()
        nodes.forEach(function(node){

            if(node.data && selectedThesaurus.indexOf("thes_"+node.data.thesaurus)<0){
                node.hidden=true;
            }else{
                node.hidden=false;
            }
        })

        visjsGraph.data.nodes.update(nodes)





    }




    return self;

})()


