var Annotator = (function () {

        var self = {}
        self.selectedSources;

        self.onLoaded = function () {
            var html = "<button onclick='Annotator.showActionPanel()'>OK</button>"
            $("#sourceDivControlPanelDiv").html(html)

        }

        self.onSourceSelect = function () {

        }


        self.showActionPanel = function () {
            self.selectedSources = $("#sourcesTreeDiv").jstree(true).get_checked()
            $("#actionDiv").html("")
            $("#graphDiv").load("snippets/annotator.html")
            $("#accordion").accordion("option", {active: 2});

        }


        self.annotate = function () {
            var text = $("#Annotator_textArea").val();
            var sourcesLabels = self.selectedSources;
            var sources = [];
            sourcesLabels.forEach(function (label) {
                var source = Config.sources[label]
                source.name = label;
                sources.push(source)
            })
            var payload = {
                annotateLive: 1,
                text: text,
                sources: JSON.stringify(sources)
            }


            $.ajax({
                type: "POST",
                url: Config.serverUrl,
                data: payload,
                dataType: "json",
                /* beforeSend: function(request) {
                     request.setRequestHeader('Age', '10000');
                 },*/

                success: function (data, textStatus, jqXHR) {
                    var x = data
                    self.showAnnotationResult(data)
                }

                , error: function (err) {
                    MainController.UI.message(err)
                }
            })

        }
        self.showAnnotationResult = function (data) {


            var html = "<table  class='center' >"
            html += "<tr><td>&nbsp;</td>"
            var sourcesLabels = self.selectedSources;
            sourcesLabels.forEach(function (source) {
                html += "<td>" + source + "</td>"
            })


            html += "</tr>"
            for (var word in data.entities) {
                html += "<tr><td>" + word + "</td>"

                sourcesLabels.forEach(function (source) {
                    var value = "";
                    if (data.entities[word][source]) {
                        data.entities[word][source].forEach(function (entity) {

                            if (entity.source == source)
                                value += "<span class='Annotator_entitySpan' id='Annotator_entity|" + source + "|" + entity.id + "'>" + "+" + "</span>"
                        })
                    }
                    html += "<td>" + value + "</td>"

                })
                html += "</tr>"
            }
            html += "</table>"

            $("#Annotator_AnnotationResultDiv").html(html)
            $(".Annotator_entitySpan").bind("click", Annotator.onNodeClick)


            var html = ""
            data.missingNouns.forEach(function (item) {
                html += "<span class='Annotator_orphanNouns' id='Annotator_noun|" + "orphan" + "|" + item + "'>" + item + "</span>"

            })
            $("#Annotator_orphanNounsDiv").html(html)
            $(".Annotator_orphanNouns").bind("click", Annotator.onNodeClick)

        }

        self.onNodeClick = function (e) {
            if (e.ctrlKey)
                MainController.UI.showPopup({x:e.pageX-leftPanelWidth,y:e.pageY})

            else
                self.getEntityInfo(e)
        }


        self.getEntityInfo = function (e) {

            var id = e.target.id;
            var array = id.split("|")
            var source = array[1]
            id = array[2]
            Sparql_generic.getNodeInfos(source, id, null, function (err, result) {
                if (err)
                    return MainController.UI.message(err)
                ThesaurusBrowser.showNodeInfos("Annotator_EntityDetailsDiv", "en", id, result);
            })
            Sparql_generic.getSingleNodeAllAncestors(source, id, function (err, result) {
                if (err)
                    return MainController.UI.message(err)

                var html = "Ancestors : "
                result.forEach(function (item) {
                    html += "<span class='Annotator_entityAncestorsSpan' id='Annotator_entity|" + source + "|" + item.broader.value + "'>" + item.broaderLabel.value + "</span>"

                })

                $("#Annotator_EntityAncestorsDiv").html(html)
                $(".Annotator_entityAncestorsSpan").bind("click", Annotator.onNodeClick)

            })

        }


        self.popupActions = {

            copyNodeOnly: function () {

            },
            copyDescendants: function () {

            }
            , copyAscendants: function () {

            }
        }


        return self;

    }
    ()
)
