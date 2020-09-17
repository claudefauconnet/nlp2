var Infos = (function () {
    var self = {};
    self.currentGraphInfos = {}

    self.showInfos = function (id, type) {
        if (id.indexOf("/Paragraph/") > -1) {
            self.resources.showParagraphInfos(id)
        }

        if (id.indexOf("/Chapter/") > -1) {
            self.resources.showChapterInfos(id)
        }
        if (id.indexOf("/Document/") > -1) {
            self.resources.showDocumentInfos(id)
        } else if (id.indexOf("/resource/vocabulary/") > -1) {
            self.concepts.showConceptInfos(id)
        } else {
            self.resources.showLambdaParagraphInfos(id);
        }
    }


    self.concepts = {
        showConceptInfos: function (conceptId) {
            $("#infosDiv").html("");
            sparql_facade.getNodeInfos(conceptId, {}, function (err, result) {


                if (err)
                    return common.message(err)

                var html = "<table>"
                html += "<tr><td>UUID</td><td><a target='_blank' href='" + conceptId + "'> " + conceptId + "</a></td></tr>"
                result.forEach(function (item) {

                    html += "<tr><td>" + item.prop.value + "</td><td> " + item.value.value + "</td></tr>"
                })
                html += "</table>"
                $("#infosDiv").html(html);
                Infos.setInfosDivHeight(300);


            })
        },

        showConceptInfosXX: function (conceptId) {
            function display(infos) {
                $("#messageDiv").html("");
                var html = ""

                html += "<span class='paragraph-docTitle'>CONCEPT :" + infos.conceptLabel.value + "</span>&nbsp;";
                for (var i = 1; i < 8; i++) {
                    var broader = infos["broader" + i]
                    if (typeof broader !== "undefined") {
                        html += "<span class='paragraph-chapter'>" + "/" + broader.value + "</span>&nbsp;";
                    }
                }
                var definition = infos["definition"]
                if (typeof definition !== "undefined") {
                    html += "<span class='paragraph-chapter'>definition:</span>&nbsp;" + definition.value;
                }
                var exactMatch = infos["exactMatch"]
                if (typeof exactMatch !== "undefined") {
                    html += "<br>"
                    html += "<span class='paragraph-chapter'>Quantum exact match:</span>&nbsp;" + exactMatch.value;
                }

                $("#infosDiv").html(html);
                Infos.setInfosDivHeight(100);

            }

            var infos = self.currentGraphInfos[conceptId];
            if (infos)
                display(infos)
            else {
                Concepts.getConceptsInfos([conceptId], {noAncestors: true}, function (err, result) {
                    infos = result[0];
                    self.currentGraphInfos[conceptId] = infos
                    display(infos)


                })
            }
        }


    }


    self.resources = {

        showDocumentInfos: function (documentId) {

            function display(infos) {
                $("#messageDiv").html("");
                var html = ""
                html += "<div class='paragraph-docTitle'>DOCUMENT: " + infos.documentLabel.value + "</div>";
                html += "<div class='paragraph-docTitle'>Title : " + infos.documentTitle.value + "</div>";
                html += "<div class='paragraph-chapter'>Purpose : " + infos.documentPurpose.value + "</div>";

                html += "<img src='icons/plus.png' width='25px' onclick=\"Infos.resources.showDocChaptersList('" + infos.document.value + "')\"> </div>";
                $("#infosDiv").html(html);
                Infos.setInfosDivHeight(100);
            }

            var infos = self.currentGraphInfos[documentId];
            if (infos)
                display(infos)
            else {

                var url = app_config.sparql_url + "?default-graph-uri=&query=";// + query + queryOptions
                var query = "PREFIX mime:<http://purl.org/dc/dcmitype/> " +
                    " PREFIX terms:<http://purl.org/dc/terms/>" +
                    " PREFIX skos:<http://www.w3.org/2004/02/skos/core#>" +
                    "select distinct *" +
                    "where{" +
                    "?document terms:title ?documentTitle ." +
                    "?document skos:note ?documentPurpose ." +
                    "?document skos:prefLabel ?documentLabel." +
                    " filter (?document in(<" + documentId + ">))"

                query += "} limit 10000"
                var queryOptions = "&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=20000&debug=off"
                sparql.querySPARQL_GET_proxy(url, query, queryOptions, null, function (err, result) {
                    if (err)
                        return common.message(err)
                    var infos = result.results.bindings[0];
                    self.currentGraphInfos[documentId] = infos;

                    display(infos)


                })
            }


        },

        showDocChaptersList: function (documentId) {
            var url = app_config.sparql_url + "?default-graph-uri=&query=";// + query + queryOptions
            var query = "PREFIX mime:<http://purl.org/dc/dcmitype/> " +
                " PREFIX terms:<http://purl.org/dc/terms/>" +
                " PREFIX skos:<http://www.w3.org/2004/02/skos/core#>" +
                "select distinct *" +
                "where{" +
                "?chapter skos:broader ?document ." +
                "?chapter skos:prefLabel ?chapterLabel." +
                " filter (?document in(<" + documentId + ">))"

            query += "} ORDER by ?chapterLabel limit 10000"
            var queryOptions = "&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=20000&debug=off"
            sparql.querySPARQL_GET_proxy(url, query, queryOptions, null, function (err, result) {
                if (err)
                    return common.message(err)
                var infos = result.results.bindings;
                var html = ""// "<ul>";

                infos.forEach(function (item) {
                    var chapterId = "infosDiv" + common.formatUriToJqueryId(item.chapter.value)
                    //   html += "<li  onclick=\"Infos.resources.showChapterParagraphs('"+item.chapter.value+"')\"> " +item.chapterLabel.value + "<ul style='display: flex' id='infosDiv " +chapterId + "'></ul></li>";
                    html += "<div style='font-weight: bold' > <span >" + item.chapterLabel.value + "&nbsp;</span>" +
                        "<img src='icons/plus.png' width='15px' onclick=\"Infos.resources.showChapterParagraphs('" + item.chapter.value + "')\"> </div>" +
                        "<div style='font-weight: normal' id='" + chapterId + "'></div>";

                })
                html += ""// "</ul>"
                Infos.setInfosDivHeight(400);
                $("#infosDiv").append(html);

            })
        },

        showChapterParagraphs: function (chapterId) {
            var url = app_config.sparql_url + "?default-graph-uri=&query=";// + query + queryOptions
            var query = "PREFIX mime:<http://purl.org/dc/dcmitype/> " +
                " PREFIX dcmitype:<http://purl.org/dc/dcmitype/> " +
                " PREFIX skos:<http://www.w3.org/2004/02/skos/core#>" +


                "select distinct *" +
                "where{" +
                "?paragraph skos:broader ?chapter ." +
                "?paragraph dcmitype:Text ?paragraphText ." +
                " filter (?chapter in(<" + chapterId + ">))"

            query += "} ORDER by ?paragraph limit 10000"
            var queryOptions = "&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=20000&debug=off"
            sparql.querySPARQL_GET_proxy(url, query, queryOptions, null, function (err, result) {
                if (err)
                    return common.message(err)
                var infos = result.results.bindings;
                var html = "<ul>"
                infos.forEach(function (item) {

                    html += "<li>" + item.paragraphText.value + "</li>";
                })
                html += "</ul>"
                var chapterDivId = "infosDiv" + common.formatUriToJqueryId(chapterId)
                //   $(chapterDivId).css("display","flex")
                Infos.setInfosDivHeight(700);
                //  $("#"+chapterDivId).css("height","50px");
                $("#" + chapterDivId).css("background-color", "#ddd");
                $("#" + chapterDivId).html(html);

                //  $("#infosDiv").load(location.href+" #infosDiv>*","");

            })


        },
        showChapterInfos: function (chapterId) {
            var url = app_config.sparql_url + "?default-graph-uri=&query=";// + query + queryOptions
            var query = "PREFIX mime:<http://purl.org/dc/dcmitype/> " +
                " PREFIX dcmitype:<http://purl.org/dc/dcmitype/> " +
                " PREFIX skos:<http://www.w3.org/2004/02/skos/core#>" +
                " PREFIX terms:<http://purl.org/dc/terms/>" +


                "select distinct *" +
                "where{" +
                "?paragraph skos:broader ?chapter ." +
                "?chapter skos:prefLabel ?chapterLabel. " +
                "?chapter skos:broader ?document. " +
                "?document skos:prefLabel ?documentLabel. " +
                "?document terms:title ?documentTitle ." +
                "?paragraph dcmitype:Text ?paragraphText ." +
                " filter (?chapter in(<" + chapterId + ">))"

            query += "} ORDER by ?paragraph limit 10000"
            var queryOptions = "&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=20000&debug=off"
            sparql.querySPARQL_GET_proxy(url, query, queryOptions, null, function (err, result) {
                if (err)
                    return common.message(err)
                var infos = result.results.bindings;
                var html = "";

                infos.forEach(function (item, index) {
                    if (index == 0) {
                        html += "<div class='paragraph-docTitle'>DOCUMENT : " + item.documentLabel.value + "&nbsp;" + item.documentTitle.value + "</div>";
                        html += "<div class='paragraph-chapter'>CHAPTER: " + item.chapterLabel.value + "</div>";
                        html += "<ul>"

                    }

                    html += "<li>" + item.paragraphText.value + "</li>";
                })
                html += "</ul>"
                self.setInfosDivHeight(300)
                $("#infosDiv").html(html);

                //  $("#infosDiv").load(location.href+" #infosDiv>*","");

            })

        },

        showParagraphInfos: function (paragraphId, callback) {

            function display(infos) {
                $("#messageDiv").html("");
                var html = ""
                var text = infos.paragraphText.value;
                var textRich = Infos.resources.getEntichedParagraphText(infos);
                html += "<div class='paragraph-docTitle'>DOCUMENT: " + infos.documentLabel.value + "</div>";
                html += "<div class='paragraph-docTitle'>Title : " + infos.documentTitle.value + "</div>";
                html += "<span class='paragraph-chapter'>" + infos.chapterLabel.value + "</span>&nbsp;";


                html += "<span class='text'>" + textRich + "</span>&nbsp;";
                //    html += "<span style='font-weight:bold'>" + text + "</span>&nbsp;";
                if (text)
                    $("#infosDiv").html(html);

            }

            var infos = self.currentGraphInfos[paragraphId];
            if (infos)
                display(infos)
            else {
                var url = app_config.sparql_url + "?default-graph-uri=&query=";// + query + queryOptions
                var query = "PREFIX mime:<http://purl.org/dc/dcmitype/> " +
                    " PREFIX skos:<http://www.w3.org/2004/02/skos/core#>" +
                    " PREFIX terms:<http://purl.org/dc/terms/>" +
                    "select distinct *" +
                    "where{" +
                    "?paragraph mime:Text ?paragraphText ." +
                    " filter (?paragraph in(<" + paragraphId + ">))"

                query += "?paragraph <http://open.vocab.org/terms/hasOffset> ?offset ." +
                    "?paragraph skos:broader ?chapter ." +
                    "?chapter skos:prefLabel ?chapterLabel. " +
                    "?chapter skos:broader ?document. " +
                    "?document skos:prefLabel ?documentLabel. " +
                    "?document terms:title ?documentTitle ."
                query += "} limit 100"
                var queryOptions = "&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=20000&debug=off"
                sparql.querySPARQL_GET_proxy(url, query, queryOptions, null, function (err, result) {
                    if (err) {

                        return common.message(err);
                    }
                    var infos = {}
                    result.results.bindings.forEach(function (item, index) {
                        if (index == 0) {
                            infos = result.results.bindings[0];
                            infos.offsets = [];
                        }
                        infos.offsets.push(item.offset.value)

                    })
                    self.currentGraphInfos[infos.paragraph.value] = infos;
                    display(infos)
                    self.setInfosDivHeight(300)


                })

            }
        }
        ,

        showLambdaParagraphInfos: function (id, callback) {

            function display(infos) {
                $("#messageDiv").html("");
                var html = "<table>"
                html+="<tr><td colspan='2'></td> "+ infos.id+"</td></tr>";
               for(var key in infos.properties){
                   var item=infos.properties[key]
                    html+="<tr><td>"+ item.name+"</td> <td>"+ item.value+"</td></tr>";
                }
                html+="</table>"

                    $("#infosDiv").html(html);

            }

            var infos = self.currentGraphInfos[id];
            if (infos)
                display(infos)
            else {
                var url = app_config.sparql_url + "?query=";// + query + queryOptions

                var query = "PREFIX skos: <http://www.w3.org/2004/02/skos/core#>" +
                    "" +
                    "select distinct *" +
                    " from <" + app_config.ontologies[app_config.currentOntology].corpusGraphUri + "> " +
                    " from <" + app_config.ontologies[app_config.currentOntology].conceptsGraphUri + "> " +
                    "where {" +
                    "?id ?prop ?value . filter(?id= <" + id + ">)" +
                    "" +

                    "\n" +
                    "}"
                "" +
                "}" +
                "limit 100"
                var queryOptions = "&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=20000&debug=off"

                sparql.querySPARQL_GET_proxy(url, query, queryOptions, null, function (err, result) {
                    if (err) {
                        return callback(err);
                    }
                    var bindings = []
                    var obj = {label: options.label, id: id, properties: {}};
                    result.results.bindings.forEach(function (item) {
                        var propName = item.prop.value
                        var p = propName.lastIndexOf("#")
                        if (p == -1)
                            var p = propName.lastIndexOf("/")
                        if (p > -1)
                            var propName = item.prop.value.substring(p + 1)
                        var value = item.value.value;
                        /*   if (item.valueLabel)
                               value = item.valueLabel.value;*/

                        if (!obj.properties[item.prop.value])
                            obj.properties[item.prop.value] = {name: propName, langValues: {}}

                        if (item.value && item.value["xml:lang"])
                            obj.properties[item.prop.value].langValues[item.value["xml:lang"]] = value;
                        else
                            obj.properties[item.prop.value].value = value;

                    })
                    self.currentGraphInfos[obj.id] = obj;
                    display(obj)
                    self.setInfosDivHeight(300)


                })

            }
        }
        ,


        getEntichedParagraphText: function (paragraphInfos) {
            var allOffsets = []
            var allUniqueOffsets = []
            paragraphInfos.offsets.forEach(function (offset) {
                var offsetArray = offset.split("|");
                if (allUniqueOffsets.indexOf(offsetArray[2] + "_" + offsetArray[3]) < 0) {
                    allUniqueOffsets.push(offsetArray[2] + "_" + offsetArray[3])
                    var type = offsetArray[0];
                    //   type=type.substring(type.lastIndexOf("/")+1)
                    allOffsets.push({type: type, start: parseInt(offsetArray[3]), end: parseInt(offsetArray[4])})
                }

            })

            var previousOffset = 0
            var chunks = [];

            //   obj.text=obj.text.replace(/\  /g,"")
            allOffsets.forEach(function (offset, index) {
                chunks.push(paragraphInfos.paragraphText.value.substring(previousOffset, offset.start))

                var color = ontograph.entityTypeColors[offset.type]
                var newText = "<span style='background-color:" + color + "'>" + paragraphInfos.paragraphText.value.substring(offset.start, offset.end) + "</span>"
                chunks.push(newText)
                previousOffset = offset.end

            })
            //  chunks.push(obj.text.substring(previousOffset))
            var htmlText = ""
            chunks.forEach(function (chunk, index) {

                htmlText += chunk
            })
            return htmlText;
        }


    }
    self.setInfosDivHeight = function (height) {
        $("#infosDiv").css("position", "relative")
        $("#infosDiv").css("overflow", "auto")
        var totalHeight = $(window).height() - 30
        $("#graphDiv").height(totalHeight);
        $("#infosDiv").height(height);
        $("#infosDiv").offset({top: (totalHeight - height)});


    }

    return self;
})
()
