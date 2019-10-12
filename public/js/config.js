var config = {
    appName:"search",
   loginMode:"none",  //database or none
    contentField:"attachment.content",
    locale:"Fr",
    elasticUrl : "../elastic",
    indexes:["bordereaux", "phototheque","artotheque","videotheque","audiotheque","ocr","testdocs","testsql"],
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

config.elasticQuery={
    from: 0,
        size: 25,
        indexes: [],
        source: {"excludes": [config.contentField]},
    highlight: {
        tags_schema: "styled",
            number_of_fragments: 3,
            fragment_size: 150,
            fields: {
            [config.contentField]: {},

        }
    }

}
