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
          context.thesauri={}
            result.forEach(function(thesaurusConfig){
                context.thesauri[thesaurusConfig.name]=thesaurusConfig;
            })

        })

      })
    }



    self.editConfigSkosXml = function (create) {
        var formStr = "<div style='width: 500px'><form id='shemaForm'></form></div>"
        $("#thesaurus_mainDiv").html(formStr);

        var json=null;
        if(!create){
            var thesaurusName=$("#thesaurus_select").val();
           var obj=context.thesauri[thesaurusName];
           if(!obj)
             return $("#messageDiv").html("select a thesaurus configuration");
           json={thesaurus:obj}

        }


        configEditor.editJsonForm('shemaForm', context.jsonSchemas.thesaurus, json, null, function (errors, data) {
            if (errors)
                return;
          var payload = {
            saveThesaurusConfig: 1,
            name:data.thesaurus.name,
            content:JSON.stringify(data.thesaurus,null,2)
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
    self.applyToIndex = function () {
        var thesaurusName=$("#thesaurus_select").val();
        var json=context.thesauri[thesaurusName];
        if(!json)
            return $("#messageDiv").html("select a thesaurus configuration");


    }


    return self;

})();
