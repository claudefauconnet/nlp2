var NavigateThesaurus = (function () {
    var self = {}

    self.showThesaurusTopConcepts = function (thesaurusLabel) {
        Sparql_facade.getTopConcepts(thesaurusLabel, function (err, result) {
            if (err) {
                return MainController.message(err);
            }

            var options={ layoutHierarchical:1}
           

            GraphController.drawOrUpdateGraph(result,null,"#","topConcept",null,"box",options)


        })


    }


    return self;


})()
