var Collection = (function () {

    var self = {}
    self.currentTreeNode;
    self.broaderProperty = "http://www.w3.org/2004/02/skos/core#member"

    self.getJstreeContextMenu = function () {
        var menuItems = {}
        var clipboard = Clipboard.getContent()
        if (clipboard.length > 0 && clipboard[0].type == "node") {


            menuItems.assignConcepts = {
                label: "Assign selected Concepts",
                action: function (obj, sss, cc) {
                    Collection.assignConcepts()
                },


            }
        }
        menuItems.filterConcepts = {
            label: "Filter Concepts",
            action: function (obj, sss, cc) {
                Collection.filterConcepts()
            }
        }
        menuItems.unAssignConcepts = {
            label: "Unassign Concepts",
            action: function (obj, sss, cc) {
                Collection.unAssignConcepts()
                ;
            },
        }

        menuItems.editNode = {
            label: "Edit node",
            action: function (obj, sss, cc) {
                Blender.nodeEdition.editNode()
            }
        }

        menuItems.deleteNode = {
            label: "Delete node",
            action: function (obj, sss, cc) {
                Blender.menuActions.deleteNode();
            },


        }
        menuItems.addChildNodeNode = {
            label: "Create child",
            action: function (obj, sss, cc) {
                Blender.nodeEdition.createChildNode();
                ;
            },
        },

        menuItems.importChildren = {
            label: "Import child nodes",
            action: function (obj, sss, cc) {
                Import.showImportNodesDialog();
                ;
            },
        }
        return menuItems;
    }


    self.selectNodeFn = function (event, propertiesMap) {
        if (propertiesMap)
            self.currentTreeNode = propertiesMap.node
        $("#Blender_collectionTreeDiv").jstree(true).settings.contextmenu.items = Collection.getJstreeContextMenu()
        self.openTreeNode("Blender_collectionTreeDiv", Blender.currentSource, self.currentTreeNode)
    }


    self.openTreeNode = function (divId, thesaurusLabel, node, callback) {
        var existingNodes = common.getjsTreeNodes(divId, true)
        if (node.children.length > 0)
            return;

        self.Sparql.getNodeChildren(thesaurusLabel,  node.id,  function (err, result) {
            if (err) {
                return MainController.UI.message(err);
            }
            TreeController.drawOrUpdateTree(divId, result, node.id, "child1")

        })

    }


    self.assignConcepts = function () {
        var nodes = Clipboard.getContent();
        var conceptIds = [];
        nodes.forEach(function (item) {
            conceptIds.push(item.id)
        })
        Collections.Sparql.setConceptsCollectionMembership(Blender.currentSource, conceptIds, Collection.currentTreeNode.id, function (err, result) {
            if (err)
                return MainController.UI.message(err)
            return MainController.UI.message(result)
        })

    }
    self.unAssignConcepts = function () {

    }
    self.filterConcepts = function () {
        var options = {
            filterCollections: Collection.currentTreeNode.id
        }
        TreeController.getFilteredNodesJstreeData(self.currentSource, options, function (err, jstreeData) {

            MainController.UI.message("")
            $("#Blender_tabs").tabs("option", "active", 0);
            common.loadJsTree("Blender_conceptTreeDiv", jstreeData, {
                selectNodeFn: Blender.selectNodeFn,
                contextMenu: Blender.getJstreeConceptsContextMenu()
            })

        })
    }
    self.dropNode = function () {
        var newParent = Blender.menuActions.movingNode.newParent
        var oldParent = Blender.menuActions.movingNode.oldParent
        var id = Blender.menuActions.movingNode.id
        if (Blender.menuActions.lastDroppedNodeId == id)
            return
        Blender.menuActions.lastDroppedNodeId = id;
        var broaderPredicate = self.broaderProperty

        Sparql_generic.deleteTriples(Blender.currentSource, oldParent,  "http://www.w3.org/2004/02/skos/core#member",id, function (err, result) {

            if (err) {
                return MainController.UI.message(err)
            }
            var triple = {subject: newParent, predicate: "http://www.w3.org/2004/02/skos/core#member", object: id, valueType: "uri"}
            Sparql_generic.update(Blender.currentSource, [triple], function (err, result) {
                if (err) {
                    return MainController.UI.message(err)
                }
            })
        })

    }

    self.Sparql = {

    getVariables:function (sourceLabel) {
        var source = Config.sources[sourceLabel]
        var vars = {
            serverUrl: source.sparql_url + "?query=&format=json",
            graphUri: source.graphUri,
            lang: source.predicates.lang,
            limit:1000
        }
        return vars;
    },

    getCollections: function (sourceLabel, options, callback) {
        if (!options)
            options = {}
        var variables=self.Sparql.getVariables(sourceLabel) ;
        var query = "PREFIX  rdf:<http://www.w3.org/1999/02/22-rdf-syntax-ns#> PREFIX  skos:<http://www.w3.org/2004/02/skos/core#>" +
            " select    distinct * from  <"+variables.graphUri + ">  WHERE {" +
            "?collection rdf:type  ?collectionType. filter( ?collectionType =skos:Collection). " +
            "?collection skos:prefLabel ?collectionLabel."
        if (variables.lang)
            query += "filter( lang(?collectionLabel)=\"" + variables.lang + "\")"
        if (true)
            query += "FILTER (  NOT EXISTS {?child skos:member ?collection})"

        query += "} ORDER BY ?collectionLabel limit " + variables.limit;


        Sparql_proxy.querySPARQL_GET_proxy(variables.serverUrl, query, null, null, function (err, result) {
            if (err)
                return callback(err);

            return callback(null, result.results.bindings)
        })
    }
,

    setConceptsCollectionMembership(sourceLabel, conceptIds, collectionId, callback)
    {

        var triples = []
        conceptIds.forEach(function (item) {
            triples.push({subject: collectionId, predicate: Collection.broaderProperty, object: item, valueType: "uri"})
        })

        Sparql_generic.update(sourceLabel, triples, function (err, result) {

            return callback(err, result)
        })


    }
,
    getNodeChildren: function (sourceLabel, collectionId, callback) {
        var variables=self.Sparql.getVariables(sourceLabel) ;

        var query = "PREFIX skos:<http://www.w3.org/2004/02/skos/core#>";

        query += " select distinct * from <" + variables.graphUri + ">  WHERE {"

        query += "<"+collectionId+"> skos:member ?child1." +

            "OPTIONAL{ ?child1  skos:prefLabel ?child1Label. ";
        if (variables.lang)
            query += "filter( lang(?child1Label)=\"" + variables.lang + "\")"
        query += "}"

        query += "OPTIONAL{?child1 rdf:type ?child1Type.}" +
            "}" +
            "limit " + variables.limit;

        Sparql_proxy.querySPARQL_GET_proxy(variables.serverUrl, query, {}, null, function (err, result) {
            if (err) {
                return callback(err)
            }
            return callback(null, result.results.bindings);
        })
    }


    ,
       getSingleNodeAllDescendants : function (sourceLabel, id, callback) {
           var variables=self.Sparql.getVariables(sourceLabel) ;
            var query = "";
            query += prefixesStr;
            query += " select distinct * FROM <" + variables.graphUri + ">  WHERE {"
            query += "  ?collection   skos:member*  ?narrower." +
                "filter (?collection=<" + id + ">) " +
                "?narrower skos:prefLabel ?narrowerLabel." +
                "?narrower rdf:type ?narrowerType."

            query += "  }";
            query += "limit " + variables.limit + " ";


            Sparql_proxy.querySPARQL_GET_proxy(url, query, queryOptions, null, function (err, result) {
                if (err) {
                    return callback(err)
                }
                return callback(null, result.results.bindings);
            })

        }


}


    return self;
})()
