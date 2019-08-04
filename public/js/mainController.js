var mainController = (function () {

    var self = {};
    var elasticUrl = "../elastic";
    self.minAutoValidateQuestionLength = 4
    self.windowHeight = $(window).height();
    self.windowWidth = $(window).width();

    self.bindControls = function () {

        //   $("#questionInput").keyup(function(event){

        $('#questionInput').keyup(function (e) {
            if (e.keyCode == 13) {

                var str = $(this).val();
                context.question = str;
                Search.searchPlainText(str)
            }

        })
    }

    self.queryElastic=function(query, callback){

        var payload = {
            executeQuery: JSON.stringify(query),
            indexes:JSON.stringify(context.elasticQuery.indexes)

        }
        $.ajax({
            type: "POST",
            url: elasticUrl,
            data: payload,
            dataType: "json",
            success: function (data, textStatus, jqXHR) {
                var xx=data;
                callback(data)

            }
            , error: function (err) {

                console.log(err.responseText)
                if (callback) {
                    return callback(err)
                }
                return (err);
            }

        });



    }


    return self;


})();
