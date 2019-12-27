var ui = (function () {
    var self = {};


    self.getHitDiv = function (hit, displayConfig) {
        var indexLabel = context.indexConfigs[hit._index].general.label
        var html = "<div class='hit' onclick=Search.searchHitDetails('" + hit._id + "') >" +
            "<span style=' font-size: 12px;color:brown; font-weight: bold'>" + indexLabel + " : </span>  " +
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
    self.getEntitiesLegendDiv = function () {
        if (!context.currententityNames)
            return "";
        var html = "<div style='display:flex;flex-direction:column; border: solid;1px; border-radius: 5px;width: 200px'>Entities"
        context.currententityNames.forEach(function (entity, entityIndex) {
            html += "<em  class='E_" + entityIndex + "'>" + entity + "</em>&nbsp;";
        })
        html += "</div>"
        return html
    }

    self.showHitDetails = function (hit) {
        var displayConfig = context.indexConfigs[hit._index].display;
        var indexLabel = context.indexConfigs[hit._index].general.label;

        for(var thesaurus in context.thesauri) {
            if (hit._source["entities_" + thesaurus])
                hit = Entities.setHitEntitiesHiglight(hit, hit._source["entities_" + thesaurus])
        }
        var hitHtml = self.getHitHtml(hit, displayConfig, "details")

        var entitieLegendHtml = self.getEntitiesLegendDiv();
        var html="<div id='entityExtractDiv'></div>"
        html+= "<div style='display:flex;flex-direction:row' >" +entitieLegendHtml
        html +="<div id='detailsContentDiv'> <b> Source : </b><span class='title'>" + indexLabel + "</span><hr> "
        html += hitHtml+"</div>"
        html += "</div>";

        $("#dialogDiv").html(html);
        $(".hlt1").css("background-color", " #FFFF00");
        $(".dialogDiv").css("top", " 100px");
        $("#dialogDiv").dialog("open")

        $("em[class^='E_']").bind("click", function () {
            var x = $(this)
            var emClass = $(this).attr('class');
           // var index = parseInt(emClass.substring(emClass.lastIndexOf("_") + 1))
            Entities.showEntityExtracts(emClass)

        })

    }

    self.setHighlight = function (text, highlightedWords) {
        if (highlightedWords.length > 2)
            return text;
        if (!text.replace)
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

        if (!displayConfig || displayConfig.length == 0 && template == "details") {
            delete hit._source["attachment.content"]
            return JSON.stringify(hit._source, null, 2).replace(/\n/g, "<br>")
        }

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
                //format date
                fieldValue = fieldValue.replace(/(\d{4})-(\d{2})-(\d{2}).*Z/, function (a, year, month, day) {
                    if (appConfig.locale == "Fr")
                        return "" + day + "/" + month + "/" + year
                    return "" + year + "/" + month + "/" + day
                })
            }
            if (template == "details" || [fieldName].highlightWords) {
                fieldValue = self.setHighlight(fieldValue, words);
            }

            if (line[fieldName].hyperlink) {
                fieldValue = "<a href='" + fieldValue + "'>" + "cliquez ici" + "</a>"
            }


            var cssClass = line[fieldName].cssClass;

            if (!cssClass)
                cssClass = "";


            if (template == "details") {
                fieldValue = "<span class='" + template + "'>" + fieldValue + "</span>";
                html += "<B>" + fieldLabel + " : </B>" + fieldValue + "<hr>";
            } else {
                fieldValue = "<span class='" + template + " " + cssClass + "'><b>" + fieldValue + "</b></span>";
                html += fieldValue + "&nbsp;&nbsp;";
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
