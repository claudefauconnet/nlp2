var mainController = (function () {

    var self = {};

    self.minAutoValidateQuestionLength = 4
    self.windowHeight = $(window).height();
    self.windowWidth = $(window).width();

    self.init0= function () {
        context = config;
        mainController.bindControls();
        mainController.initIndexesDiv()
    }

    self.bindControls = function () {

        //   $("#questionInput").keyup(function(event){

        $('#questionInput').keyup(function (e) {
            if (e.keyCode == 13) {

                var str = $(this).val();
                context.question = str;
                Search.searchPlainText({question:str}, function (err, result) {

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
        Search.searchPlainText({question:question}, function (err, result) {

        })

    }


    self.onIndexCBXchange = function (cbx) {
        var allchecked = true;

        $(".indexesCbxes").each(function (cbx) {
            if (!$(this).prop("checked"))
                allchecked = false;
        })

        $("#indexesCbxes_all").prop("checked", allchecked)
        self.setContextIndexes();
        Search.searchPlainText()


    }
    self.setContextIndexes = function () {
        var indexes = [];
        $(".indexesCbxes").each(function (cbx) {

            var id = $(this).attr("id");
            if ($(this).prop("checked"))
                indexes.push(id);

        })
        context.indexes = indexes;

    }


    self.onIndexAllCBXchange = function () {
        var checkedAll = $("#indexesCbxes_all").prop("checked");
        $(".indexesCbxes").each(function (cbx) {
            $(this).prop("checked", checkedAll);

        })
        self.setContextIndexes();
        Search.searchPlainText()
    }


    self.initIndexesDiv = function () {
        var indexes = context.indexes;
        indexesCxbs = "<span class='ui_title'>Sources</span><ul>";

        indexesCxbs += "<li><input type='checkbox' checked='checked'  id='indexesCbxes_all' onchange='mainController.onIndexAllCBXchange()'>" +
            "Toutes <index> <span class='indexDocCount' id='indexDocCount_all'/></li>"
        indexesCxbs += ""
        indexes.forEach(function (index) {

            indexesCxbs += "<li><input type='checkbox' checked='checked' onchange='mainController.onIndexCBXchange(this)' class='indexesCbxes' id='" + index + "'>" +
                //  index+"<index> </li>"
                index + " <span class='indexDocCount' id='indexDocCount_" + index + "'/></li>"
        })
        indexesCxbs += "<ul>";
        $("#indexesDiv").html(indexesCxbs);

    }


    self.showPageControls = function (total) {

        var maxPagesLinks = 10;
    
        if (total > context.elasticQuery.from) {

            var str = "documents trouvés : "+total+" &nbsp; pages&nbsp;:&nbsp;";
            var k = 1
            if ((context.currentPage+1) <= (total/context.elasticQuery.size) )
            str += "<em onclick='Search.searchPlainText({page:"+(context.currentPage+1)+"})'> suivante  </a>&nbsp;&nbsp;";
            if (context.currentPage > 0)
                str += "<em onclick='Search.searchPlainText({page:"+(context.currentPage-1)+"})'> précédente  </em>&nbsp;&nbsp;";


            for (var i = 0; i < total; i++) {
                var linkClass = "";
                if (k == context.currentPage+1)
                    linkClass = " class='currentPage' ";


                if (i % context.elasticQuery.size == 0) {
                    str += "<em onclick='Search.searchPlainText({page:"+(k-1)+"})'> " + (k) + "</a>&nbsp;&nbsp;"
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
    self.resetQuestion=function(){
        $("#questionInput").val("");
        $("#resultDiv").html("");
        $(".indexDocCount").html("")
        $("#paginationDiv").html("")
        $("#associatedWordsDiv").html("")
    }

    self.hideUsageDiv=function(){
        $("#usageDiv").hide()
    }

    return self;


})();
