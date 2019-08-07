var x={
    "query": {
    "bool": {
        "must": [
            {
                "match": {
                    "content": "infantile"
                }
            }
        ],
            "should": []
    }
},
    "from": 0,
    "size": 25,
    "_source": {
    "excludes": [
        "content"
    ]
},
    "highlight": {
    "tags_schema": "styled",
        "number_of_fragments": 3,
        "fragment_size": 150,
        "fields": {
        "content": {}
    }
},
    "aggregations": {
    "significant_crime_types": {
        "significant_terms": {
            "size": 5,
                "field": "content"
        }
    },


    "keywords":
    {
        "significant_text":

        {
            "size": 5,
            "field":
            "content"
        }
    }
,
    "rare_terms": {
        "field": "content",
            "max_doc_count": 1

    }
}


}
