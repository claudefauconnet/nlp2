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





      /*  console.log(url)
        url="http://vps475829.ovh.net:8890/sparql?default-graph-uri=&query=PREFIX+skos:+%3Chttp://www.w3.org/2004/02/skos/core#%3E+SELECT+DISTINCT+*+WHERE+%7B+?id+skos:prefLabel+?prefLabel+.++filter(str(?prefLabel)='Zinc')+++?id+?prop+?valueId+.+++?valueId+skos:prefLabel+?value.+?id+skos:broader+?broaderId+.+++?broaderId+skos:prefLabel+?broader.+%7D+LIMIT+1000&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=5000&debug=on"
        console.log(url)
    //   url=url.replace(/\\n/g,"")
        url="http://vps475829.ovh.net:8890/sparql?default-graph-uri=&query=select+distinct+%3FConcept+where+%7B%5B%5D+a+%3FConcept%7D+LIMIT+100&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=5000&debug=on"
        url="http://vps475829.ovh.net:8890/sparql?default-graph-uri=&query=PREFIX+skos%3A+%3Chttp%3A%2F%2Fwww.w3.org%2F2004%2F02%2Fskos%2Fcore%23%3ESELECT+DISTINCT+*WHERE+%7B%3Fid+skos%3AprefLabel+%3FprefLabel+.+filter(str(%3FprefLabel)%3D'Zinc')++%3Fid+%3Fprop+%3FvalueId+.++%3FvalueId+skos%3AprefLabel+%3Fvalue.%3Fid+skos%3Abroader+%3FbroaderId+.++%3FbroaderId+skos%3AprefLabel+%3Fbroader.%7DLIMIT+1000&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=5000&debug=on"
*/

    //  url="http://ma-graph.org/sparql?default-graph-uri=&query=%20PREFIX%20rdf%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F1999%2F02%2F22-rdf-syntax-ns%23%3E%20PREFIX%20foaf%3A%20%3Chttp%3A%2F%2Fxmlns.com%2Ffoaf%2F0.1%2F%3E%20PREFIX%20xsd%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F2001%2FXMLSchema%23%3E%20PREFIX%20map%3A%20%3Chttp%3A%2F%2Fma-graph.org%2Fproperty%2F%3E%20%20SELECT%20distinct%20*%20WHERE%20%7B%20%20%3Ffield%20foaf%3Aname%20%22Corrosion%22%5E%5Exsd%3Astring%20.%20%3Ffield%20%20foaf%3Aname%20%3FprefLabel%20.%20%3Ffield%20map%3AhasParent%20%3FbroaderId1%20.%20%3FbroaderId1%20foaf%3Aname%20%3FbroaderLabel1%20.%20%7D%20LIMIT%20100&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on"
       var request= superagent .get(url)




        for(var key in options.headers){
            request.set(key,options.headers[key])

        }



        request .end((err, res) => {
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

