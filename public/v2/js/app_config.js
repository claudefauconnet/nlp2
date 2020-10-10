var Config=(function() {
    var self = {};
self.serverUrl="/elastic";
self.sparql_url="http://51.178.139.80:8890/sparql"


    self.sources = {}
    self.sources['Total-CTG'] = {type:"thesaurus",schema:"skos",sparql_url: 'http://vps-c46025b8.vps.ovh.net:8890/sparql/', graphIri: 'http://data.total.com/resource/thesaurus/ctg/', sparqlBuilder: "sparql_skos_generic"};
    self.sources['Oil&Gas-Upstream'] = {type:"thesaurus",schema:"skos",sparql_url: 'http://vps-c46025b8.vps.ovh.net:8890/sparql/', graphIri: 'http://souslesens.org/oil-gas/upstream/', sparqlBuilder: "sparql_skos_generic"};


    self.sources['ISO_15926'] = {type:"ontology",schema:"rdf",sparql_url: 'http://68.71.136.105/sparql/', graphIri: '', sparqlBuilder: "sparql_ISO_15926"};
    self.sources['GEMET'] = {type:"thesaurus",schema:"skos",sparql_url: 'http://vps-c46025b8.vps.ovh.net:8890/sparql/', graphIri: 'http://www.eionet.europa.eu/gemet/', sparqlBuilder: "sparql_GEMET"};
    self.sources['BNF'] = {type:"thesaurus",schema:"skos",sparql_url: 'https://data.bnf.fr/sparql', graphIri: 'http://data.bnf.fr', sparqlBuilder: "sparql_skos_generic"};
    self.sources['Dbpedia'] = {sparql_url: 'http://dbpedia.org/sparql', graphIri: 'http://dbpedia.org', sparqlBuilder: "sparql_skos_generic", ancestorsDepth: 4};

    self.sources['WORDNET'] = {type:"ontology",schema:"rdf",sparql_url: 'http://wordnet.rkbexplorer.com/sparql/', graphIri: '', sparqlBuilder: "sparql_WORDNET"};
    self.sources['USGS'] = {type:"ontology",schema:"rdf",sparql_url: 'http://vps-c46025b8.vps.ovh.net:8890/sparql/', graphIri: 'https://www2.usgs.gov/science/USGSThesaurus/', sparqlBuilder: "sparql_skos_generic"};
//    'Oil&Gas-Upstream': {sparql_url: 'http://vps-c46025b8.vps.ovh.net:8890/sparql/', graphIri: 'http://souslesens.org/oil-gas/upstream/', sparqlBuilder: "sparql_skos_generic"},
    self.sources['TermSciences'] = {type:"thesaurus",schema:"skos",sparql_url: 'http://vps-c46025b8.vps.ovh.net:8890/sparql/', graphIri: 'http://api.termsciences.fr/termsciences/', sparqlBuilder: "sparql_skos_generic"};
    self.sources['ThesaurusIngenieur'] = {type:"thesaurus",schema:"skos",sparql_url: 'http://vps-c46025b8.vps.ovh.net:8890/sparql/', graphIri: 'http://www.souslesens.org/thesaurusIngenieur/', sparqlBuilder: "sparql_skos_generic"};
    self.sources['Unesco'] = {type:"thesaurus",schema:"skos",sparql_url: 'http://vps-c46025b8.vps.ovh.net:8890/sparql/', graphIri: 'http://skos.um.es/unesco6/', sparqlBuilder: "sparql_skos_generic"};
    self.sources['LibraryOfCongress'] = {type:"thesaurus",schema:"skos",sparql_url: 'http://vps-c46025b8.vps.ovh.net:8890/sparql/', graphIri: 'http://www.loc.gov/', sparqlBuilder: "sparql_skos_generic"};
    self.sources['Wikidata'] = {type:"ontology",schema:"rdf",sparql_url: 'https://query.wikidata.org/', graphIri: 'http://skos.um.es/unesco6/', sparqlBuilder: "sparql_Wikidata"};
    self.sources['Microsoft-accademic'] = {sparql_url: 'http://ma-graph.org/sparql/', graphIri: '', sparqlBuilder: "sparql_microsoft-accademic"};
    self.sources['BabelNet'] = {type:"ontology",schema:"rdf",sparql_url: 'https://babelnet.org/sparql/', graphIri: '', sparqlBuilder: "sparql_babelNet"}




    self.tools={};


    self.tools["navigate thesaurus"]={multiSources:0}
    self.tools["compare sources"]={multiSources:1}
    self.tools["explore corpus matching"]={multiSources:1}
    self.tools["query  ontology"]={sourceFilter:"ontology",multiSources:0}








    return self;

})()
    
    
    
    
    
    
    
    
    
    
    
