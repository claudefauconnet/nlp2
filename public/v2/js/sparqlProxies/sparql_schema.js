var Sparql_schema = (function () {


    var self = {}
    self.skosUri = "http://www.w3.org/2004/02/skos/core/"
    self.npdOntologyUri = "http://sws.ifi.uio.no/vocab/npd-v2/"

    self.getClasses = function (sourceSchema, callback) {
        var fromStr="";
        if (sourceSchema.graphUri)
            fromStr = "FROM <" + sourceSchema.graphUri + "> ";

        var query = " PREFIX  rdfs:<http://www.w3.org/2000/01/rdf-schema#> " +
            "PREFIX  rdf:<http://www.w3.org/1999/02/22-rdf-syntax-ns#>" +
            "select distinct *  " + fromStr + "  WHERE  {  ?class  rdf:type owl:Class. OPTIONAL {?class rdfs:label ?classLabel}"
        if(sourceSchema.allSubclasses)
            query += " OPTIONAL{?childClass rdfs:subClassOf* ?class. ?childClass rdfs:label ?childClassLabel } "

        query += " }order by ?classLabel ?childClassLabel limit 1000"

        var url = sourceSchema.sparql_url + "?query=&format=json";;
        Sparql_proxy.querySPARQL_GET_proxy(url, query, "", null, function (err, result) {
            if (err) {
                return callback(err)
            }
            return callback(null, result.results.bindings)

        })


    }
    self.getClassProperties = function (sourceSchema, classId, callback) {
        var fromStr="";
        if (sourceSchema.graphUri)
            fromStr = "FROM <" + sourceSchema.graphUri + "> ";

        var query = " PREFIX  rdfs:<http://www.w3.org/2000/01/rdf-schema#> " +
            "PREFIX  rdf:<http://www.w3.org/1999/02/22-rdf-syntax-ns#>" +
            " select distinct *  " + fromStr + "  WHERE  {  ?property rdfs:range|rdfs:domain <" + classId + "> . OPTIONAL{?property rdfs:label ?propertyLabel.}" +
            " OPTIONAL{ ?subProperty rdfs:subPropertyOf* ?property. OPTIONAL{?subProperty rdfs:label ?subPropertyLabel}}} limit 1000"

        var url = sourceSchema.sparql_url + "?query=&format=json";
        Sparql_proxy.querySPARQL_GET_proxy(url, query, "", null, function (err, result) {
            if (err) {
                return callback(err)
            }
            return callback(null, result.results.bindings)

        })


    }
    self.getObjectAnnotations = function (sourceSchema, classId, callback) {
        var fromStr="";
        if (sourceSchema.graphUri)
             fromStr = "FROM <" + sourceSchema.graphUri + "> ";

        var query = " PREFIX  rdfs:<http://www.w3.org/2000/01/rdf-schema#> " +
            "PREFIX  rdf:<http://www.w3.org/1999/02/22-rdf-syntax-ns#>" +
            " select distinct * " + fromStr + "   WHERE  " +
            "{ ?annotation rdf:type <http://www.w3.org/2002/07/owl#AnnotationProperty>. OPTIONAL{?annotation rdfs:label ?annotationLabel} } " +
            "limit 1000"

        var url = sourceSchema.sparql_url + "?query=&format=json";
        Sparql_proxy.querySPARQL_GET_proxy(url, query, "", null, function (err, result) {
            if (err) {
                return callback(err)
            }
            return callback(null, result.results.bindings)

        })


    }

    self.getObjectRanges = function (sourceSchema, classId, callback) {
        var fromStr="";
        if (sourceSchema.graphUri)
             fromStr = "FROM <" + sourceSchema.graphUri + "> ";
        var query = " PREFIX  rdfs:<http://www.w3.org/2000/01/rdf-schema#> " +
            "PREFIX  rdf:<http://www.w3.org/1999/02/22-rdf-syntax-ns#>" +
            " select distinct *  " + fromStr + "   WHERE  " +
            "{ ?prop rdfs:domain <" + classId + "> " +
            "?prop rdfs:range ?range. OPTIONAL{?range rdfs:label ?rangeLabel }} " +
            "limit 1000"

        var url = sourceSchema.sparql_url + "?query=&format=json";
        Sparql_proxy.querySPARQL_GET_proxy(url, query, "", null, function (err, result) {
            if (err) {
                return callback(err)
            }
            return callback(null, result.results.bindings)

        })


    }


    return self;

})()
