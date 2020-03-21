
const fs=require('fs')
const path=require('path')

var conceptsList=null;

var termSciencesSkosproxy={
    loadConceptList:function(){



    },

    list:function(word,options,callback){
        var bindings=[];


        return callback(null,bindings);
    },

    getAncestors:function(id,options,callback){
        var bindings=[];


        return bindings;
    },
    getChildren:function(id,options,callback){


        callback(null, [])
    },

    getDetails:function(id,options,callback){
        var bindings=[];

        return bindings;
    }




}
module.exports=termSciencesSkosproxy;

termSciencesSkosproxy.loadConceptList();





