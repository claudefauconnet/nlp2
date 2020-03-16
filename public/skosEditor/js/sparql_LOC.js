var sparql_LOC = (function () {


    var self = {};

    self.list = function (word, options, callback) {
        var bindings = [];


        return callback(null, bindings);
    }

    self.getAncestor = function (id, options, callback) {
var maxLevels=8

        var skosMap = {};
var broaderEachEnd=false;
        function recurseParents(id, level) {


                if (!skosMap[id])
                    skosMap[id] = {prefLabels: [], id: id, broaders: []}


                self.getDetails(id, options, function (err, result) {
                    if (err)
                        return callback(err);

                    if (result["http://www.w3.org/2004/02/skos/core#prefLabel"]) {
                        result["http://www.w3.org/2004/02/skos/core#prefLabel"].forEach(function (name) {
                            skosMap[id].prefLabels.push({lang: name["@language"], value: name["@value"]})
                        })
                    }
                    var broaders = result["http://www.w3.org/2004/02/skos/core#broader"]
                    if (broaders) {

                        broaders.forEach(function (broader,index) {
                            broaderEachEnd=index>=broaders.length
                            var broaderId = broader["@id"].substring(broader["@id"].lastIndexOf("/") + 1)
                            skosMap[id].broaders.push({lang: "en", value: broaderId})
                            recurseParents(broaderId, level + 1);

                        })
                    } else {
                        if(broaderEachEnd || level>=maxLevels){
                            var x =skosMap
                            var concepts=[]
                            for(var key in skosMap){
                                concepts.push(skosMap[key])
                            }
                        }


                    }


                })

        }

       recurseParents(id, 0);




    }


    self.getChildren = function (id, options, callback) {


        callback(null, [])
    }

    self.getDetails = function (id, options, callback) {
        var url = "http://id.loc.gov/authorities/subjects/" + id
        sparql_abstract.querySPARQL_GET(url, "", "", function (err, result) {
            if (err)
                return callback(err);

            console.log(JSON.stringify(result, null, 2))
            var obj = {}
            result.forEach(function (item) {
                if (item["@id"].indexOf(id)>-1)
                if (item["@type"].indexOf("http://www.loc.gov/mads/rdf/v1#Authority") > -1)
                    if (item["@type"].indexOf("http://www.loc.gov/mads/rdf/v1#Topic") > -1)
                        if (item["@type"].indexOf("http://www.w3.org/2004/02/skos/core#Concept") > -1)
                            obj = item;
            })

            callback(null, obj)
        })

    }


    return self;

})
()
