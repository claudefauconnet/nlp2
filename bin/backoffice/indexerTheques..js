var async = require("async");
var elasticProxy = require("./elasticProxy.js")
var mySQLproxy = require("./mySQLproxy..js");
var fs=require('fs');
var path=require("path");


var indexer = {


    configLocation:__dirname+"../config/search/atdSearchConfig.json",



    loadConfig:function(){
        var filePath=path.resolve(indexer.configLocation)
        var data=""+fs.readFileSync(filePath)
        indexer.indexDescriptions=JSON.parse(data).indexDescriptions



    }
    ,
    indexTheques: function (indexes) {
        indexer.loadConfig()
        async.eachSeries(indexes, function (index, callbackEachIndex) {
                console.log("processing " + index)
                var schema = elasticProxy.getIndexMappings(index);

                var description = indexer.indexDescriptions[index];


                elasticProxy.initIndex(index, description.settings, function (err, result) {
                        if (err) {
                            console.log(err);
                            return callbackEachIndex(err);
                        }


                        var callbackAfterIndexation = function (err, result) {
                            if (err)
                                console.log(err);
                            console.log("done");
                            callbackEachIndex()
                        }

                        if (description.type == "mySQL") {
                            elasticProxy.indexSqlTable(description.connOptions, description.sqlQuery, index, index, callbackAfterIndexation);
                        }
                        else if (description.type == "sourceDB") {

                        }
                        else if (description.type == "webPage") {

                        }
                        else if (description.type == "fs") {
                            elasticProxy.indexDocDirInNewIndex(index, "officeDocument", description.dir, false, "ATD", callbackAfterIndexation)


                        }

                    }
                )

            },
            function (err) {
                if (err)
                    console.log(err);
                console.log("all done !!!!");

            })
    }


}

module.exports = indexer


//indexer.indexTheques(["bordereaux"]);


const args = process.argv;
console.log(args.length)
if (args.length > 2) {

    if (args[2] == "indexTheques") {
        console.log(2);
        var str = args[3];
        var theques = str.split(",");

        indexer.indexTheques(theques);

    }
    ;


} else {
    console.log("Usage : node indexer indexTheques  index1,index2...");
}

