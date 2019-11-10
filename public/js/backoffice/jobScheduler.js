var jobScheduler=(function(){

    var self={}


    self.loadJobs=function() {

        var payload = {
            getAllJobs: 1
        }
        mainController.post(appConfig.elasticUrl, payload, function (err, result) {
            if (err)
                $("#messageDiv").html(err)
            context.jobs=result;
        })
    }


    self.saveJobs=function(){
        var payload = {
            saveAllJobs: 1,
            jobsStr:JSON.stringify(context.jobs,null,2)
        }
        mainController.post(appConfig.elasticUrl, payload, function (err, result) {
            if (err)
                $("#messageDiv").html(err)
            $("#messageDiv").html(result)
        })
    }

   self.editJob=function(){


       var indexName=context.currentIndexName;
       if(!indexName)
           return alert ("select an index")
    context.jsonSchemas.job.job.properties.indexName.default=indexName
        var json=null;
       var formStr = "<div style='width: 500px'><form id='shemaForm'></form></div>"
       $("#mainDiv").html(formStr);
        configEditor.editJsonForm('shemaForm', context.jsonSchemas.job, json,null,function (errors, data) {
           context.jobs[data.job.indexName]=data.job
           self.saveJobs()

        })


    }

    self.editScheduler=function(){
var html="<button onclick='jobScheduler.startScheduler()'> start Schduler</button>" +
    "<button onclick='jobScheduler.stopScheduler()'> stop Schduler</button>"
        $("#mainDiv").html(html);
    }

    self.startScheduler=function(){
        var payload = {
            jobScheduler: 1,
           run:1
        }
        mainController.post(appConfig.elasticUrl, payload, function (err, result) {
            if (err)
                $("#messageDiv").html(err)
            $("#messageDiv").html(result)
        })

    }


    self.stopScheduler=function(){
        var payload = {
            jobScheduler: 1,
            stop:1
        }
        mainController.post(appConfig.elasticUrl, payload, function (err, result) {
            if (err)
                $("#messageDiv").html(err)
            $("#messageDiv").html(result)
        })


    }





    return self;



})()
