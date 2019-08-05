var entities = (function () {
    var self = {}

    self.getQuestionEntities = function (query) {

        // on ajoute la question + l'id pour avoir les highlight
        Search.analyzeQuestion(context.question, function (err, query) {
            mainController.queryElastic({
                query: query,
                _source: [""],
                size:5000

            }, null,function(err,result){
                if (err) {
                    return $("#resultDiv").html(err);
                }
                if (result.hits.hits.length == 0)
                    return $("#resultDiv").html("pas de résultats");
                var docIds=[];
                result.hits.hits.forEach(function(hit){
                    docIds.push(hit._id);



                    })
                var payload=config.hitsEntitiesQuery;
                payload.query.terms["documents.id"]=docIds
                mainController.queryElastic(payload, "eurovoc_entities",function(err, result){
                    var xxx=result;

                })



            })
        })
    }


    return self;


})()
