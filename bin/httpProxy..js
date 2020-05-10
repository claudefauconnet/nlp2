const superagent = require('superagent');
var request = require("request")

var httpProxy = {

    get: function (url, options, callback) {
        if (!options.headers) {
            options.headers = {}
            /* options.headers={  "Accept": 'application/sparql-results+json',
                    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.106 Safari/537.36"}*/
        } else {
            var x = 3
        }
        var request = superagent.get(url)
        for (var key in options.headers) {
            request.set(key, options.headers[key])

        }
        request.end((err, res) => {
            if (err)
                return callback(err);
            callback(null, res.body)
        })

    },

    post: function (url, headers, params, callback) {


        /*   var query = "PREFIX skos:<http://www.w3.org/2004/02/skos/core#>select *  where{   ?resource skos:prefLabel ?resourceLabel .?resource <http://www.w3.org/2004/02/skos/core#inScheme> <http://data.total.com/resource/ontology/ctg/Domain>OPTIONAL {?child1 skos:broader ?resource .?child1 skos:prefLabel ?childLabel1 .optional {?child2 skos:broader ?child1 .?child2 skos:prefLabel ?childLabel2 .}} }limit 2000"

           query = encodeURIComponent(query)
           query = query.replace(/%2B/g, "+").trim()

           params = {query: "PREFIX skos:<http://www.w3.org/2004/02/skos/core#>select *  where{   ?resource skos:prefLabel ?resourceLabel .?resource <http://www.w3.org/2004/02/skos/core#inScheme> <http://data.total.com/resource/ontology/ctg/Domain>OPTIONAL {?child1 skos:broader ?resource .?child1 skos:prefLabel ?childLabel1 .optional {?child2 skos:broader ?child1 .?child2 skos:prefLabel ?childLabel2 .}} }limit 2000"}
   */

        var options = {
            method: 'POST',
            form: params,
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
                'accept': 'application/json'
            },
            url: url,
        };

        request(options, function (error, response, body) {
            if (error)
                return callback(error);
         /*   if (body.indexOf("Error") > -1)
                return callback(body);*/
            try {
                var obj = JSON.parse(body);
                callback(null, obj)
            }
            catch(e){
                callback(e)
            }

            return;
        })


        /*  const options = {
              url: 'https://api.github.com/repos/request/request',
              headers: {
                  'User-Agent': 'request'
              }
          };*/

        /*    request.post('http://vps475829.ovh.net:8890/sparql').form({query: query}).on('response', function (response) {

                console.log(response.statusCode) // 200
                console.log(response.headers['content-type']) // 'image/png'
            }).on('error', function (err) {
                console.error(err)
            })
            return;*/

        /*   superagent.post(url)
               .send(params) // sends a JSON post body
               .set("Content-Type", "application/x-www-form-urlencoded")
               .set('accept', 'json')
               .end((err, res) => {
                   if (err)
                       return callback(err);
                   callback(null, res.body)
               })*/

    }


}

module.exports = httpProxy

//httpProxy.get()

