var mainController = (function () {

    var self = {};

    self.minAutoValidateQuestionLength = 4
    self.windowHeight = $(window).height();
    self.windowWidth = $(window).width();

    self.init0 = function () {

        async.series([
            function(callbackSeries) {
                mainController.bindControls();
                // self.hideUsageDiv();
                $("#questionInput").focus()
                return callbackSeries();
            }

            , function (callbackSeries) {
                indexes.loadIndexConfigs(context.currentUser.groups, function (err, result) {
                    if (err)
                        return
                    return callbackSeries()
                    indexes.initIndexesDiv(false)
                })

            }
            , function (callbackSeries) {
                Entities.loadUserThesauri(context.currentUser.groups, function (err, result) {
                    if (err)
                        return

                    indexes.initIndexesDiv(false)
                    return callbackSeries()
                })
            }
            , function (callbackSeries) {
                return callbackSeries()
            }
        ], function (err) {
            if (err)
                return $("#resultDiv").html(err);
            $("#resultDiv").html("config loaded");

        })


    }

    self.bindControls = function () {
        $("#resultDiv").css("height", self.windowHeight - 230);
        //   $("#questionInput").keyup(function(event){

        $('#questionInput').keyup(function (e) {
            if (e.keyCode == 13) {

                var str = $(this).val();
                context.question = str;
                Search.searchPlainText({question: str}, function (err, result) {

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


    self.addAssciatedWordToQuestion = function (word) {
        var val = $("#questionInput").val()
        var question = val + " " + word
        $("#questionInput").val(question);
        Search.searchPlainText({question: question}, function (err, result) {

        })

    }


    self.showPageControls = function (total) {

        var maxPagesLinks = 10;

        if (total > context.elasticQuery.from) {

            var str = "documents trouvés : " + total + " &nbsp; pages&nbsp;:&nbsp;";
            var k = 1
            if ((context.currentPage + 1) <= (total / context.elasticQuery.size))
                str += "<em onclick='Search.searchPlainText({page:" + (context.currentPage + 1) + "})'> suivante  </a>&nbsp;&nbsp;";
            if (context.currentPage > 0)
                str += "<em onclick='Search.searchPlainText({page:" + (context.currentPage - 1) + "})'> précédente  </em>&nbsp;&nbsp;";


            for (var i = 0; i < total; i++) {
                var linkClass = "";
                if (k == context.currentPage + 1)
                    linkClass = " class='currentPage' ";


                if (i % context.elasticQuery.size == 0) {
                    str += "<em onclick='Search.searchPlainText({page:" + (k - 1) + "})'> " + (k) + "</a>&nbsp;&nbsp;"
                    k++;
                }


                if (i > maxPagesLinks * context.elasticQuery.size) {
                    str += "...";
                    break;
                }
            }


            $("#paginationDiv").html(str)
        }
    }
    self.resetQuestion = function () {
        $("#questionInput").val("");
        $("#resultDiv").html("");
        $(".indexDocCount").html("")
        $("#paginationDiv").html("")
        $("#associatedWordsDiv").html("")
    }

    self.hideUsageDiv = function () {
        if (!context.usageHtml) {
            context.usageHtml = $(".usageDiv").html()
            $(".usageDiv").html("cliquez ici pour le mode d'emploi...")
            $("#resultDiv").css("height", self.windowHeight - 120);
        } else {
            $(".usageDiv").html(context.usageHtml);
            context.usageHtml = null;
            $("#resultDiv").css("height", self.windowHeight - 230);
        }
    }

    self.onThumbnails=function(value){
        if(value=="list"){
            $("#dialogDiv").dialog("close")
        }
        else if(value=="graph"){
           graphController.showGraph()
        }
        else if(value=="stats"){
            statistics.showGraph()
        }
        else if(value=="entities"){
            Entities.showAllEntitiesTree("thesaurus_ctg");

        }

    }

    return self;


})();
