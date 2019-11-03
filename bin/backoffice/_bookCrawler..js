const async = require("async");
const util = require("./util.");
const socket = require('../../routes/socket.js');
const request = require('request');
const PDFParser = require("pdf2json");
const ndjson = require('ndjson');


var bookCrawler = {

    indexSource: function (config, callback) {
        var pdfPath=config.connector.filePath;
        var elasticUrl = options.indexation.elasticUrl;
        var pdfText="";
        var docTitle="";
        var pdfPages=
        async.series([
            
                //getDocTitle
            function (callbackSeries) {
                var p = pdfPath.lastIndexOf("\\");
                if (p < 0)
                    p = pdfPath.lastIndexOf("/");//unix
                var docTitle = pdfPath.substring(p + 1)
                docTitle = docTitle.substring(0, docTitle.indexOf("."))

                return callbackSeries()

            },
            
            //parse pdf
            function (callbackSeries) {
                bookCrawler.parsePdf(pdfPath, function (err, result) {
                    if (err)
                        return callbackSeries(err);
                    pdfText = result;
                    return callbackSeries();
                })

            },
            
            //split text in pages
            function (callbackSeries) {
                bookCrawler.splitPdfTextInPages(pdfText, function (err, result) {
                    if (err)
                        return callbackSeries(err);
                    pdfPages = result;
                    return callbackSeries();
                })

            },


            // run indexation of each page
            function (callbackSeries) {
                var ndjsonStr = ""
                var serialize = ndjson.serialize();
                serialize.on('data', function (line) {
                    ndjsonStr += line; // line is a line of stringified JSON with a newline delimiter at the end
                })

                var str = ""
                pdfPages.forEach(function (page, pageIndex) {
                    var id = docTitle + "_" + (pageIndex + 1)
                    var title = docTitle + "_" + (pageIndex + 1)

                    str += JSON.stringify({index: {"_index": index, _type: index, "_id": id}}) + "\r\n"
                    str += JSON.stringify({title: title,  page: "page " + (pageIndex + 1), content: page}) + "\r\n"

                    //   serialize.write({"_index": index, "_id": id})
                    //   serialize.write({title: docTitle, pdfPath: docPath, page: (pageIndex + 1), content: page})

                })
                serialize.end();
                var options = {
                    method: 'POST',
                    body: str,
                    encoding: null,
                    headers: {
                        'content-type': 'application/json'
                    },

                    url: elasticUrl+"_bulk"
                };

                request(options, function (error, response, body) {

                    if (error)
                        return callbackSeries(error);

                    return callbackSeries(null );
                })
            }


        ], function (err) {
            callback(err);
        })


    },
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
        callback(null, pages)

    },


}
module.exports = bookCrawler;
