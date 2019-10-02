var configDir = "../config/elasticSources/";
var fs = require("fs");
var path = require("path");
var async = require("async");

var configs = {};
var configLoader = {
    getAllIndexNames: function (callback) {
        try {

            var indexNames = [];
            var pathStr = path.join(__dirname, configDir );
            fs.readdirSync(pathStr).forEach(file => {
                var p = file.indexOf(".json")
                if (p > -1)
                    indexNames.push(file.substring(0, p))
            });
        } catch (e) {
            return callback(e);

        }
        return callback(null, indexNames);
    },

    loadIndexConfig: function (index, callback) {
        var config = null;
        var str = null;
        try {
            var pathStr = path.join(__dirname, configDir + index + ".json");

            //   console.log(pathStr);
            str = fs.readFileSync(pathStr);
        } catch (e) {

            return callback(e);
        }
        try {
            config = JSON.parse(str);
        } catch (e) {
            return callback(e);
        }
        return callback(null, config);


    },
    saveIndexConfig: function (index,jsonStr, callback) {
        var pathStr = path.join(__dirname, configDir + index + ".json");

        fs.writeFile(pathStr,jsonStr,function(err,result){
            if(err)
                return callback(err);
            return callback(null, "index saved : "+index);
        });

    },
    deleteIndexConfig: function (index, callback) {
            var pathStr = path.join(__dirname, configDir + index + ".json");

          fs.unlink(pathStr,function(err,result){
              if(err)
                  return callback(err);
              return callback(null, "index deleted : "+index);
          });


    },
    getIndexConfig: function (index, callback) {

        if (configs[index]) {
            return callback(null, configs[index])
        } else {
            configLoader.loadIndexConfig(index, function (err, config) {
                if (err) {
                    return callback(err);
                }

                configs[index] = config;
                return callback(null, config)

            });

        }


    }
    ,


    getIndexConfigs: function (indexes, callback) {

        if (!Array.isArray(indexes)) {
            indexes = [indexes];
        }


        var configs = {}
        async.series([
            function (callbackSeries) {
                if (indexes != "*") {
                    return callbackSeries();
                }
                configLoader.getAllIndexNames(function (err, result) {
                    indexes = result;
                    return callbackSeries();
                })

            },
            function (callbackSeries) {

                indexes.forEach(function (index) {
                    configLoader.getIndexConfig(index, function (err, config) {
                        if (err)
                            return callbackSeries(err);
                        configs[index] = config;

                    })
                })
                return callbackSeries(null, configs)

            }
        ], function (err) {
            callback(err, configs)
        })

    }


}


module.exports = configLoader;

if (false) {
    configLoader.getIndexConfigs("bordereaux", function (err, result) {
        var xx = err;
    })
}
