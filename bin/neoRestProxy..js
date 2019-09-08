
var request=require('request');
var neo4jUrl=  'http://neo4j:souslesens@127.0.0.1:7474';
var neoRestProxy={

    cypher: function ( path, payload, callback) {

    var uri = neo4jUrl + path;

    if (typeof payload === 'string')
        payload = JSON.parse(payload);
    request({
            url: uri,
            json: payload,
            method: 'POST',
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


},
}
module.exports=neoRestProxy;
