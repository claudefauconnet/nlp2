var Config = (function () {
    var self = {};
    self.serverUrl = "/elastic";
    self.sparql_url = "http://51.178.139.80:8890/sparql"


    self.sources = {}
    self.sources['Total-CTG'] = {controller: Sparql_skos_generic, Sparql_url: 'http://vps-c46025b8.vps.ovh.net:8890/sparql/', graphIri: 'http://data.total.com/resource/thesaurus/ctg/'};
    self.sources['Oil&Gas-Upstream'] = {controller: Sparql_skos_generic, Sparql_url: 'http://vps-c46025b8.vps.ovh.net:8890/sparql/', graphIri: 'http://souslesens.org/oil-gas/upstream/'};


    self.sources['ISO_15926'] = {controller: Sparql_ISO_15926, Sparql_url: 'http://68.71.136.105/sparql/', graphIri: '',};
    self.sources['GEMET'] = {controller: Sparql_GEMET, Sparql_url: 'http://vps-c46025b8.vps.ovh.net:8890/sparql/', graphIri: 'http://www.eionet.europa.eu/gemet/'};
    self.sources['BNF'] = {controller: Sparql_skos_generic, Sparql_url: 'https://data.bnf.fr/sparql', graphIri: 'http://data.bnf.fr'};
    self.sources['Dbpedia'] = {controller: Sparql_skos_generic, Sparql_url: 'http://dbpedia.org/sparql', graphIri: 'http://dbpedia.org', ancestorsDepth: 4};

    self.sources['WORDNET'] = {controller: Sparql_WORDNET, Sparql_url: 'http://wordnet.rkbexplorer.com/sparql/', graphIri: ''};
    self.sources['USGS'] = {controller: Sparql_skos_generic, Sparql_url: 'http://vps-c46025b8.vps.ovh.net:8890/sparql/', graphIri: 'https://www2.usgs.gov/science/USGSThesaurus/'};
    self.sources['TermSciences'] = {controller: Sparql_skos_generic, Sparql_url: 'http://vps-c46025b8.vps.ovh.net:8890/sparql/', graphIri: 'http://api.termsciences.fr/termsciences/',};
    self.sources['ThesaurusIngenieur'] = {controller: Sparql_skos_generic, Sparql_url: 'http://vps-c46025b8.vps.ovh.net:8890/sparql/', graphIri: 'http://www.souslesens.org/thesaurusIngenieur/'};
    self.sources['Unesco'] = {controller: Sparql_skos_generic, Sparql_url: 'http://vps-c46025b8.vps.ovh.net:8890/sparql/', graphIri: 'http://skos.um.es/unesco6/'};
    self.sources['LibraryOfCongress'] = {controller: Sparql_skos_generic, Sparql_url: 'http://vps-c46025b8.vps.ovh.net:8890/sparql/', graphIri: 'http://www.loc.gov/'};
    self.sources['Wikidata'] = {controller: Sparql_Wikidata, Sparql_url: 'https://query.wikidata.org/', graphIri: 'http://skos.um.es/unesco6/'};
    self.sources['Microsoft-accademic'] = {controller: Sparql_microsoft_accademic, Sparql_url: 'http://ma-graph.org/sparql/', graphIri: ''};
    self.sources['BabelNet'] = {controller: Sparql_babelNet, Sparql_url: 'https://babelnet.org/sparql/', graphIri: ''}


    self.tools = {};


    self.tools["thesaurusBrowser"] = {label: "thesaurus browser", multiSources: 0, controller: ThesaurusBrowser}
    self.tools["termTaxonomy"] = {label: "term taxonomy", multiSources: 1, controller: TermTaxonomy}
    self.tools["corpusGraph"] = {label: "corpus graph", multiSources: 1, controller: CorpusGraph}
    self.tools["ontologyBrowser"] = {label: "ontology browser", multiSources: 0, controller: OntologyBrowser}


    return self;

})()
    
    
    
    
    
    
    
    
    
    
    
