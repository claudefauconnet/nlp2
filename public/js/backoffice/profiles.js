
var profiles=(function(){
    var self={};

    self.editProfiles=function(){

        var payload={
            getAllProfiles:1
        }
        mainController.post(appConfig.elasticUrl,payload,function(err, result){
            if(err)
                $("#messageDiv").html(err)
            var array=[];
            result.forEach(function(line){
                for(var key in line) {
                    var group = key;
                    if (group != "ADMIN")
                        array.push({group: group, indexes: line[key].indexes})
                }

            })

            var allIndexesNames=Object.keys(context.indexConfigs);
            allIndexesNames.splice(0,0,"")
           var xx= context.jsonSchemas.profiles.profiles.items.properties.indexes.items.enum=allIndexesNames
                var json = {profiles:array};
            var formStr = "<div style='width: 500px'><form id='shemaForm'></form></div>"
                $("#mainDiv").html(formStr);
                configEditor.editJsonForm('shemaForm', context.jsonSchemas.profiles, json,null,function (errors, data) {
                    if(errors)
                        return;

                    var profiles={}
                data.profiles.forEach(function(profile){
                    profiles[profile.group]={indexes:profile.indexes}

                })
                    profiles["ADMIN"]={indexes:"*"}

                    var payload={
                        writeAllProfiles:1,
                        profiles:JSON.stringify(profiles,null,2)


                    }
                    mainController.post(appConfig.elasticUrl,payload,function(err, result) {
                        if(err)
                            $("#messageDiv").html(err)
                    $("#messageDiv").html("profiles saved")
                    })

            })




        })
    }






    return self;

})()
