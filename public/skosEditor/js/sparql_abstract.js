//https://anjackson.github.io/zombse/062013%20Libraries%20&%20Information%20Science/static/questions/556.html
//https://joernhees.de/blog/2015/11/23/setting-up-a-linked-data-mirror-from-rdf-dumps-dbpedia-2015-04-freebase-wikidata-linkedgeodata-with-virtuoso-7-2-1-and-docker-optional/

//sparql loader virtuoso NT
//isql-vt

//ld_dir ('/etc/virtuosoData/import', '*.*', 'http://www.souslesens.org/thesaurusIngenieur/')
//select * from DB.DBA.load_list;
//rdf_loader_run();



var sparql_abstract = (function () {


    var self = {};
    /**
     *
     *
     * @return [{id,label}]
     *
     */
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
        if (thesaurus == "DBpedia")
            return sparql_DBpedia.list(word, options, callback)

        if (thesaurus == "private")
            return sparql_private.list(word, options, callback)

        return callback(null, []);
    }

    self.getAncestors = function (thesaurus, id, options, callback) {
        $("#messageDiv").html("searching " + thesaurus);
        if (thesaurus == "BNF")
            return sparql_BNF.getAncestors(id, options, callback)
        if (thesaurus == "Wikidata")
            return sparql_Wikidata.getAncestors(id, options, callback)
        if (thesaurus == "LOC")
            return sparql_LOC.getAncestors(id, options, callback)
        if (thesaurus == "termsciences")
            return sparql_termsciences.getAncestors(id, options, callback)
        if (thesaurus == "DBpedia")
            return sparql_DBpedia.getAncestors(id, options, callback)
        if (thesaurus == "private")
            return sparql_private.getAncestors(id, options, callback)

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
        if (thesaurus == "DBpedia")
            return sparql_DBpedia.getDetails(id, options, callback)
        if (thesaurus == "private")
            return sparql_private.getDetails(id, options, callback)

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
        if (thesaurus == "DBpedia")
            return sparql_DBpedia.getChildren(id, options, callback)
        if (thesaurus == "private")
            return sparql_private.getChildren(id, options, callback)
        callback(null, [])
    }

    self.querySPARQL_GET = function (url, query, queryOptions, callback) {

        $("#waitImg").css("display", "block");
        var url = url + query + queryOptions
        $.ajax({
            type: "GET",
            url: url,
            dataType: "json",

            /* beforeSend: function(request) {
                 request.setRequestHeader('Age', '10000');
             },*/

            success: function (data, textStatus, jqXHR) {
                var xx = data;
                $("#messageDiv").html("found : " + data.length);
                $("#waitImg").css("display", "none");
                callback(null, data)

            }
            , error: function (err) {
                $("#messageDiv").html(err.responseText);
                $("#waitImg").css("display", "none");
                console.log(JSON.stringify(err))
                if (callback) {
                    return callback(err)
                }
                return (err);
            }

        });
    }


    self.querySPARQL_JSONP = function (url, query, queryOptions, callback) {
        $("#waitImg").css("display", "block");
        var url = url + query + queryOptions
        $.getJSON(url + "&callback=?", function (result) {
            //response data are now in the result variable
            alert(result);
            var x = result;
        });
    }
    self.querySPARQL_GET_proxy = function (url, query,queryOptions, callback) {

        query=encodeURIComponent(query);
        query=query.replace(/%2B/g,"+")
        url=url+query+queryOptions;
        console.log(url)

        $("#waitImg").css("display", "block");

        var payload = {
            httpProxy: 1,
            url: url,
        }
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
                $("#messageDiv").html("found : " + data.length);
                $("#waitImg").css("display", "none");
                callback(null, data)

            }
            , error: function (err) {
                $("#messageDiv").html(err.responseText);
                $("#waitImg").css("display", "none");
                console.log(JSON.stringify(err))
                if (callback) {
                    return callback(err)
                }
                return (err);
            }

        });
    }


    self.clearMessage = function () {

    }

    self.skosToFlat = function (id, concepts, thesaurus) {
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
        allItems.forEach(function (item, index) {
            //   if (item.id == id) {
            if (index == 0) {
                var ancestors = recurseAncestors(item, "", 1);

                jsonArray.push({id: item.id, ancestors: ancestors, prefLabels: item.name, thesaurus: thesaurus, altLabels: ""})
            }
            //   }


        })


        return jsonArray;

    }
    self.processData_SKOS = function (source,id,bindings) {
        var nLevels = 8;

        var paths = []
        var str2 = "";
        var topNodes = {}
        bindings.forEach(function (binding) {

            for (var level = 0; level < nLevels; level++) {
                var bindingId = id;
                if (!topNodes[bindingId] && level == 0) {
                    var str0 = "|_" + id + ";" +"" ;
                    topNodes[bindingId] = {id:id, name:binding.prefLabel.value, path: str0}
                }
                var str = ""
                var broaderName = "broader" + (level);
                var broaderIdName = "broaderId" + (level);
                if (binding[broaderName]) {
                    var sep = "|"
                    for (var j = 1; j <= level + 1; j++) {
                        sep += "_";
                    }
                    str = sep + binding[broaderIdName].value + ";" + binding[broaderName].value
                    if (topNodes[bindingId].path.indexOf(str) < 0)
                        topNodes[bindingId].path += str
                }
            }
        })
        for (var key in topNodes) {
            var topNode = topNodes[key]
            paths.push({
                "id": topNode.id,
                "prefLabels": topNode.name,
                "altLabels": "",
                "source": source,
                "ancestors": topNode.path
            })
        }

        return paths;


    }


    return self;

})
()
