let fs = require('fs'),
    PDFParser = require("pdf2json");
var async = require('async');
var ndjson = require('ndjson');
var request=require('request');
var ingester = {

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

                    if (error)
                        return callbackSeries(err);
                    var json = JSON.parse(response.body);
                    return callbackSeries(null,json);
                })
            }
            ],function(err){
            callback(err)
        })

    },


    indexDocumentByPages: function (path,index) {
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
                ingester.parsePdf(path, function (err, result) {
                    if (err)
                        return callbackSeries(err);
                    pdfText=result;
                    return callbackSeries();
                })

            },
            function (callbackSeries) {
                ingester.splitPdfTextInPages(pdfText, function (err, result) {
                    if (err)
                        return callbackSeries(err);
                    pdfPages=result;
                    return callbackSeries();
                })

            },



            function (callbackSeries) {
                ingester.indexPages(index,docTitle,path,pdfPages, function (err, result) {
                    if (err)
                        return callbackSeries(err);
                    pdfText=result;
                    return callbackSeries();
                })

            }
        ], function (err) {
            if (err)
                console.log(err)
            console.log("Done")
        })
    }


}
module.exports = ingester;

var path = "D:\\livres\\l-ideologie-de-la-silicon-valley.pdf";
ingester.indexDocumentByPages(path,"testpdf");
//var path="D:\\livres\\livrenumerique.pdf"
