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
                Search.searchPlainText(str,function(err, result){

                })
            }

        })
        $("#dialogDiv").dialog({
            autoOpen: false,
                height: self.windowHeight - 100,
                width: "70%",
                modal: true,
        })
    }

    self.queryElastic=function(query, indexes,callback){
if(!indexes)
    indexes=context.elasticQuery.indexes;
        var payload = {
            executeQuery: JSON.stringify(query),
            indexes:JSON.stringify(indexes)

        }
        $.ajax({
            type: "POST",
            url: elasticUrl,
            data: payload,
            dataType: "json",
            success: function (data, textStatus, jqXHR) {
                var xx=data;
                callback(null,data)

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
