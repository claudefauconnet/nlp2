/*https://data.bnf.fr/en/opendata*/

var fs = require('fs')

var ontologyKoha = {


    generate: function () {
        var str = "";
        var ontologyIri = "http://data.telanthropia.org/resource"


        var noticesMap = {}
        var strNotices = "";

        var idSujet = 1000;
        var sujetsMap = {};
        var sujetsStr = ""
        var strSujetsX = "";

        var personnesMap = {}
        var personneNamesMap = {};
        var orphanStr = ""
        var strPersonnes = ""

        var strSujets = ""

        var nomsCommunsMap = {}
        var nomsCommunsNamesMap = {}
        var nomsCommunsStr = ""

        var collectivitesMap = {}
        var collectivitesNamesMap = {}
        var collectivitesStr = ""


        var nomsGeographiquesMap = {}
        var nomsGeographiquesNamesMap = {}
        var nomsGeographiquesStr = ""


        function formatString(str) {
            if (!str.replace)
                var x = 3

            str = str.replace(/"/gm, "\\\"")
            str = str.replace(/\//gm, "\/")
            str = str.replace(/;/gm, " ")
            str = str.replace(/\n/gm, "\\\\n")
            str = str.replace(/\r/gm, "")
            str = str.replace(/\t/gm, " ")
            return str;
        }

        var jsonAll = [];
        for (var i = 0; i < 5; i++) {
            var str0 = "" + fs.readFileSync("D:\\telanthropia\\telanthropia_koha_02_20_" + i + ".json");
            var json = JSON.parse(str0);
            jsonAll = jsonAll.concat(json)
        }
        var map = {};
        var str = ""
        var topConceptsStr = "";


        topConceptsStr += "<" + ontologyIri + "/vocabulary/PLM/Personne> <http://www.w3.org/2004/02/skos/core#topConceptOf>  <" + ontologyIri + "/vocabulary/PLM/> .\n";
        topConceptsStr += "<" + ontologyIri + "/vocabulary/PLM/Personne> <http://www.w3.org/2004/02/skos/core#prefLabel> \"Personne\" .\n";

        topConceptsStr += "<" + ontologyIri + "/vocabulary/PLM/NomCommun> <http://www.w3.org/2004/02/skos/core#topConceptOf>  <" + ontologyIri + "/vocabulary/PLM/> .\n";
        topConceptsStr += "<" + ontologyIri + "/vocabulary/PLM/NomCommun> <http://www.w3.org/2004/02/skos/core#prefLabel> \"Nom commun\" .\n";

        topConceptsStr += "<" + ontologyIri + "/vocabulary/PLM/Collectivite> <http://www.w3.org/2004/02/skos/core#topConceptOf>  <" + ontologyIri + "/vocabulary/PLM/> .\n";
        topConceptsStr += "<" + ontologyIri + "/vocabulary/PLM/Collectivite> <http://www.w3.org/2004/02/skos/core#prefLabel> \"Collectivité\" .\n";

        topConceptsStr += "<" + ontologyIri + "/vocabulary/PLM/NomGeographique> <http://www.w3.org/2004/02/skos/core#topConceptOf>  <" + ontologyIri + "/vocabulary/PLM/> .\n";
        topConceptsStr += "<" + ontologyIri + "/vocabulary/PLM/NomGeographique> <http://www.w3.org/2004/02/skos/core#prefLabel> \"Nom géographique\" .\n";


        jsonAll.forEach(function (item) {
            var noticeId = "<" + ontologyIri + "/ontology/Notice/" + item.codeBarre + ">"
            //titre
            var titre = item.titre.label;
            if (item.complementTitre)
                titre += " / " + item.complementTitre;

            strNotices += noticeId + " <http://purl.org/dc/terms/title>  \"" + formatString(titre) + "\" .\n";
            strNotices += noticeId + "<http://www.w3.org/2004/02/skos/core#prefLabel>  \"" + formatString(titre) + "\" .\n";
            // strSujetsX+= noticeId + " <http://www.w3.org/2004/02/skos/core#broader> "+sujetsMap[item.sujet]+ ".\n";
            //isbn
            strNotices += noticeId + " <http://purl.org/ontology/bibo/isbn>  \"" + item.isbn + "\" .\n";
            //sujet
            if (item.sujet) {
                if (!sujetsMap[item.sujet]) {
                    sujetsMap[item.sujet] = "<" + ontologyIri + "/ontology/SujetPLM/" + (idSujet++) + ">"
                    sujetsStr += sujetsMap[item.sujet] + " <http://www.w3.org/2004/02/skos/core#prefLabel> \"" + formatString(item.sujet) + "\" .\n"
                    sujetsStr += sujetsMap[item.sujet] + " <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <" + ontologyIri + "/ontology/PLM/Sujet> .\n"
                    sujetsStr += sujetsMap[item.sujet] + " <http://www.w3.org/2004/02/skos/core#inScheme>  <" + ontologyIri + "/ontology/PLM/Sujet> .\n";
                }

                strNotices += noticeId + " <http://www.w3.org/2004/02/skos/core#broader> " + sujetsMap[item.sujet] + ".\n";


            }
            //cote
            strNotices += noticeId + " <http://purl.org/ontology/bibo/locator>  \"" + item.cote + "\" .\n";


            item.personnes.forEach(function (personne) {
                var personneKey;
                var personneId = "<" + ontologyIri + "/vocabulary/Personne/" + personne.id + ">"
                if (personne.id.indexOf("X_") == 0) {//pas d'id BNF
                    return;
                    personneKey = personne.label;
                    if (personne.titre)
                        personneKey += "_" + personne.titre
                    if (personne.subdivision)
                        personneKey += "_" + personne.subdivision

                    if (!personnesMap[personneKey]) {
                        personnesMap[personneKey] = personneId;
                        strPersonnes += personnesMap[personneKey] + " <http://www.w3.org/2004/02/skos/core#prefLabel> \"" + formatString(personne.label) + "\" .\n"
                        if (personne.titre)
                            strPersonnes += personnesMap[personneKey] + " <http://xmlns.com/foaf/0.1/interest> \"" + formatString(personne.titre) + "\" .\n"
                        if (personne.subdivision) {
                            strPersonnes += personnesMap[personneKey] + "  <http://www.w3.org/2004/02/skos/altLabel> \"" + formatString(personne.subdivision) + "\" .\n"

                        }
                        if (personne.date)
                            strPersonnes += personnesMap[personneKey] + " <http://purl.org/dc/terms/date> \"" + formatString(personne.date) + "\" .\n"

                        strPersonnes += personnesMap[personneKey] + " <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <" + ontologyIri + "/vocabulary/PLM/Personne> .\n"
                        strPersonnes += personnesMap[personneKey] + " <http://www.w3.org/2004/02/skos/core#broader> <" + ontologyIri + "/vocabulary/PLM/Personne> .\n"


                    }
                } else {
                    personneKey = personne.id
                    if (!personnesMap[personneKey]) {
                        personnesMap[personneKey] = personneId;
                        strPersonnes += personnesMap[personneKey] + " <http://www.w3.org/2004/02/skos/core#prefLabel> \"" + formatString(personne.label) + "\" .\n"
                        strPersonnes += personnesMap[personneKey] + " <http://data.bnf.fr/ontology/bnf-onto/FRBNF> \"" + formatString(personne.id) + "\" .\n"

                        strPersonnes += personnesMap[personneKey] + " <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <" + ontologyIri + "/vocabulary/PLM/Personne> .\n"
                        strPersonnes += personnesMap[personneKey] + " <http://www.w3.org/2004/02/skos/core#broader> <" + ontologyIri + "/vocabulary/PLM/Personne> .\n"
                        personneNamesMap[personne.label.toLowerCase()] = personne.id;
                    }
                }

                strNotices += noticeId + " <http://xmlns.com/foaf/0.1/Person> " + personnesMap[personneKey] + " .\n"
                strNotices += noticeId + "  <http://purl.org/dc/terms/subject> " + personnesMap[personneKey] + " .\n"


            })


            item.nomsCommuns.forEach(function (nomCommun) {
                var nomCommunKey
                var nomCommunId = "<" + ontologyIri + "/vocabulary/NomCommun/" + nomCommun.id + ">"
                if (nomCommun.id.indexOf("X_") == 0) {//pas d'id BNF
                    nomCommunKey = nomCommun.label;
                    if (nomCommun.subdivision)
                        nomCommunKey += "_" + nomCommun.subdivision

                    if (!nomsCommunsMap[nomCommunKey]) {
                        nomsCommunsMap[nomCommunKey] = nomCommunId;
                        nomsCommunsStr += nomsCommunsMap[nomCommunKey] + " <http://www.w3.org/2004/02/skos/core#prefLabel> \"" + formatString(nomCommun.label) + "\" .\n"
                        if (nomCommun.subdivision)
                            nomsCommunsStr += nomsCommunsMap[nomCommunKey] + " <http://www.w3.org/2004/02/skos/altLabel> \"" + formatString(nomCommun.subdivision) + "\" .\n"
                        nomsCommunsStr += nomsCommunsMap[nomCommunKey] + " <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <" + ontologyIri + "/vocabulary/PLM/NomCommun> .\n";
                        nomsCommunsStr += nomsCommunsMap[nomCommunKey] + " <http://www.w3.org/2004/02/skos/core#broader> <" + ontologyIri + "/vocabulary/PLM/NomCommun> .\n";

                    }
                } else {
                    nomCommunKey = nomCommun.id;
                    if (!nomsCommunsMap[nomCommunKey]) {
                        nomsCommunsMap[nomCommunKey] = nomCommunId;
                        nomsCommunsStr += nomsCommunsMap[nomCommunKey] + " <http://www.w3.org/2004/02/skos/core#prefLabel> \"" + formatString(nomCommun.label) + "\" .\n"
                        nomsCommunsStr += nomsCommunsMap[nomCommunKey] + " <http://data.bnf.fr/ontology/bnf-onto/FRBNF> \"" + formatString(nomCommun.id) + "\" .\n"
                        nomsCommunsStr += nomsCommunsMap[nomCommunKey] + " <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <" + ontologyIri + "/vocabulary/PLM/NomCommun> .\n";
                        nomsCommunsStr += nomsCommunsMap[nomCommunKey] + " <http://www.w3.org/2004/02/skos/core#broader> <" + ontologyIri + "/vocabulary/PLM/NomCommun> .\n";
                        nomsCommunsNamesMap[nomCommun.label.toLowerCase()] = nomCommun.id;
                    }
                }

                strNotices += noticeId + " <http://xmlns.com/foaf/0.1/focus> " + nomsCommunsMap[nomCommunKey] + " .\n"
                strNotices += noticeId + "  <http://purl.org/dc/terms/subject> " + nomsCommunsMap[nomCommunKey] + " .\n"


            })

            item.collectivites.forEach(function (collectivite) {
                var collectiviteKey
                var collectiviteId = "<" + ontologyIri + "/vocabulary/Collectivite/" + collectivite.id + ">"
                if (collectivite.id.indexOf("X_") == 0) {//pas d'id BNF
                    collectiviteKey = collectivite.label;
                    if (collectivite.subdivision)
                        collectiviteKey += "_" + collectivite.subdivision

                    if (!collectivitesMap[collectiviteKey]) {
                        collectivitesMap[collectiviteKey] = collectiviteId;
                        collectivitesStr += collectivitesMap[collectiviteKey] + " <http://www.w3.org/2004/02/skos/core#prefLabel> \"" + formatString(collectivite.label) + "\" .\n"
                        if (collectivite.subdivision)
                            collectivitesStr += collectivitesMap[collectiviteKey] + " <http://www.w3.org/2004/02/skos/altLabel> \"" + formatString(collectivite.subdivision) + "\" .\n"
                        collectivitesStr += collectivitesMap[collectiviteKey] + " <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <" + ontologyIri + "/vocabulary/PLM/Collectivite> .\n";
                        collectivitesStr += collectivitesMap[collectiviteKey] + " <http://www.w3.org/2004/02/skos/core#broader> <" + ontologyIri + "/vocabulary/PLM/Collectivite> .\n";
                    }
                } else {
                    collectiviteKey = collectivite.id;
                    if (!collectivitesMap[collectiviteKey]) {
                        collectivitesMap[collectiviteKey] = collectiviteId;
                        collectivitesStr += collectivitesMap[collectiviteKey] + " <http://www.w3.org/2004/02/skos/core#prefLabel> \"" + formatString(collectivite.label) + "\" .\n"
                        collectivitesStr += collectivitesMap[collectiviteKey] + " <http://data.bnf.fr/ontology/bnf-onto/FRBNF> \"" + collectivite.id + "\" .\n"
                        collectivitesStr += collectivitesMap[collectiviteKey] + " <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <" + ontologyIri + "/vocabulary/PLM/Collectivite> .\n";
                        collectivitesStr += collectivitesMap[collectiviteKey] + " <http://www.w3.org/2004/02/skos/core#broader> <" + ontologyIri + "/vocabulary/PLM/Collectivite> .\n";
                        collectivitesNamesMap[collectivite.label.toLowerCase()] = collectivite.id;
                    }
                }

                strNotices += noticeId + " <http://xmlns.com/foaf/0.1/Group> " + collectivitesMap[collectiviteKey] + " .\n"
                strNotices += noticeId + "  <http://purl.org/dc/terms/subject> " + collectivitesMap[collectiviteKey] + " .\n"


            })

            item.nomsGeographiques.forEach(function (nomGeographique) {
                var nomsGeographiqueKey
                var nomsGeographiqueId = "<" + ontologyIri + "/vocabulary/NomGeographique/" + nomGeographique.id + ">"
                if (nomGeographique.id.indexOf("X_") == 0) {//pas d'id BNF
                    nomsGeographiqueKey = nomGeographique.label;
                    if (nomGeographique.subdivision)
                        nomsGeographiqueKey += "_" + nomGeographique.subdivision

                    if (!nomsGeographiquesMap[nomsGeographiqueKey]) {
                        nomsGeographiquesMap[nomsGeographiqueKey] = nomsGeographiqueId;
                        nomsGeographiquesStr += nomsGeographiquesMap[nomsGeographiqueKey] + " <http://www.w3.org/2004/02/skos/core#prefLabel> \"" + formatString(nomGeographique.label) + "\" .\n"
                        if (nomGeographique.subdivision)
                            nomsGeographiquesStr += nomsGeographiquesMap[nomsGeographiqueKey] + "  <http://www.w3.org/2004/02/skos/altLabel> \"" + formatString(nomGeographique.subdivision) + "\" .\n"
                        nomsGeographiquesStr += nomsGeographiquesMap[nomsGeographiqueKey] + " <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <" + ontologyIri + "/vocabulary/PLM/NomGeographique> .\n"
                        nomsGeographiquesStr += nomsGeographiquesMap[nomsGeographiqueKey] + " <http://www.w3.org/2004/02/skos/core#broader> <" + ontologyIri + "/vocabulary/PLM/NomGeographique> .\n"
                    }
                } else {
                    nomsGeographiqueKey = nomGeographique.id;
                    if (!nomsGeographiquesMap[nomsGeographiqueKey]) {
                        nomsGeographiquesMap[nomsGeographiqueKey] = nomsGeographiqueId;
                        nomsGeographiquesStr += nomsGeographiquesMap[nomsGeographiqueKey] + " <http://data.bnf.fr/ontology/bnf-onto/FRBNF> \"" + formatString(nomGeographique.id) + "\" .\n"
                        nomsGeographiquesStr += nomsGeographiquesMap[nomsGeographiqueKey] + "<http://www.w3.org/2004/02/skos/core#prefLabel> \"" + formatString(nomGeographique.label) + "\" .\n"
                        nomsGeographiquesStr += nomsGeographiquesMap[nomsGeographiqueKey] + " <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <" + ontologyIri + "/vocabulary/PLM/NomGeographique> .\n"
                        nomsGeographiquesStr += nomsGeographiquesMap[nomsGeographiqueKey] + " <http://www.w3.org/2004/02/skos/core#broader> <" + ontologyIri + "/vocabulary/PLM/NomGeographique> .\n"
                        nomsGeographiquesNamesMap[nomGeographique.label.toLowerCase()] = nomGeographique.id;
                    }
                    ///     strNotices+= "<" + ontologyIri + "/vocabulary/PLM/NomGeographique>"+
                }


                strNotices += noticeId + " <http://schema.org/location> " + nomsGeographiquesMap[nomsGeographiqueKey] + " .\n"
                strNotices += noticeId + "  <http://purl.org/dc/terms/subject> " + nomsGeographiquesMap[nomsGeographiqueKey] + " .\n"


            })


        })


        if( true) {
            var strBnfOk = "";

            jsonAll.forEach(function (item) {
                var type = "nomsGeographiques"
                item[type].forEach(function (item) {
                    if (nomsGeographiquesMap[item.id])
                        strBnfOk += type + "\t" + item.label + "\t" + item.id+"\n";
                })
                var type = "nomsCommuns"
                item[type].forEach(function (item) {
                    if (nomsCommunsMap[item.id])
                        strBnfOk += type + "\t" + item.label + "\t" + item.id+"\n";
                })
                var type = "collectivites"
                item[type].forEach(function (item) {
                    if (collectivitesMap[item.id])
                        strBnfOk += type + "\t" + item.label + "\t" + item.id+"\n";
                })
                var type = "personnes"
                item[type].forEach(function (item) {
                    if (personnesMap[item.id])
                        strBnfOk += type + "\t" + item.label + "\t" + item.id+"\n";
                })


            })

            fs.writeFileSync("D:\\telanthropia\\telanthropia_bnf_OK_Ids.csv", strBnfOk)
        }

        if(false) {
            var type = "personnes"
            var type = "nomsGeographiques"
            //   var type ="collectivites"
            var type = "nomsCommuns"

            var ok = false;
            var orphans = [];
            jsonAll.forEach(function (item) {

                item[type].forEach(function (item) {
                    if (!personneNamesMap[item.label.toLowerCase()])
                        if (orphans.indexOf(item.label) < 0)
                            orphans.push(item.label)

                    orphanStr += item.label + "_" + item.titre + "_" + item.subdivision + "\n";
                })
            })


            var async = require("async")

            var bnfIds = "";
            async.eachSeries(orphans, function (orphan, callbackEach) {
                if (orphan == "Messie") {
                    ok = true
                }
                if (!ok)
                    return callbackEach();
                if (type == "personnes") {
                    var query = "PREFIX skos: <http://www.w3.org/2004/02/skos/core#>" +
                        "SELECT DISTINCT * " +
                        "WHERE {" +
                        "?id foaf:familyName ?prefLabel ." +
                        " filter regex(?prefLabel, \"^" + orphan + "$\", \"i\")" +
                        "}" +
                        "LIMIT 1000"
                }
                if (type == "nomsGeographiques" || type == "collectivites") {

                    if (orphan.indexOf("(") > -1)
                        orphan = orphan.substring(0, orphan.indexOf(" ("))
                    var query = "PREFIX skos: <http://www.w3.org/2004/02/skos/core#>" +
                        "SELECT DISTINCT * " +
                        "WHERE {" +
                        "?id foaf:name ?prefLabel ." +
                        //  "?id  <http://purl.org/dc/terms/isPartOf> ?scheme"+
                        " filter regex(?prefLabel, \"^" + orphan + "$\", \"i\")" +
                        "}" +
                        "LIMIT 1000"
                }

                if (type == "nomsCommuns") {

                    var query = "PREFIX skos: <http://www.w3.org/2004/02/skos/core#>" +
                        "SELECT DISTINCT * " +
                        "WHERE {" +
                        "?id skos:prefLabel ?prefLabel ." +
                        "?id  <http://purl.org/dc/terms/isPartOf> ?scheme" +
                        " filter regex(?prefLabel, \"^" + orphan + "$\", \"i\")" +
                        "}" +
                        "LIMIT 1000"
                }


                var url = 'https://data.bnf.fr/sparql' + "?default-graph-uri=" + encodeURIComponent('http://data.bnf.fr') + "&query=";// + query + queryOptions
                var queryOptions = "&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=20000&debug=off"
                var payload = {
                    params: {query: query},
                    headers: {
                        "Accept": "application/sparql-results+json",
                        "Content-Type": "application/x-www-form-urlencoded"
                    }
                }
                var httpProxy = require("../../httpProxy.");

                console.log("X\t" + orphan + "\n");
                httpProxy.post(url, payload.headers, payload.params, function (err, result) {
                    if (err) {
                        return console.log(err);
                    }
                    if (result.results.bindings.length == 0)
                        bnfIds += "X\t" + orphan + "\n"
                    else {
                        result.results.bindings.forEach(function (item) {
                            bnfIds += "A\t" + orphan + "\t" + item.id.value + "\n"
                            console.log("A\t" + orphan + "\t" + item.id.value + "\n");
                        })
                    }
                    callbackEach()

                })


            }, function (err) {
                fs.writeFileSync("D:\\telanthropia\\telanthropia_bnf" + type + "Ids.csv", bnfIds)

            })

        }


        return;

        orphanStr += "-------------"
        for (var key in personneNamesMap) {
            orphanStr += key + "\n"
        }

        var strResources = strNotices;
        strResources += sujetsStr;
        var strThesaurus = topConceptsStr;
        strThesaurus += strPersonnes;
        strThesaurus += nomsCommunsStr;
        strThesaurus += collectivitesStr;
        strThesaurus += nomsGeographiquesStr;


        // strAll=strSujetsX;

        //    fs.writeFileSync("D:\\telanthropia\\telanthropia_all.rdf.nt", strAll)

        fs.writeFileSync("D:\\telanthropia\\telanthropia_resources.rdf.nt", strResources)
        fs.writeFileSync("D:\\telanthropia\\telanthropia_thesaurus.rdf.nt", strThesaurus);
        fs.writeFileSync("D:\\telanthropia\\telanthropia_orphanPersons.rdf.nt", orphanStr);


        return;
        fs.writeFileSync("D:\\telanthropia\\telanthropia_notices.rdf.nt", strNotices)
        fs.writeFileSync("D:\\telanthropia\\telanthropia_personnes.rdf.nt", strPersonnes)
        fs.writeFileSync("D:\\telanthropia\\telanthropia_nomsCommunsrdf.nt", nomsCommunsStr)
        fs.writeFileSync("D:\\telanthropia\\telanthropia_ncollectivites .rdf.nt", collectivitesStr)
        fs.writeFileSync("D:\\telanthropia\\telanthropia_nomsGeographiques.rdf.nt", nomsGeographiquesStr)
        fs.writeFileSync("D:\\telanthropia\\telanthropia_sujets.rdf.nt", sujetsStr)


    }


}

ontologyKoha.generate()



