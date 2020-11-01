
var httpProxy=require('../bin/httpProxy.')
var async=require('async')
var spacyServerUrl = "http://vps475829.ovh.net/spacy/pos"



var annotatorLive={


    annotate:function(text, sources,callback){
var textNouns=[]
        async.series([

            //extract spacy nouns
            function(callbackSeries) {
                var json = {
                    "text": text
                }

                httpProxy.post(spacyServerUrl, {'content-type': 'application/json'}, json, function (err, result) {
                    if (err) {
                        console.log(err)
                        return callbackSeries(err);
                    }

                    result.data.forEach(function (sentence) {
                        sentence.tags.forEach(function (item) {
                            if (item.tag == "NN") {//item.tag.indexOf("NN")>-1) {
                                item.text = item.text.toLowerCase();
                                if( textNouns.indexOf(item.text)<0)
                                textNouns.push(item.text)

                            }
                        })
                    })
                    callbackSeries();
                })
            },

            //extract concepts for each source
            function(callbackSeries) {
                callbackSeries();
            }
            ],function(err){
            callback(err,textNouns)

        })







    }








}
module.exports=annotatorLive
