const async = require("async");
const util = require("./util.");
const socket = require('../../routes/socket.js');
const request = require('request');
const fs = require('fs');

var csvCrawler = {

    indexSource: function (config, callback) {


        var data = [];
        var headers = [];
        var bulkStr = "";
        var t0 = new Date();
        async.series([


            // read csv
            function (callbackseries) {
                csvCrawler.readJson(config.connector, function (err, result) {
                    if (err)
                        return callbackseries(err);
                    data = result.data;
                    headers = result.headers;

                    return callbackseries();

                })

            }
            ,
            //prepare payload
            function (callbackseries) {


                data.forEach(function (record, indexedLine) {
                    var lineContent = "";

                    headers.forEach(function (header) {
                        var key = header;
                        var value = record[header];
                        if (!value)
                            return;
                        if (value == "0000-00-00")
                            return;
                        lineContent += value + ";";
                        record[key] = value;

                    })
                    record[config.schema.contentField] = lineContent;
                    var incrementRecordId = util.getStringHash(lineContent);
                    record.incrementRecordId = incrementRecordId;
                    var id = "R" + incrementRecordId;


                    if (config.incrementRecordIds.indexOf(incrementRecordId) < 0) {

                        bulkStr += JSON.stringify({index: {_index: config.general.indexName, _type: config.general.indexName, _id: id}}) + "\r\n"
                        bulkStr += JSON.stringify(record) + "\r\n";

                    }
                })

                callbackseries();
            },
            function (callbackseries) {
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
                        return callbackseries(error)

                    }
                    if (body.error) {
                        if (body.error.reason) {
                            return callbackseries(body.error.reason);
                        } else {
                            return callbackseries(body.error);
                        }
                    }


                    var message = "indexed " + data.length + " records ";
                    socket.message(message)
                    return callbackseries()
                })
            }


        ], function (err) {
            if (err)
                return callback(err);

            var duration = new Date().getTime() - t0;
            var message = "*** indexation done : " + data.length + " records  in " + duration + " msec.";
            socket.message(message)
            callback(null, "done");

        })
    }


    , generateDefaultMappingFields: function (connector, callback) {
        var data = fs.readFileSync(config.connector.filePath);
        data = JSON.parse("" + data);
        var fields = {};
        data.forEach(function (line) {
            Object.keys(line).forEach(function (key) {
                if (!fields[key]) {
                    if (util.isFloat(line[key]))
                        fields[key] = {type: "float"};
                    else if (util.isInt(line[key]))
                        fields[key] = {type: "integer"};
                    else
                        fields[key] = {type: "text"};

                }

            })

        })

        return callback(null, fields);

    },
    readJson: function (connector, lines, callback) {

        var headers = [];
        var dataArray = [];
        try {
            var str = "" + fs.readFileSync(config.connector.filePath);
            dataArray = JSON.parse(str);
        } catch (e) {
            return callback(e);
        }
        dataArray.forEach(function (line) {

            Object.keys(line).forEach(function (key) {
                if (headers.indexOf(key) < 0)
                    headers.push(key)

            })
            return callback(null, {headers: headers, data: dataArray})
        })
    }


}
module.exports = csvCrawler;
