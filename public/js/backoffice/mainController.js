var mainController = (function () {

    var self = {};

    self.urlPrefix = "."
    self.totalDims = {};

    self.leftPanelWidth = 250;


    self.init0 = function () {
        indexes.loadIndexConfigs(["*"], function (err, result) {

            if (err)
                $("#messageDiv").html("indexes non chargés" + err);
            context.indexConfigs = result;
            ui.showIndexList();

        })
        self.initSocket();


    }

    self.initSocket=function(){
        var socket = io();
        socket.on('connect', function (data) {
            socket.emit('join', 'Hello World from client');
        });
        socket.on('messages', function (message) {

            if (!message || message.length == 0)
                return $("#socketDiv").html("<i>" + message.substring(2) + "<i>");

        })
    }


    self.bindControls = function () {

        //   $("#questionInput").keyup(function(event){


        $("#dialogDiv").dialog({
            autoOpen: false,
            height: self.windowHeight - 100,
            width: "70%",
            modal: true,
        })
    }

    self.setDivsSize = function () {
        $("#left").width(self.leftPanelWidth)
        mainController.totalDims.w = $(window).width();
        mainController.totalDims.h = $(window).height();
        var dataTableWidth = mainController.totalDims.w - (self.leftPanelWidth);
        $("#mainDiv").width(mainController.totalDims.w - (self.leftPanelWidth + 20)).height(mainController.totalDims.h - 20);
        $("#graphWrapperDiv").width(mainController.totalDims.w - (self.leftPanelWidth + 20)).height(mainController.totalDims.h - 20);
        $("#listWrapperDiv").width(mainController.totalDims.w - (self.leftPanelWidth + 20)).height(mainController.totalDims.h - 20);
        //  $("#dataTableDiv").width(dataTableWidth).height(500);
        //  $(".dataTableDiv").width(dataTableWidth).height(mainController.totalDims.h - 50);

    }

    self.saveIndexConfig = function (indexName,callback) {
        if (!indexName)
            indexName = context.currentIndexName;
        try {
            var jsonStr = JSON.stringify(ui.jsonEditor.get(), null, 2);
            jsonStr= jsonStr.replace(/\\\\\\/g,"\\\\");
            indexes.saveIndexConfig(indexName, jsonStr, function (err, result) {
                if (err)
                    return $("#messageDiv").html(err);
                $("#messageDiv").html(result.result);
                if(callback)
                    return callback(null,result)
            })
        } catch (e) {
            return alert(e.toString());
        }


    }


    self.deleteIndexConfig = function (indexName) {
        if (!indexName)
            indexName = context.currentIndexName;
        if (confirm("Delete index configuration :" + indexName)) {

            indexes.deleteIndexConfig(context.currentIndexName, function (err, result) {
                if (err)
                    return $("#messageDiv").html(err);
               $("#messageDiv").html(result.result);
                    indexes.loadIndexConfigs(["*"], function (err, result) {
                        ui.showIndexList();
                    })

            })
        }

    }

    self.duplicateCurrentIndexConfig = function () {
        var newIndexName = prompt("enter new index name");
        if (newIndexName && newIndexName != "")
            self.saveIndexConfig(newIndexName,function(err,result){
            if(!err)
                indexes.loadIndexConfigs(["*"], function (err, result) {
                    ui.showIndexList();
                })

        });


    }

self.indexCurrentSource=function() {
    var config = context.indexConfigs[context.currentIndexName];

}

    return self;


})();
