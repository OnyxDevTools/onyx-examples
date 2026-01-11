SCHEMA_JSON = {
  "databaseId": "43bdbdec-ee99-11f0-0000-9efa948b1cdf",
  "revisionDescription": "Created a **Note** table with the following attributes: - **id** (String) \u2013 primary key, value supplied by the client (generator: None) - **title** (String) \u2013 required - **content*",
  "entities": [
    {
      "name": "Note",
      "identifier": {
        "name": "id",
        "type": "String",
        "generator": "None"
      },
      "partition": "",
      "attributes": [
        {
          "name": "id",
          "type": "String"
        },
        {
          "name": "title",
          "type": "String"
        },
        {
          "name": "content",
          "type": "String"
        },
        {
          "name": "createdAt",
          "type": "Timestamp"
        },
        {
          "name": "updatedAt",
          "type": "Timestamp"
        }
      ],
      "resolvers": [],
      "triggers": [],
      "indexes": []
    }
  ]
}
