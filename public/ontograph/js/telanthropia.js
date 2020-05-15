 var Telanthropia=(function(){

     var self={};


     self.loadSubjects=function(){

         var query="select distinct * where {\n" +
             "\n" +
             "?sujet  <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://data.telanthropia.org/resource/ontology/PLM/Sujet> .\n" +
             "?sujet skos:prefLabel ?sujetLabel .\n" +
             "}\n" +
             "\n" +
             "ORDER BY ?sujetLabel\n" +
             "\n" +
             " LIMIT 1000"

         var defaultIri="http://telanthropia.org/resource/ontology/PLM/"
         var url = sparql.source.sparql_url + "?default-graph-uri=" + defaultIri + "&query=";// + query + queryOptions
         var queryOptions = "&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=20000&debug=off"
         sparql.querySPARQL_GET_proxy(url, query, queryOptions, null, function (err, result) {
             if (err) {
                 return common.message(err)
             }
           var sujets=[]
             result.results.bindings.forEach(function (item) {
               sujets.push({id:item.sujet.value,label:item.sujetLabel.value})


             })
            common.fillSelectOptions("sujetsSelect",sujets,true,"label","id")
         })

     }




self.getNoticesCoocurrences=function(){


         var query="select distinct * where {\n" +
             "\n" +
             "\n" +
             "?sujet skos:prefLabel ?sujetLabel .\n" +
             "filter (?sujet=<http://data.telanthropia.org/resource/ontology/SujetPLM/1182>)\n" +
             "\n" +
             "\n" +
             "?notice ?subject ?sujet .\n" +
             "\n" +
             "optional{\n" +
             "?notice foaf:Person ?personne.\n" +
             "?personne skos:prefLabel ?personneLabel .\n" +
             "}\n" +
             "}\n" +
             "\n" +
             "ORDER BY ?sujetLabel\n" +
             "\n" +
             " LIMIT 1000"
}






     return self;

 })()
