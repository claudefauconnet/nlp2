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
                            var topNode = {id: node.parent, parent: "#", text: node.parent.substring(node.parent.lastIndexOf("/")+1)}
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
            common.loadJsTree("jstreeConceptDiv",jstreeData)


        })
    }


    return self;

})()
