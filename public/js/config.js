var appConfig = {
    appName:"search",
   loginMode:"none",  //database or none
    contentField:"attachment.content",
    locale:"Fr",
    elasticUrl : "../elastic",
  //  indexes:["bordereaux", "phototheque","artotheque","videotheque","audiotheque","ocr","testdocs","testsql"],
    indexes:["*"],
  // indexes:["bordereaux", "phototheque","artotheque","videotheque","audiotheque","ocr"],
  //  indexes:["gmail_cf"],
 //  indexes:["testpdfquantum"],
    searchExpression: "",

    hitsEntitiesQuery: {
        "_source": {},
        from:0,
        size: 5000,
        "query":
            {
                "terms": {
                    "data.documents.id": []
                }
            }
    }


}

appConfig.elasticQuery={
    from: 0,
        size: 25,
        indexes: [],
        source: {"excludes": [appConfig.contentField]},
    highlight: {
        tags_schema: "styled",
            number_of_fragments: 3,
            fragment_size: 150,
            fields: {
            [appConfig.contentField]: {},

        }
    }

}
