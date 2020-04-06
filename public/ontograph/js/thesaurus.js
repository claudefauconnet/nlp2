var thesaurus = (function () {
    var self = {}


    var rootUris = {}

    self.searchConcept = function (word) {

        sparql.listThesaurusConcepts(word, {}, function (err, result) {

            if (err)
                return common.message(err)

            var jstreeData = [];
            var conceptBroadersMap = {};
            var uniqueIds = []

            result.forEach(function (item) {
                var id = item.concept.value;
                for (var i = 1; i < 5; i++) {
                    var broader = item["broader" + i];
                    if (broader) {
                        broader = broader.value


                        var node = {id: broader, text: item["broaderLabel" + i].value};
                        var broader2 = null;
                        broader2 = item["broader" + (i + 1)]
                        if (typeof broader2 === "undefined") {
                            node.parent = broader.substring(0, broader.lastIndexOf("/"));
                            var topNode = {id: node.parent, parent: "#", text: node.parent.substring(node.parent.lastIndexOf("/") + 1)}
                            conceptBroadersMap[topNode.id] = topNode;

                        } else {
                            node.parent = broader2.value;
                        }

                        conceptBroadersMap[broader] = node;
                    }
                }

            })

            for (var id in conceptBroadersMap) {
                var item = conceptBroadersMap[id];
                if (uniqueIds.indexOf(id) < 0) {
                    uniqueIds.push(id)
                    jstreeData.push(item)
                }

            }
            result.forEach(function (item) {
                var id = item.concept.value;
                if (uniqueIds.indexOf(id) < 0) {
                    uniqueIds.push(id)
                    var node = {id: id, text: item.prefLabel.value}
                    if (conceptBroadersMap[item.broader1.value]) {
                        node.parent = item.broader1.value;
                        jstreeData.push(node)
                    }

                }

            })


            //  console.log(JSON.stringify(jstreeData,null,2))
            common.loadJsTree("jstreeConceptDiv", jstreeData, {withCheckboxes: 1, selectDescendants: 1})


        })
    }
    self.loadThesaurusTopConceptsTree = function () {

        var url = sparql.source.sparql_url + "?default-graph-uri=http://data.total.com/resource/thesaurus/ctg/&query=";// + query + queryOptions
        var query = "PREFIX terms:<http://purl.org/dc/terms/>PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#>PREFIX rdfsyn:<https://www.w3.org/1999/02/22-rdf-syntax-ns#>PREFIX skos:<http://www.w3.org/2004/02/skos/core#>" +

            "select distinct * " +
            "where{" +

            "?concept skos:topConceptOf ?scheme." +
            "?concept skos:prefLabel ?concepLabel." +
            "} limit 100"
        var queryOptions = "&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=5000&debug=on"
        sparql.querySPARQL_GET_proxy(url, query, queryOptions, null, function (err, result) {
            if (err) {
                return common.message(err)
            }

            var jstreeData = [];
            var uniqueIds = []
            result.results.bindings.forEach(function (item) {

                if (uniqueIds.indexOf(item.scheme.value) < 0) {
                    uniqueIds.push(item.scheme.value);
                    var schemeLabel = item.scheme.value
                    schemeLabel = schemeLabel.substring(0, schemeLabel.length - 1)
                    schemeLabel = schemeLabel.substring(schemeLabel.lastIndexOf("/") + 1)
                    jstreeData.push({text: schemeLabel, id: item.scheme.value, parent: "#"})
                }
                if (uniqueIds.indexOf(item.concept.value) < 0) {
                    uniqueIds.push(item.concept.value);
                    jstreeData.push({text: item.concepLabel.value, id: item.concept.value, parent: item.scheme.value})
                }
            })
            common.loadJsTree("jstreeConceptDiv", jstreeData, {
                withCheckboxes: 1, selectDescendants: 1, selectNodeFn: function (evt, obj) {
                    thesaurus.onNodeSelect(evt, obj);
                }
            })

        });


    }

    self.loadChildrenInConceptJstree = function (conceptId) {

        var url = sparql.source.sparql_url + "?default-graph-uri=http://data.total.com/resource/thesaurus/ctg/&query=";// + query + queryOptions
        var query = "PREFIX terms:<http://purl.org/dc/terms/>PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#>PREFIX rdfsyn:<https://www.w3.org/1999/02/22-rdf-syntax-ns#>PREFIX skos:<http://www.w3.org/2004/02/skos/core#>" +

            "select distinct *" +
            "where{ ?child1 skos:broader ?concept."
            +" filter (?concept=<"+conceptId+">) "
            +"?child1 skos:prefLabel ?childLabel1 ."


        for (var i = 1; i < 7; i++) {

                query += "OPTIONAL { ?child" + i + " skos:broader ?child" + (i + 1) + "."
            "?child" + (i + 1) + " skos:prefLabel ?childLabel" + (i + 1) + "." +
            "filter( lang(?childLabel" + (i + 1) + ")=\"en\")"
        }
        for (var i = 1; i < 7; i++) {
            query += "}"
        }
        query += "}limit 1000"
        var queryOptions = "&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=5000&debug=on"
        sparql.querySPARQL_GET_proxy(url, query, queryOptions, null, function (err, result) {
            if (err) {
                return common.message(err)
            }

            var jstreeData = [];
            var uniqueIds = []
            result.results.bindings.forEach(function (item) {

              for( var i=1;i<7;i++) {
                  var concept=item["concept"+i]
                  if(concept) {
                      if (uniqueIds.indexOf(concept.value) < 0) {
                          uniqueIds.push(concept.value);
                          jstreeData.push({text: item["conceptLabel"+i].value, id: concept.value, parent: item.scheme.value})
                      }
                  }
              }
            })
            common.loadJsTree("jstreeConceptDiv", jstreeData, {
                withCheckboxes: 1, selectDescendants: 1, selectNodeFn: function (evt, obj) {
                    thesaurus.onNodeSelect(evt, obj);
                }
            })

        });


    }

    self.onNodeSelect = function (evt, obj) {
        var node = obj.node
        if (node.children.length > 0)
            return;
        self.loadChildrenInConceptJstree(obj.node.id)

    }


    return self;

})()
