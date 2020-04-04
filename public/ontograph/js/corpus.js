var corpus=(function(){
    var self={};


    self.searchResource = function (word) {

        self.sparql_searchResource(word,"document", 2,function (err, result) {
            if (err)
                return common.message(err)

            var jstreeData = [];
            var conceptBroadersMap = {};
            var uniqueIds = []


var uniqueIds=[];
            result.forEach(function (item) {
                var docId=item.resource.value
                var docText=item.resourceLabel.value
                if(uniqueIds.indexOf(docId)<0) {
                    uniqueIds.push(docId);
                    jstreeData.push({id: docId, text: docText, parent: "#"})
                }
                var previousParent=docId
                for(var i=1;i<6;i++){
                var child= item["child"+i]
                    if (typeof child !== "undefined") {
                        var childLabel=item["childLabel"+i]
                        if(uniqueIds.indexOf(child.value)<0) {
                            uniqueIds.push(child.value);
                            jstreeData.push({id: child.value, text: childLabel.value, parent: previousParent})
                        }
                        previousParent=child.value
                    }

                }
            })
            console.log(JSON.stringify(jstreeData,null,2))
          common.loadJsTree("jstreeCorpusDiv",jstreeData)
        })
    }



    self.sparql_searchResource=function(word,type,depth,callback) {
        var typeUri = "<http://data.total.com/resource/ontology/ctg/Document>"
        if (type != "document")
            ;


        var query = "PREFIX skos:<http://www.w3.org/2004/02/skos/core#>" +
            "select *  where{   " +
            "" +
            "?resource skos:prefLabel ?resourceLabel ." +
            "?resource <http://www.w3.org/2004/02/skos/core#inScheme> " + typeUri + " ." +
            " filter contains(lcase(str(?resourceLabel )),\"" + word + "\") " +
            "optional {" +
            "?child1 skos:broader ?resource ." +
            "?child1 skos:prefLabel ?childLabel1 ."

        for (var i = 1; i <= depth; i++) {
            query += "optional {" +
                "?child" + (i + 1) + " skos:broader ?child" + (i) + " ." +
                "?child" + (i + 1) + " skos:prefLabel ?childLabel" + (i + 1) + " ."

        }
        for (var i = 0; i <= depth; i++) {
            query += "}"
        }


        query += " }limit 100"

        var url = sparql.source.sparql_url + "?default-graph-uri=" + encodeURIComponent("http://data.total.com/resource/corpus-description/ctg/") + "&query=";// + query + queryOptions
        var queryOptions = "&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=5000&debug=on"
        sparql.querySPARQL_GET_proxy(url, query, queryOptions, null, function (err, result) {
            if (err) {
                return callback(err);
            }
            var bindings = [];
            var ids = [];
            return callback(null, result.results.bindings);
        })
    }








    return self;



})()
