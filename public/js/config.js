var config = {
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
        "_source": {"excludes": ["documents"]},
        "query":
            {
                "terms": {
                    "documents.id": []
                }
            }
    }


}
