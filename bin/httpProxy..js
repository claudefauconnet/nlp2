
var request=require("request")

var httpProxy={

    get:function(url,callback){
        request({
                url: url,
                method: 'GET',
            },
            function (err, res) {

                if (err)
                    callback(err)
                else if (res.body && res.body.errors && res.body.errors.length > 0) {
                    console.log(JSON.stringify(res.body.errors))
                    callback(res.body.errors)
                }
                else
                    callback(null, res.body)
            });




    }



}

module.exports=httpProxy
