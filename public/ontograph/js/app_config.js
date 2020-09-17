var app_config = {
    sparql_url:"http://vps-c46025b8.vps.ovh.net:8890/sparql",
    currentOntology: "CTG",

currentOntology: "Energistics",
    currentOntology: "Geosciml",
  currentOntology: "PLM",
    currentOntology: "CTG",
    currentOntology: "RcReports",




    ontologies: {

        "CTG": {

            corpusGraphUri: "http://data.total.com/resource/corpus-description/ctg/",
            corpusScheme: "http://data.total.com/resource/ontology/ctg/Domain",

            resourceLevels: [ //order broader ascending (bottom up)
                {value: "/Paragraph/", label: "paragraph"},
                {value: "/Chapter/", label: "chapter"},
                {value: "/Document/", label: "document"},
                {value: "/Document-type/", label: "documentType"},
                {value: "/Branch/", label: "branch"},
                {value: "/Domain/", label: "domain"},
            ],
            resourceDefaultLevel: "document",


            conceptsGraphUri: "http://data.total.com/resource/thesaurus/ctg/",

        },
     /*   "PLM": {
            corpusGraphUri: "http://telanthropia.org/resource/ontology/PLM/",
            corpusScheme: "http://data.telanthropia.org/resource/ontology/PLM/Sujet",
            resourceLevels: [
                {value: "/Notice/", label: "notice"},
                {value: "/SujetPLM/", label: "sujet"},


            ],
            resourceDefaultLevel: "notice",

            conceptsGraphUri: "http://telanthropia.org/resource/thesaurus/PLM/",

        },*/
        "Energistics": {
            corpusGraphUri: "http://www.energistics.org/energyml/data/",
            corpusScheme: "http://www.energistics.org/energyml/data/",
            resourceLevels: [
                {value: "/Notice/", label: "notice"},
                {value: "/SujetPLM/", label: "sujet"},


            ],
            resourceDefaultLevel: "notice",

            conceptsGraphUri: "http://www.energistics.org/energyml/data/",

        },
        "Geosciml": {
            corpusGraphUri: "http://www.energistics.org/energyml/data/",
            corpusScheme: "http://www.energistics.org/energyml/data/",
            resourceLevels: [
                {value: "/Notice/", label: "notice"},
                {value: "/SujetPLM/", label: "sujet"},


            ],
            resourceDefaultLevel: "notice",

            conceptsGraphUri: "http://resource.geosciml.org/",

        },

        "Tulsa": {
            corpusGraphUri: "http://souslesens.org/oil-gas/upstream/",
            corpusScheme: "http://souslesens.org/oil-gas/upstream/",
            resourceLevels: [



            ],
            resourceDefaultLevel: "",

            conceptsGraphUri: "http://souslesens.org/oil-gas/upstream/",

        }
        ,
        "BGS": {
            corpusGraphUri: "http://http://data.bgs.ac.uk/",
            corpusScheme: "http://http://data.bgs.ac.uk/",
            resourceLevels: [



            ],
            resourceDefaultLevel: "",

            conceptsGraphUri: "http://http://data.bgs.ac.uk/",

        },


        "Quantum": {
            corpusGraphUri: "http://data.total.com/resource/ontology/quantum/",
            corpusScheme: "http://data.total.com/resource/ontology/quantum/",
            resourceLevels: [



            ],
            resourceDefaultLevel: "",

            conceptsGraphUri: "http://data.total.com/resource/ontology/quantum/",

        },

        "Gaia": {
            corpusGraphUri: "http://data.total.com/resource/dictionary/gaia/",
            corpusScheme: "http://data.total.com/resource/dictionary/gaia/",
            resourceLevels: [



            ],
            resourceDefaultLevel: "",

            conceptsGraphUri: "http://data.total.com/resource/dictionary/gaia/",

        },
        "Acronyms": {
            corpusGraphUri: "http://data.total.com/resource/acronyms/",
            corpusScheme: "http://data.total.com/resource/acronyms/",
            resourceLevels: [



            ],
            resourceDefaultLevel: "",

            conceptsGraphUri: "http://data.total.com/resource/acronyms/",

        },
        "RcReports": {
            corpusGraphUri: "http://data.total.com/resource/reportsRC/corpus/",
            corpusScheme: "http://data.total.com/resource/reportsRC/corpus/",
            resourceLevels: [

                {value: "/Report/", label: "Report"},




            ],



            resourceDefaultLevel: "",

            conceptsGraphUri: "http://data.total.com/resource/reportsRC/thesaurus/",

        },





        ISO_15926:{
            isExternal:true,

            conceptsGraphUri: "http://data.15926.org/rdl",






        },
        "GEMET":{
            isExternal:true,
            conceptsGraphUri: "http://www.eionet.europa.eu/gemet/",

        },
        "GBA":{
            isExternal:true,


        }
        ,
        "USGS": {
         isExternal:true,


        },







    }

    ,visjsGraph:{
        maxLabelLength:20,
    }


}
