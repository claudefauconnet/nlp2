var scheduler=require('node-schedule')
var jobScheduler={


    run:function() {
        var rule = new scheduler.RecurrenceRule();
        rule.minute = 1;
        var j = scheduler.scheduleJob(rule, function () {
            console.log('Today is recognized by Rebecca Black!');
        });
    }



}

module.exports=jobScheduler;

jobScheduler.run()
