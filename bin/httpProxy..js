const superagent = require('superagent');
var request=require("request")

var httpProxy={

    get:function(url,callback){
      /*  console.log(url)
        url="http://vps475829.ovh.net:8890/sparql?default-graph-uri=&query=PREFIX+skos:+%3Chttp://www.w3.org/2004/02/skos/core#%3E+SELECT+DISTINCT+*+WHERE+%7B+?id+skos:prefLabel+?prefLabel+.++filter(str(?prefLabel)='Zinc')+++?id+?prop+?valueId+.+++?valueId+skos:prefLabel+?value.+?id+skos:broader+?broaderId+.+++?broaderId+skos:prefLabel+?broader.+%7D+LIMIT+1000&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=5000&debug=on"
        console.log(url)
    //   url=url.replace(/\\n/g,"")
        url="http://vps475829.ovh.net:8890/sparql?default-graph-uri=&query=select+distinct+%3FConcept+where+%7B%5B%5D+a+%3FConcept%7D+LIMIT+100&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=5000&debug=on"
        url="http://vps475829.ovh.net:8890/sparql?default-graph-uri=&query=PREFIX+skos%3A+%3Chttp%3A%2F%2Fwww.w3.org%2F2004%2F02%2Fskos%2Fcore%23%3ESELECT+DISTINCT+*WHERE+%7B%3Fid+skos%3AprefLabel+%3FprefLabel+.+filter(str(%3FprefLabel)%3D'Zinc')++%3Fid+%3Fprop+%3FvalueId+.++%3FvalueId+skos%3AprefLabel+%3Fvalue.%3Fid+skos%3Abroader+%3FbroaderId+.++%3FbroaderId+skos%3AprefLabel+%3Fbroader.%7DLIMIT+1000&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=5000&debug=on"
*/
        superagent
            .get(url)

            //   .send({query:sparqlQuery}) // sends a JSON post body
          .set("Accept", 'application/sparql-results+json')
           .set("user-agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.106 Safari/537.36")
            .end((err, res) => {
                if (err)
                    return callback(err);
                callback(null, res.body)
            })

      /*  request({
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
            });*/




    }



}

module.exports=httpProxy

//httpProxy.get()

