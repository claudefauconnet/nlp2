const superagent = require('superagent');
var request=require("request")

var httpProxy={

    get:function(url,options,callback){
      if( !options.headers){
          options.headers={}
           /* options.headers={  "Accept": 'application/sparql-results+json',
                   "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.106 Safari/537.36"}*/
        }
        else{
            var x=3
        }
        var request= superagent .get(url)
        for(var key in options.headers){
            request.set(key,options.headers[key])

        }
        request .end((err, res) => {
                if (err)
                    return callback(err);
                callback(null, res.body)
            })

    },

    post:function(url,options,callback){
        if( !options.headers){
            options.headers={}
            /* options.headers={  "Accept": 'application/sparql-results+json',
                    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.106 Safari/537.36"}*/
        }
        else{
            var x=3
        }
        var request= superagent .post(url)
        for(var key in options.headers){
            request.set(key,options.headers[key])

        }
        request .end((err, res) => {
            if (err)
                return callback(err);
            callback(null, res.body)
        })

    }



}

module.exports=httpProxy

//httpProxy.get()

