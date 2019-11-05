var jobScheduler=(function(){

    var self={}


   self.editJobs=function(){

        var formStr = "<div style='width: 500px'><form id='shemaForm'></form></div>"
        $("#mainDiv").html(formStr);
       var allIndexesNames=Object.keys(context.indexConfigs);
       allIndexesNames.splice(0,0,"")
       var xx= context.jsonSchemas.jobs.jobs.items.properties.indexName.enum=allIndexesNames
        var json=null;
        configEditor.editJsonForm('shemaForm', context.jsonSchemas.jobs, json,null,function (errors, data) {
            if (errors)
                return;
        })


    }

    self.editScheduler=function(){
var html="<button onclick='jobScheduler.startScheduler()'> start Schduler</button>" +
    "<button onclick='jobScheduler.stopScheduler()'> stop Schduler</button>"
        $("#mainDiv").html(html);
    }

    self.startScheduler=function(){


    }


    self.stopScheduler=function(){


    }





    return self;



})()
