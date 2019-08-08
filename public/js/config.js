var config = {
    elasticUrl : "../elastic",
  //  indexes:["bordereaux", "phototheque","artotheque","videotheque","audiotheque","ocr"],
    indexes:["testpdf"],
    searchExpression: "",
    elasticQuery: {
        from: 0,
        size: 25,
        indexes: ["bordereaux"],//, "phototheque"],
        source: {"excludes": ["content"]},
        highlight: {
            tags_schema: "styled",
            number_of_fragments: 3,
            fragment_size: 150,
            fields: {
                "content": {},

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
