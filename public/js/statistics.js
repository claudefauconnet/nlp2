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
        context.currentCorpusIndex=$("#corpusIndexSelect").val();
        context.currentThesaurusIndex=$("#thesaurusIndexSelect").val();
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
                indexes: JSON.stringify([context.currentCorpusIndex])

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
                indexes: JSON.stringify([context.currentThesaurusIndex])

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
            var url = "./heatMap"
            if (result) {
                var queryStr = encodeURIComponent(JSON.stringify(result))
                url += "?query=" + queryStr
            }


            d3.json(url).then(function (data) {
                var canvasData=  self.bindData(data, options);
                drawCanvas.drawData(canvasData, {onclickFn: statistics.onRectClick, onMouseOverFn: statistics.onRectMouseOver});
            })
        })
    }

    /******************************************************************************************************************************/
    /*************************************************Bind data**************************************************************/
    /******************************************************************************************************************************/
    /******************************************************************************************************************************/

    self.bindData = function (data, options, callback) {

        var interpolateViridisColours = d3.scaleSequential(d3.interpolateYlOrRd).domain([1, Math.log(data.max)]);

        var canvasData = [];
        var margin = 100;
        var x = margin;
        var y = margin;
        var w = Math.round((totalWidth - margin) / data.data.length);
        data.data.forEach(function (line, lineIndex) {
            var x = 100;
            line.forEach(function (row, rowIndex) {
                if(rowIndex>lineIndex)
                    return;
                var bgColor = "#aaa"
                if (row > 0)
                    bgColor = interpolateViridisColours(Math.log(row))
                if(row==20)
                    xx=3
                var rect = {
                    type: "rect",
                    x: x,
                    y: y,
                    w: w,
                    h: w,
                    bgColor: bgColor,
                    //   lineWidth:1,
                    coords: {x: lineIndex, y: rowIndex}

                }
                canvasData.push(rect);
                x += w
            })


            y += w
        })

        var y0 = margin;
        var x0 = margin;
        data.labels.forEach(function (label, index) {
            var p=label.indexOf("-");
            if(p>0)
                label= label.substring(0,p)

            if (index == 0 || data.labels[index - 1].substring(0, 3) != label.substring(0, 3)) {
                var line = {
                    type: "line",
                    x1: 0,
                    y1: y0 + (index * w),
                    x2: totalWidth,
                    y2: y0 + (index * w),
                    lineWidth: "2px"
                }
                canvasData.push(line);

                canvasData.push({
                    type: "text",
                    text: label,
                    textAlign: "end",
                    font: "14px courrier normal",
                    color: "black",
                    x: margin - 5,
                    y: y0 + (index * w) + 10,
                })
                //vert

                var line = {
                    type: "line",
                    x1: x0 + (index * w),
                    y1: 0,
                    x2: x0 + (index * w),
                    y2: totalHeight,
                    lineWidth: "2px"
                }
                canvasData.push(line);


                canvasData.push({
                    type: "text",
                    text: label,
                    textAlign: "start",
                    font: "14px courrier normal",
                    stroke: "black",
                    x: x0 + (index * w) + 10,
                    y:margin-5,
                    vertical: true
                })
            }
        });

        return canvasData;
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
        
        context.currentCorpusIndex=$("#corpusIndexSelect").val();
        context.currentThesaurusIndex=$("#thesaurusIndexSelect").val();
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
                indexes: JSON.stringify([context.currentThesaurusIndex])

            }
            console.log(JSON.stringify(payload,null,2))
            $.ajax({
                type: "POST",
                url: appConfig.elasticUrl,
                data: payload,
                dataType: "json",
                success: function (data, textStatus, jqXHR) {
                    var nodes = [];
                    var edges = [];
                    data.hits.hits.forEach(function (hit) {
                        nodes.push(graphController.getNodeFromEntityHit(hit))
                    })

                    visjsGraph.draw("graphDiv", {nodes: nodes, edges: edges}, {})
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

    self.onRectMouseOver = function (p, data) {
        var labels = drawCanvas.rawData.labels;
        var entity1 = labels[data.coords.x];
        var entity2 = labels[data.coords.y];
        var count = drawCanvas.rawData.data[data.coords.x][data.coords.y]
        var str = "" + entity1 + " / " + entity2 + " " + count + "";
        var p2={x:p[0]+10,y:p[1]+10}
        $("#mouseOverDiv").css("visibility", "visible")
        $("#mouseOverDiv").css({top: p2.y, left: p2.x, position:'absolute'});
        $("#mouseOverDiv").html(str)
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
        console.log(JSON.stringify(query, null, 2))
        var payload = {
            executeQuery: JSON.stringify(query),
            indexes: JSON.stringify([context.currentCorpusIndex])

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
                        //     console.log(docAttrs.docTitle + " " + docAttrs.chapter + " " + docAttrs.paragraphId)
                        if (!docs[docAttrs["docTitle"]]) {
                            docs[docAttrs["docTitle"]] = {chapters: {}, docId: docAttrs.docId,entities:docAttrs.entities_thesaurus_ctg}
                        }
                        if (!docs[docAttrs["docTitle"]].chapters[docAttrs["chapter"]]) {
                            docs[docAttrs["docTitle"]].chapters[docAttrs["chapter"]] = {paragraphs: [], chapterId: docAttrs.chapterId}
                        }
                        docs[docAttrs["docTitle"]].chapters[docAttrs["chapter"]].paragraphs.push({text: docAttrs.text, paragraphId: docAttrs.paragraphId})


                    })

                    var jsTreeArray = [];
                    for (var docKey in docs) {
                        var doc = docs[docKey];
                        jsTreeArray.push({
                            text: docKey, id: doc.docId, parent: "#",data:{type:"document",text: docKey,entities:doc.entities }}
                            )
                        for (var chapterKey in doc.chapters) {
                            var chapter = doc.chapters[chapterKey];
                            jsTreeArray.push({
                                text: chapterKey, id: chapter.chapterId, parent: doc.docId,data: {type:"chapter",text: chapterKey}
                            })

                            chapter.paragraphs.forEach(function (paragraph) {
                                jsTreeArray.push({
                                    text: paragraph.paragraphId, id: paragraph.paragraphId, parent: chapter.chapterId, data: {type:"paragraph",text: paragraph.text}
                                })
                            })

                        }
                    }
                    return jsTreeArray;
                }

                var jsTreeArray = docDataToJstree(data);
                self.drawJsTree("jstreeDiv", jsTreeArray);


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
                var html=""
                var entities=[];
                var documentHtml="";
                var chapterHtml="";
                var paragraphHtml="";
                obj.node.parents.forEach(function(parent){
                   if(parent=="#")
                       return;
                    var parentNode =  $("#" + treeDiv).jstree(true).get_json(parent);
                    if(parentNode.data.type=="document") {
                        documentHtml = parentNode.data.text
                    }
                    if(parentNode.data.type=="chapter"){
                        chapterHtml= parentNode.data.text
                    }

                    if(parentNode.data.entities)
                        entities=parentNode.data.entities;
                })

                if (obj.node.data && obj.node.data.text)
                    paragraphHtml = obj.node.data.text;
                else
                    paragraphHtml = obj.node.text;
var entityNames=[]
                entities.forEach(function(entity){
                    entityNames.push(entity.id)
                    var entityName=entity.id;
                    entity.offsets.sort(function(a,b){
                        if(a.start>b.start)
                            return -1;
                        if(b.start>a.start)
                            return 1;
                        return 0;


                    })
if(false){
                    entity.offsets.forEach(function(offset){
                        if(offset.field="docTitle") {
                            documentHtml = documentHtml.substring(0, offset.start-1) + "<em class='E_" + entityNames.length - 1 + "'>"
                                +documentHtml.substring( offset.start,offset.start+offset.syn.length)+"</em>"+documentHtml.substring(offset.start+offset.syn.length)
                        }
                        if(offset.field="parentChapter") {
                            chapterHtml = chapterHtml.substring(0, offset.start-1) + "<em class='E_" + entityNames.length - 1 + "'>"
                                +chapterHtml.substring( offset.start,offset.start+offset.syn.length)+"</em>"+chapterHtml.substring(offset.start+offset.syn.length)
                        }
                        if(offset.field="text") {
                            paragraphHtml = paragraphHtml.substring(0, offset.start-1) + "<em class='E_" + entityNames.length - 1 + "'>"
                                +paragraphHtml.substring( offset.start,offset.start+offset.syn.length)+"</em>"+paragraphHtml.substring(offset.start+offset.syn.length)
                        }
                    })
}
                })


                html="<div class='jstreeDocTitle'>"+documentHtml+"</div>"
                html+="<div class='jstreeChapterTitle'>"+chapterHtml+"</div>";
                html+=paragraphHtml;



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
