var indexes = (function () {

    var self = {};

    self.loadIndexConfigs = function (userGroups, callback) {
        var payload = {
            getUserIndexConfigs: 1,
            userGroups: JSON.stringify(userGroups)
        }
        $.ajax({
            type: "POST",
            url: appConfig.elasticUrl,
            data: payload,
            dataType: "json",
            success: function (data, textStatus, jqXHR) {
                context.indexConfigs = data;
                callback(null, data);

            }
            , error: function (err) {
                console.log(err.responseText)
                return callback(err)
            }

        });


    }

    self.saveIndexConfig = function (indexName, jsonStr, callback) {

        var payload = {
            saveIndexConfig: 1,
            index: indexName,
            jsonStr: jsonStr
        }
        $.ajax({
            type: "POST",
            url: appConfig.elasticUrl,
            data: payload,
            dataType: "json",
            success: function (data, textStatus, jqXHR) {

                callback(null, data);

            }
            , error: function (err) {
                console.log(err.responseText)
                return callback(err)
            }

        });

    }

    self.deleteIndexConfig = function (config,callback) {
        var payload = {
            deleteIndexConfig: 1,
            config: JSON.stringify(config),
            deleteIndexContent:config.deleteIndexContent
        }
        $.ajax({
            type: "POST",
            url: appConfig.elasticUrl,
            data: payload,
            dataType: "json",
            success: function (data, textStatus, jqXHR) {
                context.indexConfigs = data;
                callback(null, data);

            }
            , error: function (err) {
                console.log(err.responseText)
                return callback(err)
            }

        });


    }


    self.uncheckAllIndexes = function () {
        $("#indexesCbxes_all").prop("checked", false)
        $(".indexesCbxes").each(function (cbx) {
            $(this).prop("checked", false);
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
        context.curentSearchIndexes = indexes;
        context.question = $('#questionInput').val();

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
        $("#indexesCbxes_all").prop("checked", false);
        $(".indexesCbxes").each(function (cbx) {
            var id = $(this).attr("id");
            var check = false
            if (id == index)
                check = true
            $(this).prop("checked", check);

        })
        self.setContextIndexes();
        Search.searchPlainText()
    }


    self.initIndexesDiv = function (checked) {
        var indexes = context.indexConfigs;
        var indexesCxbs = "<ul>";


        indexesCxbs += "<span class='ui_title'>Sources</span>";
        indexesCxbs += "<li><input type='checkbox' checked="+checked+" id='indexesCbxes_all' onchange='indexes.onIndexAllCBXchange()'>" +
            "Toutes <index> <span class='indexDocCount' id='indexDocCount_all'/></li><li>&nbsp;</li>"
        indexesCxbs += ""

        for (var key in context.indexConfigs) {
            var index = context.indexConfigs[key]
            indexesCxbs += "<li><input type='checkbox' checked="+checked+" onchange='indexes.onIndexCBXchange(this)' class='indexesCbxes' id='" + key + "'>" +
                "<span onclick=indexes.onIndexSelect('" + key + "') >" + index.general.label + "</span><span class='indexDocCount' id='indexDocCount_" + key + "'/></li>"
        }
        indexesCxbs += "<ul>";
        $("#indexesDiv").html(indexesCxbs);

        if (true || checked  && Object.keys(context.indexConfigs)>1  )
            self.uncheckAllIndexes();
        self.setContextIndexes()
    }


    self.runIndexation = function () {
        $("#messageDiv").html("");
        $("#socketDiv").html("");
        context.socketAppend=true;
        var config = context.indexConfigs[context.currentIndexName];
        var indexationConfig = context.currentIndexationConfig;
        config.indexation = indexationConfig;
        var payload = {
            runIndexation: 1,
            config: JSON.stringify(config)
        }
        $.ajax({
            type: "POST",
            url: appConfig.elasticUrl,
            data: payload,
            dataType: "json",
            success: function (data, textStatus, jqXHR) {

                $("#messageDiv").html("done")
                context.socketAppend=null;
            }
            , error: function (err) {
                $("#messageDiv").html("error" + err.responseText)
                console.log(err.responseText)
                context.socketAppend=null;

            }

        });


    }


    return self;

})()
