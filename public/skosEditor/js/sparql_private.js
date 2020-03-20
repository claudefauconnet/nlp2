

var sparql_private=(function(){


    var self={};

    self.list=function(word,options,callback){
        self.currentWord=word
        var bindings=[];
        options.default_field="prefLabels"
        self.queryElastic(word, options, function (err, result) {
            if (err)
                return console.log(err);
            var hits = result.hits.hits;
            hits.forEach(function (hit) {
                if (options.exactMatch) {
                    var hitWords = hit._source.prefLabels.replace(/\*/g, "").toLowerCase().split(",")
                    if (hitWords.indexOf(word.replace(/\*/g, "").toLowerCase()) < 0)
                        return;

                }
                var parent=hit._source.ancestors.split("|")[2]
                parent=parent.substring(parent.indexOf(";")+1)
                bindings.push({id:hit._source.id , label:hit._source.prefLabels,description:parent,source:"private",thesaurus:hit._source.thesaurus})
            })
            callback(null, bindings)

        })

        return callback(null,bindings);
    }



    self.getAncestors=function(id,options,callback) {
        var str = self.parseId(id);
        var queryString = "*" + str;

        self.queryElastic(queryString, {}, function (err, result) {
            if (err)
                return console.log(err);
            var hits = result.hits.hits;
            var bindings = [];
            hits.forEach(function (hit) {
                if (options.exactMatch) {
                    var hitWords = hit._source.prefLabels.replace(/\*/g, "").toLowerCase().split(",")
                    if (hitWords.indexOf(self.currentWord.replace(/\*/g, "").toLowerCase()) < 0)
                        return;

                }
                var binding=hit._source
                binding.source="private";
                bindings.push(binding)
            })
            return callback(null, bindings)

        })
    }
    self.getChildren=function(id,options,callback){
        var str = self.parseId(id);
        var queryString = "*" + str;

        self.queryElastic(queryString, {default_field: "ancestors"}, function (err, result) {
            if (err) {
               return callback(err)
            }
            var hits = result.hits.hits;

            var children = [];
            hits.forEach(function (hit) {
                var ancestors=hit._source.ancestors;
                var childId=hit._source.id;
                var p=ancestors.indexOf(id+";")
                var childrenStr=ancestors.substring(0,p);
                var q=childrenStr.lastIndexOf("|")
                if(q>-1){
                    var q2=childrenStr.lastIndexOf("|")
                    if(q2>-1){
                        var array=childrenStr.split(";")
                        if(array.length==2) {
                            var label = array[1]
                            label = label.substring(0, label.lastIndexOf("|"))
                            var data={source:"private",thesaurus:"private",parent:id}
                            var narrowerId=array[0].substring(array[0].indexOf("_")+1)
                            children.push({id: id, narrowerId:narrowerId, narrowerLabel: label,data:data});
                        }

                    }
                }
            })
            callback(null, children)

        })


    }

    self.getDetails=function(id,options,callback){
        var bindings=[];

        return bindings;
    }

    self.parseId=function(str){
        var p=str.lastIndexOf("#");
        if( p==-1)
            var p=str.lastIndexOf("/");
        str = str.substring(p + 1)
        str = str.replace(/[:\-\/.@#]/g, " ")
        return str;
    }


    self.queryElastic = function (queryString, options, callback) {
        var default_field = "prefLabels";

        var query = {

            "query": {
                "bool": {
                    "must": [
                        {
                            "query_string": {
                                "query": queryString,
                              //  "default_field": default_field,
                                "default_operator": "AND"
                            }
                        }
                    ]
                }
            },
            "from": 0,
            "size": 1000,
        }

        if(options.default_field)
            query.query.bool.must[0].query_string.default_field=options.default_field



        if (options.selectedThesaurus) {
            query.query.bool.must.push({terms: {thesaurus: [options.selectedThesaurus]}})
        }
        if(options.source)
            query._source=options.source


        query.query.bool.must_not=[{term: {thesaurus: "LOC"}}]

        var strQuery = JSON.stringify(query, null, 2);
        console.log(strQuery)
        var payload = {
            executeQuery: strQuery,
            indexes: JSON.stringify(["flat_thesaurus2"])

        }
        $.ajax({
            type: "POST",
            url: "/elastic",
            data: payload,
            dataType: "json",

            success: function (data, textStatus, jqXHR) {
                var xx = data;
                callback(null, data)

            }
            , error: function (err) {
                $("#waitImg").css("display", "none");
                console.log(err.responseText)
                if (callback) {
                    return callback(err)
                }
                return (err);
            }

        });


    }







    return self;

})()
