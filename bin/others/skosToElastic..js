var fs = require('fs')
var async = require('async')
var request = require('request')
var skosReader = require('../backoffice/skosReader.')
var skosToElastic = {

    load: function (thesaurusPaths,callback) {

        async.eachSeries(thesaursusList, function (thesaurusPath, callbackEach) {
            skosReader.rdfToFlat(thesaurusPath, null, function (err, json) {
                skosToElastic.flatToElastic(json,function(err, result){
                    if(err) {
                        return callbackEach(err)
                    }
                    console.log( "indexed" +thesaurusPath+ " :  "+result)
                        callbackEach();
                })
            })


        },function(err){
            if(err){
                return callback(err)
                callback();
            }
        })

    },
    flatToElastic: function (flatJson, callback) {
        var indexName = "flat_thesaurus"
        var bulkStr = "";
        var elasticUrl = "http://localhost:9200/"
        flatJson.forEach(function (record, indexedLine) {
            var id = record.thesaurus + "_" + (indexedLine)

            bulkStr += JSON.stringify({index: {_index: indexName, _type: indexName, _id: id}}) + "\r\n"
            bulkStr += JSON.stringify(record) + "\r\n";

        })

        var options = {
            method: 'POST',
            body: bulkStr,
            encoding: null,
            headers: {
                'content-type': 'application/json'
            },
            url: elasticUrl + "_bulk?refresh=wait_for"
        };

        request(options, function (error, response, body) {
            if (error) {
                return callback(error)

            }


            if (Buffer.isBuffer(body))
                body = JSON.parse(body.toString());
            else
                body = body;
            var errors = [];
            if (body.error) {
                if (body.error.reason)
                    return callback(body.error.reason)
                return callback(body.error)
            }

            if (!body.items)
                return callback(null, "done");
            body.items.forEach(function (item) {
                if (item.index && item.index.error)
                    errors.push(item.index.error);
                else if (item.update && item.update.error)
                    errors.push(item.update.error);
                else if (item.delete && item.delete.error)
                    errors.push(item.delete.error);
            })

            if (errors.length > 0) {
                errors = errors.slice(0, 20);
                return callback(errors);
            }
            return callback(null, body.items.length);


        })

    }







}

module.exports = skosToElastic


function getThesaurusListFromNlp2App() {
    var listPath = "D:\\GitHub\\nlp2\\public\\skosEditor\\js\\theaususList.js";
    var str = "" + fs.readFileSync(listPath)


    var list = [];
    var lines = str.split("\n")
    lines.forEach(function (line) {
        if (line.indexOf("D:") > -1) {
            list.push(line.replace(",", "").replace(/"/g, "").trim());
        }

    })
    return list;
}

var thesaursusList = getThesaurusListFromNlp2App();
var x = thesaursusList;

skosToElastic.load(thesaursusList, function (err, result) {
    if (err)
        return console.log(err);
    return console.log("done")
})



