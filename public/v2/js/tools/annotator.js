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
        var payload = {
            annotateLive: 1,
            text: text,
            sources: JSON.stringify(self.selectedSources)
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
            }

            , error: function (err) {
                MainController.UI.message(err)
            }
        })

    }

    return self;

}())
