var graphController=(function(){
   var self={} ;


   self.showGraph=function(){
var nodes=[];
var edges=[]


       context.currentHits. forEach(function (hit) {

           var node={
               id:hit._id,
               color:"red",
               label:""+hit._source.docId
           }
           nodes.push(node);

       })

       $("#dialogDiv").html("<div style='width:400px;height: 400px' id='graphDiv'></div>")
       $("#dialogDiv").dialog("open")
       var w=$("#dialogDiv").width()
       var h=$("#dialogDiv").height()
       $("#graphDiv").width(w )
       $("#graphDiv").height( h)

       visjsGraph.draw("graphDiv",{nodes:nodes,edges:[]},)
   }



   return self;



})()
