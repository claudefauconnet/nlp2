
//https://anjackson.github.io/zombse/062013%20Libraries%20&%20Information%20Science/static/questions/556.html

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

    self.skosToFlat = function (id,concepts,thesaurus) {
        var conceptsMap = {}
        var allItems = [];
        var allUniqueItems = [];

        function recurseAllItems(node) {
            if (allUniqueItems.indexOf(node.id) < 0) {
                allUniqueItems.push(node.id)
                allItems.push(node);
                if (!node.broaders || !Array.isArray(node.broaders)) {
                    node.broaders.forEach(function (broader, indexParent) {
                        recurseAllItems(broader)
                    })
                }
            } else {
                var x = 3
            }
        }

        concepts.forEach(function (item) {
            conceptsMap[item.id] = item;
            recurseAllItems(item)
        })


        function recurseAncestors(node, ancestors, level) {

            if (!node)
                return ancestors;

            ancestors += "|"
            var spaces = ""
            for (var i = 0; i < level; i++) {
                spaces += "_"
            }
            var prefLabel = "?";
            if (node.prefLabels && Array.isArray(node.prefLabels) && node.prefLabels.length > 0)
                prefLabel = node.prefLabels[0].value
            ancestors += spaces + node.id + ";" + prefLabel;
            var level2 = level + 1;
            if (!node.broaders || !Array.isArray(node.broaders))
                return ancestors
            node.broaders.forEach(function (broader, indexParent) {
                var broaderObj = conceptsMap[broader.value];

                ancestors = recurseAncestors(broaderObj, ancestors, level2)
            })
            return ancestors;
        }


        var jsonArray = []
        allItems.forEach(function (item,index) {
         //   if (item.id == id) {
            if(index==0) {
                var ancestors = recurseAncestors(item, "", 1);

                jsonArray.push({id: item.id, ancestors: ancestors, prefLabels: item.name,thesaurus:thesaurus, altLabels: ""})
            }
         //   }


        })


        return jsonArray;

    }


    return self;

})
()
