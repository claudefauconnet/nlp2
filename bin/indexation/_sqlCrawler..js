const async = require("async");
const util = require("./util.");
const socket = require('../../routes/socket.js');
const request = require('request');

const mySQLproxy = require("../mySQLproxy.");


var sqlCrawler = {

    indexSource: function (config, callback) {


        var index = config.general.indexName;
        var sqlProxy;

        if (config.connector.subType = "mySQL") {
            sqlProxy = mySQLproxy;
        } else {
            return callback("this SQL connector is not allowed");
        }

        var defaultFetchSize = 300;
        var fetchSize = config.connector.fetchSize || defaultFetchSize;
        var schemaProperties = config.schema.mappings[index].properties;
        var fields = Object.keys(schemaProperties);


        var bulkStr = "";
        var totalSqlRecords = 0
        var indexedFiles=0;
        var offset = 0;
        var resultSize = 1;
        var t0 = new Date().getTime();
        async.whilst(
            function (callbackTest) {//test
                return callbackTest(null, resultSize > 0);
            },
            function (callbackWhilst) {//iterate
                resultSize = 0;
                var sqlFetch = config.connector.sqlQuery + " limit " + fetchSize + " offset " + offset;


                sqlProxy.exec(config.connector.connOptions, sqlFetch, function (err, result) {
                    if (err) {
                        callbackWhilst(err);
                        return;
                    }

                    resultSize = result.length;
                    if (resultSize == 0) {
                        return callbackWhilst(null, "end");
                    }

                    offset += resultSize;
                    totalSqlRecords += resultSize;

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
                        record["attachment.content"] = content;
                        var incrementRecordId = util.getStringHash(content);
                        record.incrementRecordId = incrementRecordId;
                        var id = "R" + incrementRecordId;


                        if (config.incrementRecordIds.indexOf(incrementRecordId) < 0) {

                            bulkStr += JSON.stringify({index: {_index: index, _type: index, _id: id}}) + "\r\n"
                            bulkStr += JSON.stringify(record) + "\r\n";
                         indexedFiles+=1;
                        }

                    })

                    if (bulkStr == "")
                        return callbackWhilst();
                    var options = {
                        method: 'POST',
                        body: bulkStr,
                        encoding: null,
                        headers: {
                            'content-type': 'application/json'
                        },
                        url: config.indexation.elasticUrl + "_bulk"
                    };

                    request(options, function (error, response, body) {
                        if (error) {
                            return callbackWhilst(error)

                        }
                        if (body.error) {
                            if (body.error.reason) {
                                return callbackWhilst(body.error.reason);
                            } else {
                                return callbackWhilst(body.error);
                            }
                        }


                        var message = "indexed " + indexedFiles+"/"+totalSqlRecords + " records ";
                        socket.message(message)
                        return callbackWhilst()
                    })


                })
            }

            ,

            function (err, result) {//end
                if (err)
                    return callback(err);


                var duration = new Date().getTime() - t0;
                var message = "*** indexation done : " + indexedFiles + "/" + totalSqlRecords + " records  in " + duration + " msec.";
                callback(null, "done");


            }
        );

    }


}
module.exports = sqlCrawler;
