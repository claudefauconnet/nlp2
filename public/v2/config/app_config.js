var Config = (function () {
    var self = {};
    self.serverUrl = "/elastic";
    self.default_sparql_url = "http://51.178.139.80:8890/sparql"


    self.wikiCategoriesGraphIri = "http://souslesens.org/data/total/ep/"

    self.sources = {}




    self.tools = {};


    self.tools["thesaurusBrowser"] = {label: "Browse", multiSources: 0, controller: ThesaurusBrowser}
    self.tools["sourceEditor"] = {label: "Edit", multiSources: 0, controller: SourceEditor,onLoaded:SourceEditor.onLoaded}
    self.tools["thesauriMatcher"] = {label: "Match", multiSources: 0, controller: ThesaurusMatcher}
    self.tools["nerEvaluator"] = {label: "Evaluate", multiSources: 1, controller: NerEvaluator}
    self.tools["termTaxonomy"] = {label: "Taxonomy", multiSources: 1, controller: TermTaxonomy}
    //  self.tools["corpusGraph"] = {label: "corpus concepts graph", multiSources: 1, controller: CorpusGraph}
    self.tools["ontologyBrowser"] = {label: "ontology browser", multiSources: 0, controller: OntologyBrowser}


    return self;

})()
    
    
    
    
    
    
    
    
    
    
    
