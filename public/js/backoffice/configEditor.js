var configEditor = (function () {
    var self = {};
    var html = "<div id='configEditorDiv'>";

    self.editConfig = function (json) {
        function isString(s) {
            return typeof(s) === 'string' || s instanceof String;
        }


                for (var key in json) {

                    if( isString(json[key])) {
                        html += "<div><span style=' font-weight: bold' id='" + key + "'>" + key + "</span>" ;
                           html+= "<input id='" + key + "' value='" + json[key] + "'>" +"</div>"

                    }
                    else{
                        html += "<div><span style=' font-weight: bold;font-size: larger' >" + key + "</span></div>" ;
                        html+= "<div>"
                            self.editConfig(json[key])
                        html+= "</div>"
                    }

                }

           // }
            html +="</div>";
            $("#mainDiv").html(html)
    }


    return self;


})()




