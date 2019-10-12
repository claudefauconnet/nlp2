var jsonschema_general = {
    "general": {
        "type": "object",
        "name" :"general",
        "title": "general",
        "properties": {
            "description": {"type": "string", "title": "description", "required": true},
            "label": {"type": "string", "title": "label", "required": true},
            "indexName": {"type": "string", "title": "indexName", "required": true}
        }


    }


}

var jsonschema_connectorTypesXX = {
    "connectorTypes": {
        "connectors": {"type": "string", "title": "connector","name": "connector", "enum": ["", "fs", "sql", "imap", "book", "csv"]}
    }
}

var jsonschema_connectorTypes = {
    connector: {
        type: 'string',
        title: 'connectors',
        required: true,
        "enum": ["", "fs", "sql", "imap", "book", "csv"]

    }
}

var jsonschema_connector_sql = {
        "connector": {
            "type": "object",
            "name" :"connector",
            "title": "connector SQL",
            "properties": {
                "type": {"type": "string", "title": "type", "default": "sql"},
                "subType": {"type": "string", "title": "label", "enum": ["mysql","oracle"]},
                "connOptions": {"type": "object","name" :"connOptions", "title": "connOptions", "properties":{
                        "host": {"type": "string", "title": "host","required": true},
                        "user": {"type": "string", "title": "user","required": true},
                        "password": {"type": "string", "title": "password","required": true},
                        "database": {"type": "string", "title": "database","required": true},
                        "table": {"type": "string", "title": "table","required": true},
                    }}
            }



    }

}

var jsonschema_connector_fs = {
    "connector": {
        "type": "object",
        "name": "connector",
        "title": "connector file system",
        "properties": {
            "type": {"type": "string", "title": "type", "default": "fs"},
            "dir": {"type": "string", "title": "type", "required": true},

        }
    }
}

var jsonschema_connector_imap = {
    "connector": {
        "type": "object",
        "name": "connector",
        "title": "connector IMAP",
        "properties": {
            "type": {"type": "string", "title": "type", "default": "imap"},
            "imapServerUrl": {"type": "string", "title": "imapServerUrl", "required": true},
            "emailAdress": {"type": "string", "title": "emailAdress", "required": true},
            "rootDir": {"type": "string", "title": "rootDir", "default": "inBox"},
        }
    }
}

var jsonschema_connector_book = {
    "connector": {
        "type": "object",
        "name": "connector",
        "title": "connector",
        "properties": {
            "type": {"type": "string", "title": "type", "default": "book"},
            "filePath": {"type": "string", "title": "filePath", "required": true},
        }
    }
}

var jsonschema_connector_csv = {
    "connector": {
        "type": "object",
        "name": "connector",
        "title": "connector",
        "properties": {
            "type": {"type": "string", "title": "type", "default": "csv"},
            "filePath": {"type": "string", "title": "filePath", "required": true},
        }
    }
}
