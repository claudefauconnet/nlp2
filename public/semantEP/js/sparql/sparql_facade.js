var Sparql_facade=(function(){
   var self={};


   self.proxyUrl="http://51.178.139.80:8890/sparql"

   self.getClasses=function(callback){

       var query="PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>" +
           "prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>" +
           "select   distinct * from <http://sws.ifi.uio.no/data/npd-v2/>  where {?class\trdf:type rdfs:Class.  ?class rdfs:label ?classLabel. filter( not EXISTS {?class <http://www.w3.org/2000/01/rdf-schema#subClassOf> ?d} )} order by ?classLabel limit 1000"

       self.querySPARQL_proxy(query,null,null,null,function(err, result){
           if(err){
               return callback(err);
           }
           return callback(null,result.results.bindings);





       })



   }

   self.searchClasses=function(word, callback){


       var query="PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>" +
           "prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>" +
           "select   distinct * from <http://sws.ifi.uio.no/data/npd-v2/>  where {?class rdf:type rdfs:Class.?class rdfs:label ?classLabel filter  regex(?classLabel, \""+word+"\", \"i\")}"

       self.querySPARQL_proxy(query,null,null,null,function(err, result){
           if(err){
               return callback(err);
           }
           return callback(null,result.results.bindings);





       })


   }
   
   
   self.getOwlClassesAndProperties=function(owlPropType,callback){
       var query="PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>" +
           "prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>" +
           "prefix owl: <http://www.w3.org/2002/07/owl#>" +
           "" +
           "select   distinct * from <http://sws.ifi.uio.no/ontology/npd-v2/>  where {" +
           " ?prop   rdf:type owl:ObjectProperty." +
           "  ?prop rdfs:domain ?domain." +
           "   ?prop rdfs:range ?range." +
           "  " +
           " " +
           "}limit 1000"

       self.querySPARQL_proxy(query,null,null,null,function(err, result){
           if(err){
               return callback(err);
           }
           return callback(null,result.results.bindings);





       })
   }

    self.getOwlSubClasses=function(id,callback){
        var query="PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>" +
            "prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>" +
            "prefix owl: <http://www.w3.org/2002/07/owl#>" +
            "" +
            "select   distinct * from <http://sws.ifi.uio.no/ontology/npd-v2/>  where {" +
            "?subClassId   rdfs:subClassOf <"+id+">."+
            "}limit 1000"

        self.querySPARQL_proxy(query,null,null,null,function(err, result){
            if(err){
                return callback(err);
            }
            return callback(null,result.results.bindings);





        })
    }




    self.querySPARQL_proxy = function  (query,url, queryOptions, options, callback) {
       if(!url){
           url=self.proxyUrl;
       }
       if(!queryOptions) {
           queryOptions = "&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=20000&debug=off"
       }
        if (!options)
            options = {}
        if (!options.doNotEncode) {
            var query2 = encodeURIComponent(query);
            query2 = query2.replace(/%2B/g, "+").trim()
        }



        var body = {
            params: {query: query},
            headers: {
                "Accept": "application/sparql-results+json",
                "Content-Type": "application/x-www-form-urlencoded"
            }
        }


        $("#waitImg").css("display", "block");




        var payload = {
            httpProxy: 1,
            url: url,
            body: body,
            options:queryOptions


        }

        if (options.method && options.method=="GET")
            payload.GET=true;
        else
            payload.POST=true;

        $.ajax({
            type: "POST",
            url: "/elastic",
            data: payload,
            dataType: "json",
            /* beforeSend: function(request) {
                 request.setRequestHeader('Age', '10000');
             },*/

            success: function (data, textStatus, jqXHR) {
                var xx = data;
                //  $("#messageDiv").html("found : " + data.results.bindings.length);
                $("#waitImg").css("display", "none");
                /*  if (data.results.bindings.length == 0)
                      return callback({data.results.bindings:},[])*/
                callback(null, data)

            }
            , error: function (err) {
                $("#messageDiv").html(err.responseText);

                $("#waitImg").css("display", "none");
                console.log(JSON.stringify(err))
                console.log(JSON.stringify(query))
                if (callback) {
                    return callback(err)
                }
                return (err);
            }

        });
    }




   return self;
})()
