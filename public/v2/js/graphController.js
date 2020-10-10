var GraphController=(function(){

 var self={};


 self.drawOrUpdateGraph=function(data,parentNodeId,fromVar,toVar,fromShape,toShape,visjOptions,callback){

     var visjsData = {nodes: [], edges: []};
     var existingNodes = {}
     var existingEdges = {};
     if( parentNodeId ){
        visjsGraph.data.nodes.getIds().forEach(function(id){
             existingNodes[id]=id
         });
        visjsGraph.data.edges.getIds().forEach(function(id){
            existingEdges[id]=id
        });

     }

     data.forEach(function (item) {

         if(!parentNodeId ) {
             var fromId=""
             var fromLabel = "";

             if(fromVar=="#" ){
                 fromId="#"
                 fromLabel="#"
             }else{

                 fromId = item[fromVar].value
                 fromLabel=item[fromVar + "Label"].value;
             }


             if (!existingNodes[fromId]) {
                 existingNodes[fromLabel] = 1;
                 var node = {
                     id: fromId,
                     label: fromLabel,
                     shape: fromShape || "dot",
                 }
                 visjsData.nodes.push(node)
             }
         }

         if(toVar && item[toVar]) {
             var toId = item[toVar].value || "#";
             var toLabel = item[toVar + "Label"].value;

             if ( !existingNodes[item[toVar].value]) {
                 existingNodes[item[toVar].value] = 1;

                 var node = {
                     id: toId,
                     label: toLabel,
                     shape: toShape || "dot",
                 }
                 visjsData.nodes.push(node);
             }

             var edgeId = fromId + "_" + toId;
             if (!existingEdges[edgeId]) {
                 existingEdges[edgeId] = 1
                 var edge = {
                     id: edgeId,
                     from: fromId,
                     to: toId
                 }
                 visjsData.edges.push(edge);

             }
         }



     })

     if( parentNodeId && parentNodeId!="#"){

         visjsGraph.data.nodes.add(self.context.newNodes)
         visjsGraph.data.edges.add(self.context.newEdges)
     }
     else {
         visjsGraph.draw("graphDiv", visjsData,visjOptions)
     }




 }










 return self;

})();
