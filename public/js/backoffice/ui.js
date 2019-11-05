var ui = (function () {
    var self = {};
    self.jsonEditor = null;


    self.initSourcesList = function () {
        var indexNames = Object.keys(context.indexConfigs);
        indexNames.sort();

        mainController.fillSelectOptions("sourcesSelect", indexNames);


    }

    self.showIndexConfig = function () {
        if(!context.currentIndexName)
        return alert("select an index ")
        var config = context.indexConfigs[context.currentIndexName];


        $("#mainDiv").html("<div>" +
            "<span class='title'>index : " + context.currentIndexName + "</span>&nbsp;&nbsp;" +
            "<button onclick='mainController.saveIndexConfig()'>Save</button>" +
            " <button onclick='mainController.deleteIndexConfig()'>Delete</button>" +
            " <button onclick='mainController.duplicateCurrentIndexConfig()'>Duplicate</button>" +
            "</div>" +
            "<hr> <pre id=\"json-display\"></pre>\n");
        self.jsonEditor = new JsonEditor('#json-display', config);


    }


    self.showIndexationForm = function () {
        if(!context.currentIndexName)
            return alert("select an index ")
        var indexName = context.currentIndexName;


        var formStr = "<div style='width: 500px'><form id='shemaForm'></form></div>"

        var json = context.indexConfigs[indexName].indexation;
        $("#mainDiv").html(formStr);
        configEditor.editJsonForm('shemaForm', context.jsonSchemas.indexation, null, null,function (errors, data) {
           context.currentIndexationConfig=data.indexation;
            $("#mainDiv").html(
                "<div><button onclick='configEditor.saveIndexationConfig()'>save indexation config</button> "
            +"<button onclick='indexes.runIndexation()'>run indexation</button> " +
                "</div><div id='socketDiv'  style='font: italic 18px;color:blue'></div>"
            );

        })


    }

    self.selectIndexConfig = function (indexName) {
        context.currentIndexName = indexName;

    }


    return self;
})()
