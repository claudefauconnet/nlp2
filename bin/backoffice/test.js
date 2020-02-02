var x = [
    {
        "@context": {
            "cs": "http://purl.org/vocab/changeset/schema#",
            "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
            "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
            "rdfs1": "http://www.w3.org/1999/02/22-rdf-schema#",
            "skos": "http://www.w3.org/2004/02/skos/core#",
            "skosxl": "http://www.w3.org/2008/05/skos-xl#",
            "xsd": "http://www.w3.org/2001/XMLSchema#",
            "about": "sh94008219"
        },
        "@graph": [{"@id": "sh85146057", "@type": "skos:Concept", "skos:prefLabel": {"@language": "en", "@value": "Wells"}}, {
            "@id": "http://id.worldcat.org/fast/1094416",
            "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": "Remediation wells"
        }, {
            "@id": "sh94008219",
            "@type": "skos:Concept",
            "http://www.loc.gov/mads/rdf/v1#hasCloseExternalAuthority": {"@id": "http://id.worldcat.org/fast/1094416"},
            "skos:broader": {"@id": "sh85146057"},
            "skos:changeNote": [{"@id": "_:N840090a0dca34dddacdbb962fa6e2567"}, {"@id": "_:Nf059a44a76384a21bf0dba7422033a52"}],
            "skos:inScheme": {"@id": "http://id.loc.gov/authorities/subjects"},
            "skos:prefLabel": {"@language": "en", "@value": "Remediation wells"}
        }, {
            "@id": "_:N840090a0dca34dddacdbb962fa6e2567",
            "@type": "cs:ChangeSet",
            "cs:changeReason": "new",
            "cs:createdDate": {"@type": "xsd:dateTime", "@value": "1994-11-08T00:00:00"},
            "cs:creatorName": {"@id": "http://id.loc.gov/vocabulary/organizations/dlc"},
            "cs:subjectOfChange": {"@id": "sh94008219"}
        }, {
            "@id": "_:Nf059a44a76384a21bf0dba7422033a52",
            "@type": "cs:ChangeSet",
            "cs:changeReason": "revised",
            "cs:createdDate": {"@type": "xsd:dateTime", "@value": "1994-12-13T16:27:35"},
            "cs:creatorName": {"@id": "http://id.loc.gov/vocabulary/organizations/dlc"},
            "cs:subjectOfChange": {"@id": "sh94008219"}
        }]
    }
    , {
        "@context": {
            "cs": "http://purl.org/vocab/changeset/schema#",
            "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
            "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
            "rdfs1": "http://www.w3.org/1999/02/22-rdf-schema#",
            "skos": "http://www.w3.org/2004/02/skos/core#",
            "skosxl": "http://www.w3.org/2008/05/skos-xl#",
            "xsd": "http://www.w3.org/2001/XMLSchema#",
            "about": "sh85146042"
        },
        "@graph": [{"@id": "sh85146057", "@type": "skos:Concept", "skos:prefLabel": {"@language": "en", "@value": "Wells"}}, {
            "@id": "http://id.worldcat.org/fast/1173707",
            "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": "Well-dressing"
        }, {
            "@id": "sh85146042",
            "@type": "skos:Concept",
            "http://www.loc.gov/mads/rdf/v1#hasCloseExternalAuthority": {"@id": "http://id.worldcat.org/fast/1173707"},
            "skos:broader": {"@id": "sh85146057"},
            "skos:changeNote": [{"@id": "_:Nbc00b8622c064b43b09b81826d0449f3"}, {"@id": "_:N4812bfbd742146eca619f9959bfe137f"}],
            "skos:inScheme": {"@id": "http://id.loc.gov/authorities/subjects"},
            "skos:prefLabel": {"@language": "en", "@value": "Well-dressing"}
        }, {
            "@id": "_:Nbc00b8622c064b43b09b81826d0449f3",
            "@type": "cs:ChangeSet",
            "cs:changeReason": "revised",
            "cs:createdDate": {"@type": "xsd:dateTime", "@value": "2012-03-28T08:31:45"},
            "cs:creatorName": {"@id": "http://id.loc.gov/vocabulary/organizations/dlc"},
            "cs:subjectOfChange": {"@id": "sh85146042"}
        }, {
            "@id": "_:N4812bfbd742146eca619f9959bfe137f",
            "@type": "cs:ChangeSet",
            "cs:changeReason": "new",
            "cs:createdDate": {"@type": "xsd:dateTime", "@value": "1986-02-11T00:00:00"},
            "cs:creatorName": {"@id": "http://id.loc.gov/vocabulary/organizations/dlc"},
            "cs:subjectOfChange": {"@id": "sh85146042"}
        }]
    }
    , {
        "@context": {
            "cs": "http://purl.org/vocab/changeset/schema#",
            "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
            "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
            "rdfs1": "http://www.w3.org/1999/02/22-rdf-schema#",
            "skos": "http://www.w3.org/2004/02/skos/core#",
            "skosxl": "http://www.w3.org/2008/05/skos-xl#",
            "xsd": "http://www.w3.org/2001/XMLSchema#",
            "about": "sh85026112"
        },
        "@graph": [{"@id": "sh85146057", "@type": "skos:Concept", "skos:prefLabel": {"@language": "en", "@value": "Wells"}}, {
            "@id": "sh85145648",
            "@type": "skos:Concept",
            "skos:prefLabel": {"@language": "en", "@value": "Water-supply"}
        }, {
            "@id": "sh85026112",
            "@type": "skos:Concept",
            "http://www.loc.gov/mads/rdf/v1#hasCloseExternalAuthority": [{"@id": "http://id.worldcat.org/fast/861723"}, {"@id": "http://data.bnf.fr/ark:/12148/cb12115867h"}],
            "skos:broader": [{"@id": "sh85146057"}, {"@id": "sh85145648"}, {"@id": "sh85113074"}],
            "skos:changeNote": {"@id": "_:Neb67d32a69ae486ba64976f20898fc38"},
            "skos:inScheme": {"@id": "http://id.loc.gov/authorities/subjects"},
            "skos:narrower": {"@id": "sh85025484"},
            "skos:prefLabel": {"@language": "en", "@value": "Cisterns"}
        }, {
            "@id": "_:Neb67d32a69ae486ba64976f20898fc38",
            "@type": "cs:ChangeSet",
            "cs:changeReason": "new",
            "cs:createdDate": {"@type": "xsd:dateTime", "@value": "1986-02-11T00:00:00"},
            "cs:creatorName": {"@id": "http://id.loc.gov/vocabulary/organizations/dlc"},
            "cs:subjectOfChange": {"@id": "sh85026112"}
        }, {"@id": "http://id.worldcat.org/fast/861723", "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": "Cisterns"}, {
            "@id": "sh85113074",
            "@type": "skos:Concept",
            "skos:prefLabel": {"@language": "en", "@value": "Reservoirs"}
        }, {"@id": "http://data.bnf.fr/ark:/12148/cb12115867h", "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": "Citernes"}, {
            "@id": "sh85025484",
            "@type": "http://www.loc.gov/mads/rdf/v1#Authority",
            "skos:prefLabel": {"@language": "en", "@value": "Chultunes"}
        }]
    }
    , {
        "@context": {
            "cs": "http://purl.org/vocab/changeset/schema#",
            "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
            "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
            "rdfs1": "http://www.w3.org/1999/02/22-rdf-schema#",
            "skos": "http://www.w3.org/2004/02/skos/core#",
            "skosxl": "http://www.w3.org/2008/05/skos-xl#",
            "xsd": "http://www.w3.org/2001/XMLSchema#",
            "about": "sh94000034"
        },
        "@graph": [{"@id": "sh85146057", "@type": "skos:Concept", "skos:prefLabel": {"@language": "en", "@value": "Wells"}}, {
            "@id": "sh94000034",
            "@type": "skos:Concept",
            "http://www.loc.gov/mads/rdf/v1#hasCloseExternalAuthority": {"@id": "http://id.worldcat.org/fast/1025473"},
            "skos:broader": {"@id": "sh85146057"},
            "skos:changeNote": [{"@id": "_:N0ee70e61b3b343f59457e1f58812b18f"}, {"@id": "_:N99b312508cc84592872cb1474bdf5407"}],
            "skos:inScheme": {"@id": "http://id.loc.gov/authorities/subjects"},
            "skos:prefLabel": {"@language": "en", "@value": "Monitoring wells"}
        }, {
            "@id": "_:N0ee70e61b3b343f59457e1f58812b18f",
            "@type": "cs:ChangeSet",
            "cs:changeReason": "new",
            "cs:createdDate": {"@type": "xsd:dateTime", "@value": "1994-01-03T00:00:00"},
            "cs:creatorName": {"@id": "http://id.loc.gov/vocabulary/organizations/dlc"},
            "cs:subjectOfChange": {"@id": "sh94000034"}
        }, {
            "@id": "_:N99b312508cc84592872cb1474bdf5407",
            "@type": "cs:ChangeSet",
            "cs:changeReason": "revised",
            "cs:createdDate": {"@type": "xsd:dateTime", "@value": "1994-02-08T10:54:20"},
            "cs:creatorName": {"@id": "http://id.loc.gov/vocabulary/organizations/dlc"},
            "cs:subjectOfChange": {"@id": "sh94000034"}
        }, {"@id": "http://id.worldcat.org/fast/1025473", "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": "Monitoring wells"}]
    }
    , {
        "@context": {
            "cs": "http://purl.org/vocab/changeset/schema#",
            "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
            "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
            "rdfs1": "http://www.w3.org/1999/02/22-rdf-schema#",
            "skos": "http://www.w3.org/2004/02/skos/core#",
            "skosxl": "http://www.w3.org/2008/05/skos-xl#",
            "xsd": "http://www.w3.org/2001/XMLSchema#",
            "about": "sh96010314"
        },
        "@graph": [{"@id": "sh85146057", "@type": "skos:Concept", "skos:prefLabel": {"@language": "en", "@value": "Wells"}}, {
            "@id": "http://id.worldcat.org/fast/1176276",
            "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": "Wishing wells"
        }, {
            "@id": "sh96010314",
            "@type": "skos:Concept",
            "http://www.loc.gov/mads/rdf/v1#hasCloseExternalAuthority": {"@id": "http://id.worldcat.org/fast/1176276"},
            "skos:broader": {"@id": "sh85146057"},
            "skos:changeNote": [{"@id": "_:N4502b1e757494b0abbed757d1e38a344"}, {"@id": "_:Na60b0be8829f423db789da6d90a751db"}],
            "skos:inScheme": {"@id": "http://id.loc.gov/authorities/subjects"},
            "skos:prefLabel": {"@language": "en", "@value": "Wishing wells"}
        }, {
            "@id": "_:N4502b1e757494b0abbed757d1e38a344",
            "@type": "cs:ChangeSet",
            "cs:changeReason": "new",
            "cs:createdDate": {"@type": "xsd:dateTime", "@value": "1996-10-23T00:00:00"},
            "cs:creatorName": {"@id": "http://id.loc.gov/vocabulary/organizations/mnmhcl"},
            "cs:subjectOfChange": {"@id": "sh96010314"}
        }, {
            "@id": "_:Na60b0be8829f423db789da6d90a751db",
            "@type": "cs:ChangeSet",
            "cs:changeReason": "revised",
            "cs:createdDate": {"@type": "xsd:dateTime", "@value": "1996-12-02T14:36:01"},
            "cs:creatorName": {"@id": "http://id.loc.gov/vocabulary/organizations/dlc"},
            "cs:subjectOfChange": {"@id": "sh96010314"}
        }]
    }
    , {
        "@context": {
            "cs": "http://purl.org/vocab/changeset/schema#",
            "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
            "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
            "rdfs1": "http://www.w3.org/1999/02/22-rdf-schema#",
            "skos": "http://www.w3.org/2004/02/skos/core#",
            "skosxl": "http://www.w3.org/2008/05/skos-xl#",
            "xsd": "http://www.w3.org/2001/XMLSchema#",
            "about": "sh2016001940"
        },
        "@graph": [{"@id": "sh85146057", "@type": "skos:Concept", "skos:prefLabel": {"@language": "en", "@value": "Wells"}}, {
            "@id": "http://id.worldcat.org/fast/1940969",
            "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": "Geothermal wells"
        }, {
            "@id": "sh2016001940",
            "@type": "skos:Concept",
            "http://www.loc.gov/mads/rdf/v1#hasCloseExternalAuthority": {"@id": "http://id.worldcat.org/fast/1940969"},
            "skos:broader": [{"@id": "sh85146057"}, {"@id": "sh85054268"}],
            "skos:changeNote": [{"@id": "_:Na0dc540559604d809c67be1762cbf379"}, {"@id": "_:Nf6daf65df0d54828aa1c2921394bd7d3"}],
            "skos:inScheme": {"@id": "http://id.loc.gov/authorities/subjects"},
            "skos:prefLabel": {"@language": "en", "@value": "Geothermal wells"}
        }, {
            "@id": "_:Na0dc540559604d809c67be1762cbf379",
            "@type": "cs:ChangeSet",
            "cs:changeReason": "revised",
            "cs:createdDate": {"@type": "xsd:dateTime", "@value": "2016-11-09T15:31:08"},
            "cs:creatorName": {"@id": "http://id.loc.gov/vocabulary/organizations/dlc"},
            "cs:subjectOfChange": {"@id": "sh2016001940"}
        }, {
            "@id": "_:Nf6daf65df0d54828aa1c2921394bd7d3",
            "@type": "cs:ChangeSet",
            "cs:changeReason": "new",
            "cs:createdDate": {"@type": "xsd:dateTime", "@value": "2016-08-19T00:00:00"},
            "cs:creatorName": {"@id": "http://id.loc.gov/vocabulary/organizations/abau"},
            "cs:subjectOfChange": {"@id": "sh2016001940"}
        }, {"@id": "sh85054268", "@type": "skos:Concept", "skos:prefLabel": {"@language": "en", "@value": "Geothermal engineering"}}]
    }
    , {
        "@context": {
            "cs": "http://purl.org/vocab/changeset/schema#",
            "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
            "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
            "rdfs1": "http://www.w3.org/1999/02/22-rdf-schema#",
            "skos": "http://www.w3.org/2004/02/skos/core#",
            "skosxl": "http://www.w3.org/2008/05/skos-xl#",
            "xsd": "http://www.w3.org/2001/XMLSchema#",
            "about": "sh85146050"
        },
        "@graph": [{"@id": "sh85146057", "@type": "skos:Concept", "skos:prefLabel": {"@language": "en", "@value": "Wells"}}, {
            "@id": "http://id.worldcat.org/fast/1173715",
            "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": "Wellheads"
        }, {"@id": "http://id.worldcat.org/fast/1173716", "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": "Wellheads--Computer programs"}, {
            "@id": "sh85146050",
            "@type": "skos:Concept",
            "http://www.loc.gov/mads/rdf/v1#hasCloseExternalAuthority": {"@id": "http://id.worldcat.org/fast/1173715"},
            "http://www.loc.gov/mads/rdf/v1#hasNarrowerExternalAuthority": [{"@id": "http://id.worldcat.org/fast/1173719"}, {"@id": "http://id.worldcat.org/fast/1173717"}, {"@id": "http://id.worldcat.org/fast/1426960"}, {"@id": "http://id.worldcat.org/fast/1173716"}, {"@id": "http://id.worldcat.org/fast/1426959"}, {"@id": "http://id.worldcat.org/fast/1173718"}],
            "skos:altLabel": {"@language": "en", "@value": "Well heads"},
            "skos:broader": {"@id": "sh85146057"},
            "skos:changeNote": [{"@id": "_:N441dbceb73bc436ea298d741f033a820"}, {"@id": "_:Ncb4cb4d0dc1949cf9d6b4dd15dbf1cf2"}],
            "skos:inScheme": {"@id": "http://id.loc.gov/authorities/subjects"},
            "skos:prefLabel": {"@language": "en", "@value": "Wellheads"},
            "skosxl:altLabel": {"@id": "_:Ne07d72ecd2bd4e86b46f8e2a454b8eaa"}
        }, {
            "@id": "_:N441dbceb73bc436ea298d741f033a820",
            "@type": "cs:ChangeSet",
            "cs:changeReason": "revised",
            "cs:createdDate": {"@type": "xsd:dateTime", "@value": "2012-03-28T08:31:46"},
            "cs:creatorName": {"@id": "http://id.loc.gov/vocabulary/organizations/dlc"},
            "cs:subjectOfChange": {"@id": "sh85146050"}
        }, {"@id": "_:Ne07d72ecd2bd4e86b46f8e2a454b8eaa", "@type": "skosxl:Label", "skosxl:literalForm": {"@language": "en", "@value": "Well heads"}}, {
            "@id": "_:Ncb4cb4d0dc1949cf9d6b4dd15dbf1cf2",
            "@type": "cs:ChangeSet",
            "cs:changeReason": "new",
            "cs:createdDate": {"@type": "xsd:dateTime", "@value": "1986-02-11T00:00:00"},
            "cs:creatorName": {"@id": "http://id.loc.gov/vocabulary/organizations/dlc"},
            "cs:subjectOfChange": {"@id": "sh85146050"}
        }, {
            "@id": "http://id.worldcat.org/fast/1173718",
            "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": "Wellheads--Laws, regulations, etc.--U.S. states"
        }, {"@id": "http://id.worldcat.org/fast/1426960", "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": "Wellheads--Protection"}, {
            "@id": "http://id.worldcat.org/fast/1426959",
            "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": "Wellheads--Laws, regulations, etc."
        }, {"@id": "http://id.worldcat.org/fast/1173717", "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": "Wellheads--Environmental aspects"}, {
            "@id": "http://id.worldcat.org/fast/1173719",
            "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": "Wellheads--Protection--U.S. states"
        }]
    }
    , {
        "@context": {
            "cs": "http://purl.org/vocab/changeset/schema#",
            "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
            "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
            "rdfs1": "http://www.w3.org/1999/02/22-rdf-schema#",
            "skos": "http://www.w3.org/2004/02/skos/core#",
            "skosxl": "http://www.w3.org/2008/05/skos-xl#",
            "xsd": "http://www.w3.org/2001/XMLSchema#",
            "about": "sh85146057"
        },
        "@graph": [{"@id": "http://id.worldcat.org/fast/1173729", "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": "Wells--Data processing"}, {
            "@id": "sh2007006246",
            "@type": "skos:Concept",
            "skos:prefLabel": {"@language": "en", "@value": "Well water"}
        }, {"@id": "sh85146050", "@type": "http://www.loc.gov/mads/rdf/v1#Authority", "skos:prefLabel": {"@language": "en", "@value": "Wellheads"}}, {
            "@id": "sh2016001940",
            "@type": "http://www.loc.gov/mads/rdf/v1#Authority",
            "skos:prefLabel": {"@language": "en", "@value": "Geothermal wells"}
        }, {"@id": "http://www.wikidata.org/entity/Q43483", "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": "well"}, {
            "@id": "http://id.worldcat.org/fast/1173734",
            "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": "Wells--Equipment and supplies"
        }, {"@id": "http://id.worldcat.org/fast/1173735", "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": "Wells--Evaluation"}, {
            "@id": "http://id.worldcat.org/fast/1173754",
            "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": "Wells--Testing"
        }, {"@id": "http://id.worldcat.org/fast/1173730", "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": "Wells--Design and construction"}, {
            "@id": "sh85112548",
            "@type": "http://www.loc.gov/mads/rdf/v1#Authority",
            "skos:prefLabel": {"@language": "en", "@value": "Relief wells"}
        }, {"@id": "http://id.worldcat.org/fast/1173747", "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": "Wells--Maintenance and repair"}, {
            "@id": "http://id.worldcat.org/fast/1173736",
            "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": "Wells--Finance"
        }, {"@id": "http://lod.nal.usda.gov/nalt/46287", "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": "wells"}, {
            "@id": "http://d-nb.info/gnd/4273516-6",
            "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": "Bohrbrunnen"
        }, {"@id": "http://id.worldcat.org/fast/1173725", "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": "Wells--Audio-visual aids"}, {
            "@id": "sh94008219",
            "@type": "http://www.loc.gov/mads/rdf/v1#Authority",
            "skos:prefLabel": {"@language": "en", "@value": "Remediation wells"}
        }, {"@id": "http://www.yso.fi/onto/yso/p9494", "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": "kaivot"}, {
            "@id": "http://id.worldcat.org/fast/1173733",
            "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": "Wells--Environmental aspects"
        }, {"@id": "sh85146045", "@type": "http://www.loc.gov/mads/rdf/v1#Authority", "skos:prefLabel": {"@language": "en", "@value": "Well points"}}, {
            "@id": "sh86000205",
            "@type": "http://www.loc.gov/mads/rdf/v1#Authority",
            "skos:prefLabel": {"@language": "en", "@value": "Injection wells"}
        }, {"@id": "http://id.worldcat.org/fast/1173748", "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": "Wells--Mathematical models"}, {
            "@id": "sh85063336",
            "@type": "skos:Concept",
            "skos:prefLabel": {"@language": "en", "@value": "Hydraulic structures"}
        }, {"@id": "http://id.worldcat.org/fast/1173746", "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": "Wells--Location"}, {
            "@id": "http://id.worldcat.org/fast/1173728",
            "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": "Wells--Costs"
        }, {"@id": "http://id.worldcat.org/fast/1173750", "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": "Wells--Research"}, {
            "@id": "sh96010314",
            "@type": "http://www.loc.gov/mads/rdf/v1#Authority",
            "skos:prefLabel": {"@language": "en", "@value": "Wishing wells"}
        }, {
            "@id": "sh85146057",
            "@type": "skos:Concept",
            "http://www.loc.gov/mads/rdf/v1#hasCloseExternalAuthority": [{"@id": "http://www.wikidata.org/entity/Q43483"}, {"@id": "http://data.bnf.fr/ark:/12148/cb121998794"}, {"@id": "http://data.bnf.fr/ark:/12148/cb119759000"}, {"@id": "http://data.bnf.fr/ark:/12148/cb12360991t"}, {"@id": "http://id.worldcat.org/fast/1173723"}, {"@id": "http://www.yso.fi/onto/yso/p9494"}, {"@id": "http://d-nb.info/gnd/4273516-6"}],
            "http://www.loc.gov/mads/rdf/v1#hasExactExternalAuthority": {"@id": "http://lod.nal.usda.gov/nalt/46287"},
            "http://www.loc.gov/mads/rdf/v1#hasNarrowerExternalAuthority": [{"@id": "http://id.worldcat.org/fast/1173728"}, {"@id": "http://id.worldcat.org/fast/1173749"}, {"@id": "http://id.worldcat.org/fast/1173750"}, {"@id": "http://id.worldcat.org/fast/1173727"}, {"@id": "http://id.worldcat.org/fast/1173726"}, {"@id": "http://id.worldcat.org/fast/1173736"}, {"@id": "http://id.worldcat.org/fast/1173754"}, {"@id": "http://id.worldcat.org/fast/1173729"}, {"@id": "http://id.worldcat.org/fast/1173734"}, {"@id": "http://id.worldcat.org/fast/1173733"}, {"@id": "http://id.worldcat.org/fast/1173735"}, {"@id": "http://id.worldcat.org/fast/1173747"}, {"@id": "http://id.worldcat.org/fast/1173748"}, {"@id": "http://id.worldcat.org/fast/1173732"}, {"@id": "http://id.worldcat.org/fast/1173753"}, {"@id": "http://id.worldcat.org/fast/1173731"}, {"@id": "http://id.worldcat.org/fast/1173742"}, {"@id": "http://id.worldcat.org/fast/1173725"}, {"@id": "http://id.worldcat.org/fast/1173746"}, {"@id": "http://id.worldcat.org/fast/1173751"}, {"@id": "http://id.worldcat.org/fast/1173730"}, {"@id": "http://id.worldcat.org/fast/1173752"}],
            "skos:altLabel": [{"@language": "en", "@value": "Tube wells"}, {"@language": "en", "@value": "Water wells"}],
            "skos:broader": {"@id": "sh85063336"},
            "skos:changeNote": [{"@id": "_:N53b3805d7d26497993ad64dbd82dee95"}, {"@id": "_:Nd15135bb5fc54823b3faad6f0775b3ee"}],
            "skos:inScheme": {"@id": "http://id.loc.gov/authorities/subjects"},
            "skos:narrower": [{"@id": "sh94000034"}, {"@id": "sh96010314"}, {"@id": "sh85112548"}, {"@id": "sh85146045"}, {"@id": "sh86000205"}, {"@id": "sh85026112"}, {"@id": "sh85008118"}, {"@id": "sh85146042"}, {"@id": "sh2016001940"}, {"@id": "sh85146050"}, {"@id": "sh94008219"}],
            "skos:prefLabel": {"@language": "en", "@value": "Wells"},
            "skos:related": {"@id": "sh2007006246"},
            "skosxl:altLabel": [{"@id": "_:N87fbc4cdbd394fa69fd446cb03008dc9"}, {"@id": "_:N4a2ed1e095784f51b7ff8d19e93fb650"}]
        }, {
            "@id": "_:N53b3805d7d26497993ad64dbd82dee95",
            "@type": "cs:ChangeSet",
            "cs:changeReason": "new",
            "cs:createdDate": {"@type": "xsd:dateTime", "@value": "1986-02-11T00:00:00"},
            "cs:creatorName": {"@id": "http://id.loc.gov/vocabulary/organizations/dlc"},
            "cs:subjectOfChange": {"@id": "sh85146057"}
        }, {
            "@id": "_:Nd15135bb5fc54823b3faad6f0775b3ee",
            "@type": "cs:ChangeSet",
            "cs:changeReason": "revised",
            "cs:createdDate": {"@type": "xsd:dateTime", "@value": "2012-03-28T08:31:46"},
            "cs:creatorName": {"@id": "http://id.loc.gov/vocabulary/organizations/dlc"},
            "cs:subjectOfChange": {"@id": "sh85146057"}
        }, {"@id": "_:N87fbc4cdbd394fa69fd446cb03008dc9", "@type": "skosxl:Label", "skosxl:literalForm": {"@language": "en", "@value": "Tube wells"}}, {
            "@id": "_:N4a2ed1e095784f51b7ff8d19e93fb650",
            "@type": "skosxl:Label",
            "skosxl:literalForm": {"@language": "en", "@value": "Water wells"}
        }, {
            "@id": "sh85008118",
            "@type": "http://www.loc.gov/mads/rdf/v1#Authority",
            "skos:prefLabel": {"@language": "en", "@value": "Artesian wells"}
        }, {"@id": "http://data.bnf.fr/ark:/12148/cb12360991t", "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": "Wells (GB)"}, {
            "@id": "http://id.worldcat.org/fast/1173752",
            "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": "Wells--Standards"
        }, {"@id": "sh85146042", "@type": "http://www.loc.gov/mads/rdf/v1#Authority", "skos:prefLabel": {"@language": "en", "@value": "Well-dressing"}}, {
            "@id": "http://id.worldcat.org/fast/1173749",
            "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": "Wells--Measurement"
        }, {"@id": "http://id.worldcat.org/fast/1173732", "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": "Wells--Economic aspects"}, {
            "@id": "http://id.worldcat.org/fast/1173753",
            "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": "Wells--Statistical methods"
        }, {"@id": "http://id.worldcat.org/fast/1173751", "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": "Wells--Safety measures"}, {
            "@id": "http://id.worldcat.org/fast/1173723",
            "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": "Wells"
        }, {
            "@id": "http://id.worldcat.org/fast/1173731",
            "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": "Wells--Design and construction--Audio-visual aids"
        }, {"@id": "http://data.bnf.fr/ark:/12148/cb121998794", "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": "Wells (GB) -- Cathedral"}, {
            "@id": "sh85026112",
            "@type": "http://www.loc.gov/mads/rdf/v1#Authority",
            "skos:prefLabel": {"@language": "en", "@value": "Cisterns"}
        }, {
            "@id": "sh94000034",
            "@type": "http://www.loc.gov/mads/rdf/v1#Authority",
            "skos:prefLabel": {"@language": "en", "@value": "Monitoring wells"}
        }, {"@id": "http://id.worldcat.org/fast/1173726", "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": "Wells--Corrosion"}, {
            "@id": "http://id.worldcat.org/fast/1173742",
            "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": "Wells--Government policy"
        }, {"@id": "http://data.bnf.fr/ark:/12148/cb119759000", "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": "Puits"}, {
            "@id": "http://id.worldcat.org/fast/1173727",
            "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": "Wells--Cost effectiveness"
        }]
    }
    , {
        "@context": {
            "cs": "http://purl.org/vocab/changeset/schema#",
            "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
            "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
            "rdfs1": "http://www.w3.org/1999/02/22-rdf-schema#",
            "skos": "http://www.w3.org/2004/02/skos/core#",
            "skosxl": "http://www.w3.org/2008/05/skos-xl#",
            "xsd": "http://www.w3.org/2001/XMLSchema#",
            "about": "sh85112548"
        },
        "@graph": [{
            "@id": "sh85112548",
            "@type": "skos:Concept",
            "http://www.loc.gov/mads/rdf/v1#hasCloseExternalAuthority": [{"@id": "http://id.worldcat.org/fast/1093757"}, {"@id": "http://data.bnf.fr/ark:/12148/cb124454515"}],
            "skos:broader": [{"@id": "sh85129555"}, {"@id": "sh85146057"}, {"@id": "sh85142910"}],
            "skos:changeNote": [{"@id": "_:N1efeb947463e4a06894a6ed60cead227"}, {"@id": "_:Ndb7239c7627b470d8a5ac110f779bd7c"}],
            "skos:inScheme": {"@id": "http://id.loc.gov/authorities/subjects"},
            "skos:prefLabel": {"@language": "en", "@value": "Relief wells"}
        }, {
            "@id": "_:N1efeb947463e4a06894a6ed60cead227",
            "@type": "cs:ChangeSet",
            "cs:changeReason": "new",
            "cs:createdDate": {"@type": "xsd:dateTime", "@value": "1986-02-11T00:00:00"},
            "cs:creatorName": {"@id": "http://id.loc.gov/vocabulary/organizations/dlc"},
            "cs:subjectOfChange": {"@id": "sh85112548"}
        }, {
            "@id": "_:Ndb7239c7627b470d8a5ac110f779bd7c",
            "@type": "cs:ChangeSet",
            "cs:changeReason": "revised",
            "cs:createdDate": {"@type": "xsd:dateTime", "@value": "1994-11-23T10:01:19"},
            "cs:creatorName": {"@id": "http://id.loc.gov/vocabulary/organizations/dlc"},
            "cs:subjectOfChange": {"@id": "sh85112548"}
        }, {"@id": "http://data.bnf.fr/ark:/12148/cb124454515", "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": "Puits de secours"}, {
            "@id": "sh85146057",
            "@type": "skos:Concept",
            "skos:prefLabel": {"@language": "en", "@value": "Wells"}
        }, {"@id": "http://id.worldcat.org/fast/1093757", "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": "Relief wells"}, {
            "@id": "sh85142910",
            "@type": "skos:Concept",
            "skos:prefLabel": {"@language": "en", "@value": "Vertical drains"}
        }, {"@id": "sh85129555", "@type": "skos:Concept", "skos:prefLabel": {"@language": "en", "@value": "Subsurface drainage"}}]
    }
    , {
        "@context": {
            "cs": "http://purl.org/vocab/changeset/schema#",
            "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
            "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
            "rdfs1": "http://www.w3.org/1999/02/22-rdf-schema#",
            "skos": "http://www.w3.org/2004/02/skos/core#",
            "skosxl": "http://www.w3.org/2008/05/skos-xl#",
            "xsd": "http://www.w3.org/2001/XMLSchema#",
            "about": "sh85008118"
        },
        "@graph": [{"@id": "sh85146057", "@type": "skos:Concept", "skos:prefLabel": {"@language": "en", "@value": "Wells"}}, {
            "@id": "sh85008118",
            "@type": "skos:Concept",
            "http://www.loc.gov/mads/rdf/v1#hasCloseExternalAuthority": [{"@id": "http://id.worldcat.org/fast/817093"}, {"@id": "http://data.bnf.fr/ark:/12148/cb146337241"}, {"@id": "http://lod.nal.usda.gov/nalt/12455"}, {"@id": "http://www.yso.fi/onto/yso/p27644"}],
            "skos:broader": {"@id": "sh85146057"},
            "skos:changeNote": [{"@id": "_:N12cb05c209cd4f39ab77bda753055407"}, {"@id": "_:N8e2e01b0776945ad8961b3ee15760020"}],
            "skos:inScheme": {"@id": "http://id.loc.gov/authorities/subjects"},
            "skos:narrower": {"@id": "sh93006655"},
            "skos:prefLabel": {"@language": "en", "@value": "Artesian wells"}
        }, {
            "@id": "_:N12cb05c209cd4f39ab77bda753055407",
            "@type": "cs:ChangeSet",
            "cs:changeReason": "revised",
            "cs:createdDate": {"@type": "xsd:dateTime", "@value": "2012-03-21T07:37:10"},
            "cs:creatorName": {"@id": "http://id.loc.gov/vocabulary/organizations/dlc"},
            "cs:subjectOfChange": {"@id": "sh85008118"}
        }, {
            "@id": "_:N8e2e01b0776945ad8961b3ee15760020",
            "@type": "cs:ChangeSet",
            "cs:changeReason": "new",
            "cs:createdDate": {"@type": "xsd:dateTime", "@value": "1986-02-11T00:00:00"},
            "cs:creatorName": {"@id": "http://id.loc.gov/vocabulary/organizations/dlc"},
            "cs:subjectOfChange": {"@id": "sh85008118"}
        }, {"@id": "http://www.yso.fi/onto/yso/p27644", "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": "arteesiset kaivot"}, {
            "@id": "http://id.worldcat.org/fast/817093",
            "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": "Artesian wells"
        }, {"@id": "http://lod.nal.usda.gov/nalt/12455", "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": "springs (water)"}, {
            "@id": "sh93006655",
            "@type": "http://www.loc.gov/mads/rdf/v1#Authority",
            "skos:prefLabel": {"@language": "en", "@value": "Abandoned artesian wells"}
        }, {"@id": "http://data.bnf.fr/ark:/12148/cb146337241", "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": "Puits art\u00e9siens"}]
    }
    , {
        "@context": {
            "cs": "http://purl.org/vocab/changeset/schema#",
            "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
            "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
            "rdfs1": "http://www.w3.org/1999/02/22-rdf-schema#",
            "skos": "http://www.w3.org/2004/02/skos/core#",
            "skosxl": "http://www.w3.org/2008/05/skos-xl#",
            "xsd": "http://www.w3.org/2001/XMLSchema#",
            "about": "sh85146045"
        },
        "@graph": [{"@id": "sh85146057", "@type": "skos:Concept", "skos:prefLabel": {"@language": "en", "@value": "Wells"}}, {
            "@id": "sh85142910",
            "@type": "skos:Concept",
            "skos:prefLabel": {"@language": "en", "@value": "Vertical drains"}
        }, {
            "@id": "sh85146045",
            "@type": "skos:Concept",
            "http://www.loc.gov/mads/rdf/v1#hasCloseExternalAuthority": {"@id": "http://id.worldcat.org/fast/1173706"},
            "skos:altLabel": {"@language": "en", "@value": "Wellpoint system"},
            "skos:broader": [{"@id": "sh85129555"}, {"@id": "sh85039296"}, {"@id": "sh85146057"}, {"@id": "sh85142910"}],
            "skos:changeNote": [{"@id": "_:N3f82662ec151470a9d05845a299fab75"}, {"@id": "_:N1fbad78761584773a36f878d4b571844"}],
            "skos:inScheme": {"@id": "http://id.loc.gov/authorities/subjects"},
            "skos:prefLabel": {"@language": "en", "@value": "Well points"},
            "skosxl:altLabel": {"@id": "_:Nccd123365a724940828c40ee54e10598"}
        }, {
            "@id": "_:N3f82662ec151470a9d05845a299fab75",
            "@type": "cs:ChangeSet",
            "cs:changeReason": "new",
            "cs:createdDate": {"@type": "xsd:dateTime", "@value": "1986-02-11T00:00:00"},
            "cs:creatorName": {"@id": "http://id.loc.gov/vocabulary/organizations/dlc"},
            "cs:subjectOfChange": {"@id": "sh85146045"}
        }, {
            "@id": "_:N1fbad78761584773a36f878d4b571844",
            "@type": "cs:ChangeSet",
            "cs:changeReason": "revised",
            "cs:createdDate": {"@type": "xsd:dateTime", "@value": "2012-03-28T08:31:45"},
            "cs:creatorName": {"@id": "http://id.loc.gov/vocabulary/organizations/dlc"},
            "cs:subjectOfChange": {"@id": "sh85146045"}
        }, {
            "@id": "_:Nccd123365a724940828c40ee54e10598",
            "@type": "skosxl:Label",
            "skosxl:literalForm": {"@language": "en", "@value": "Wellpoint system"}
        }, {"@id": "http://id.worldcat.org/fast/1173706", "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": "Well points"}, {
            "@id": "sh85129555",
            "@type": "skos:Concept",
            "skos:prefLabel": {"@language": "en", "@value": "Subsurface drainage"}
        }, {"@id": "sh85039296", "@type": "skos:Concept", "skos:prefLabel": {"@language": "en", "@value": "Drainage"}}]
    }
    , {
        "@context": {
            "cs": "http://purl.org/vocab/changeset/schema#",
            "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
            "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
            "rdfs1": "http://www.w3.org/1999/02/22-rdf-schema#",
            "skos": "http://www.w3.org/2004/02/skos/core#",
            "skosxl": "http://www.w3.org/2008/05/skos-xl#",
            "xsd": "http://www.w3.org/2001/XMLSchema#",
            "about": "sh86000205"
        },
        "@graph": [{"@id": "sh85146057", "@type": "skos:Concept", "skos:prefLabel": {"@language": "en", "@value": "Wells"}}, {
            "@id": "http://id.worldcat.org/fast/973517",
            "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": "Injection wells--Government policy"
        }, {"@id": "http://id.worldcat.org/fast/973520", "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": "Injection wells--Testing"}, {
            "@id": "http://id.worldcat.org/fast/973519",
            "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": "Injection wells--Mathematical models"
        }, {"@id": "http://id.worldcat.org/fast/973516", "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": "Injection wells--Evaluation"}, {
            "@id": "sh86000205",
            "@type": "skos:Concept",
            "http://www.loc.gov/mads/rdf/v1#hasCloseExternalAuthority": {"@id": "http://id.worldcat.org/fast/973514"},
            "http://www.loc.gov/mads/rdf/v1#hasNarrowerExternalAuthority": [{"@id": "http://id.worldcat.org/fast/973519"}, {"@id": "http://id.worldcat.org/fast/973516"}, {"@id": "http://id.worldcat.org/fast/973520"}, {"@id": "http://id.worldcat.org/fast/973515"}, {"@id": "http://id.worldcat.org/fast/973517"}],
            "skos:altLabel": {"@language": "en", "@value": "Wells, Injection"},
            "skos:broader": {"@id": "sh85146057"},
            "skos:changeNote": [{"@id": "_:N5e71ed2f10b1433383f105562aa7ebad"}, {"@id": "_:N4067ca64586845d285dc93b9f49ec8a8"}],
            "skos:inScheme": {"@id": "http://id.loc.gov/authorities/subjects"},
            "skos:prefLabel": {"@language": "en", "@value": "Injection wells"},
            "skosxl:altLabel": {"@id": "_:N39728c301796469e9dd9634648d1daaa"}
        }, {
            "@id": "_:N39728c301796469e9dd9634648d1daaa",
            "@type": "skosxl:Label",
            "skosxl:literalForm": {"@language": "en", "@value": "Wells, Injection"}
        }, {
            "@id": "_:N5e71ed2f10b1433383f105562aa7ebad",
            "@type": "cs:ChangeSet",
            "cs:changeReason": "revised",
            "cs:createdDate": {"@type": "xsd:dateTime", "@value": "2012-03-28T08:37:41"},
            "cs:creatorName": {"@id": "http://id.loc.gov/vocabulary/organizations/dlc"},
            "cs:subjectOfChange": {"@id": "sh86000205"}
        }, {
            "@id": "_:N4067ca64586845d285dc93b9f49ec8a8",
            "@type": "cs:ChangeSet",
            "cs:changeReason": "new",
            "cs:createdDate": {"@type": "xsd:dateTime", "@value": "1986-01-28T00:00:00"},
            "cs:creatorName": {"@id": "http://id.loc.gov/vocabulary/organizations/dlc"},
            "cs:subjectOfChange": {"@id": "sh86000205"}
        }, {"@id": "http://id.worldcat.org/fast/973514", "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": "Injection wells"}, {
            "@id": "http://id.worldcat.org/fast/973515",
            "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": "Injection wells--Environmental aspects"
        }]
    }
    , {
        "@context": {
            "cs": "http://purl.org/vocab/changeset/schema#",
            "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
            "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
            "rdfs1": "http://www.w3.org/1999/02/22-rdf-schema#",
            "skos": "http://www.w3.org/2004/02/skos/core#",
            "skosxl": "http://www.w3.org/2008/05/skos-xl#",
            "xsd": "http://www.w3.org/2001/XMLSchema#",
            "about": "sh2007006246"
        },
        "@graph": [{"@id": "sh85146057", "@type": "skos:Concept", "skos:prefLabel": {"@language": "en", "@value": "Wells"}}, {
            "@id": "sh2007006246",
            "@type": "skos:Concept",
            "http://www.loc.gov/mads/rdf/v1#hasCloseExternalAuthority": [{"@id": "http://id.worldcat.org/fast/1743789"}, {"@id": "http://www.yso.fi/onto/yso/p2647"}],
            "skos:broader": [{"@id": "sh85145648"}, {"@id": "sh85145514"}],
            "skos:changeNote": [{"@id": "_:Na5ccbf20cd0f4faebeea30e87d19227f"}, {"@id": "_:N1fa298be0485428495e6f09d81b09ec0"}],
            "skos:inScheme": {"@id": "http://id.loc.gov/authorities/subjects"},
            "skos:prefLabel": {"@language": "en", "@value": "Well water"},
            "skos:related": {"@id": "sh85146057"}
        }, {
            "@id": "_:Na5ccbf20cd0f4faebeea30e87d19227f",
            "@type": "cs:ChangeSet",
            "cs:changeReason": "new",
            "cs:createdDate": {"@type": "xsd:dateTime", "@value": "2007-08-06T00:00:00"},
            "cs:creatorName": {"@id": "http://id.loc.gov/vocabulary/organizations/orcs"},
            "cs:subjectOfChange": {"@id": "sh2007006246"}
        }, {
            "@id": "_:N1fa298be0485428495e6f09d81b09ec0",
            "@type": "cs:ChangeSet",
            "cs:changeReason": "revised",
            "cs:createdDate": {"@type": "xsd:dateTime", "@value": "2007-10-03T07:55:10"},
            "cs:creatorName": {"@id": "http://id.loc.gov/vocabulary/organizations/dlc"},
            "cs:subjectOfChange": {"@id": "sh2007006246"}
        }, {"@id": "sh85145648", "@type": "skos:Concept", "skos:prefLabel": {"@language": "en", "@value": "Water-supply"}}, {
            "@id": "http://www.yso.fi/onto/yso/p2647",
            "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": "kaivovesi"
        }, {"@id": "sh85145514", "@type": "skos:Concept", "skos:prefLabel": {"@language": "en", "@value": "Groundwater"}}, {
            "@id": "http://id.worldcat.org/fast/1743789",
            "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": "Well water"
        }]
    }
    , {
        "@context": {
            "cs": "http://purl.org/vocab/changeset/schema#",
            "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
            "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
            "rdfs1": "http://www.w3.org/1999/02/22-rdf-schema#",
            "skos": "http://www.w3.org/2004/02/skos/core#",
            "skosxl": "http://www.w3.org/2008/05/skos-xl#",
            "xsd": "http://www.w3.org/2001/XMLSchema#",
            "about": "sh85063336"
        },
        "@graph": [{
            "@id": "http://id.worldcat.org/fast/964733",
            "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": "Hydraulic structures--Environmental aspects"
        }, {"@id": "http://id.worldcat.org/fast/964741", "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": "Hydraulic structures--Management"}, {
            "@id": "sh85038703",
            "@type": "http://www.loc.gov/mads/rdf/v1#Authority",
            "skos:prefLabel": {"@language": "en", "@value": "Docks"}
        }, {"@id": "sh85016673", "@type": "http://www.loc.gov/mads/rdf/v1#Authority", "skos:prefLabel": {"@language": "en", "@value": "Breakwaters"}}, {
            "@id": "sh85102058",
            "@type": "http://www.loc.gov/mads/rdf/v1#Authority",
            "skos:prefLabel": {"@language": "en", "@value": "Piers"}
        }, {"@id": "sh85119273", "@type": "http://www.loc.gov/mads/rdf/v1#Authority", "skos:prefLabel": {"@language": "en", "@value": "Sea-walls"}}, {
            "@id": "http://d-nb.info/gnd/4154895-4",
            "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": "Flussbauwerk"
        }, {"@id": "sh85063318", "@type": "http://www.loc.gov/mads/rdf/v1#Authority", "skos:prefLabel": {"@language": "en", "@value": "Hydraulic gates"}}, {
            "@id": "sh85129198",
            "@type": "skos:Concept",
            "skos:prefLabel": {"@language": "en", "@value": "Structural engineering"}
        }, {
            "@id": "sh85057408",
            "@type": "http://www.loc.gov/mads/rdf/v1#Authority",
            "skos:prefLabel": {"@language": "en", "@value": "Groins (Shore protection)"}
        }, {"@id": "http://id.worldcat.org/fast/964742", "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": "Hydraulic structures--Materials"}, {
            "@id": "sh85109076",
            "@type": "http://www.loc.gov/mads/rdf/v1#Authority",
            "skos:prefLabel": {"@language": "en", "@value": "Pumping stations"}
        }, {"@id": "http://data.bnf.fr/ark:/12148/cb119421860", "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": "Ouvrages hydrauliques"}, {
            "@id": "sh85018718",
            "@type": "http://www.loc.gov/mads/rdf/v1#Authority",
            "skos:prefLabel": {"@language": "en", "@value": "Caissons"}
        }, {"@id": "http://id.worldcat.org/fast/964748", "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": "Hydraulic structures--Research"}, {
            "@id": "http://id.worldcat.org/fast/964716",
            "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": "Hydraulic structures--Cold weather conditions"
        }, {
            "@id": "sh85016841",
            "@type": "http://www.loc.gov/mads/rdf/v1#Authority",
            "skos:prefLabel": {"@language": "en", "@value": "Bridges--Foundations and piers"}
        }, {"@id": "http://id.worldcat.org/fast/964719", "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": "Hydraulic structures--Costs"}, {
            "@id": "sh85033965",
            "@type": "http://www.loc.gov/mads/rdf/v1#Authority",
            "skos:prefLabel": {"@language": "en", "@value": "Cribwork"}
        }, {"@id": "sh85145665", "@type": "http://www.loc.gov/mads/rdf/v1#Authority", "skos:prefLabel": {"@language": "en", "@value": "Water tunnels"}}, {
            "@id": "sh85063328",
            "@type": "http://www.loc.gov/mads/rdf/v1#Authority",
            "skos:prefLabel": {"@language": "en", "@value": "Hydraulic models"}
        }, {"@id": "http://id.worldcat.org/fast/964715", "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": "Hydraulic structures"}, {
            "@id": "sh85120536",
            "@type": "http://www.loc.gov/mads/rdf/v1#Authority",
            "skos:prefLabel": {"@language": "en", "@value": "Sewerage"}
        }, {"@id": "sh85110865", "@type": "http://www.loc.gov/mads/rdf/v1#Authority", "skos:prefLabel": {"@language": "en", "@value": "Railroad bridges--Foundations and piers"}}, {
            "@id": "sh85114697",
            "@type": "http://www.loc.gov/mads/rdf/v1#Authority",
            "skos:prefLabel": {"@language": "en", "@value": "Rock traps (Hydraulic engineering)"}
        }, {"@id": "http://id.worldcat.org/fast/964720", "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": "Hydraulic structures--Defects"}, {
            "@id": "sh85063305",
            "@type": "skos:Concept",
            "skos:prefLabel": {"@language": "en", "@value": "Hydraulic engineering"}
        }, {
            "@id": "sh85063336",
            "@type": "skos:Concept",
            "http://www.loc.gov/mads/rdf/v1#hasCloseExternalAuthority": [{"@id": "http://id.worldcat.org/fast/964715"}, {"@id": "http://d-nb.info/gnd/4154895-4"}, {"@id": "http://data.bnf.fr/ark:/12148/cb119421860"}],
            "http://www.loc.gov/mads/rdf/v1#hasExactExternalAuthority": {"@id": "http://lod.nal.usda.gov/nalt/21737"},
            "http://www.loc.gov/mads/rdf/v1#hasNarrowerExternalAuthority": [{"@id": "http://id.worldcat.org/fast/964749"}, {"@id": "http://id.worldcat.org/fast/964719"}, {"@id": "http://id.worldcat.org/fast/964745"}, {"@id": "http://id.worldcat.org/fast/964718"}, {"@id": "http://id.worldcat.org/fast/964744"}, {"@id": "http://id.worldcat.org/fast/964717"}, {"@id": "http://id.worldcat.org/fast/964734"}, {"@id": "http://id.worldcat.org/fast/964741"}, {"@id": "http://id.worldcat.org/fast/964742"}, {"@id": "http://id.worldcat.org/fast/964721"}, {"@id": "http://id.worldcat.org/fast/964716"}, {"@id": "http://id.worldcat.org/fast/964748"}, {"@id": "http://id.worldcat.org/fast/964730"}, {"@id": "http://id.worldcat.org/fast/964720"}, {"@id": "http://id.worldcat.org/fast/964747"}, {"@id": "http://id.worldcat.org/fast/964733"}, {"@id": "http://id.worldcat.org/fast/964743"}, {"@id": "http://id.worldcat.org/fast/964739"}, {"@id": "http://id.worldcat.org/fast/964750"}],
            "skos:broader": [{"@id": "sh85129198"}, {"@id": "sh85063305"}],
            "skos:changeNote": [{"@id": "_:N503712de556c451fa9e3436c0a4ba1c9"}, {"@id": "_:Naee76f6ca2a343cca2550e7c87856992"}],
            "skos:inScheme": {"@id": "http://id.loc.gov/authorities/subjects"},
            "skos:narrower": [{"@id": "sh85016841"}, {"@id": "sh85037213"}, {"@id": "sh85006259"}, {"@id": "sh2004004526"}, {"@id": "sh85102372"}, {"@id": "sh85119273"}, {"@id": "sh85102058"}, {"@id": "sh85063328"}, {"@id": "sh85114697"}, {"@id": "sh85018718"}, {"@id": "sh85038003"}, {"@id": "sh85027727"}, {"@id": "sh85077979"}, {"@id": "sh85016673"}, {"@id": "sh85033965"}, {"@id": "sh85038703"}, {"@id": "sh85039268"}, {"@id": "sh85120536"}, {"@id": "sh85076918"}, {"@id": "sh85035582"}, {"@id": "sh85147009"}, {"@id": "sh85051043"}, {"@id": "sh85058838"}, {"@id": "sh85110865"}, {"@id": "sh85038580"}, {"@id": "sh2005005382"}, {"@id": "sh85146364"}, {"@id": "sh85051067"}, {"@id": "sh85067081"}, {"@id": "sh85109076"}, {"@id": "sh85113074"}, {"@id": "sh85034768"}, {"@id": "sh85057408"}, {"@id": "sh85093898"}, {"@id": "sh85042664"}, {"@id": "sh85019433"}, {"@id": "sh85063318"}, {"@id": "sh00005341"}, {"@id": "sh85145665"}, {"@id": "sh85146057"}, {"@id": "sh98008116"}],
            "skos:prefLabel": {"@language": "en", "@value": "Hydraulic structures"}
        }, {
            "@id": "_:N503712de556c451fa9e3436c0a4ba1c9",
            "@type": "cs:ChangeSet",
            "cs:changeReason": "new",
            "cs:createdDate": {"@type": "xsd:dateTime", "@value": "1986-02-11T00:00:00"},
            "cs:creatorName": {"@id": "http://id.loc.gov/vocabulary/organizations/dlc"},
            "cs:subjectOfChange": {"@id": "sh85063336"}
        }, {
            "@id": "_:Naee76f6ca2a343cca2550e7c87856992",
            "@type": "cs:ChangeSet",
            "cs:changeReason": "revised",
            "cs:createdDate": {"@type": "xsd:dateTime", "@value": "2012-03-26T10:00:01"},
            "cs:creatorName": {"@id": "http://id.loc.gov/vocabulary/organizations/dlc"},
            "cs:subjectOfChange": {"@id": "sh85063336"}
        }, {"@id": "sh85034768", "@type": "http://www.loc.gov/mads/rdf/v1#Authority", "skos:prefLabel": {"@language": "en", "@value": "Culverts"}}, {
            "@id": "http://id.worldcat.org/fast/964743",
            "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": "Hydraulic structures--Mathematical models"
        }, {"@id": "http://id.worldcat.org/fast/964750", "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": "Hydraulic structures--Testing"}, {
            "@id": "sh2005005382",
            "@type": "http://www.loc.gov/mads/rdf/v1#Authority",
            "skos:prefLabel": {"@language": "en", "@value": "Engineered log jams (Hydraulic engineering)"}
        }, {"@id": "sh85051067", "@type": "http://www.loc.gov/mads/rdf/v1#Authority", "skos:prefLabel": {"@language": "en", "@value": "Fountains"}}, {
            "@id": "sh85146057",
            "@type": "http://www.loc.gov/mads/rdf/v1#Authority",
            "skos:prefLabel": {"@language": "en", "@value": "Wells"}
        }, {"@id": "sh85019433", "@type": "http://www.loc.gov/mads/rdf/v1#Authority", "skos:prefLabel": {"@language": "en", "@value": "Canals"}}, {
            "@id": "sh85051043",
            "@type": "http://www.loc.gov/mads/rdf/v1#Authority",
            "skos:prefLabel": {"@language": "en", "@value": "Fouling organisms"}
        }, {"@id": "sh85027727", "@type": "http://www.loc.gov/mads/rdf/v1#Authority", "skos:prefLabel": {"@language": "en", "@value": "Cofferdams"}}, {
            "@id": "sh85102372",
            "@type": "http://www.loc.gov/mads/rdf/v1#Authority",
            "skos:prefLabel": {"@language": "en", "@value": "Pipelines"}
        }, {"@id": "sh85146364", "@type": "http://www.loc.gov/mads/rdf/v1#Authority", "skos:prefLabel": {"@language": "en", "@value": "Wharves"}}, {
            "@id": "sh85042664",
            "@type": "http://www.loc.gov/mads/rdf/v1#Authority",
            "skos:prefLabel": {"@language": "en", "@value": "Embankments"}
        }, {"@id": "sh85035582", "@type": "http://www.loc.gov/mads/rdf/v1#Authority", "skos:prefLabel": {"@language": "en", "@value": "Dams"}}, {
            "@id": "sh85067081",
            "@type": "http://www.loc.gov/mads/rdf/v1#Authority",
            "skos:prefLabel": {"@language": "en", "@value": "Intakes (Hydraulic engineering)"}
        }, {"@id": "http://id.worldcat.org/fast/964739", "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": "Hydraulic structures--Inspection"}, {
            "@id": "http://id.worldcat.org/fast/964718",
            "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": "Hydraulic structures--Corrosion"
        }, {"@id": "http://id.worldcat.org/fast/964745", "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": "Hydraulic structures--Planning"}, {
            "@id": "sh85038580",
            "@type": "http://www.loc.gov/mads/rdf/v1#Authority",
            "skos:prefLabel": {"@language": "en", "@value": "Diversion structures (Hydraulic engineering)"}
        }, {
            "@id": "sh00005341",
            "@type": "http://www.loc.gov/mads/rdf/v1#Authority",
            "skos:prefLabel": {"@language": "en", "@value": "Gatehouses (Hydraulic structures)"}
        }, {"@id": "http://id.worldcat.org/fast/964744", "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": "Hydraulic structures--Models"}, {
            "@id": "sh2004004526",
            "@type": "http://www.loc.gov/mads/rdf/v1#Authority",
            "skos:prefLabel": {"@language": "en", "@value": "Concrete hydraulic structures"}
        }, {"@id": "sh85113074", "@type": "http://www.loc.gov/mads/rdf/v1#Authority", "skos:prefLabel": {"@language": "en", "@value": "Reservoirs"}}, {
            "@id": "http://id.worldcat.org/fast/964749",
            "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": "Hydraulic structures--Safety measures"
        }, {"@id": "http://id.worldcat.org/fast/964734", "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": "Hydraulic structures--Evaluation"}, {
            "@id": "sh85093898",
            "@type": "http://www.loc.gov/mads/rdf/v1#Authority",
            "skos:prefLabel": {"@language": "en", "@value": "Ocean outfalls"}
        }, {"@id": "http://id.worldcat.org/fast/964721", "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": "Hydraulic structures--Design"}, {
            "@id": "sh85039268",
            "@type": "http://www.loc.gov/mads/rdf/v1#Authority",
            "skos:prefLabel": {"@language": "en", "@value": "Draft tubes"}
        }, {"@id": "http://id.worldcat.org/fast/964747", "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": "Hydraulic structures--Reliability"}, {
            "@id": "sh85006259",
            "@type": "http://www.loc.gov/mads/rdf/v1#Authority",
            "skos:prefLabel": {"@language": "en", "@value": "Aqueducts"}
        }, {"@id": "sh98008116", "@type": "http://www.loc.gov/mads/rdf/v1#Authority", "skos:prefLabel": {"@language": "en", "@value": "Booms (Hydraulic engineering)"}}, {
            "@id": "sh85058838",
            "@type": "http://www.loc.gov/mads/rdf/v1#Authority",
            "skos:prefLabel": {"@language": "en", "@value": "Harbors"}
        }, {"@id": "http://id.worldcat.org/fast/964717", "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": "Hydraulic structures--Computer programs"}, {
            "@id": "sh85037213",
            "@type": "http://www.loc.gov/mads/rdf/v1#Authority",
            "skos:prefLabel": {"@language": "en", "@value": "Desilting basins"}
        }, {"@id": "sh85147009", "@type": "http://www.loc.gov/mads/rdf/v1#Authority", "skos:prefLabel": {"@language": "en", "@value": "Wing walls"}}, {
            "@id": "sh85076918",
            "@type": "http://www.loc.gov/mads/rdf/v1#Authority",
            "skos:prefLabel": {"@language": "en", "@value": "Lighthouses"}
        }, {
            "@id": "sh85038003",
            "@type": "http://www.loc.gov/mads/rdf/v1#Authority",
            "skos:prefLabel": {"@language": "en", "@value": "Dikes (Engineering)"}
        }, {"@id": "http://id.worldcat.org/fast/964730", "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": "Hydraulic structures--Deterioration"}, {
            "@id": "http://lod.nal.usda.gov/nalt/21737",
            "http://www.loc.gov/mads/rdf/v1#authoritativeLabel": "hydraulic structures"
        }, {"@id": "sh85077979", "@type": "http://www.loc.gov/mads/rdf/v1#Authority", "skos:prefLabel": {"@language": "en", "@value": "Locks (Hydraulic engineering)"}}]
    }
]
