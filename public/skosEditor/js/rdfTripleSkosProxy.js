var rdfTripleSkosProxy = (function () {

    var self = {}
    self.sparqlServerUrl = 'http://51.178.139.80:8890/sparql/'
    self.loadThesaurus = function (graphUri) {

        var query = "PREFIX schema: <http://schema.org/>" +
            "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>" +
            "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>" +
            "prefix skos: <http://www.w3.org/2004/02/skos/core#>" +
            "prefix foaf: <http://xmlns.com/foaf/0.1/>" +
            "prefix shema: <http://schema.org/>" +
            "SELECT distinct * from <http://souslesens.org/data/total/ep/> WHERE {" +
            "" +
            "  ?concept skos:topConceptOf ?scheme ." +
            "  ?concept skos:prefLabel ?conceptLabel" +
            "  " +
            " " +
            "} LIMIT 1000"

        self.querySPARQL_proxy(query, self.sparqlServerUrl, {}, {}, function (err, result) {

            if (err) {
                return console.log(err);
            }
            var nodes = [];
            result.results.bindings.forEach(function (item) {

                var id = item.concept.value;
                var prefLabel = item.conceptLabel.value;

                var node = {
                    data: {
                        altLabels: [],
                        broaders: [],
                        definitions: [],
                        id: id,
                        notes: [],
                        prefLabels: [{lang: "en", value: prefLabel}],

                        relateds: [],
                    },
                    treeDivId: "treeDiv1",
                    icon: "concept-icon.png",
                    id: id,
                    parent: "#",
                    text: prefLabel,
                }
                nodes.push(node);

            })

            common.loadJsTree("treeDiv1", nodes, {selectNodeFn: rdfTripleSkosProxy.onClikNode});

        })


    }


    self.onClikNode = function (evt, obj) {

        if (obj.node.children.length > 0)
            return;
        self.addTreeChildrenNodes(obj.node.id);

        self.showNodeConcepts(obj.node.id)


    }

    self.addTreeChildrenNodes = function (broader) {


        var query = "PREFIX schema: <http://schema.org/>" +
            "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>" +
            "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>" +
            "prefix skos: <http://www.w3.org/2004/02/skos/core#>" +
            "prefix foaf: <http://xmlns.com/foaf/0.1/>" +
            "prefix shema: <http://schema.org/>" +
            "SELECT distinct * from <http://souslesens.org/data/total/ep/> WHERE {" +
            "" +
            "  ?concept skos:broader ?broader .  filter (?broader=<" + broaderId + ">)" +
            "  ?concept skos:prefLabel ?conceptLabel" +
            "  " +
            " " +
            "} LIMIT 1000"

        self.querySPARQL_proxy(query, self.sparqlServerUrl, {}, {}, function (err, result) {

            if (err) {
                return console.log(err);
            }
            var nodes = [];
            result.results.bindings.forEach(function (item) {

                var id = item.concept.value;
                var prefLabel = item.conceptLabel.value;

                var node = {
                    data: {
                        altLabels: [],
                        broaders: [broaderId],
                        definitions: [],
                        id: id,
                        notes: [],
                        prefLabels: [{lang: "en", value: prefLabel}],

                        relateds: [],
                    },
                    treeDivId: "treeDiv1",
                    icon: "concept-icon.png",
                    id: id,
                    parent: broaderId,
                    text: prefLabel,
                }
                nodes.push(node);

            })

            common.addNodesToJstree("treeDiv1", broaderId, nodes);

        })
    }

    self.showNodeConcepts = function (nodeId) {
        var query="prefix skos: <http://www.w3.org/2004/02/skos/core#>" +
            "prefix foaf: <http://xmlns.com/foaf/0.1/>" +
            "prefix schema: <http://schema.org/>" +
            "SELECT  ?catId  ?subject  ?concept ?conceptLabel (count(?category) as ?nCategories) WHERE{" +
            "    ?catId foaf:topic ?subject ." +
            "    ?category schema:about ?catId. " +
            "    ?concept ?x ?category." +
            "  ?concept skos:prefLabel ?conceptLabel filter(lang(?conceptLabel)='en')" +
            "    filter ( ?subject=<http://souslesens.org/vocab/subject/Casing_design>)" +
            "   " +
            "} group by  ?catId  ?subject  ?concept ?conceptLabel limit 1000"


    }

    self.querySPARQL_proxy = function (query, url, queryOptions, options, callback) {
        console.log(query)
        $("#waitImg").css("display", "block")
        if (!url) {
            url = self.proxyUrl;
        }
        if (!queryOptions) {
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
            options: queryOptions


        }

        if (options.method && options.method == "GET")
            payload.GET = true;
        else
            payload.POST = true;

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
