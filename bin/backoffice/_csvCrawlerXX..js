const async = require("async");
const util = require("./util.");
const socket = require('../../routes/socket.js');
const request = require('request');
const fs = require('fs');
const csv = require('csv-parser')

var csvCrawler = {

    indexSource: function (config ,callback){
        csvCrawler.readCsvAndIndexChunks(config, 1000,csvCrawler.indexData, function(err, result){

            if (err)
                return callback(err);

            var duration = new Date().getTime() - t0;
            var message = "*** indexation done : " + data.length + " records  in " + duration + " msec.";
            socket.message(message)
            callback(null, "done");


        })


},



    indexData: function (config,headers,data, callback) {
    
        var bulkStr = "";
        var t0 = new Date();
        async.series([


         
            //prepare payload
            function (callbackSeries) {


                data.forEach(function (line, indexedLine) {
                    var lineContent = "";
                    var record = {}
                    headers.forEach(function (header) {
                        var key = header;
                        var value =line[header];
                        if (!value)
                            return;
                        if (value == "0000-00-00")
                            return;
                        lineContent +=    "[#"+key+"] "+value+" [/#]"
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

                callbackSeries();
            },
            function (callbackSeries) {
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
                        return callbackSeries(error)

                    }
                    const elasticRestProxy=require('../elasticRestProxy..js')
                    elasticRestProxy.checkBulkQueryResponse(body, function(err,result){
                        if(err)
                            return callbackSeries(err);
                        var message = "indexed " + result.length + " records ";
                        socket.message(message)
                        return callbackSeries()

                    })



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
        csvCrawler.readCsv(connector, 1000000, function (err, result) {
            if (err)
                return callback(err);
            var fields = {}
            result.headers.forEach(function (header) {
                if (header != "")
                    if (!fields[header]) {
                        result.data.forEach(function(line){
                            if (util.isFloat(line[header]))
                                fields[header] = {type: "float"};
                            else if (util.isInt(line[header]))
                                fields[header] = {type: "integer"};
                            else
                                fields[header] = {type: "text"};

                        })
                    }
            })

            return callback(null, fields);

        })


    },

    readCsvAndIndexChunks: function (config, lines,indexationFn, callback) {
        util.getCsvFileSeparator(config.connector.filePath, function (separator) {
            var headers = [];
            var jsonData = [];
            var startId = 100000
            fs.createReadStream(config.connector.filePath)
                .pipe(csv(
                    {
                        separator: separator,
                        mapHeaders: ({header, index}) =>
                            util.normalizeHeader(headers, header)
                        ,


                    })
                    .on('header', function (header) {
                        headers.push(header);

                    })

                    .on('data', function (data) {


                        jsonData.push(data)
                        if (lines && jsonData.length>=lines) {
                            async.series([
                                function (callbackSeries) {
                                    indexationFn(config, headers, jsonData, function (err, result) {
                                        jsonData = [];
                                        callbackSeries();
                                    });
                                }
                            ])
                        }
                           // return callback(null, {hearders: headers, data: jsonData})

                    })
                    .on('end', function () {
                        async.series([
                            function(callbackSeries){
                                indexationFn (config,headers,jsonData, function(err,result){
                                    jsonData=[];
                                    callbackSeries();
                                });
                            }
                        ])
                       // return callback(null, {headers: headers, data: jsonData})
                    })
                );

        })

    }


}
module.exports = csvCrawler;
