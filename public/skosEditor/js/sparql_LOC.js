var sparql_LOC = (function () {


    var self = {};

    self.list = function (word, options, callback) {
        var bindings = [];


        return callback(null, bindings);
    }

    self.getAncestor = function (id, options, callback) {
        var maxLevels = 8

        var skosMap = {};
        var broadersDoneByLevel = {};
        var done = false;

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
                    var level2 = level + 1
                    broaders.forEach(function (broader, index) {
                        broadersDoneByLevel[level] = broadersDoneByLevel[level] || (index >= (broaders.length - 1))
                        var broaderId = broader["@id"].substring(broader["@id"].lastIndexOf("/") + 1)
                        skosMap[id].broaders.push({lang: "en", value: broaderId})

                        recurseParents(broaderId, level2);

                    })
                } else {
                    if (!done && level >= 8) {
                        var end = true;
                        for (var key in broadersDoneByLevel) {
                            end = end & broadersDoneByLevel[key]
                        }


                        if (end) {
                            done=true;
                            var concepts = [];
                            for (var key in skosMap) {
                                concepts.push(skosMap[key])
                            }
                            var paths = sparql_abstract.skosToFlat(id, concepts,"LOC")

                            return callback(null, paths)
                           // console.log(JSON.stringify(path, null, 2))
                        }
                    }


                }


            })

        }

        recurseParents(id, 0);


    }


    self.getChildren = function (id, options, callback) {
        var bindings=[]

        self.getDetails(id, options, function (err, result) {
            if (err)
                return callback(err);

            var narrowers = result["http://www.w3.org/2004/02/skos/core#narrower"]
            if (!narrowers) {
                return callback(null, [])
            }
            else{
                async.eachSeries(narrowers, function (narrower, callbackEach) {
                    var narrowerID = narrower["@id"].substring(narrower["@id"].lastIndexOf("/") + 1)
                    self.getDetails(narrowerID, options, function (err, result) {
                        if (err)
                            return callbackEach(err);
                        var narrowerLabel = result["http://www.w3.org/2004/02/skos/core#prefLabel"][0]["@value"]
                        bindings.push({narrowerId: narrowerID, narrowerLabel: narrowerLabel})
                        callbackEach()
                    })

                }, function (err) {
                    if (err)
                        return callback(err);
                    callback(null, bindings)

                })
            }
        })

    }

    self.getDetails = function (id, options, callback) {
        var url = "http://id.loc.gov/authorities/subjects/" + id
        sparql_abstract.querySPARQL_GET(url, "", "", function (err, result) {
            if (err)
                return callback(err);

          //  console.log(JSON.stringify(result, null, 2))
            var obj = {}
            result.forEach(function (item) {
                if (item["@id"].indexOf(id) > -1)
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
