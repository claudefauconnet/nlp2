var ui = (function () {
    var self = {};


    self.getHitDiv = function (hit, displayConfig) {
        var indexLabel = context.indexConfigs[hit._index].general.label
        var html = "<div class='hit' onclick=Search.searchHitDetails('" + hit._id + "') >" +
            "<span style=' font-size: 12px;font-weight: bold'>" + indexLabel + " : </span>  " +
            "" + self.getHitHtml(hit, displayConfig, "list") +
            "" +
            "" +
            "</div>"
        return html;

    }
    self.showResultList = function (hits, displayConfigs) {
        var html = "";
        hits.forEach(function (hit, index) {
            var displayConfig = context.indexConfigs[hit._index].display
            html += self.getHitDiv(hit, displayConfig)
        })


        $("#resultDiv").html(html);


    }


    self.showHitDetails = function (hit) {
        var displayConfig = context.indexConfigs[hit._index].display;
        var indexLabel = context.indexConfigs[hit._index].general.label
        var html = "<b> Source : </b><span class='title'>" + indexLabel + "</span><hr> " + self.getHitHtml(hit, displayConfig, "details");

        $("#dialogDiv").html(html);
        $(".hlt1").css("background-color", " #FFFF00");
        $("#dialogDiv").dialog("open")

    }

    self.setHighlight = function (text, highlightedWords) {
        if(highlightedWords.length>2)
            return text;
        highlightedWords.forEach(function (word) {
            word = word.replace(/\*/g, "")
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

    self.getHitHtml = function (hit, displayConfig, template) {
        var words = self.getQuestionWords(context.question);
        var html = "";
        displayConfig.forEach(function (line) {


            var fieldName = Object.keys(line)[0];
            var fieldLabel = line[fieldName]["label" + appConfig.locale] || fieldName;
            var fieldValue;
            if (fieldName.indexOf(".") > -1) {// when fields are objects (attachment.content...)
                var subFields = fieldName.split(".")
                fieldValue = null;
                subFields.forEach(function (field) {
                    if (!fieldValue)
                        fieldValue = hit._source[field];
                    else
                        fieldValue = fieldValue[field]
                })

            } else {
                fieldValue = hit._source[fieldName];
            }


            fieldValue = fieldValue || "";
            if (fieldValue.replace) {
                fieldValue = fieldValue.replace(/\n{2}/gm, "<br>")
                fieldValue = fieldValue.replace(/\n/gm, "<br>")
            }
            if (template == "details" || [fieldName].highlightWords) {
                fieldValue = self.setHighlight(fieldValue, words);
            }

            if (line[fieldName].hyperlink) {
                fieldValue = "<a href='" + fieldValue + "'>" + "cliquez ici" + "</a>"
            }


            var cssClass = line[fieldName].cssClass;


            if (cssClass == "excerpt" && template == "list") {
                html += "<span class='text'>";
                html += fieldValue + "  "
                return;
            } else if (cssClass) {
                if (cssClass == "date" && fieldValue != "") {
                    var date = new Date(fieldValue)
                    fieldValue = date.toLocaleDateString("fr-FR");
                }

                fieldValue = "<span class='" + template + " " + cssClass + "'>" + fieldValue + "</span>";


                if (template == "details") {
                    html += "<B>" + fieldLabel + " : </B>" + fieldValue + "<hr>";
                } else {
                    html += fieldValue + "&nbsp;&nbsp;";
                }
            }


        })
        if (hit.highlight) {// traitement special
            html += "<span class='excerpt'>";
            hit.highlight[appConfig.contentField].forEach(function (highlight, index) {
                if (index > 0)
                    html += "  ...  "
                html += highlight
            })
            html += "<span>"
        }
        return html;
    }


    return self;
})()
