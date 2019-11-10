const schedule = require('node-schedule');
const configLoader = require('../configLoader.');
const async = require('async');
const logger = require('../logger.')
const indexer = require('./indexer.')
var jobScheduler = {

    runningjobs: [],


    run: function (callback) {


        function runJob(job, callback) {
            configLoader.loadIndexConfig(job.indexName, function (err, result) {
                if (err)
                    return callback();
                var config = result;
                config.indexation = {deleteOldIndex: job.deleteOldIndex, elasticUrl: job.elasticUrl}
                indexer.runIndexation(config, function (err, result) {
                    if (err) {
                        logger.info(err)
                        return callback();

                    }
                    logger.info("index " + job.indexName + " run successfully at " + new Date() + "   " + result)

                })

            })


        }

        function getCronStr(job) {
            var minute = 0
            var hour = 0
            if (job.runTime) {
                var array = job.runTime.split(":");
                hour = parseInt(array[0]);
                minute = parseInt(array[1]);
            }


            if (job.runEvery == "minute")
                return '* * * * *'
            else if (job.runEvery == "hour")
                return '0 * * * *'
            else if (job.runEvery == "day")
                return '' + minute + ' ' + hour + ' * * *'
            else if (job.runEvery == "week")
                return '' + minute + ' ' + hour + ' * * 0'
            else if (job.runEvery == "month")
                return '' + minute + ' ' + hour + ' 1 * *'
        }


        configLoader.getAllJobs(function (err, result) {
            if (err)
                return callback(err);
            var jobs = result;

            var jobsArray = [];
            for (var key in jobs) {
                jobsArray.push(jobs[key])
            }

            async.eachSeries(jobs, function (job, callbackEach) {
                var cronStr = getCronStr(job)
                setTimeout(function () {
                    var runningJob = schedule.scheduleJob(cronStr, function () {
                        runJob(job, function (err, result) {

                        })
                    })
                    jobScheduler.runningjobs.push(runningJob)
                    callbackEach();
                }, 5000)
            }, function (err) {
                if (err)
                    return callback(err)
                return callback(null, "all  jobs started :" + jobsArray.length)
            })
        })
    },
    stop: function (callback) {
        var n = jobScheduler.runningjobs.length;
        jobScheduler.runningjobs.forEach(function (runningjob) {
            runningjob.cancel();
        })

        callback(null, n + " jobs cancelled")

    }


}

module.exports = jobScheduler;

//jobScheduler.run()
