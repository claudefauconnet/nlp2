var sparql_abstract = (function () {


    var self = {};

    self.list = function (thesaurus, word, options, callback) {
        $("#messageDiv").html("searching " + thesaurus);
        if (thesaurus == "BNF")
            return sparql_BNF.list(word, options, callback)
        if (thesaurus == "Wikidata")
            return sparql_Wikidata.list(word, options, callback)
        if (thesaurus == "LOC")
            return sparql_LOC.list(word, options, callback)
        if (thesaurus == "termsciences")
            return sparql_termsciences.list(word, options, callback)

        return callback(null, []);
    }

    self.getAncestor = function (thesaurus, id, options, callback) {
        $("#messageDiv").html("searching " + thesaurus);
        if (thesaurus == "BNF")
            return sparql_BNF.getAncestor(id, options, callback)
        if (thesaurus == "Wikidata")
            return sparql_Wikidata.getAncestor(id, options, callback)
        if (thesaurus == "LOC")
            return sparql_LOC.getAncestor(id, options, callback)
        if (thesaurus == "termsciences")
            return sparql_termsciences.getAncestor(id, options, callback)

        return callback(null, []);
    }


    self.getDetails = function (thesaurus, id, options, callback) {
        $("#messageDiv").html("searching " + thesaurus);
        if (thesaurus == "BNF")
            return sparql_BNF.getDetails(id, options, callback)
        if (thesaurus == "Wikidata")
            return sparql_Wikidata.getDetails(id, options, callback)
        if (thesaurus == "LOC")
            return sparql_LOC.getDetails(id, options, callback)
        if (thesaurus == "termsciences")
            return sparql_termsciences.getDetails(id, options, callback)

        return callback(null, []);
    }


    self.getChildren = function (thesaurus, id, options, callback) {
        $("#messageDiv").html("searching " + thesaurus);

        if (thesaurus == "BNF")
            return sparql_BNF.getChildren(id, options, callback)
        if (thesaurus == "Wikidata")
            return sparql_Wikidata.getChildren(id, options, callback)
        if (thesaurus == "LOC")
            return sparql_LOC.getChildren(id, options, callback)
        if (thesaurus == "termsciences")
            return sparql_termsciences.getChildren(id, options, callback)
        callback(null, [])
    }

    self.querySPARQL_GET = function (url, query, queryOptions, callback) {

        $("#waitImg").css("display", "block");
        var url = url + query + queryOptions
        $.ajax({
            type: "GET",
            url: url,
            dataType: "json",

            success: function (data, textStatus, jqXHR) {
                var xx = data;
                $("#messageDiv").html("found : " + data.length);
                $("#waitImg").css("display", "none");
                callback(null, data)

            }
            , error: function (err) {
                $("#messageDiv").html(err.responseText);
                $("#waitImg").css("display", "none");
                console.log(err.responseText)
                if (callback) {
                    return callback(err)
                }
                return (err);
            }

        });
    }

    self.clearMessage = function () {

    }

    self.skosToFlat = function (conceptMap) {

        function recurseAncestors(concept) {
            if (node.parent) {

                if (treeMap[node.parent] && treeMap[node.parent].parent) {
                    node.ancestors.push(treeMap[node.parent].parent);
                    recurseAncestors(treeMap[node.parent].parent)
                }

            }

        }

        for (var key1 in conceptMap) {
            var concept = conceptMap[key1];

            var ancestorsStr = "";
            var ancestorsIdsStr = ""

            //   strAncestors = recurseAncestors(concept.id, "", 0)
                    ancestorsIdsStr = recurseAncestors(concept.id, "", 0)
                    ancestorsIdsStr.split("|").forEach(function (ancestorId2) {
                        ancestorId2.split(",").forEach(function (ancestorId) {
                            var ancestor = conceptMap[ancestorId];
                            if (ancestor && ancestor.prefLabels) {
                                if (ancestorsStr != "")
                                    ancestorsStr += ","
                                if (ancestor.prefLabels[options.outputLangage] && ancestor.prefLabels[options.outputLangage].length > 0) {
                                    ancestorsStr += ancestor.prefLabels[options.outputLangage][0];
                                } else {
                                    var xxx = ancestor
                                    var str = "?"

                                    ancestorsStr += str;

                                }

                            }


                        })
                    })
                }

                if (options.output == 'json') {
                    jsonArray.push({id: concept.id, ancestorsIds: ancestorsIdsStr, ancestors: ancestorsStr, prefLabels: strPrefLabel, altLabels: strAltLabel})

                } else {


                    str += concept.id;

                    if (options.withAncestors) {
                        str += "\t" + ancestorsStr + "\t" + ancestorsIdsStr
                    }
                    str += "\t" + strPrefLabel + "\t" + strAltLabel + "\n"
                }






    }
})


return self;

})
()
