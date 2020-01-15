var fs = require('fs');
var async = require('async')

var tulsaToSkos = {
    parseTxt: function () {

        var entitiesArray = []
        var jsonArray = [];
        var conceptsMap={}
        var filePath = "D:\\NLP\\Tulsa.txt";

        var str = "" + fs.readFileSync(filePath);
        var lines = str.split("\n");
        lines.forEach(function (line, index) {
            if (index > 20000000)
                return;
            var obj = {
                type: line.substring(0, 6).trim(),
                term: line.substring(6, 32).trim(),
                id: line.substring(32, 41).trim(),
            }
            jsonArray.push(obj);


        })
        var entity = null;
        var schemes = ["common word",
            "geographic area",
            "organisation",
            "chemistry",
            "geological term"
        ]
        jsonArray.forEach(function (item) {

            if (item.type == "DS") {
                if (entity != null) {
                    entitiesArray.push(entity)
                }

                var scheme = schemes[parseInt(item.id.substring(0, 1)) - 1]
                conceptsMap[item.term]= item.id
                entity = {

                    prefLabel: item.term,
                    id: item.id,
                    inScheme: scheme,
                    relateds: [],
                    altLabels: [],
                }
            } else if (item.type == "BT") {
                entity.broader = item.term
            } else if (item.type == "SA") {
                entity.relateds.push(item.term)
            } else if (item.type.indexOf("SN") == 0) {
                var p;
                if ((p = item.term.indexOf(")")) > -1)
                    item.term = item.term.substring(p + 2)

                entity.altLabels.push(item.term)


            }

        })
        if (entity != null) {
            entitiesArray.push(entity)
        }


        var str="";
        str+="<?xml version=\"1.0\" encoding=\"utf-8\"?>\n" +
            "<rdf:RDF xmlns:skos=\"http://www.w3.org/2004/02/skos/core#\"  xmlns:rdf=\"http://www.w3.org/1999/02/22-rdf-syntax-ns#\">"
        schemes.forEach(function(scheme) {
            str += "<skos:ConceptScheme rdf:about=\"http://PetroleumAbstractsThesaurus/"+scheme+"\">"
            str += "<skos:prefLabel xml:lang='en'>"+scheme+"</skos:prefLabel>"
            str += "</skos:ConceptScheme>";

        })

        var js2xmlparser = require("js2xmlparser");
        entitiesArray.forEach(function (entity,index) {

            if(entity.id.charAt(0)!="5")
                return;
            var obj = {

                    "@": {
                        "rdf:about": "http://PetroleumAbstractsThesaurus/" + entity.prefLabel
                    },

                    "skos:prefLabel": {
                        "@": {
                            "xml:lang": "en"
                        },
                        "#": entity.prefLabel
                    },

                    "skos:inScheme": {"@": {"rdf:resource": "http://PetroleumAbstractsThesaurus/" + entity.inScheme}}

                }

            if (entity.broader)
                obj["skos:broader"] = {"@": {"rdf:resource":"http://PetroleumAbstractsThesaurus/"+ entity.broader}},

                    entity.altLabels.forEach(function (altLabel) {
                        obj["skos:altLabel"] = {
                            "@": {
                                "xml:lang": "en"
                            },
                            "#": altLabel
                        }
                    })
            entity.relateds.forEach(function (related) {
                obj["skos:related"] = {
                    "@": {
                        "xml:lang": "en"
                    },
                    "#": "http://PetroleumAbstractsThesaurus/"+ related
                }
            })


            str+=js2xmlparser.parse("skos:Concept", obj).substring(22)+"\n";
        })
        str+="</rdf:RDF>"



        fs.writeFileSync( "D:\\NLP\\Tulsa.rdf",str)



        /*   var xx = entitiesArray;
           var schemes = []
           var schemeIds = []
           entitiesArray.forEach(function (entity) {
               var scheme = entity.id.substring(0, 4)
               if (schemeIds.indexOf(scheme) < 0) {
                   schemeIds.push(scheme)
                   schemes.push({broader: entity.broader, term: entity.prefLabel, scheme: scheme})

               }
           })

           schemes.sort(function (a, b) {
               if (a.scheme > b.sheme)
                   return 1;
               if (a.scheme < b.sheme)
                   return -1;
           })

           schemes.forEach(function (scheme) {
               console.log(scheme.term + "\t" + scheme.scheme)
           })*/
    }


}

tulsaToSkos.parseTxt();

module.exports = tulsaToSkos
