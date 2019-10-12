const async=require("async");
const util = require("./util.");
const socket = require('../../routes/socket.js');
const request = require('request');


var imapCrawler = {

    indexSource: function (config, callback) {


        var index = config.general.index;
        var sqlProxy;

       if (config.connector.subType="mySQL"){
           sqlProxy=mySQLproxy;
       }else{
           return callback("this SQL connector is not allowed");
       }

        var defaultFetchSize = 300;
        var fetchSize = config.connector.fetchSize || defaultFetchSize;
        var schemaProperties = config.schema.mappings[index].properties;
        var fields = Object.keys(schemaProperties);


        var bulkStr = "";
        var totalIndexedRecords = 0
        var offset = 0;
        var resultSize = 1;
        var t0 = new Date().getTime();
        async.whilst(
            function () {//test
                return resultSize > 0;
            },
            function (callbackWhilst) {//iterate
                var sqlFetch = config.connector.sql + " limit " + fetchSize + " offset " + offset;


                sqlProxy.exec(config.connector.connOptions, sqlFetch, function (err, result) {
                    if (err) {
                        callback(err);
                        return;
                    }

                    resultSize = result.length;
                    if (resultSize == 0) {
                        return callback(null, "end");
                    }

                    offset += resultSize;
                    totalIndexedRecords += resultSize;

                    var bulkStr = "";

                    // contcat all fields values in content field
                        result.forEach(function (line) {
                            var record = {};
                            var content = "";

                            fields.forEach(function (field) {
                                var value = line[field];
                                if (!value)
                                    return;
                                if (value == "0000-00-00")
                                    return;
                                content += " " + value;
                                record[field] = value;

                            })
                            record["attachement.content"] = content;
                            var incrementRecordId = util.getStringHash(content);
                            var id = "R" + incrementRecordId;

                            bulkStr += JSON.stringify({index: {_index: index, _type: index, _id: id}}) + "\r\n"
                            bulkStr += JSON.stringify(record) + "\r\n"

                        })

                        var options = {
                            method: 'POST',
                            body: bulkStr,
                            encoding: null,
                            headers: {
                                'content-type': 'application/json'
                            },
                            url: elasticUrl + "_bulk"
                        };

                        request(options, function (error, response, body) {

                            if (error)
                                return callback(err);
                            var message = "indexed " + totalIndexedRecords.length+" records ";
                            socket.message(message)
                            return callback()
                        })


                    }

                ,

                    function (err, result) {//end
                        if (err) {
                            callback(err);

                        } else {
                            var duration = new Date().getTime() - t0;
                            var message = "*** indexation done : " + totalIndexedRecords.length  +" records  in " + duration + " msec.";
                            callback(null, "done");
                        }

                    }

                );
            })
    }





}
module.exports = imapCrawler;
