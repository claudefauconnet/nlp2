var request = require('request')
const superagent = require('superagent');
var async=require('async')
var wikidata = {


    getParents: function (label, callback) {
        var stopValues = ["entity", "occurrence", "concept"]

        label2 = encodeURIComponent(label)

        var url = "https://query.wikidata.org/sparql?query=SELECT%20*%20WHERE%20%7B%0A%20%20%20%3Fitem1%20%3Flabel%20%22" + label2 + "%22%40en.%20%20%0A%20%20%3Fitem1%20wdt%3AP31%2Fwdt%3AP279%20%3Fitem2.%0A%20%20%3Fitem2%20rdfs%3Alabel%20%3FitemLabel.%20%0A%20%20FILTER%20(LANG(%3FitemLabel)%20%3D%20%22en%22)%0A%20%20%20%20%20%20%0A%7D%0Alimit%20100"
// callback
        superagent
            .get(url)
            //   .send({query:sparqlQuery}) // sends a JSON post body
            .set("Accept", 'application/sparql-results+json')
            .set("user-agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.106 Safari/537.36")
            .end((err, res) => {
                if (err)
                    return callback(err);

                var obj = {child: label, parents: []}
                var items = res.body.results.bindings;
                items.forEach(function (item) {

                    var parent = item.itemLabel.value
                    if (stopValues.indexOf(parent) < 0) {
                        obj.parents.push(parent)
                    }
                })
                callback(null, obj)


            });
    }


}
var labels = ["Corrosiveness","Cathodic Disbondment",
    "Coating Breakdown Factor",
    "Composition",
    "Corrosion Level",
    "Corrosion Rate",
    ];

var wikidataConcepts = []
async.eachSeries(labels, function (label, callbackEach) {
    setTimeout(function () {

        wikidata.getParents(label, function (err, result) {
            if (err)
                return console.log(err)
            wikidataConcepts.push(result);
            callbackEach()


        })
    }, 500)
}, function (err) {
    if (err) {

    }
    fs.writeFileSync("D:\\NLP\wikidataConcepts.json", JSON.stringify(wikidataConcepts, null, 2));
})

