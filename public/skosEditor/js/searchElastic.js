var searchElastic = (function () {

    var self = {}
    var elasticUrl="/elastic"
    self.search = function (query, index, callback) {

        var strQuery = JSON.stringify(query);
        var payload = {
            executeQuery: strQuery,
            indexes: JSON.stringify(index)

        }
        $.ajax({
            type: "POST",
            url: elasticUrl,
            data: payload,
            dataType: "json",
            success: function (data, textStatus, jqXHR) {
                var hits = data.hits.hits;
                callback(null, hits)

            }
            , error: function (err) {

                console.log(err.responseText)
                if (callback) {
                    return callback(err)
                }
                return (err);
            }

        });


    }
    self.getLocParents = function (name) {
        var query = {
            "query": {
                "bool": {
                    "must": [
                        {
                            "query_string": {
                                "query": "concept:" + name,

                                "default_operator": "AND"
                            }
                        }
                    ]
                }
            },
            "from": 0,
            "size": 1000

        }
        var index = "libraryofcongress";
        self.search(query, index, function (err, result) {
            self.showResults(result);

        })


    }

    self.getLocChildren = function (name) {
        var query = {
            "query": {
                "bool": {
                    "must": [
                        {
                            "query_string": {
                                "query": "parentNames:" + name,

                                "default_operator": "AND"
                            }
                        }
                    ]
                }
            },
            "from": 0,
            "size": 1000

        }
        var index = "libraryofcongress";
        self.search(query, index, function (err, result) {

            self.showResults(result);


        })


    }
    self.showResults=function(result){
        result.sort(function(a,b){
            if(a._source.concept>b._source.concept)
                return 1;
            if(a._source.concept<b._source.concept)
                return -1;
            return 0;
        })
        var str="<table>"
        result.forEach(function (hit) {
            hit=hit._source
            //  parents.push(hit._source.parentNames);
            //  str+=  hit.concept + "\t" + hit.id + "\t" + hit.parents + "\t" + hit.parentNames + "\n"
            // str+=  "<tr><td>"+hit.concept + "</td><td>" + hit.parentNames +"</td></td>t" + hit.id + "</td><td>" + hit.parents +  "</td></tr>"
            str+=  "<tr style='border: solid brown 1px'><td>"+hit.concept + "</td><td>" + hit.parentNames +"</td></tr>"
        })
        $("#searchElasticPopupDiv").css("display","block")
        //  $("#searchElasticResultDiv").html(JSON.stringify(parents,null,2));
        $("#searchElasticResultDiv").html(str);
    }


    return self;


})()
