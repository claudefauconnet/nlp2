var fs = require('fs');
var async = require('async');
const csv = require('csv-parser')

//https://www.bnf.fr/fr/intermarc-bibliographique-de-diffusion
var kohaImport = {


    xmlToJson: function (sourcePath, callback) {
        var synsetsMap = {};
        var currentRecord = null;
        var currentSynset = null;
        var currentAttrTag = null;
        var records = [];
        var currentNode;
        var currentNodeName;
        var currentTagName;
        var currentSubField;
        var strict = true; // set to false for html-mode
        var saxStream = require("sax").createStream(strict)
        saxStream.on("error", function (e) {

            console.error("error!", e)
            this._parser.error = null
            this._parser.resume()
            return callback(e);
        })
        saxStream.on("opentag", function (node) {
            currentNodeName = node.name;
            if (node.name == "record") {
                currentRecord = {};

            }
            if (node.name == "datafield") {

                var tag = node.attributes["tag"]
                currentTagName = tag
                currentRecord[tag] = [];
            }

            if (node.name == "subfield") {
                var code = node.attributes["code"];
                currentSubField = {
                    code: code
                }
            }


        })

        saxStream.on("text", function (text) {

            if (text.indexOf("\n") > -1 || text.indexOf("\r") > -1)
                return;
            //  console.log(text)
            if (currentNodeName == "leader")
                currentRecord.leader = text;
            if (currentNodeName == "controlfield")
                currentRecord.controlfield = text;
            if (currentNodeName == "subfield") {
                currentSubField.value = text
                currentRecord[currentTagName].push(currentSubField);
            }


        })
        saxStream.on("closetag", function (nodeName) {
            if (nodeName == "record") {
                records.push(currentRecord);
            }
        })
        saxStream.on("end", function (node) {
            return callback(null, records)

            //    return callback(null, {synsets: synsetsMap, nouns: nouns});
        })
        fs.createReadStream(sourcePath)
            .pipe(saxStream)
    },


    extractVedettes: function (json) {

        var codes = {}
        json.forEach(function (record) {

            getAssociatedValues = function (record, sourceField) {
                for (var key in record) {
                    if (key.charAt(0) == "6") {
                        if (Array.isArray(record[key])) {
                            record[key].forEach(function (field) {

                                if (field.value != sourceField.value && sourceField.associatedValues.indexOf(field.value) < 0) {
                                    if (field.code == "a")
                                        sourceField.associatedValues.push(field.value)
                                }
                            })

                        }
                    }
                }

                return sourceField

            }
            var auteur = null;
            for (var key in record) {

                if (key == "200") {
                    record[key].forEach(function (field) {
                        if (field.code == "f") {
                            auteur = field.value;
                        }
                    })

                }

                if (key.charAt(0) == "6") {
                    if (Array.isArray(record[key])) {
                        record[key].forEach(function (field) {
                            var code = field.code;
                            if (code == "a") {

                                if (!codes[field.value])
                                    codes[field.value] = {freq: 1, tags: [key], value: field.value, associatedValues: [], auteurs: [auteur]}
                                else {
                                    if (codes[field.value].tags.indexOf(key) < 0)
                                        codes[field.value].tags.push(key);
                                    if (codes[field.value].auteurs.indexOf(auteur) < 0)
                                        codes[field.value].auteurs.push(auteur);
                                    codes[field.value].freq += 1
                                }
                                codes[field.value] = getAssociatedValues(record, codes[field.value])
                            }
                        })
                    }
                }

            }
        })

        var codesArray = [];
        for (var key in codes) {
            codesArray.push(codes[key])
        }

        codesArray.sort(function (a, b) {
            if (a.freq > b.freq)
                return -1;
            if (b.freq > a.freq)
                return 1;
            return 0;
        })


        var top100 = codesArray.slice(0, 100)

//console.log(JSON.stringify(top100))

        for (var i = 0; i < 1000; i++) {
            var vedette = codesArray[i];
          //  console.log(vedette.value + "\t" + vedette.freq + "\t" + vedette.tags.toString() + "\t" + vedette.associatedValues.toString() + "\t" + vedette.auteurs.toString())
        }
    }
    , vedettesToGraph: function (json) {
        var codes = {}
        json.forEach(function (record) {
            getAssociatedValues = function (record, sourceField) {
                for (var key in record) {
                    if (key.charAt(0) == "6") {
                        if (Array.isArray(record[key])) {
                            record[key].forEach(function (field) {

                                if (field.value != sourceField.value) {//&& sourceField.associatedValues.indexOf(field.value) < 0) {
                                    if (field.code == "a") {
                                        if (!sourceField.associatedValues[field.value])
                                            sourceField.associatedValues[field.value] = 1;
                                        else
                                            sourceField.associatedValues[field.value] += 1;
                                    }
                                }
                            })

                        }
                    }
                }

                return sourceField

            }
            var auteur = null;
            var isbn = null;
            var titre = null;
            for (var key in record) {

                if (key == "200") {
                    record[key].forEach(function (field) {
                        if (field.code == "f") {
                            auteur = field.value;
                        }
                        if (field.code == "a") {
                            titre = field.value;
                        }
                    })

                }
                if (key == "010") {
                    record[key].forEach(function (field) {
                        if (field.code == "a") {
                            isbn = field.value;
                        }
                    })

                }

                if (key.charAt(0) == "6") {
                    if (Array.isArray(record[key])) {
                        record[key].forEach(function (field) {
                            var code = field.code;
                            if (code == "a") {

                                if (!codes[field.value]) {
                                    codes[field.value] = {freq: 1, tags: {}, value: field.value, associatedValues: {}, auteurs: {}, ouvrages: []}
                                    codes[field.value].auteurs[auteur] = 1;
                                    codes[field.value].tags[key] = 1;

                                } else {

                                    if (!codes[field.value].tags[key])
                                        codes[field.value].tags[key] = 1;
                                    else
                                        codes[field.value].tags[key] += 1;

                                    if (!codes[field.value].auteurs[auteur])
                                        codes[field.value].auteurs[auteur] = 1;
                                    else
                                        codes[field.value].auteurs[auteur] += 1;

                                    codes[field.value].freq += 1
                                }
                                codes[field.value].ouvrages.push({titre: titre, isbn: isbn});
                                codes[field.value] = getAssociatedValues(record, codes[field.value])
                            }
                        })
                    }
                }

            }
        })

        var codesArray = [];
        for (var key in codes) {
            codesArray.push(codes[key])
        }

        codesArray.sort(function (a, b) {
            if (a.freq > b.freq)
                return -1;
            if (b.freq > a.freq)
                return 1;
            return 0;
        })


        var top100 = codesArray.slice(0, 100)

//console.log(JSON.stringify(top100))

        var vedettesCsv = "";
        var relationsVedettesCsv = "";
        var relationsAuteursCsv = "";
        var auteursCsv = "";
        var relationsOuvragesCsv = "";
        var auteurs = [];
        for (var i = 0; i < 500; i++) {
            var vedette = codesArray[i];
            vedettesCsv += vedette.value + "\t" + vedette.freq + "\n";
            for (var key in vedette.auteurs) {
                if (auteurs.indexOf(key) < 0) {
                    auteurs.push(key)
                }
                relationsAuteursCsv += vedette.value + "\t" + key + "\t" + vedette.auteurs[key] + "\n";
            }
            vedette.ouvrages.forEach(function (ouvrage) {

                relationsOuvragesCsv += vedette.value + "\t" + ouvrage.titre + "\t" + ouvrage.isbn + "\n";
            })

            for (var key in vedette.associatedValues) {
                auteurs.push(key)
                relationsVedettesCsv += vedette.value + "\t" + key + "\t" + vedette.associatedValues[key] + "\n";
            }

            auteurs.forEach(function (auteur) {
                auteursCsv += auteur + "\n";
            })


            //   console.log(vedette.value + "\t" + vedette.freq + "\t" + JSON.stringify(vedette.tags)+ "\t" +JSON.stringify( vedette.associatedValues) + "\t" + JSON.stringify(vedette.auteurs))
        }

        var firPath = "D:\\telanthropia\\";
        // fs.writeFileSync("D:\\telanthropia\\auteurs.csv", auteursCsv);
        fs.writeFileSync("D:\\telanthropia\\vedettes.csv", vedettesCsv);
        fs.writeFileSync("D:\\telanthropia\\relationsAuteurs.csv", relationsAuteursCsv);
        fs.writeFileSync("D:\\telanthropia\\relationsVedettes.csv", relationsVedettesCsv);
        fs.writeFileSync("D:\\telanthropia\\relationsOuvrages.csv", relationsOuvragesCsv);

    },


    noticesVedettes: function (json, callback) {
        var stopWords_fr = ["a", "abord", "absolument", "afin", "ah", "ai", "aie", "aient", "aies", "ailleurs", "ainsi", "ait", "allaient", "allo", "allons", "allô", "alors", "anterieur", "anterieure", "anterieures", "apres", "après", "as", "assez", "attendu", "au", "aucun", "aucune", "aucuns", "aujourd", "aujourd'hui", "aupres", "auquel", "aura", "aurai", "auraient", "aurais", "aurait", "auras", "aurez", "auriez", "aurions", "aurons", "auront", "aussi", "autre", "autrefois", "autrement", "autres", "autrui", "aux", "auxquelles", "auxquels", "avaient", "avais", "avait", "avant", "avec", "avez", "aviez", "avions", "avoir", "avons", "ayant", "ayez", "ayons", "b", "bah", "bas", "basee", "bat", "beau", "beaucoup", "bien", "bigre", "bon", "boum", "bravo", "brrr", "c", "car", "ce", "ceci", "cela", "celle", "celle-ci", "celle-là", "celles", "celles-ci", "celles-là", "celui", "celui-ci", "celui-là", "celà", "cent", "cependant", "certain", "certaine", "certaines", "certains", "certes", "ces", "cet", "cette", "ceux", "ceux-ci", "ceux-là", "chacun", "chacune", "chaque", "cher", "chers", "chez", "chiche", "chut", "chère", "chères", "ci", "cinq", "cinquantaine", "cinquante", "cinquantième", "cinquième", "clac", "clic", "combien", "comme", "comment", "comparable", "comparables", "compris", "concernant", "contre", "couic", "crac", "d", "da", "dans", "de", "debout", "dedans", "dehors", "deja", "delà", "depuis", "dernier", "derniere", "derriere", "derrière", "des", "desormais", "desquelles", "desquels", "dessous", "dessus", "deux", "deuxième", "deuxièmement", "devant", "devers", "devra", "devrait", "different", "differentes", "differents", "différent", "différente", "différentes", "différents", "dire", "directe", "directement", "dit", "dite", "dits", "divers", "diverse", "diverses", "dix", "dix-huit", "dix-neuf", "dix-sept", "dixième", "doit", "doivent", "donc", "dont", "dos", "douze", "douzième", "dring", "droite", "du", "duquel", "durant", "dès", "début", "désormais", "e", "effet", "egale", "egalement", "egales", "eh", "elle", "elle-même", "elles", "elles-mêmes", "en", "encore", "enfin", "entre", "envers", "environ", "es", "essai", "est", "et", "etant", "etc", "etre", "eu", "eue", "eues", "euh", "eurent", "eus", "eusse", "eussent", "eusses", "eussiez", "eussions", "eut", "eux", "eux-mêmes", "exactement", "excepté", "extenso", "exterieur", "eûmes", "eût", "eûtes", "f", "fais", "faisaient", "faisant", "fait", "faites", "façon", "feront", "fi", "flac", "floc", "fois", "font", "force", "furent", "fus", "fusse", "fussent", "fusses", "fussiez", "fussions", "fut", "fûmes", "fût", "fûtes", "g", "gens", "h", "ha", "haut", "hein", "hem", "hep", "hi", "ho", "holà", "hop", "hormis", "hors", "hou", "houp", "hue", "hui", "huit", "huitième", "hum", "hurrah", "hé", "hélas", "i", "ici", "il", "ils", "importe", "j", "je", "jusqu", "jusque", "juste", "k", "l", "la", "laisser", "laquelle", "las", "le", "lequel", "les", "lesquelles", "lesquels", "leur", "leurs", "longtemps", "lors", "lorsque", "lui", "lui-meme", "lui-même", "là", "lès", "m", "ma", "maint", "maintenant", "mais", "malgre", "malgré", "maximale", "me", "meme", "memes", "merci", "mes", "mien", "mienne", "miennes", "miens", "mille", "mince", "mine", "minimale", "moi", "moi-meme", "moi-même", "moindres", "moins", "mon", "mot", "moyennant", "multiple", "multiples", "même", "mêmes", "n", "na", "naturel", "naturelle", "naturelles", "ne", "neanmoins", "necessaire", "necessairement", "neuf", "neuvième", "ni", "nombreuses", "nombreux", "nommés", "non", "nos", "notamment", "notre", "nous", "nous-mêmes", "nouveau", "nouveaux", "nul", "néanmoins", "nôtre", "nôtres", "o", "oh", "ohé", "ollé", "olé", "on", "ont", "onze", "onzième", "ore", "ou", "ouf", "ouias", "oust", "ouste", "outre", "ouvert", "ouverte", "ouverts", "o|", "où", "p", "paf", "pan", "par", "parce", "parfois", "parle", "parlent", "parler", "parmi", "parole", "parseme", "partant", "particulier", "particulière", "particulièrement", "pas", "passé", "pendant", "pense", "permet", "personne", "personnes", "peu", "peut", "peuvent", "peux", "pff", "pfft", "pfut", "pif", "pire", "pièce", "plein", "plouf", "plupart", "plus", "plusieurs", "plutôt", "possessif", "possessifs", "possible", "possibles", "pouah", "pour", "pourquoi", "pourrais", "pourrait", "pouvait", "prealable", "precisement", "premier", "première", "premièrement", "pres", "probable", "probante", "procedant", "proche", "près", "psitt", "pu", "puis", "puisque", "pur", "pure", "q", "qu", "quand", "quant", "quant-à-soi", "quanta", "quarante", "quatorze", "quatre", "quatre-vingt", "quatrième", "quatrièmement", "que", "quel", "quelconque", "quelle", "quelles", "quelqu'un", "quelque", "quelques", "quels", "qui", "quiconque", "quinze", "quoi", "quoique", "r", "rare", "rarement", "rares", "relative", "relativement", "remarquable", "rend", "rendre", "restant", "reste", "restent", "restrictif", "retour", "revoici", "revoilà", "rien", "s", "sa", "sacrebleu", "sait", "sans", "sapristi", "sauf", "se", "sein", "seize", "selon", "semblable", "semblaient", "semble", "semblent", "sent", "sept", "septième", "sera", "serai", "seraient", "serais", "serait", "seras", "serez", "seriez", "serions", "serons", "seront", "ses", "seul", "seule", "seulement", "si", "sien", "sienne", "siennes", "siens", "sinon", "six", "sixième", "soi", "soi-même", "soient", "sois", "soit", "soixante", "sommes", "son", "sont", "sous", "souvent", "soyez", "soyons", "specifique", "specifiques", "speculatif", "stop", "strictement", "subtiles", "suffisant", "suffisante", "suffit", "suis", "suit", "suivant", "suivante", "suivantes", "suivants", "suivre", "sujet", "superpose", "sur", "surtout", "t", "ta", "tac", "tandis", "tant", "tardive", "te", "tel", "telle", "tellement", "telles", "tels", "tenant", "tend", "tenir", "tente", "tes", "tic", "tien", "tienne", "tiennes", "tiens", "toc", "toi", "toi-même", "ton", "touchant", "toujours", "tous", "tout", "toute", "toutefois", "toutes", "treize", "trente", "tres", "trois", "troisième", "troisièmement", "trop", "très", "tsoin", "tsouin", "tu", "té", "u", "un", "une", "unes", "uniformement", "unique", "uniques", "uns", "v", "va", "vais", "valeur", "vas", "vers", "via", "vif", "vifs", "vingt", "vivat", "vive", "vives", "vlan", "voici", "voie", "voient", "voilà", "vont", "vos", "votre", "vous", "vous-mêmes", "vu", "vé", "vôtre", "vôtres", "w", "x", "y", "z", "zut", "à", "â", "ça", "ès", "étaient", "étais", "était", "étant", "état", "étiez", "étions", "été", "étée", "étées", "étés", "êtes", "être", "ô"]

        var idIndex=1000
        var notices = [];
        json.forEach(function (record) {

            var auteur = null;
            var isbn = null;
            var titre = null;
            var auteurs = [];
            var vedettes = [];
            var personnes = [];
            var nomsCommuns = [];
            var nomsGeographiques = [];
            var collectivites = [];
            var cote = "";
            var codeBarre = "";
            var bibliotheque = "";



            function getFieldsMap(recordkeys){
                var map = {}
                if (Array.isArray(recordkeys)) {
                    recordkeys.forEach(function (field) {

                        var code = field.code
                        var value = field.value;
                        if (!map[code])
                            map[code] = [];
                        map[code].push(value);
                        if( map[code].length>1)
                            var x=3;
                    })
                }
                return map;

            }

            for (var key in record) {



                key = "" + key;
                if (key == "200") {
                    var map=getFieldsMap(record[key])
                        map["a"].forEach(function (name, index) {
                            var id;
                            if (map["3"])
                                id = map["3"][index]
                            else
                                id = "X_" + idIndex++;

                            var nom = map["a"][index];
                            titre = {id: id, label: nom}
                            if (map["e"] && map["e"][index])
                                titre.complementTitre = map["e"][index]
                        })



                }
                if (key == "010") {
                    record[key].forEach(function (field) {
                        if (field.code == "a") {
                            isbn = field.value;

                        }
                    })

                }

                if (key == "600") {
                    var map=getFieldsMap(record[key])
                    if (map["a"] ){
                        map["a"].forEach(function (name, index) {
                            var id;
                            if (map["3"])
                                id = map["3"][index]
                            else
                                id = "X_" + idIndex++;

                            var nom = map["a"][index];
                            if (map["b"] && map["b"][index])
                                nom += " " + map["b"][index]
                            var personne = {id: id, label: nom}
                            if (map["x"] && map["x"][index])
                                personne.subdivision = map["x"][index]
                            if (map["c"] && map["c"][index])
                                personne.titre = map["c"][index]
                            if (map["f"] && map["f"][index])
                                personne.date = map["f"][index]
                            personnes.push(personne);
                        })
                    }

                }
                if (key == "601") {//collectivité
                    var map=getFieldsMap(record[key])
                    if (map["a"] ){
                        map["a"].forEach(function (name, index) {
                            var id;
                            if (map["3"])
                                id = map["3"][index]
                            else
                                id = "X_" + idIndex++;

                            var nom = map["a"][index];
                            if (map["b"] && map["b"][index])
                                nom += " " + map["b"][index]
                            var collectivite = {id: id, label: nom}
                            if (map["x"] && map["x"][index])
                                collectivite.subdivision = map["x"][index]
                            if (map["c"] && map["c"][index])
                                collectivite.titre = map["c"][index]
                            if (map["f"] && map["f"][index])
                                collectivite.date = map["f"][index]
                            collectivites.push(collectivite);
                        })
                    }


                }
                if(  isbn=="2-204-04706-6"){
                    var x=3
                }
                if (key == "606") {//nom commun


                    var map=getFieldsMap(record[key])
                    if (map["a"] ){
                        if(  map["a"].length>1)
                            var x=3

                        map["a"].forEach(function (name, index) {
                            var id;
                            if (map["3"])
                                id = map["3"][index]
                            else
                                id = "X_" + idIndex++;

                            var nom = map["a"][index];
                            var nomCommun = {id: id, label: nom}
                            if (map["x"] && map["x"][index])
                                nomCommun.subdivision = map["x"][index]
                            if (map["y"] && map["y"][index])
                                nomCommun.subdivisionGeo = map["y"][index]

                            nomsCommuns.push(nomCommun);
                        })
                    }

                }
                if (key == "607") {
                    var map=getFieldsMap(record[key])
                    if (map["a"] ){
                        map["a"].forEach(function (name, index) {
                            var id;
                            if (map["3"])
                                id = map["3"][index]
                            else
                                id = "X_" + idIndex++;

                            var nom = map["a"][index];
                            var nomGeographique = {id: id, label: nom}
                            if (map["x"] && map["x"][index])
                                nomGeographique.subdivision = map["x"][index]
                            if (map["y"] && map["y"][index])
                                nomGeographique.subdivisionGeo = map["y"][index]

                            nomsGeographiques.push(nomGeographique);
                        })

                    }
                }


                if (key == "995") {
                    var map=getFieldsMap(record[key])
                    if (map["a"] ){
                        record[key].forEach(function (field) {
                            var code = field.code
                            var value = field.value;
                            if (code == "c")
                                bibliotheque = value;
                            if (code == "f")
                                codeBarre = value;
                            if (code == "k")
                                cote = value;


                        })
                    }
                }
                if (key == "700" || key == "701" || key == "702") {
                    var map=getFieldsMap(record[key])
                    if (map["a"] ){
                        map["a"].forEach(function (name, index) {
                            var id;
                            if (map["3"])
                                id = map["3"][index]
                            else
                                id = "X_" + idIndex++;

                            var nom = map["a"][index];
                            if (map["b"] && map["b"][index])
                                nom += " " + map["b"][index]
                            var auteur = {id: id, label: nom}
                            if (map["f"] && map["f"][index])
                                auteur.date = map["f"][index]
                            auteurs.push(auteur);
                        })
                    }
                }
            }

                var notice = {
                    isbn: isbn,
                    titre: titre,
                    auteurs: auteurs,
                    personnes: personnes,
                    nomsCommuns: nomsCommuns,
                    nomsGeographiques: nomsGeographiques,
                    collectivites: collectivites,
                    bibliotheque: bibliotheque,
                    codeBarre: codeBarre,
                    cote: cote,


                }

                notices.push(notice);



        })

        return callback(null, notices)

    },

    getCotesMap: function (filePath) {
        var map = {};
        var str = "" + fs.readFileSync(filePath);
        var lines = str.split("\n")
        lines.forEach(function (line, index) {
            if (index > 0) {
                var cols = line.trim().split("\t")
                var cote = cols[0].replace(" ", "")
                map[cote] = cols[1];
            }
        })
        return map;


    }


}


if (false) {

    var filePath = "D:\\telanthropia\\koha_11-19\\koha (2).mrc"

    var dir = "D:\\telanthropia\\koha_11-19\\";
    var files = fs.readdirSync(dir)
    var data = [];
    async.eachSeries(files, function (file, callbackEach) {
            var filePath = dir + file
           // console.log(file)
            kohaImport.xmlToJson(filePath, function (err, result) {
                data = data.concat(result);
                callbackEach()
            })

        }, function (err) {
            fs.writeFileSync("D:\\telanthropia\\notices.json", JSON.stringify(data, null, 2));

        }
    )
}


var filePath = "D:\\telanthropia\\notices.json";
var json = JSON.parse(fs.readFileSync(filePath));
if (false) {
    kohaImport.extractVedettes(json, function (err, result) {

    })
}
if (false) {
    kohaImport.vedettesToGraph(json, function (err, result) {

    })
}


if (true) {
    var dirPath = "D:\\telanthropia\\koha_PLM__05_20\\";
   // var dirPath = "D:\\telanthropia\\missionsEtrangeres\\"

    var motsClesCotesPath = "D:\\telanthropia\\cotesSujets.txt";

    var cotesMap = kohaImport.getCotesMap(motsClesCotesPath)
    var files = fs.readdirSync(dirPath);
    var allNotices = [];
    files.forEach(function (filePath, fileIndex) {
        filePath = dirPath + filePath;
        kohaImport.xmlToJson(filePath, function (err, result) {

            if (err)
                return console.log(err);

            kohaImport.noticesVedettes(result, function (err, result) {
                if (err)
                    return console.log(err)
                var x = result

                result.forEach(function (item) {
                    var cote = item.cote.split(" ")[0]
                        item.sujet = cotesMap[cote];
                    allNotices.push(item)

                })

                  //  fs.writeFileSync("D:\\telanthropia\\telanthropia_koha_02_20_"+fileIndex+".json", JSON.stringify(allNotices, null, 2))
                fs.writeFileSync(dirPath+"koha_"+fileIndex+".json", JSON.stringify(allNotices, null, 2))


            })


        })


    })


}


