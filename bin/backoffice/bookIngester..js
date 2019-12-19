let fs = require('fs'),
    PDFParser = require("pdf2json");
var async = require('async');
var ndjson = require('ndjson');
var request=require('request');
var path=require('path');
var bookIngester = {

    parsePdf: function (pdfPath, callback) {
        let pdfParser = new PDFParser(this, 1);

        pdfParser.on("pdfParser_dataError", errData => callback(errData.parserError));
        pdfParser.on("pdfParser_dataReady", pdfData => {
            var text = pdfParser.getRawTextContent();
            callback(null, text)

        });
        pdfParser.loadPDF(pdfPath);
    },
    splitPdfTextInPages: function (pdfText, callback) {
        var pages = [];
        var regex = /----------------Page \([0-9]+\) Break----------------/
        pages = pdfText.split(regex);
        callback(null,pages)

    },

    indexPages: function (index,docTitle,docPath,pages, callback) {
        async.series([
            function (callbackSeries) {//deleteIndex
                if (false)
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
                    console.log("index " + index + " deleted")
                    var json = JSON.parse(response.body);
                    callbackSeries();
                })
            },
            function (callbackSeries) {
                var json = {mappings: {}}
                json.mappings[index] = {
                    "properties": {
                        "content": {
                            "type": "text",
                            "index_options": "offsets",
                           // "analyzer": "ATD",
                            "fielddata": true,
                            "fields": {
                                "contentKeyWords": {
                                    "type": "keyword",
                                    "ignore_above": 256
                                }
                            }
                        }

                    }
                }
                var options = {
                    json: json,
                    method: 'PUT',
                    headers: {
                        'content-type': 'application/json'
                    },
                    url: "http://localhost:9200/" + index
                };
                request(options, function (error, response, body) {
                    if (error)
                        return callbackSeries(error);
                    console.log("index " + index + " created")
                    callbackSeries();
                })

            },
            function (callbackSeries) {


                var ndjsonStr = ""
                var serialize = ndjson.serialize();
                serialize.on('data', function (line) {
                    ndjsonStr += line; // line is a line of stringified JSON with a newline delimiter at the end
                })

                var str=""
                pages.forEach(function (page, pageIndex) {
                    var id = docTitle + "_" + (pageIndex + 1)
                    var title=docTitle + "_" + (pageIndex + 1)

                    str+=JSON.stringify({index:{"_index": index, _type: index, "_id": id}})+"\r\n"
                    str+=JSON.stringify({title: title, path: docPath, page: "page "+(pageIndex + 1), content: page})+"\r\n"

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
                    const indexer=require('./indexer..js')
                    elasticRestProxy.checkBulkQueryResponse(body, function(err,result){
                        if(err)
                            return callbackSeries(err);
                        var message = "indexed " + result.length + " records ";
                        socket.message(message)
                        return callbackSeries()

                    })
                })
            }
            ],function(err){
            callback(err)
        })

    },


    indexDocumentByPages: function (path,index, callback) {
        var pdfText = "";
        var pdfPages=[];
        var docTitle="";
        async.series([
            function (callbackSeries) { //getDocTitle
                var p=path.lastIndexOf("\\");
                if(p<0)
                    p=path.lastIndexOf("/");//unix
                var docTitle=path.substring(p+1)
                docTitle=docTitle.substring(0,docTitle.indexOf("."))

                return callbackSeries()

            },
            function (callbackSeries) {
                bookIngester.parsePdf(path, function (err, result) {
                    if (err)
                        return callbackSeries(err);
                    pdfText=result;
                    return callbackSeries();
                })

            },
            function (callbackSeries) {
                bookIngester.splitPdfTextInPages(pdfText, function (err, result) {
                    if (err)
                        return callbackSeries(err);
                    pdfPages=result;
                    return callbackSeries();
                })

            },



            function (callbackSeries) {
                bookIngester.indexPages(index,docTitle,path,pdfPages, function (err, result) {
                    if (err)
                        return callbackSeries(err);
                    pdfText=result;
                    return callbackSeries();
                })

            }
        ], function (err) {
           callback(err);
        })
    }
    ,


    indexDocumentsByPages:function(dir,index,callback) {

        if (fs.statSync(dir).isDirectory()) {
            var files = fs.readdirSync(dir);

            async.eachSeries(files,function (file,callbackEach){
                var xx=path.extname(file)
             if( path.extname(file).toLocaleLowerCase()==".pdf"){
                 bookIngester.indexDocumentByPages(dir+path.sep+file, index,callbackEach);

             }
             else{
                 callbackEach()
             }

            },function(err) {
                    if (err)
                        return callback(err);
                    return callback(null, "done");
                }
            )


        }
    }


}
module.exports = bookIngester;
if( false) {
    var path = "D:\\livres\\l-ideologie-de-la-silicon-valley.pdf";
    bookIngester.indexDocumentByPages(path, "testpdf", function (err, result) {
        if (err)
            return console.log(err);
        return console.log("DONE");
    });
}

if( true) {
    var dir = "D:\\ATD_Baillet\\livres";
    bookIngester.indexDocumentsByPages(dir, "testpdfquantum",function(err, result){
        if(err)
            return console.log(err);
        return console.log("DONE");
    });
}


//var path="D:\\livres\\livrenumerique.pdf"
