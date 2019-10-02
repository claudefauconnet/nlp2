var async = require('async');
var ndjson = require('ndjson');
var request = require('request');
var path = require('path');
var socket = require('../routes/socket.js');
var fs = require('fs');


var documentCrawler = require("./_documentCrawler.");
var pdfBookCrawler = require("./_pdfBookCrawler.");
var sqlCrawler = require("./_sqlCrawler.");

var indexer = {


    index: function (config, callback) {
        var index = config.general.indexName;
        var elasticUrl = config.run.elasticUrl;
        var connector = config.connector;
        var indexExists = false;

        async.series([


            //******check config *************
            function (callbackSeries) {
                if (!index)
                    return callbackSeries("no index field in config ");
                if (!elasticUrl)
                    return callbackSeries("no elasticUrl field in config ");
                if (!connector)
                    return callbackSeries("no connector field in config ");
                if (elasticUrl.charAt(elasticUrl.length - 1) != "/")
                    elasticUrl += "/";
                callbackSeries()
            },

            function (callbackSeries) {
                var message = "strarting indexation index :" + index
                socket.message(message);
                callbackSeries();
            },

            //******check if index exist*************
            function (callbackSeries) {
                var options = {
                    method: 'HEAD',
                    headers: {
                        'content-type': 'application/json'
                    },
                    url: elasticUrl + index
                };
                request(options, function (error, response, body) {
                    if (error)
                        return callbackSeries(error);
                    if (response.statusCode == 200)
                        indexExists = true;
                    callbackSeries();
                })
            },




            //******deleteIndex*************
            function (callbackSeries) {
                if (!indexExists || !config.params.deleteOldIndex)
                    return callbackSeries();


                var options = {
                    method: 'DELETE',
                    headers: {
                        'content-type': 'application/json'
                    },
                    url: "http://localhost:9200/" + index
                };
                request(options, function (error, response, body) {
                    if (error)
                        return callbackSeries(error);
                    var message = "delete index :" + index
                    socket.message(message);
                    callbackSeries();
                })
            },
            //******create Index*************
            function (callbackSeries) {
                if (!config.params.deleteOldIndex)
                    return callbackSeries();

                var json = {}
                var indexSchema = config.schema;
                if (indexSchema) {
                    if (indexSchema.settings)
                        json.settings = indexSchema.settings;
                    if (indexSchema.mappings)
                        json.mappings = indexSchema.mappings;
                }

                var options = {
                    method: 'PUT',
                    description: "create index",
                    url: elasticUrl + index + "/",
                    json: json
                };

                request(options, function (error, response, body) {
                    if (error)
                        return callbackSeries(error);
                    if (body.error)
                        return callbackSeries(body.error);
                    var message = "index " + index + " created"
                    socket.message(message);
                    return callbackSeries();

                })
            },



            //******get existing documents  versionid for incremental update*************
            function (callbackSeries) {
                return callbackSeries();
            },

            //******fetch source*************
            function (callbackSeries) {

                if (!connector.type) {
                    return callbackSeries("no connector type declared");
                }
                if (connector.type = "fs") {

                }
            }

        var ndjsonStr = ""
        var serialize = ndjson.serialize();
        serialize.on('data', function (line) {
            ndjsonStr += line; // line is a line of stringified JSON with a newline delimiter at the end
        })

        var str = ""
        pages.forEach(function (page, pageIndex) {
            var id = docTitle + "_" + (pageIndex + 1)
            var title = docTitle + "_" + (pageIndex + 1)

            str += JSON.stringify({index: {"_index": index, _type: index, "_id": id}}) + "\r\n"
            str += JSON.stringify({title: title, path: docPath, page: "page " + (pageIndex + 1), content: page}) + "\r\n"

            //   serialize.write({"_index": index, "_id": id})
            //   serialize.write({title: docTitle, path: docPath, page: (pageIndex + 1), content: page})

        })
        serialize.end();
        var options = {
            method: 'POST',
            body: str,
            encoding: null,
            headers: {
                'content-type': 'application/json'
            },

            url: "http://localhost:9200/_bulk"
        };

        request(options, function (error, response, body) {

            if (error)
                return callbackSeries(err);
            var json = JSON.parse(response.body);
            return callbackSeries(null, json);
        })
    }
],

function (err) {
    callback(err)
}

)

},


indexDocumentByPages
    :

    function (path, index, callback) {
        var pdfText = "";
        var pdfPages = [];
        var docTitle = "";
        async.series([
            function (callbackSeries) { //getDocTitle
                var p = path.lastIndexOf("\\");
                if (p < 0)
                    p = path.lastIndexOf("/");//unix
                var docTitle = path.substring(p + 1)
                docTitle = docTitle.substring(0, docTitle.indexOf("."))

                return callbackSeries()

            },
            function (callbackSeries) {
                bookIngester.parsePdf(path, function (err, result) {
                    if (err)
                        return callbackSeries(err);
                    pdfText = result;
                    return callbackSeries();
                })

            },
            function (callbackSeries) {
                bookIngester.splitPdfTextInPages(pdfText, function (err, result) {
                    if (err)
                        return callbackSeries(err);
                    pdfPages = result;
                    return callbackSeries();
                })

            },


            function (callbackSeries) {
                bookIngester.indexPages(index, docTitle, path, pdfPages, function (err, result) {
                    if (err)
                        return callbackSeries(err);
                    pdfText = result;
                    return callbackSeries();
                })

            }
        ], function (err) {
            callback(err);
        })
    }

,


indexDocumentsByPages: function (dir, index, callback) {

    if (fs.statSync(dir).isDirectory()) {
        var files = fs.readdirSync(dir);

        async.eachSeries(files, function (file, callbackEach) {
                var xx = path.extname(file)
                if (path.extname(file).toLocaleLowerCase() == ".pdf") {
                    bookIngester.indexDocumentByPages(dir + path.sep + file, index, callbackEach);

                } else {
                    callbackEach()
                }

            }, function (err) {
                if (err)
                    return callback(err);
                return callback(null, "done");
            }
        )


    }
}


}
module.exports = bookIngester;
if (false) {
    var path = "D:\\livres\\l-ideologie-de-la-silicon-valley.pdf";
    bookIngester.indexDocumentByPages(path, "testpdf", function (err, result) {
        if (err)
            return console.log(err);
        return console.log("DONE");
    });
}

if (true) {
    var dir = "D:\\ATD_Baillet\\livres";
    bookIngester.indexDocumentsByPages(dir, "testpdfquantum", function (err, result) {
        if (err)
            return console.log(err);
        return console.log("DONE");
    });
}


//var path="D:\\livres\\livrenumerique.pdf"
