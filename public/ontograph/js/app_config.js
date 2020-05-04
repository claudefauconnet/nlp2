var app_config = {

    currentOntology: "PLM",

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
        "PLM": {
            corpusGraphUri: "http://telanthropia.org/resource/ontology/PLM/",
            corpusScheme: "http://data.telanthropia.org/resource/ontology/PLM/Sujet",
            resourceLevels: [
                {value: "/Notice/", label: "notice"},
                {value: "/SujetPLM/", label: "sujet"},


            ],
            resourceDefaultLevel: "notice",

            conceptsGraphUri: "http://telanthropia.org/resource/thesaurus/PLM/",

        }


    }

    ,visjsGraph:{
        maxLabelLength:20,
    }


}
