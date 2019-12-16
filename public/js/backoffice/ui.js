var ui = (function () {
    var self = {};
    self.jsonEditor = null;


    self.initSourcesList = function (reloadFromServer, selectedSource) {
        function load() {
            var indexNames = Object.keys(context.indexConfigs);
            indexNames.sort();

            mainController.fillSelectOptions("sourcesSelect", indexNames);
            if (selectedSource)
                $("#sourcesSelect").val(selectedSource)
        }

        if (reloadFromServer) {
            indexes.loadIndexConfigs(context.currentUser.groups, function (err, result) {
                if (err)
                    return $("#messageDiv").html(err)
                load();
            })
        } else {
            load();
        }


    }

    self.showIndexConfig = function () {
        if (!context.currentIndexName)
            return alert("select an index ")
        var config = context.indexConfigs[context.currentIndexName];
        if (config.connector.filePath)
            config.connector.filePath = config.connector.filePath.replace(/\\+/g, "\\")
        if (config.connector.dirPath)
            config.connector.dirPath = config.connector.dirPath.replace(/\\+/g, "\\")

        $("#mainDiv").html("<div>" +
            "<span class='title'>index : " + context.currentIndexName + "</span>&nbsp;&nbsp;" +
            "<button onclick='mainController.saveIndexConfig()'>Save</button>" +
            " <button onclick='mainController.deleteIndexConfig()'>Delete</button>" +
            " <button onclick='mainController.duplicateCurrentIndexConfig()'>Duplicate</button>" +
            "</div>" +
            "<hr> <pre id=\"json-display\"></pre>\n");
        self.jsonEditor = new JsonEditor('#json-display', config);


    }

    self.deleteIndexConfig = function (indexName) {
        if (!indexName)
            indexName = context.currentIndexName;


        function exec() {
            indexes.deleteIndexConfig(config, function (err, result) {
                if (err)
                    return $("#messageDiv").html(err);
                $("#messageDiv").html(result.result);
                indexes.loadIndexConfigs(context.currentUser.groups, function (err, result) {
                    if (err)
                        return $("#messageDiv").html("indexes non chargés" + err);
                    ui.initSourcesList();
                })

            })
        }

        if (confirm("Delete index configuration :" + indexName)) {


            var config = context.indexConfigs[indexName];
            if (confirm("Delete also Index content ?")) {
                if (!config.indexation) {
                    ui.showIndexationForm(function (data) {
                        config.indexation = data.indexation;
                        config.deleteIndexContent = true;
                        exec()
                    })

                }
            } else
                exec()


        }

    }


    self.showIndexationForm = function (callback) {
        if (!context.currentIndexName)
            return alert("select an index ")
        var indexName = context.currentIndexName;


        var formStr = "<div style='width: 500px'><form id='shemaForm'></form></div>"

        var json = {indexation: context.indexConfigs[indexName].indexation};
        $("#mainDiv").html(formStr);
        configEditor.editJsonForm('shemaForm', context.jsonSchemas.indexation, json, null, function (err, data) {
            callback(data);
        })


    }


    self.onIndexationFormOK = function (data) {
        context.currentIndexationConfig = data.indexation;
        $("#mainDiv").html(
            "<div><button onclick='configEditor.saveIndexationConfig()'>save indexation config</button> "
            + "<button onclick='indexes.runIndexation()'>run indexation</button> " +
            "</div><div id='socketDiv'  style='font: italic 18px;color:blue'></div>"
        );


    }


    self.selectIndexConfig = function (indexName) {
        $("#leftAccordion").accordion({active: 0});
        context.currentIndexName = indexName;
        $("#mainDiv").html("");

    }


    return self;
})()
