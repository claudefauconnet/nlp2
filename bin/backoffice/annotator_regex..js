var fs = require('fs');
var async = require('async');
var request = require('request');
var ndjson = require('ndjson');
const socket = require('../../routes/socket.js');
const elasticRestProxy = require('../elasticRestProxy..js')

var annotator_regex = {



    annotateCorpus:function(options,callback){
        var query={
            query:{match_all:{[options.contentField]:{}}


        }


    }






}


module.exports=annotator_regex;

