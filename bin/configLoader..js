var configDir = "../config/elasticSources/";
var fs = require("fs");
var path=require("path");


var configs = {};
var configLoader = {


    loadIndexConfig: function (index, callback) {
        var config = null;
        var str = null;
        try {
            str = fs.readFileSync(path.resolve(__dirname,configDir + index+".json"));
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
    getIndexConfig: function (index, callback) {

        if (configs[index]) {
            return callback(null, configs[index])
        } else {
            configLoader.loadIndexConfig(index,function(err,config){
                if(err){
                    return callback(err);
                }

                configs[index] = config;
                return callback(null, config)

            });

        }


    }
    ,
    getIndexConfigs:function(indexes,callback){
        if(!Array.isArray(indexes)){
            indexes=[indexes];
        }
        var configs={}
        indexes.forEach(function(index){
            configLoader.getIndexConfig(index, function(err, config){
               if(err)
                  return callback(err);
             configs[index]=config;

            })
        })
        return callback(null,configs)
    }


}


module.exports = configLoader;

if(false){
    configLoader.getIndexConfigs("bordereaux", function(err, result){
        var xx=err;
    })
}
