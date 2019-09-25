var ui = (function () {
    var self = {};


    self.getHitDiv = function (hit) {
        var title = hit._source.title
        if (!title)
            title = "";

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


    self.showHitDetails = function (hit, displayConfig) {

        /*  var htmlHighlight = "<span >";
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
              "</div>"*/


        var html = "";
        //var fields = Object.keys(hit._source);

        var words = self.getQuestionWords(context.question);
        displayConfig.forEach(function (line) {
            var fieldName = Object.keys(line)[0];
            var fieldLabel = line[fieldName]["label"+config.locale] || fieldName;

            var fieldValue = hit._source[fieldName];
            fieldValue = fieldValue || "";

            if (line[fieldName].highlightWords) {
                fieldValue = self.setHighlight(fieldValue, words);
            }

            if (line[fieldName].hyperlink) {
                fieldValue = "<a href='" + fieldValue + "'>" + "cliquez ici" + "</a>"
            }

            if (fieldValue) {
                if (line[fieldName].cssClass)
                    fieldValue="<span class='"+line[fieldName].cssClass+"'>"+fieldValue+"</span>"
                    html += "<B>" + fieldLabel + " : </B>" + fieldValue + "<hr>";
            }


        })


        $("#dialogDiv").html(html);
        $(".hlt1").css("background-color", " #FFFF00");
        $("#dialogDiv").dialog("open")

    }

    self.setHighlight = function (text, highlightedWords) {
        highlightedWords.forEach(function (word) {
            var regex = new RegExp(word, "igm");
            var regex = new RegExp("[., ]" + word + "[., ]", "igm");
            text = text.replace(regex, function (matched, index, original) {
                return "<em class='hlt1'>" + matched + "</em>"
            })
        })
        return text;
    }

    self.getQuestionWords = function (question) {
        var words = [];

        var regexPhrase = /(\w{3,})/ig;// only words and numbers
        var array;
        while ((array = regexPhrase.exec(question)) != null) {
            //  array.forEach(function (line) {
            words.push(array[1]);
        }

        return words;
    }


    return self;
})()
