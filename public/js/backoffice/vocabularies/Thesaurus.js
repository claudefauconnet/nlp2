var Thesaurus = (function () {
    var self = {};
    self.initDialog = function () {

        $("#mainDiv").load("htmlSnippets/thesaurus.html", function () {

            var payload = {
                getAllThesaurusConfig: 1
            }
            mainController.post(appConfig.elasticUrl, payload, function (err, result) {
                if (err)
                    return $("#messageDiv").html(err);
                mainController.fillSelectOptions("thesaurus_select", result, "true", "name", "name");
                context.thesauri = {}
                result.forEach(function (thesaurusConfig) {
                    context.thesauri[thesaurusConfig.name] = thesaurusConfig;
                })

            })

        })
    }


    self.editConfigSkosXml = function (create) {
        var formStr = "<div style='width: 500px'><form id='shemaForm'></form></div>"
        $("#thesaurus_mainDiv").html(formStr);

        var json = null;
        if (!create) {
            var thesaurusName = $("#thesaurus_select").val();
            var obj = context.thesauri[thesaurusName];
            if (!obj)
                return $("#messageDiv").html("select a thesaurus configuration");
            json = {thesaurus: obj}

        }


        configEditor.editJsonForm('shemaForm', context.jsonSchemas.thesaurus, json, null, function (errors, data) {
            if (errors)
                return;
            var payload = {
                saveThesaurusConfig: 1,
                name: data.thesaurus.name,
                content: JSON.stringify(data.thesaurus, null, 2)
            }
            mainController.post(appConfig.elasticUrl, payload, function (err, result) {
                if (err)
                    return $("#messageDiv").html(err);

                Thesaurus.initDialog()
                return $("#messageDiv").html("thesaurus saved");

            })

        })
    }
    self.delete = function () {
    }

    self.showJson = function () {

    }
    self.showApplyToIndexDialog = function () {
        var thesaurusName = $("#thesaurus_select").val();
        var json = context.thesauri[thesaurusName];
        if (!json)
            return $("#messageDiv").html("select a thesaurus configuration");

        var thesaurusIndexes = self.getThesaurusIndexAssociations(thesaurusName);
        var indexes = Object.keys(context.indexConfigs);
        var optionsStr = "<option></option>"
        indexes.forEach(function (index) {
var selected="";
if(thesaurusIndexes.indexOf(index)>-1)
    selected="selected='selected'"
            optionsStr += "<option "+selected+">" + index + "</option>"
        })
        var html = "Indexes<div><select id='thesaurus_indexSelect' multiple='true' size='10'>" + optionsStr + "</select> "

        asyncDialog.show("thesaurus_mainDiv", html, function (err, result) {
            var indexes = $("#thesaurus_indexSelect").val();
            indexes.forEach(function (index) {

                Thesaurus.associateToIndex(index, thesaurusName)

            })


        })

        self.associateToIndex = function (index, thesaurus) {
            var indexConfig = context.indexConfigs[index];

            if (!indexConfig.thesaurii)
                indexConfig.thesaurii = {};
            var thesaurusName = $("#thesaurus_select").val();
            var json = context.thesauri[thesaurus];
            indexConfig.thesauri[thesaurus] = json;
            configEditor.saveIndexationConfig(index);

        }
    }

    self.getThesaurusIndexAssociations = function (thesaurus) {
        var thesauriIndexes = [];
        for (var key in context.indexConfigs) {
            if (context.indexConfigs[key].thesauri) {
                if (context.indexConfigs[key].thesauri[thesaurus]) {
                    thesauriIndexes.push(key)
                }
            }

        }
        return thesauriIndexes;
    }


    return self;

})();
