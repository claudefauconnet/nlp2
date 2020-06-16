//https://anjackson.github.io/zombse/062013%20Libraries%20&%20Information%20Science/static/questions/556.html
//https://joernhees.de/blog/2015/11/23/setting-up-a-linked-data-mirror-from-rdf-dumps-dbpedia-2015-04-freebase-wikidata-linkedgeodata-with-virtuoso-7-2-1-and-docker-optional/

//sparql loader virtuoso NT
//isql-vt

//ld_dir ('/etc/virtuosoData/import', '*.*', 'http://www.souslesens.org/thesaurusIngenieur/')
//select * from DB.DBA.load_list;
//rdf_loader_run();

//https://babelnet.org/home ClaudeFauconnet Sol2#mineur

/*

SELECT DISTINCT ?g
WHERE {
  GRAPH ?g { ?s ?p ?o }
}
 */


var sparql_abstract = (function () {
    var self = {};
    self.rdfsMap = {}
    self.initSources = function (all) {



        var userGroups = authentication.currentUser.groupes;
        if (all || userGroups.indexOf("admin") > -1 || userGroups.indexOf("CTG") > -1) {
            self.rdfsMap['Total-CTG'] = {sparql_url: 'http://vps475829.ovh.net:8890/sparql', graphIRI: 'http://data.total.com/resource/thesaurus/ctg/', sparqlBuilder: "sparql_skos_generic"};
            self.rdfsMap['Oil&Gas-Upstream'] = {sparql_url: 'http://vps475829.ovh.net:8890/sparql', graphIRI: 'http://souslesens.org/oil-gas/upstream/', sparqlBuilder: "sparql_skos_generic"};
        }



        self.rdfsMap['BNF']={sparql_url: 'https://data.bnf.fr/sparql', graphIRI: 'http://data.bnf.fr', sparqlBuilder: "sparql_skos_generic"};
        self.rdfsMap['Dbpedia']={sparql_url: 'http://dbpedia.org/sparql', graphIRI: 'http://dbpedia.org', sparqlBuilder: "sparql_skos_generic"};


        //    'Oil&Gas-Upstream': {sparql_url: 'http://vps475829.ovh.net:8890/sparql', graphIRI: 'http://souslesens.org/oil-gas/upstream/', sparqlBuilder: "sparql_skos_generic"},
        self.rdfsMap['TermSciences']= {sparql_url: 'http://vps475829.ovh.net:8890/sparql', graphIRI: 'http://api.termsciences.fr/termsciences/', sparqlBuilder: "sparql_skos_generic"};
        self.rdfsMap['ThesaurusIngenieur']= {sparql_url: 'http://vps475829.ovh.net:8890/sparql', graphIRI: 'http://www.souslesens.org/thesaurusIngenieur/', sparqlBuilder: "sparql_skos_generic"};
        self.rdfsMap['Unesco']={sparql_url: 'http://vps475829.ovh.net:8890/sparql', graphIRI: 'http://skos.um.es/unesco6/', sparqlBuilder: "sparql_skos_generic"};
        self.rdfsMap['LibraryOfCongress']= {sparql_url: 'http://vps475829.ovh.net:8890/sparql', graphIRI: 'http://www.loc.gov/', sparqlBuilder: "sparql_skos_generic"};

        self.rdfsMap['Wikidata']= {sparql_url: 'https://query.wikidata.org/', graphIRI: 'http://skos.um.es/unesco6/', sparqlBuilder: "sparql_Wikidata"};
        self.rdfsMap['Microsoft-accademic']= {sparql_url: 'http://ma-graph.org/sparql/', graphIRI: '', sparqlBuilder: "sparql_microsoft-accademic"};
        self.rdfsMap['BabelNet']= {sparql_url: 'https://babelnet.org/sparql/', graphIRI: '', sparqlBuilder: "sparql_babelNet"};


        }



  /*   self.rdfsMap = {
            //  'Microsoft-accademic': {sparql_url: 'http://ma-graph.org/sparql/', graphIRI: '', sparqlBuilder: "sparql_microsoft-accademic"},
            'LibraryOfCongress': {sparql_url: 'http://vps475829.ovh.net:8890/sparql', graphIRI: 'http://www.loc.gov/', sparqlBuilder: "sparql_skos_generic"},
        // 'TermSciences': {sparql_url: 'http://vps475829.ovh.net:8890/sparql', graphIRI: 'http://api.termsciences.fr/termsciences/', sparqlBuilder: "sparql_skos_generic"},
       //  'Oil&Gas-Upstream': {sparql_url: 'http://vps475829.ovh.net:8890/sparql', graphIRI: 'http://souslesens.org/oil-gas/upstream/', sparqlBuilder: "sparql_skos_generic"},
        }*/




    /**
     *
     *
     * @return [{id,label}]
     *
     */
    self.list = function (sourceName, word, options, callback) {
        var source = self.rdfsMap[sourceName]
        var sparqlBuilder = source.sparqlBuilder


        $("#messageDiv").html("searching " + sourceName);
        if (sparqlBuilder == "sparql_skos_generic")
            return sparql_skos_generic.list(source, word, options, callback)


        if (sparqlBuilder == "sparql_Wikidata")
            return sparql_Wikidata.list(source, word, options, callback)

        if (sparqlBuilder == "sparql_microsoft-accademic")
            return sparql_microsoft_accademic.list(source, word, options, callback)

        if (sparqlBuilder == "sparql_babelNet")
            return sparql_babelNet.list(source, word, options, callback)


        return callback(null, []);
    }

    self.getAncestors = function (sourceName, id, options, callback) {

        var source = self.rdfsMap[sourceName]
        var sparqlBuilder = source.sparqlBuilder

        $("#messageDiv").html("searching " + sourceName);
        if (sparqlBuilder == "sparql_skos_generic")
            return sparql_skos_generic.getAncestors(source, id, options, callback)

        if (sparqlBuilder == "sparql_Wikidata")
            return sparql_Wikidata.getAncestors(source, id, options, callback)

        if (sparqlBuilder == "sparql_microsoft-accademic")
            return sparql_microsoft_accademic.getAncestors(source, id, options, callback)
        return callback(null, []);
        if (sparqlBuilder == "sparql_babelNet")
            return sparql_babelNet.getAncestors(source, id, options, callback)
    }


    self.getDetails = function (sourceName, id, options, callback) {
        $("#messageDiv").html("searching " + sourceName);
        var source = self.rdfsMap[sourceName]
        var sparqlBuilder = source.sparqlBuilder

        $("#messageDiv").html("searching " + sourceName);
        if (sparqlBuilder == "sparql_skos_generic")
            return sparql_skos_generic.getDetails(source, id, options, callback)

        if (sparqlBuilder == "sparql_Wikidata")
            return sparql_Wikidata.getDetails(source, id, options, callback)

        if (sparqlBuilder == "sparql_microsoft-accademic")
            return sparql_microsoft_accademic.getDetails(source, id, options, callback)
        if (sparqlBuilder == "sparql_babelNet")
            return sparql_babelNet.getDetails(source, id, options, callback)

        return callback(null, []);
    }


    self.getChildren = function (sourceName, id, options, callback) {
        $("#messageDiv").html("searching " + sourceName);
        var source = self.rdfsMap[sourceName]
        var sparqlBuilder = source.sparqlBuilder

        $("#messageDiv").html("searching " + sourceName);
        if (sparqlBuilder == "sparql_skos_generic")
            return sparql_skos_generic.getChildren(source, id, options, callback)

        if (sparqlBuilder == "sparql_Wikidata")
            return sparql_Wikidata.getChildren(source, id, options, callback)

        if (sparqlBuilder == "sparql_microsoft-accademic")
            return sparql_microsoft_accademic.getChildren(source, id, options, callback)
        if (sparqlBuilder == "sparql_babelNet")
            return sparql_babelNet.getChildren(source, id, options, callback)
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
                if(data&& data.search)
                $("#messageDiv").html("found : " + data.search.length);
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
    self.querySPARQL_GET_proxy = function (url, query, queryOptions, options, callback) {
        if (!options)
            options = {}
        if (!options.doNotEncode) {
            query = encodeURIComponent(query);
            query = query.replace(/%2B/g, "+")
        }
        url = url + query + queryOptions;
        console.log(url)

        $("#waitImg").css("display", "block");

        var payload = {
            httpProxy: 1,
            url: url,
            options: JSON.stringify(options)
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
                //  $("#messageDiv").html("found : " + data.results.bindings.length);
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

    self.getLinkedData = function () {


    }


    self.clearMessage = function () {

    }

    self.skosToFlat = function (id, concepts, source) {
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

                jsonArray.push({id: item.id, ancestors: ancestors, prefLabels: item.name, source: source, altLabels: ""})
            }
            //   }


        })


        return jsonArray;

    }
    self.processData_SKOS = function (source, id, bindings) {
        var nLevels = 8;

        var paths = []
        var str2 = "";
        var topNodes = {}
        bindings.forEach(function (binding) {

            for (var level = 0; level < nLevels; level++) {
                var bindingId = id;
                if (!topNodes[bindingId] && level == 0) {
                //    var str0 = "|_" + id + ";" + "";
                    var str0 = "|_" + id + ";" + binding.prefLabel.value;
                    topNodes[bindingId] = {id: id, name: binding.prefLabel.value, path: str0}
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
