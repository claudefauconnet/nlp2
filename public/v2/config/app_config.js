var Config = (function () {
    var self = {};
    self.serverUrl = "/elastic";
    self.default_sparql_url = "http://51.178.139.80:8890/sparql"


    self.wikiCategoriesGraphIri = "http://souslesens.org/data/total/ep/"

    self.sources = {}




    self.tools = {};


    self.tools["thesaurusBrowser"] = {label: "Browse", multiSources: 0, controller: ThesaurusBrowser,toolDescriptionImg:"images/browse.png"}
    self.tools["sourceEditor"] = {label: "Edit", multiSources: 0, controller: SourceEditor,toolDescriptionImg:null},
    self.tools["thesauriMatcher"] = {label: "Match", multiSources: 0, controller: ThesaurusMatcher,toolDescriptionImg:"images/match.png"}
    self.tools["nerEvaluator"] = {label: "Evaluate", multiSources: 1, controller: NerEvaluator,toolDescriptionImg:"images/evaluate.png"}
    self.tools["termTaxonomy"] = {label: "Taxonomy", multiSources: 1, controller: TermTaxonomy,toolDescriptionImg:"images/taxonomy.png"}
    self.tools["ontologyBrowser"] = {label: "Ontology", multiSources: 0, controller: OntologyBrowser,toolDescriptionImg:null}

    self.tools["annotator"] = {label: "Annotator", multiSources: 1, controller: Annotator,toolDescriptionImg:null}


    // moved self.tools["cook"] = {label: "Cook", multiSources: 0, controller: Cook,toolDescriptionImg:null}



    return self;

})()
    
    
    
    
    
    
    
    
    
    
    
