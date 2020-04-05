var corpus = (function () {
    var self = {};

    self.searchResources = function (word) {
        self.showJstreeResources(word, null,"Document", 1);

    }
    self.showDomainsJstree = function (word) {
        self.showJstreeResources(null, null,"Domain", 2);
    }


    self.showJstreeResources = function (word,id, type, depth, addToNode) {

        self.sparql_searchResource(word,id, type, depth, function (err, result) {
            if (err)
                return common.message(err)

            var jstreeData = [];
            var conceptBroadersMap = {};
            var uniqueIds = []


            var uniqueIds = [];
            result.forEach(function (item) {
                if (addToNode) {
                    var previousParent =  item.resource.value
                    for (var i = 1; i < 6; i++) {
                        var child = item["child" + i]
                        if (typeof child !== "undefined") {
                            var childLabel = item["childLabel" + i]
                            if (uniqueIds.indexOf(child.value) < 0) {
                                uniqueIds.push(child.value);
                                jstreeData.push({id: child.value, text: childLabel.value, parent: previousParent})
                            }
                            previousParent = child.value
                        }

                    }

                } else {
                    var docId = item.resource.value
                    var docText = item.resourceLabel.value
                    var parent = "#";
                    if (uniqueIds.indexOf(docId) < 0) {
                        uniqueIds.push(docId);
                        jstreeData.push({id: docId, text: docText, parent: parent})
                    }

                    var previousParent = docId
                    for (var i = 1; i < 6; i++) {
                        var child = item["child" + i]
                        if (typeof child !== "undefined") {
                            var childLabel = item["childLabel" + i]
                            if (uniqueIds.indexOf(child.value) < 0) {
                                uniqueIds.push(child.value);
                                jstreeData.push({id: child.value, text: childLabel.value, parent: previousParent})
                            }
                            previousParent = child.value
                        }

                    }
                }
            })
            //  console.log(JSON.stringify(jstreeData, null, 2))
            if (addToNode) {
                jstreeData.forEach(function (node) {
                    $("#jstreeCorpusDiv").jstree(true).create_node(addToNode,node,"last",function(){
                      //  $("#jstreeCorpusDiv").jstree(true).open_node(node.id,null,false);
                        $("#jstreeCorpusDiv").jstree(true).open_all();
                     //   $("#jstreeCorpusDiv").jstree(true).uncheck_all ();

                        $(".jstree-themeicon").css("display","none")
                        $(".jstree-anchor").css("line-height","18px")
                        $(".jstree-anchor").css("height","18px")
                        $(".jstree-anchor").css("font-size","14px")

                    })

                })

            } else {
                common.loadJsTree("jstreeCorpusDiv", jstreeData,
                    {
                        selectNodeFn: function (evt, obj) {

                            corpus.onJstreeSelectNode(evt, obj)
                        }
                    })
            }
        })
    }


    self.sparql_searchResource = function (word,id, type, depth, callback) {
        var typeUri = "<http://data.total.com/resource/ontology/ctg/" + type + ">"


        var query = "PREFIX skos:<http://www.w3.org/2004/02/skos/core#>" +
            "select *  where{   " +
            "" +
            "?resource skos:prefLabel ?resourceLabel ."
        if (type) {
            query += "?resource <http://www.w3.org/2004/02/skos/core#inScheme> <http://data.total.com/resource/ontology/ctg/" + type + ">"
        }
        if (word) {
            query += " FILTER contains(lcase(str(?resourceLabel )),\"" + word.toLowerCase() + "\") "
        }
        if (id) {
            query += " FILTER (?resource=<"+id+">) "
        }
        if(depth>0) {


            for (var i = 0; i < depth; i++) {
                if(i==0){
                    query += "OPTIONAL {" +
                        "?child1 skos:broader ?resource ." +
                        "?child1 skos:prefLabel ?childLabel1 ."

                }
                else {
                    query += "optional {" +
                        "?child" + (i + 1) + " skos:broader ?child" + (i) + " ." +
                        "?child" + (i + 1) + " skos:prefLabel ?childLabel" + (i + 1) + " ."
                }

            }
            for (var i = 0; i < depth; i++) {
                query += "}"
            }
        }


        query += " }limit 2000"

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

    self.onJstreeSelectNode = function (evt, obj) {

        var node = obj.node
        if(node.children.length>0)
            return;
        var childType = "";
        if (node.id.indexOf("/Domain/") > -1)
            childType = "Branch"
        if (node.id.indexOf("/Branch/") > -1)
            childType = "Document-type"
        if (node.id.indexOf("/Document-type/") > -1)
            childType = "Document";
        if (node.id.indexOf("/Document/") > -1)
            childType = "Chapter";
        if (node.id.indexOf("/Chapter/") > -1)
            childType = "Paragraph";
        self.showJstreeResources  (null,  node.id,null, 1, node.id)

    }


    return self;


})()
