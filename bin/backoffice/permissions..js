const fs=require("fs")


var permissions={






}

module.exports=permissions


var checkPermission = function (file, mask, cb){
    fs.stat (file, function (error, stats){
        if (error){
            cb (error, false);
        }else{
            cb (null, !!(mask & parseInt ((stats.mode & parseInt ("777", 8)).toString (8)[0])));
        }
    });
};

checkPermission("D:\\NLP\\Thesaurus_CTG.json")
