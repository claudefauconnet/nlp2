var async = require('async');
var ndjson = require('ndjson');
var request = require('request');
var path = require('path');
var socket = require('../routes/socket.js');
var fs=require('fs');


var documentCrawler={
    indexDocumentDirs: function (config, callback) {
        var maxDocSize=1000*1000*1000*20;
       var rootdir= config.connector.dir;
       var index=config.general.indexName;
       var incrementUpdate=config.run.incrementUpdate;
        var acceptedExtensions = ["doc", "docx", "xls", "xslx", "pdf", "odt", "ods", "ppt", "pptx", "html", "htm", "txt", "csv"];

        var indexedFiles = [];

        function getFilesRecursive(dir) {
            dir = path.normalize(dir);
            if (dir.charAt(dir.length - 1) != path.sep)
                dir += path.sep;

            var files = fs.readdirSync(dir);
            for (var i = 0; i < files.length; i++) {
                var fileName = dir + files[i];
                var stats = fs.statSync(fileName);
                var infos = {lastModified: stats.mtimeMs, hash: fileInfos.getStringHash(fileName)};//fileInfos.getDirInfos(dir);

                if (stats.isDirectory()) {
                    getFilesRecursive(fileName)
                }
                else {
                    var p = fileName.lastIndexOf(".");
                    if (p < 0)
                        continue;
                    var extension = fileName.substring(p + 1).toLowerCase();
                    if (acceptedExtensions.indexOf(extension) < 0) {
                        socket.message("!!!!!!  refusedExtension " + fileName);
                        continue;
                    }
                    if (stats.size > maxDocSize) {
                        socket.message("!!!!!! "+fileName+" file  too big " + Math.round(stats.size / 1000) + " Ko , not indexed ");
                        continue;

                    }
                    if(incrementUpdate)
                    indexedFiles.push({fileName: fileName, infos: infos});
                }
            }

        }

        getFilesRecursive(rootdir);

        //  indexedFiles.sort();
        var base64Extensions = ["doc", "docx", "xls", "xslx", "pdf", "ppt", "pptx", "ods", "odt"];
        var t0 = new Date().getTime();
        async.eachSeries(indexedFiles, function (file, callbackInner) {

                var fileName = file.fileName;

                var p = fileName.lastIndexOf(".");
                if (p < 0)
                    callback("no extension for file " + fileName);
                var extension = fileName.substring(p + 1).toLowerCase();
                var base64 = false;

                if (base64Extensions.indexOf(extension) > -1) {
                    base64 = true;


                }
                var t1 = new Date().getTime();
                elasticProxy.indexDocumentFile(fileName, index, type, base64, file.infos, function (err, result) {
                    if (err) {
                        logger.error(err)
                        return callbackInner(err)
                    }
                    var duration = new Date().getTime() - t1;
                    logger.info("file " + fileName + "   indexed .Duration (ms) : " + duration)

                    callbackInner(null)


                });


            }, function (err, result) {
                if (err)
                    return callback(err);
                var duration = new Date().getTime() - t0;
                var message = "indexation done " + indexedFiles.length + "documents  in " + duration + " msec.";
                console.log(message)
                return callback(null, message);

            }
        );


    }

    indexDocumentFile: function (_file, index, type, base64, infos, callback) {
        var id;
        if (infos && infos.hash)
            id = infos.hash;
        else
            id = "R" + Math.round(Math.random() * 1000000000)
        //  var file = "./search/testDocx.doc";
        //  var file = "./search/testPDF.pdf";
        var fileContent;
        var file = path.resolve(_file);

        var p = file.lastIndexOf(path.sep);
        var title = file;
        if (p > -1)
            title = file.substring(p + 1);
        logger.info("-----indexing  " + title);
        var options;
        if (base64) {
            index = index + "temp"
            fileContent = util.base64_encodeFile(file);
            options = {
                method: 'PUT',
                url: baseUrl + index + "/" + type + "/" + id + "?pipeline=attachment",
                json: {
                    "data": fileContent,
                    "path": encodeURIComponent(file),
                    "title": title,
                    "lastModified": infos.lastModified
                }
            }
        }
        else {
            fileContent = "" + fs.readFileSync(file);
            // fileContent = elasticCustom.processContent(fileContent);
            options = {
                method: 'PUT',
                url: baseUrl + index + "/" + type + "/" + id,
                json: {
                    "content": fileContent,
                    "path": encodeURIComponent(file),
                    "title": title,
                    "lastModified": infos.lastModified
                }
            }
        }


        request(options, function (error, response, body) {

            //   console.log(file+"  "+JSON.stringify(body));

            if (error) {
                logger.error(file + " : " + error);
                console.error(file + " : " + error);
                // return callback(file+" : "+error);
            }
            if (body.error) {
                logger.error(file + " : " + body.error);
                console.error(file + " : " + body.error);
                if (body.error.reason) {
                    logger.error(file + " : " + body.error.reason);
                    console.error(file + " : " + body.error.reason);
                }
                //  return callback(file+" : "+body.error);
            }
            return callback(null, body);


        });

    }
    ,



}
module.exports=documentCrawler;
