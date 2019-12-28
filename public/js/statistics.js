var statistics = (function () {
    var self = {};


    self.clear = function () {
        $("#infosDiv").html("");
        $("#docsDiv").html("");
        $("#infosDiv").html("");
        //   $("#jstreeDiv").html("");
        $("#textDiv").html("");
    }


    self.getEntitiesQuery = function (callback) {

        var queryString = $("#queryStringInput").val();
        var entityQueryString = $("#entityQueryStringInput").val();
        if (queryString && queryString.length > 0) {

            var queryDocs = {
                query: {
                    "query_string": {
                        "query": queryString,
                        "default_field": "attachment.content",
                        "default_operator": "AND"
                    }
                },
                size: 1000,
                _source: "_id"

            }
            var payload = {
                executeQuery: JSON.stringify(queryDocs),
                indexes: JSON.stringify(["gmec_par"])

            }
            $.ajax({
                type: "POST",
                url: appConfig.elasticUrl,
                data: payload,
                dataType: "json",
                success: function (data, textStatus, jqXHR) {
                    var xx = data;
                    var docIds = [];
                    data.hits.hits.forEach(function (hit) {
                        docIds.push(hit._id)
                    })
                    var query = {
                        terms: {
                            ["documents.id"]: docIds
                        }
                    }
                    return callback(null, query);

                },
                error: function (err) {
                    console.log(err);
                    return callback(err)
                }
            })

        }
        if (entityQueryString && entityQueryString.length > 0) {

            var queryEntities = {
                query: {
                    "query_string": {
                        "query": entityQueryString,
                        "fields": ["internal_id", "synonyms"],
                        "default_operator": "AND"
                    }
                }
            }
            var payload = {
                executeQuery: JSON.stringify(queryEntities),
                indexes: JSON.stringify(["thesaurus_ctg"])

            }
            $.ajax({
                type: "POST",
                url: appConfig.elasticUrl,
                data: payload,
                dataType: "json",
                success: function (data, textStatus, jqXHR) {
                    var xx = data;
                    var docIds = [];
                    data.hits.hits.forEach(function (hit) {
                        hit._source.documents.forEach(function (doc) {
                            docIds.push(doc.id)
                        })

                    })
                    var query = {
                        terms: {
                            ["documents.id"]: docIds
                        }
                    }
                    return callback(null, query);

                },
                error: function (err) {
                    console.log(err);
                    return callback(err)
                }
            })


        } else {
            var query = {
                "match_all": {}
            };
            return callback(null, query);

        }


    }

    self.drawHeatMap = function () {
        self.clear();
        self.getEntitiesQuery(function (err, result) {
            drawCanvas.drawAll({onclickFn: statistics.onRectClick, query: result});
        })
    }

    self.drawGraph = function () {
        self.getEntitiesQuery(function (err, result) {
            if (err)
                return console.log(err);
            var url = "./heatMap"
            if (result) {

                if (result.terms && result.terms["documents.id"].length > 0) {
                    var ids = result.terms["documents.id"];
                    var query = {terms: {"documents.id": ids}}
                } else
                    query = result  //match_all

                var queryStr = encodeURIComponent(JSON.stringify(query))
                url += "?query=" + queryStr
            }

            $.ajax({
                type: "GET",
                url: url,
                dataType: "json",

                success: function (data, textStatus, jqXHR) {
                    graphController.drawEntitiesGraph(data);


                }, error: function (err) {
                    $("#dialogDiv").html(err);
                }
            })

        })
    }

    self.startGraph = function () {
        var entityQueryString = $("#entityQueryStringInput").val();

        if (entityQueryString && entityQueryString.length > 0) {

            var queryEntities = {
                query: {
                    "query_string": {
                        "query": entityQueryString,
                        "fields": ["internal_id", "synonyms"],
                        "default_operator": "AND"
                    }
                }
            }
            var payload = {
                executeQuery: JSON.stringify(queryEntities),
                indexes: JSON.stringify(["thesaurus_ctg"])

            }
            $.ajax({
                type: "POST",
                url: appConfig.elasticUrl,
                data: payload,
                dataType: "json",
                success: function (data, textStatus, jqXHR) {
                    var nodes = [];
                    var edges=[];
                    data.hits.hits.forEach(function (hit) {
                     nodes.push(graphController.getNodeFromEntityHit(hit))
                    })

                    visjsGraph.draw("graphDiv",{nodes:nodes,edges:edges},{})
                }

                , error: function (err) {
                    console.log(err);
                }
            })
        }
    }
    self.onRectClick = function (p, data) {
        var labels = drawCanvas.rawData.labels;
        var entity1 = labels[data.coords.x];
        var entity2 = labels[data.coords.y];
        var count = drawCanvas.rawData.data[data.coords.x][data.coords.y]
        var str = "<b>" + entity1 + " / <br>" + entity2 + "<br>" + count + " </b>"//<button onclick=showDocs('" + entity1 + "','" + entity2 + "')>X</button>"
        $("#infosDiv").html(str)
        self.showDocs(entity1, entity2)
    }

    self.showDocs = function (entity1, entity2) {
        var query = {
            query: {
                bool: {
                    must: [
                        {term: {"entities_thesaurus_ctg.id": entity1}},
                        {term: {"entities_thesaurus_ctg.id": entity2}},
                    ]
                }
            }
            , size: 1000
        }
console.log(JSON.stringify(query,null,2))
        var payload = {
            executeQuery: JSON.stringify(query),
            indexes: JSON.stringify(["gmec_par"])

        }
        $.ajax({
            type: "POST",
            url: appConfig.elasticUrl,
            data: payload,
            dataType: "json",
            success: function (data, textStatus, jqXHR) {
                var xx = data;

                function docDataToJstree(data) {

                    var docs = {};
                    data.hits.hits.forEach(function (hit) {
                        var docAttrs = hit._source
                        if (!docs[docAttrs["docTitle"]]) {
                            docs[docAttrs["docTitle"]] = {chapters: {}, docId: docAttrs.docId}

                            if (!docs[docAttrs["docTitle"]].chapters[docAttrs["chapter"]]) {
                                docs[docAttrs["docTitle"]].chapters[docAttrs["chapter"]] = {paragraphs: [], chapterId: docAttrs.chapterId}
                            }
                            docs[docAttrs["docTitle"]].chapters[docAttrs["chapter"]].paragraphs.push({text: docAttrs.text, paragraphId: docAttrs.paragraphId})
                        }


                    })

                    var jsTreeArray = [];
                    for (var docKey in docs) {
                        var doc = docs[docKey];
                        jsTreeArray.push({
                            text: docKey, id: doc.docId, parent: "#"
                        })
                        for (var chapterKey in doc.chapters) {
                            var chapter = doc.chapters[chapterKey];
                            jsTreeArray.push({
                                text: chapterKey, id: chapter.chapterId, parent: doc.docId
                            })

                            chapter.paragraphs.forEach(function (paragraph) {
                                jsTreeArray.push({
                                    text: paragraph.paragraphId, id: paragraph.paragraphId, parent: chapter.chapterId, data: {text: paragraph.text}
                                })
                            })

                        }
                    }
                    return jsTreeArray;
                }

                var jsTreeArray = docDataToJstree(data);
                self.drawJsTree("jstreeDiv", jsTreeArray)

            }
            , error: function (err) {

                console.log(err.responseText)

            }

        });
    }
    self.drawJsTree = function (treeDiv, jsTreeData) {

        var plugins = [];
        plugins.push("search");

        plugins.push("sort");
        /*   plugins.push("types");
           plugins.push("contextmenu");*/

        if ($('#' + treeDiv).jstree)
            $('#' + treeDiv).jstree("destroy")

        $('#' + treeDiv).jstree({
            'core': {
                'check_callback': true,
                'data': jsTreeData,


            }
            , 'contextmenu': {
                'items': null
            },
            'plugins': plugins,
            "search": {
                "case_sensitive": false,
                "show_only_matches": true
            }
        }).on("select_node.jstree",
            function (evt, obj) {
                var x = obj;
                var html = obj.node.text
                if (obj.node.data && obj.node.data.text)
                    html = obj.node.data.text

                $("#textDiv").html(html)
                //   Entities.runEntityQuery(obj.node);
                //   $("#dataDiv").html(JSON.stringify(obj.node.data,null,2))
            })
            .on('loaded.jstree', function () {
                $("#" + treeDiv).jstree('open_all');
            });
    }


    return self;


})()
