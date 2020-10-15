var Config = (function () {
    var self = {};
    self.serverUrl = "/elastic";
    self.default_sparql_url = "http://51.178.139.80:8890/sparql"


    self.wikiCategoriesGraphIri = "http://souslesens.org/data/total/ep/"

    self.sources = {}
    self.sources['Total-CTG'] = {controller: Sparql_generic, sparql_url: self.default_sparql_url, graphIri: 'http://data.total.com/resource/thesaurus/ctg/',
        predicates: {lang:"en"}};
    self.sources['Oil&Gas-Upstream'] = {controller: Sparql_generic, sparql_url: self.default_sparql_url, graphIri: 'http://souslesens.org/oil-gas/upstream/',
        predicates: {lang:"en"}};


    self.sources['ISO_15926'] = {
        controller: Sparql_generic, sparql_url: 'http://68.71.136.105/sparql/', graphIri: null,
        predicates: {
            prefixes: ["rdfs:<http://www.w3.org/2000/01/rdf-schema#>"],
            prefLabel: "rdfs:label",
            topConceptbroader: "rdfs:subClassOf|^rdfs:superClassFor",
            topConceptFilter: "?topConcept rdfs:subClassOf <http://data.15926.org/dm/Thing>."
        }
    };
    self.sources['GEMET'] = {
        controller: Sparql_generic, sparql_url: self.default_sparql_url, graphIri: 'http://www.eionet.europa.eu/gemet/',
        predicates: {
            lang:"en",
            prefLabel: "rdfs:label|skos:prefLabel",
            topConceptbroader: "^skos:member",
            topConceptFilter: "?topConcept rdf:type <http://www.eionet.europa.eu/gemet/2004/06/gemet-schema.rdf#SuperGroup>." +
                ""//  "?concept rdf:type <http://www.eionet.europa.eu/gemet/2004/06/gemet-schema.rdf#Group>."
        }

    };
    self.sources['BNF'] = {
        controller: Sparql_generic, sparql_url: 'https://data.bnf.fr/sparql', graphIri: 'http://data.bnf.fr',
        predicates: {
            topConceptbroader: "terms:isPartOf",
            lang: "fr"
        }
    };
    self.sources['Dbpedia'] = {
        controller: Sparql_generic, sparql_url: 'http://dbpedia.org/sparql', graphIri: 'http://dbpedia.org', ancestorsDepth: 4,
        predicates: {
            //https://forum.dbpedia.org/t/from-a-top-wikipedia-category-go-3-levels-down-and-get-all-instances-and-an-overview-of-all-available-taxonomies/376
            // topConceptFilter: "?topConcept skos:broader <http://dbpedia.org/page/Category:Main_topic_classifications>."
            topConceptFilter: "?topConcept  <http://www.w3.org/2000/01/rdf-schema#subClassOf>\t<http://www.w3.org/2002/07/owl#Thing> .",
            topConceptbroader: "rdfs:subClassOf",
            prefLabel: "rdfs:label",
            lang:"en"


        }
    };


    self.sources['WORDNET'] = {controller: Sparql_generic, sparql_url: 'http://wordnet.rkbexplorer.com/sparql/', graphIri: '',
        predicates: {
            prefixes: ["wordnet:<http://www.w3.org/2006/03/wn/wn20/schema/>","rdfs:<http://www.w3.org/2000/01/rdf-schema#>"],
            topConceptFilter: "?topConcept wordnet:hyponymOf  <http://wordnet.rkbexplorer.com/id/synset-entity-noun-1> .",
            topConceptbroader: " wordnet:hyponymOf",
            prefLabel: "rdfs:label",
            optionalDepth:1



        }};


    self.sources['USGS'] = {controller: Sparql_generic, sparql_url: 'http://vps-c46025b8.vps.ovh.net:8890/sparql/', graphIri: 'https://www2.usgs.gov/science/USGSThesaurus/'};
    self.sources['TermSciences'] = {controller: Sparql_generic, sparql_url: 'http://vps-c46025b8.vps.ovh.net:8890/sparql/', graphIri: 'http://api.termsciences.fr/termsciences/',};
    self.sources['ThesaurusIngenieur'] = {controller: Sparql_generic, sparql_url: 'http://vps-c46025b8.vps.ovh.net:8890/sparql/', graphIri: 'http://www.souslesens.org/thesaurusIngenieur/'};
    self.sources['Unesco'] = {controller: Sparql_generic, sparql_url: 'http://vps-c46025b8.vps.ovh.net:8890/sparql/', graphIri: 'http://skos.um.es/unesco6/'};
    self.sources['LibraryOfCongress'] = {controller: Sparql_generic, sparql_url: 'http://vps-c46025b8.vps.ovh.net:8890/sparql/', graphIri: 'http://www.loc.gov/'};
 //   self.sources['Wikidata'] = {controller: Sparql_Wikidata, sparql_url: 'https://query.wikidata.org/', graphIri: 'http://skos.um.es/unesco6/'};
  //  self.sources['Microsoft-accademic'] = {controller: Sparql_microsoft_accademic, sparql_url: 'http://ma-graph.org/sparql/', graphIri: ''};
  //  self.sources['BabelNet'] = {controller: Sparql_babelNet, sparql_url: 'https://babelnet.org/sparql/', graphIri: ''}


    self.tools = {};


    self.tools["thesaurusBrowser"] = {label: "source browser", multiSources: 0, controller: ThesaurusBrowser}
    self.tools["thesauriMatcher"] = {label: "sources  matcher", multiSources: 0, controller: ThesaurusMatcher}
    self.tools["nerEvaluator"] = {label: "sources evaluator", multiSources: 1, controller: NerEvaluator}
    self.tools["termTaxonomy"] = {label: "term taxonomies", multiSources: 1, controller: TermTaxonomy}
    //  self.tools["corpusGraph"] = {label: "corpus concepts graph", multiSources: 1, controller: CorpusGraph}
    //  self.tools["ontologyBrowser"] = {label: "ontology browser", multiSources: 0, controller: OntologyBrowser}


    return self;

})()
    
    
    
    
    
    
    
    
    
    
    
