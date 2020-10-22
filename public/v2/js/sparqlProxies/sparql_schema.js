var Sparql_schema = (function () {


    var self = {}
    self.skosUri = "http://www.w3.org/2004/02/skos/core/"
    self.npdOntologyUri="http://sws.ifi.uio.no/vocab/npd-v2/"

    self.getClasses = function (schemaUri, callback) {

        var query = " PREFIX  rdfs:<http://www.w3.org/2000/01/rdf-schema#> " +
            "PREFIX  rdf:<http://www.w3.org/1999/02/22-rdf-syntax-ns#>" +
            "prefix owl: <http://www.w3.org/2002/07/owl#>" +
            "select distinct *  FROM <" + schemaUri + ">   WHERE  {  ?class  rdf:type owl:Class. ?class rdfs:label ?classLabel" +
            " OPTIONAL{?childClass rdfs:subClassOf* ?class. ?childClass rdfs:label ?childClassLabel } }order by ?classLabel ?childClassLabel limit 1000"

        var url = Config.default_sparql_url + "?query=&format=json";
        Sparql_proxy.querySPARQL_GET_proxy(url, query, "", null, function (err, result) {
            if (err) {
                return callback(err)
            }
            return callback(null, result.results.bindings)

        })


    }
    self.getClassProperties = function (schemaUri, classId, callback) {

        var query = " PREFIX  rdfs:<http://www.w3.org/2000/01/rdf-schema#> " +
            "PREFIX  rdf:<http://www.w3.org/1999/02/22-rdf-syntax-ns#>" +
            " PREFIX  skos:<http://www.w3.org/2004/02/skos/core#>" +
            " PREFIX owl: <http://www.w3.org/2002/07/owl#>" +
            " select distinct * FROM <" + schemaUri + ">   WHERE  {  ?property rdfs:range <" + classId + "> . ?property rdfs:label ?propertyLabel." +
            " OPTIONAL{ ?subProperty rdfs:subPropertyOf* ?property. ?subProperty rdfs:label ?subPropertyLabel}} limit 1000"

        var url = Config.default_sparql_url + "?query=&format=json";
        Sparql_proxy.querySPARQL_GET_proxy(url, query, "", null, function (err, result) {
            if (err) {
                return callback(err)
            }
            return callback(null, result.results.bindings)

        })


    }
    self.getObjectAnnotations = function (schemaUri, classId, callback) {

        var query = " PREFIX  rdfs:<http://www.w3.org/2000/01/rdf-schema#> " +
            "PREFIX  rdf:<http://www.w3.org/1999/02/22-rdf-syntax-ns#>" +
            " PREFIX  skos:<http://www.w3.org/2004/02/skos/core#>" +
            " PREFIX owl: <http://www.w3.org/2002/07/owl#>" +
            " select distinct * FROM <" + schemaUri + ">   WHERE  " +
            "{ ?annotation rdf:type <http://www.w3.org/2002/07/owl#AnnotationProperty>.?annotation rdfs:label ?annotationLabel } " +
            "limit 1000"

        var url = Config.default_sparql_url + "?query=&format=json";
        Sparql_proxy.querySPARQL_GET_proxy(url, query, "", null, function (err, result) {
            if (err) {
                return callback(err)
            }
            return callback(null, result.results.bindings)

        })


    }


    return self;

})()
