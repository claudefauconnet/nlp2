const async = require("async");
const util = require("./util.");
const socket = require('../../routes/socket.js');
const request = require('request');

const fs = require('fs');

var jsonCrawler = {

    indexSource: function (config, callback) {


        var data = [];
        var headers = [];
        var bulkStr = "";
        var t0 = new Date();
        async.series([


            // read csv
            function (callbackseries) {
                jsonCrawler.readJson(config.connector, function (err, result) {
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
            var keysToImport=Object.keys(config.schema.mappings[config.general.indexName].properties)



                data.forEach(function (record, indexedLine) {
                    var lineContent = "";
                  if(config.connector.subType=="simple") {
                      headers.forEach(function (header) {
                          var key = header;
                          var value = record[header];
                          if (!value)
                              return;
                          if (value == "0000-00-00")
                              return;
                          if(typeof value=="object")
                              value=JSON.stringify(value,null,2)

                          record[key] = value;
                          lineContent+=value+";"

                      })
                  }
                   else if(config.connector.subType=="object" || config.connector.subType=="nested"){
                      record=record;
                      var obj={};
                      keysToImport.forEach(function(key){
                          if(record[key] && record[key]!=""){
                              obj[key]= record[key];
                              lineContent+=record[key]+";"
                          }

                      })

                    }

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
                    const indexer=require('./indexer..js')
                    elasticRestProxy.checkBulkQueryResponse(body, function(err,result){
                        if(err)
                            return callbackseries(err);
                        var message = "indexed " + result.length + " records ";
                        socket.message(message)
                        return callbackseries()

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



        var fields = {};

      /*  if(connector.subType=="object"){
            var fields={}
            return callback(null, fields);
        }
        else  if(connector.subType=="nested") {
            var fields={}
            return callback(null, fields);
        }*/
      if(true || connector.subType=="simple"){
        //    if(connector.subType=="simple" || connector.subType=="object" || connector.subType=="nested") {
            var data = fs.readFileSync(connector.filePath);
            data = JSON.parse("" + data);
            var fields = {};
            data.forEach(function (line) {
                Object.keys(line).forEach(function (key) {


                    /*    if (util.isFloat(line[key]))
                            fields[key] = {type: "float"};
                        else if (util.isInt(line[key]))
                            fields[key] = {type: "integer"};*/
                        if(typeof line[key]=="object")
                            fields[key] = {type: "object"};
                        else
                            fields[key] = {type: "text"};



                })

            })

            return callback(null, fields);
        }

    },
    readJson: function (connector, callback) {

        var headers = [];
        var dataArray = [];
        try {
            var str = "" + fs.readFileSync(connector.filePath);
            dataArray = JSON.parse(str);
        } catch (e) {
            return callback(e);
        }
        dataArray.forEach(function (line) {

            Object.keys(line).forEach(function (key) {
                if (headers.indexOf(key) < 0)
                    headers.push(key)

            })

        })
        return callback(null, {headers: headers, data: dataArray})
    }


}
module.exports = jsonCrawler;
