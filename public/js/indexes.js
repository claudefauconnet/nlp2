
var indexes=(function(){

    var self= {};

    self.loadIndexConfigs=function(callback){
        var payload={
            getIndexConfigs:1,
            indexes:JSON.stringify(config.indexes)
        }
        $.ajax({
            type: "POST",
            url: config.elasticUrl,
            data: payload,
            dataType: "json",
            success: function (data, textStatus, jqXHR) {
                context.indexConfigs=data;
                callback(null, data);

            }
            , error: function (err) {
                console.log(err.responseText)
                    return callback(err)
                }

        });


    }

    self.uncheckAllIndexes=function(){
        $("#indexesCbxes_all").prop("checked", false)
        $(".indexesCbxes").each(function (cbx) {
           $(this).prop("checked",false);
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
            context.question= $('#questionInput').val();

        }


        self.onIndexAllCBXchange = function () {
            var checkedAll = $("#indexesCbxes_all").prop("checked");
            $(".indexesCbxes").each(function (cbx) {
                $(this).prop("checked", checkedAll);

            })
            self.setContextIndexes();
            Search.searchPlainText()
        }


        //select only this index
        self.onIndexSelect = function (index) {
            $("#indexesCbxes_all").prop("checked",false);
            $(".indexesCbxes").each(function (cbx) {
                var id = $(this).attr("id");
                var check=false
                if(id==index)
                    check=true
                $(this).prop("checked", check);

            })
             self.setContextIndexes();
             Search.searchPlainText()
        }






        self.initIndexesDiv = function (checked) {
            var indexes = context.indexes;
            indexesCxbs = "<ul>";

            indexesCxbs += "<span class='ui_title'>Sources</span>";
            indexesCxbs += "<li><input type='checkbox' checked='checked'  id='indexesCbxes_all' onchange='indexes.onIndexAllCBXchange()'>" +
                "Toutes <index> <span class='indexDocCount' id='indexDocCount_all'/></li><li>&nbsp;</li>"
            indexesCxbs += ""
            indexes.forEach(function (index) {

                indexesCxbs += "<li><input type='checkbox' checked='checked' onchange='indexes.onIndexCBXchange(this)' class='indexesCbxes' id='" + index + "'>" +
                    //  index+"<index> </li>"
                    "<span onclick=indexes.onIndexSelect('"+index+"') >"+context.indexConfigs[index].general.label+"</span><span class='indexDocCount' id='indexDocCount_" + index + "'/></li>"
            })
            indexesCxbs += "<ul>";
            $("#indexesDiv").html(indexesCxbs);

            if(!checked)
                self.uncheckAllIndexes();
            self.setContextIndexes()
        }



    return self;

})()
