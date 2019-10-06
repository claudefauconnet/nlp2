var config = {
    appName:"search",
   loginMode:"database",  //database or none
    locale:"Fr",
    elasticUrl : "../elastic",
    indexes:["bordereaux", "phototheque","artotheque","videotheque","audiotheque","ocr","testdocs","testsql"],
  // indexes:["bordereaux", "phototheque","artotheque","videotheque","audiotheque","ocr"],
  //  indexes:["gmail_cf"],
 //  indexes:["testpdfquantum"],
    searchExpression: "",
    contentField:"attachment.content",
    elasticQuery: {
        from: 0,
        size: 25,
        indexes: [],
        source: {"excludes": ["attachment.content"]},
        highlight: {
            tags_schema: "styled",
            number_of_fragments: 3,
            fragment_size: 150,
            fields: {
                "attachment.content": {},

            }
        }

    },
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
