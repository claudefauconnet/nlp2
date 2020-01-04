var async = require('async');
var ndjson = require('ndjson');
var request = require('request');
var path = require('path');
var socket = require('../../routes/socket.js');
var util = require("./util.")
var fs = require('fs');


var _documentCrawler = {
    indexSource: function (config, callback) {
        var maxDocSize = 1000 * 1000 * 1000 * 20;
        var rootdir = config.connector.dirPath;
        var index = config.general.indexName;
        var acceptedExtensions = ["doc", "docx", "xls", "xslx", "pdf", "odt", "ods", "ppt", "pptx", "html", "htm", "txt", "csv"];
        var base64Extensions = ["doc", "docx", "xls", "xslx", "pdf", "ppt", "pptx", "ods", "odt"];

        var filesToIndex = [];
        var indexedFilesCount = 0;
        var t0alldocs = new Date().getTime();
        var t0doc;


        async.series([

            // list all  candidate files to index
            function (callbackSeries) {

                function getFilesRecursive(dir) {
                    dir = path.normalize(dir);
                    if(!fs.existsSync(dir))
                        return callbackSeries("dir doesnt not exist :"+dir)
                    if (dir.charAt(dir.length - 1) != path.sep)
                        dir += path.sep;

                    var files = fs.readdirSync(dir);
                    for (var i = 0; i < files.length; i++) {
                        var fileName = dir + files[i];
                        var stats = fs.statSync(fileName);
                        var infos = {lastModified: stats.mtimeMs};//fileInfos.getDirInfos(dir);

                        if (stats.isDirectory()) {
                            getFilesRecursive(fileName)
                        } else {
                            var p = fileName.lastIndexOf(".");
                            if (p < 0)
                                continue;
                            var extension = fileName.substring(p + 1).toLowerCase();
                            if (acceptedExtensions.indexOf(extension) < 0) {
                                socket.message("!!!!!!  refusedExtension " + fileName);
                                continue;
                            }
                            if (stats.size > maxDocSize) {
                                socket.message("!!!!!! " + fileName + " file  too big " + Math.round(stats.size / 1000) + " Ko , not indexed ");
                                continue;
                            }
                            filesToIndex.push({fileName: fileName, infos: infos});
                        }
                    }
                }

                getFilesRecursive(rootdir)
                return callbackSeries();
            },


            // configure ingest attachement pipeline to remove binary data from index
            function (callbackSeries) {
                var requestOptions = {
                    method: 'PUT',
                    url: config.indexation.elasticUrl + "_ingest/pipeline/attachment",
                    json: {
                        "description": "Extract attachment information",
                        "processors": [
                            {
                                "attachment": {
                                    "field": "data"
                                },
                                "remove": {
                                    "field": "data"
                                }
                            }
                        ]
                    }
                }
                request(requestOptions, function (error, response, body) {

                    if (error) {
                        return callbackSeries(error)
                        // return callback(file+" : "+error);
                    }
                    if (body.error) {
                        if (body.error.reason) {
                            return callbackSeries(body.error.reason);
                        } else {
                            return callbackSeries(body.error);
                        }
                    }
                    return callbackSeries(null, body);
                });
            },


            //index filesToIndex
            function (callbackSeries) {

                async.eachSeries(filesToIndex, function (file, callbackEach) {
                        var filePath = file.fileName;
                        var p = filePath.lastIndexOf(".");
                        if (p < 0)
                            return callback("no extension for file " + filePath);
                        var extension = filePath.substring(p + 1).toLowerCase();
                        var base64 = false;
                        if (base64Extensions.indexOf(extension) > -1) {
                            base64 = true;


                        }
                        var options = config;
                        options.file = filePath;
                        options.type = index;
                        options.index = index;
                        options.infos = file.infos;
                        options.base64 = base64;

                        t0doc = new Date().getTime();
                        _documentCrawler.indexDocumentFile(options, function (err, result) {
                            if (err)
                                return callbackSeries(err);
                            if (result.indexed) {
                                indexedFilesCount += 1;
                            }
                          if(indexedFilesCount%10==0) {
                              var duration = new Date().getTime() - t0alldocs;
                              var message = "indexed "+ indexedFilesCount+" documents in " + duration + " msec.";
                              socket.message(message);
                          }

                            return callbackEach();

                        });


                    }, function (err, result) {
                        if (err)
                            return callbackSeries(err);
                        var duration = new Date().getTime() - t0alldocs;
                        var message = "indexation done " + indexedFilesCount + "/" + filesToIndex.length + " documents  in " + duration + " msec.";
                        socket.message(message)
                        return callbackSeries();

                    }
                );


            }


        ], function (err) {
            callback(err);
        })


    },


    indexDocumentFile: function (options, callback) {
        var file = options.file;
        var index = options.index;
        var type = options.type;
        var infos = options.infos;
        var base64 = options.base64;
        var elasticUrl = options.indexation.elasticUrl;


        var fileContent;
        var file = path.resolve(file);
        var p = file.lastIndexOf(path.sep);
        var title = file;
        if (p > -1)
            title = file.substring(p + 1);
        var requestOptions;
        var incrementRecordId;
        if (base64) {
            fileContent = util.base64_encodeFile(file);
           incrementRecordId = util.getStringHash(fileContent);
            var id = "D" +incrementRecordId;
            requestOptions = {
                method: 'PUT',
                url: elasticUrl + index + "/" + type + "/" + id + "?pipeline=attachment",
                json: {
                    "data": fileContent,
                    "path": encodeURIComponent(file),
                    "title": title,
                    "lastModified": infos.lastModified
                }
            }
        } else {
            fileContent = "" + fs.readFileSync(file);
            incrementRecordId = util.getStringHash(fileContent);
            var id = "D" +incrementRecordId;
            requestOptions = {
                method: 'PUT',
                url: elasticUrl + index + "/" + type + "/" + id,
                json: {
                    "content": fileContent,
                    "path": encodeURIComponent(file),
                    "title": title,
                    "lastModified": infos.lastModified
                }
            }
        }

        //don't index docs with existing incrementRecordIds
        var docOK = true;


            if (options.incrementRecordIds.indexOf(incrementRecordId) > -1) {
                docOK = false;
            }

        if (!docOK)
            return callback(null, {notReindexed: true});
        requestOptions.json.incrementRecordId = incrementRecordId;
        request(requestOptions, function (error, response, body) {

            if (error) {
                return callback(error)
                // return callback(file+" : "+error);
            }
            if (body.error) {
                if (body.error.reason) {
                    return callback(body.error.reason);
                } else {
                    return callback(body.error);
                }
            }
            return callback(null, {indexed: true});
        });
    }

    , generateDefaultMappingFields: function (connector, callback) {
        var fields=
            {
                "attachment.author": {type: "text"},
                "attachment.title": {type: "text"},
                "attachment.date": {type: "date"},
                "attachment.language": {type: "keyword"},
                "title": {type: "text"}
            }
            callback(null, fields)

    }
}
module.exports = _documentCrawler;
