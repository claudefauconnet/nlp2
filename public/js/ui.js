var ui = (function () {
    var self = {};


    self.getHitDiv = function (hit) {
        var title = hit._source.title
if(!title)
    title="";

        var htmlHighlight = "<span class='excerpt'>";
        hit.highlight.content.forEach(function (highlight, index) {
            if (index > 0)
                htmlHighlight += "  ...  "
            htmlHighlight += highlight
        })
        htmlHighlight += "<span>"

        var html = "<div class='hit' onclick=Search.searchHitDetails('" + hit._id + "') >" +
            "<span style=' font-size: 12px;font-weight: bold'>" + hit._index + " : " + title + "</span>  " +
            "" + htmlHighlight +
            "" +
            "" +
            "</div>"
        return html;

    }
    self.showResults = function (hits) {
        var html = "";
        hits.forEach(function (hit, index) {
            html += self.getHitDiv(hit)
        })


        $("#resultDiv").html(html);


    }


    self.showHitDetails = function (hit) {
        var htmlHighlight = "<span >";
        hit.highlight.content.forEach(function (highlight, index) {
            if (index > 0)
                htmlHighlight += " <br>...<br> "
            htmlHighlight += highlight
        })
        htmlHighlight += "<span>"
        if (!hit._source.date)
            hit._source.date = ""
        if (!hit._source.title)
            hit._source.title = ""
        var html = "<div class='hitDetail'>" +
            "<div style=' font-size: 12px;font-weight: bold'>" + hit._source.title + "</div>" +
            "<div>" + hit._source.date + "</div>" +
            // "<div>" + hit._source.content + "</div>"+

            htmlHighlight +
            "" +
            "" +
            "</div>"

        $("#dialogDiv").html(html);
        $(".hlt1").css("background-color", " #FFFF00");
        $("#dialogDiv").dialog("open")

    }


    return self;
})()
