var fs = require('fs');
const async = require('async');
const request = require('request')
const sax = require("sax");
var DOMParser = require('xmldom').DOMParser;
var skosReader = require("../../backoffice/skosReader.")

var skosToElastic = require("../skosToElastic.")
var crawler_termSciences = {


    xmlToSkosConcept: function (xmlStr) {
        var xml = new DOMParser().parseFromString(xmlStr, 'text/xml');
        var doc = xml.documentElement;
        var concepts = [];
        var obj = {
            id: "",
            prefLabels: [],
            altLabels: [],
            definitions: [],
            broaders: [],
            relateds: [],
            narrowers: []

        }

        var features = doc.getElementsByTagName("feat");

        for (var i = 0; i < features.length; i++) {
            var feature = features.item(i);
            var type = feature.getAttribute("type");

            if (!feature.childNodes || feature.childNodes.length == 0)
                continue;
            var value = feature.childNodes[0].nodeValue;
            if (!value)
                continue;

            if (type == "conceptIdentifier")
                obj.id = value;

            if (type == "definition")
                obj.definitions.push(value);

            if (type == "broaderConceptGeneric") {
                var target = feature.getAttribute("target")
                //  obj.broaders.push({id: target.substring(1), name: value})
                obj.broaders.push(target.substring(1))

            }
            if (type == "specificConcept") {
                var target = feature.getAttribute("target")
                // obj.narrowers.push({id: target.substring(1), name: value})
                obj.narrowers.push(target.substring(1))

            }


        }


        var structs = doc.getElementsByTagName("struct");
        for (var i = 0; i < structs.length; i++) {
            var struct = structs.item(i);
            var type = struct.getAttribute("type");

            if (type == "languageSection") {
                var lang = ""
                var childrenFeatures = struct.getElementsByTagName("feat");
                for (var j = 0; j < childrenFeatures.length; j++) {

                    var childFeature = childrenFeatures.item(j);
                    if (childFeature.childNodes && childFeature.childNodes.length > 0) {
                        var childValue = childFeature.childNodes[0].nodeValue;
                        var childType = childFeature.getAttribute("type");
                        if (childType == "languageIdentifier") {
                            lang = childValue
                        }
                        if (childType == "term") {
                            if (obj.prefLabels.length == 0 || obj.prefLabels[0].lang != "en")
                                obj.prefLabels.push({lang: lang, value: childValue})
                            else
                                obj.altLabels.push({lang: lang, value: childValue})
                        }
                    }
                }

            }
        }


        return obj
    }


    , queryTermScience: function (conceptId, callback) {

        var url = "http://www.termsciences.fr/-/Fenetre/Fiche/XML/?idt=" + conceptId + "&lng=en"

        var options = {
            method: 'GET',
            url: url,
            headers: {
                'Content-Type': 'text/xml; charset=utf-8',
            }

        };


        function decodeXml(string) {
            var escaped_one_to_xml_special_map = {
                '&amp;': '&',
                '&quot;': '"',
                '&lt;': '<',
                '&gt;': '>'
            };
            return string.replace(/(&quot;|&lt;|&gt;|&amp;)/g,
                function (str, item) {
                    return escaped_one_to_xml_special_map[item];
                });
        }

        request(options, function (error, response, body) {
            if (error)
                return callback(error);
            if (body.error)
                return callback(body.error);


            var p = body.indexOf("<textarea")
            p = body.indexOf(">", p)
            var q = body.indexOf("</textarea")
            var xml = body.substring(p + 1, q)
            xml = decodeXml(xml);
            xml = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n" +
                "<termSienceRoot>\n" +
                xml +
                "</termSienceRoot>\n";
            callback(null, xml)

        })


    },


    buildHierarchyBroaders: function () {


        var children = JSON.parse("" + fs.readFileSync("D:\\NLP\\termScience\\consolidation\\temp\\newIdsOrphans.txt"))

        function getPrefLabelEN(prefLabels) {
            var prefLabelStr = null;
            if (prefLabels == null)
                return "?"
            if (!Array.isArray(prefLabels))
                prefLabels = [prefLabels]
            if (prefLabels.length == 0)
                return "?"
            prefLabels.forEach(function (prefLabel, index) {
                if (prefLabelStr == null && prefLabel.lang == "en")
                    prefLabelStr = prefLabels[index].value
            })
            if (prefLabelStr == null) {

                prefLabelStr = prefLabels[0].value

            }

            return prefLabelStr
        }

        var hierarchy = [];
        async.eachSeries(children, function (child, callbackEach1) {

            /*  var hierarchy = {name: "deepConcepts3", id: rootTermId, children: []}
              async.eachSeries(deepConcepts3, function (narrower1, callbackEach1) {*/


            crawler_termSciences.queryTermScience(child, function (err, result1) {
                if (err)
                    return console.log(err);
                var broader1Concept = crawler_termSciences.xmlToSkosConcept(result1);
                //  var obj1 = {name: getPrefLabelEN(broader1Concept.prefLabels), id: broader1Concept.id, broaders: []}
                var obj1 = {name: getPrefLabelEN(broader1Concept.prefLabels), id: broader1Concept.id, broaders: []}
                hierarchy.push(obj1)
                if (broader1Concept.broaders.length > 1)
                    var x = 3
                //   narrower1Concept.narrowers.forEach(function (narrower2, index2) {
                async.eachSeries(broader1Concept.broaders, function (broaders2, callbackEach2) {

                    crawler_termSciences.queryTermScience(broaders2, function (err, result2) {
                        if (err)
                            return console.log(err);
                        var broader2Concept = crawler_termSciences.xmlToSkosConcept(result2);
                        obj1.broaders.push(broader2Concept)


                        async.eachSeries(broader2Concept.broaders, function (broaders3, callbackEach3) {

                            crawler_termSciences.queryTermScience(broaders3, function (err, result3) {
                                if (err)
                                    return console.log(err);
                                var broader3Concept = crawler_termSciences.xmlToSkosConcept(result3);
                                obj1.broaders.push(broader3Concept)


                                async.eachSeries(broader3Concept.broaders, function (broaders4, callbackEach4) {

                                    crawler_termSciences.queryTermScience(broaders4, function (err, result4) {
                                        if (err)
                                            return console.log(err);
                                        var broader4Concept = crawler_termSciences.xmlToSkosConcept(result4);
                                        obj1.broaders.push(broader4Concept)


                                        async.eachSeries(broader4Concept.broaders, function (broaders5, callbackEach5) {

                                            crawler_termSciences.queryTermScience(broaders5, function (err, result5) {
                                                if (err)
                                                    return console.log(err);
                                                var broader5Concept = crawler_termSciences.xmlToSkosConcept(result5);
                                                obj1.broaders.push(broader5Concept)
                                                callbackEach5();
                                            })
                                        }, function (err) {
                                            callbackEach4()
                                        })

                                    })
                                }, function (err) {
                                    callbackEach3()
                                })

                            })
                        }, function (err) {
                            callbackEach2()
                        })

                    })
                }, function (err) {
                    callbackEach1()
                })

            })

        }, function (err) {
            var xxx = hierarchy;
        })


    },
    buildHierarchy: function () {

        function getPrefLabelEN(prefLabels) {
            var prefLabelStr = null;
            if (prefLabels == null)
                return "?"
            if (!Array.isArray(prefLabels))
                prefLabels = [prefLabels]
            if (prefLabels.length == 0)
                return "?"
            prefLabels.forEach(function (prefLabel, index) {
                if (prefLabelStr == null && prefLabel.lang == "en")
                    prefLabelStr = prefLabels[index].value
            })
            if (prefLabelStr == null) {

                prefLabelStr = prefLabels[0].value

            }

            return prefLabelStr
        }

        var rootTermId = "TE.192836" //domaines techniques
        var filter = ["Mathematics",
            "Physics",
            "Energy",
            "Civil service",
            "Chemistry",
            "Building industry",
            "Industrial Entreprises",
            "Information",
            "Computer science",
            "Spare-time activities"]

        var domains = [
            "TE.177405,Spectrophotometry,Spectrophotometry, Infrared,1",
            "TE.16021,Liquid chromatography,Ion exchange chromatography,1",
            "TE.16026,Liquid chromatography,Gel permeation chromatography,1",
            "TE.16036,Liquid chromatography,Paper chromatography,2",
            "TE.183432,Ultrafiltration,Hemofiltration,1",
            "TE.182772,Luminescent Measurements,Fluorometry,4",
            "TE.177405,Spectrophotometry,Spectrophotometry, Infrared,1",
            "TE.187612,Gels,Hydrogels,1",
            "TE.28730,Electrophoresis,Capillary electrophoresis,2",
            "TE.178241,Electrophoresis,Electrophoresis, Polyacrylamide Gel,2",
            "TE.178251,Electrophoresis,Electrophoresis, Agar Gel,1",
            "TE.28736,Electrophoresis,Paper electrophoresis,2",
            "TE.41344,Electrophoresis,Immunoelectrophoresis,2",
            "TE.183432,Ultrafiltration,Hemofiltration,1",
            "TE.177771,Molecular Conformation,Nucleic Acid Conformation,2",
            "TE.185234,Molecular Conformation,Protein Conformation,4",
            "TE.188763,Aminoacid sequence,Amino Acid Motifs,7",
            "TE.183942,Aminoacid sequence,Immunoglobulin Variable Region,3",
            "TE.176825,Aminoacid sequence,Repetitive Sequences, Amino Acid,1",
            "TE.176984,Aminoacid sequence,Protein Sorting Signals,2",
            "TE.72553,Nucleotide sequence,GC rich sequence,1",
            "TE.177513,Nucleotide sequence,Regulatory Sequences, Nucleic Acid,8",
            "TE.180969,Nucleotide sequence,Repetitive Sequences, Nucleic Acid,3",
            "TE.76227,Sulfuric acid,Sulfates,200",
            "TE.10747,Acids, Noncarboxylic,Boric acid,1",
            "TE.13135,Acids, Noncarboxylic,Carbonic acid,1",
            "TE.15575,Acids, Noncarboxylic,Hydrochloric acid,1",
            "TE.183735,Acids, Noncarboxylic,Hydrofluoric Acid,1",
            "TE.183733,Acids, Noncarboxylic,Hydrogen Cyanide,1",
            "TE.54598,Acids, Noncarboxylic,Nitrous acid,2",
            "TE.54612,Acids, Noncarboxylic,Nitric acid,1",
            "TE.73021,Acids, Noncarboxylic,Silicic acid,1",
            "TE.179760,Acids, Noncarboxylic,Phosphorus Acids,4",
            "TE.177381,Acids, Noncarboxylic,Sulfur Acids,4",
            "TE.40240,Acids, Noncarboxylic,Hydrogen bromide,1",
            "TE.183739,Acids, Noncarboxylic,Hydrogen Sulfide,1",
            "TE.71825,Hyoscine,Scopolamine derivatives,2",
            "TE.178684,Fatty Alcohols,Butanols,3",
            "TE.184453,Fatty Alcohols,Dodecanol,1",
            "TE.180930,Fatty Alcohols,Dolichol,1",
            "TE.178685,Fatty Alcohols,Hexanols,1",
            "TE.178686,Fatty Alcohols,Octanols,1",
            "TE.180664,Amino Alcohols,Ethanolamines,18",
            "TE.54934,Amino Alcohols,Norepinephrine,7",
            "TE.185196,Amino Alcohols,Propanolamines,31",
            "TE.74683,Amino Alcohols,Sphingosin,1",
            "TE.180664,Ethanol,Ethanolamines,18",
            "TE.178510,Glycols,Butylene Glycols,1",
            "TE.178201,Glycols,Ethylene Glycols,4",
            "TE.185193,Glycols,Propylene Glycols,7",
            "TE.74683,Glycols,Sphingosin,1",
            "TE.180705,Sugar Alcohols,Erythritol,1",
            "TE.35851,Sugar Alcohols,Galactitol,2",
            "TE.37326,Sugar Alcohols,Glycerol,2",
            "TE.184049,Sugar Alcohols,Inositol,1",
            "TE.184801,Sugar Alcohols,Mannitol,2",
            "TE.73883,Sugar Alcohols,Sorbitol,2",
            "TE.185196,Propanols,Propanolamines,31",
            "TE.30570,Sterol,Ergocalciferol,2",
            "TE.22130,Hydrogen Cyanide,Cyanides,6",
            "TE.54613,Nitrous acid,Nitrites,2",
            "TE.54583,Nitric acid,Nitrates,11",
            "TE.179282,Quaternary Ammonium Compounds,Betalains,2",
            "TE.178558,Quaternary Ammonium Compounds,Bethanechol Compounds,1",
            "TE.181872,Quaternary Ammonium Compounds,Bretylium Compounds,1",
            "TE.15857,Quaternary Ammonium Compounds,Choline,8",
            "TE.179401,Quaternary Ammonium Compounds,Benzylammonium Compounds,5",
            "TE.177858,Quaternary Ammonium Compounds,Bis-Trimethylammonium Compounds,2",
            "TE.179400,Quaternary Ammonium Compounds,Phenylammonium Compounds,3",
            "TE.179399,Quaternary Ammonium Compounds,Trimethyl Ammonium Compounds,9",
            "TE.180600,Quaternary Ammonium Compounds,Methacholine Compounds,1",
            "TE.189473,Quaternary Ammonium Compounds,Tetraethylammonium Compounds,1",
            "TE.189360,Quaternary Ammonium Compounds,Toxiferine,1",
            "TE.186934,Reactive Nitrogen Species,S-Nitrosothiols,2",
            "TE.181237,Fatty acids,Decanoic Acids,1",
            "TE.180819,Fatty acids,Eicosanoic Acids,1",
            "TE.182586,Fatty acids,Fatty Acids, Unsaturated,13",
            "TE.182587,Fatty acids,Fatty Acids, Volatile,5",
            "TE.183522,Fatty acids,Heptanoic Acids,1",
            "TE.184452,Fatty acids,Lauric Acids,1",
            "TE.180440,Fatty acids,Myristic Acids,2",
            "TE.180098,Fatty acids,Palmitic Acids,2",
            "TE.189619,Fatty acids,Stearic Acids,1",
            "TE.178493,Fatty acids,Caprylates,1",
            "TE.46254,Fatty acids,Lipids,3",
            "TE.182058,Alcohol,Benzyl Alcohols,1",
            "TE.182588,Alcohol,Fatty Alcohols,10",
            "TE.178665,Alcohol,Amino Alcohols,6",
            "TE.181586,Alcohol,Chlorohydrins,4",
            "TE.31421,Alcohol,Ethanol,6",
            "TE.183124,Alcohol,Glycols,4",
            "TE.49899,Alcohol,Methanol,1",
            "TE.189590,Alcohol,Sugar Alcohols,10",
            "TE.176867,Alcohol,Propanols,3",
            "TE.75269,Alcohol,Sterol,3",
            "TE.1428,Aminoacid,Aspartic acid,4",
            "TE.1500,Aminoacid,Glutamic acid,3",
            "TE.6832,Aminoacid,Arginine,7",
            "TE.13360,Aminoacid,Carnitine,2",
            "TE.22508,Aminoacid,Cysteine,5",
            "TE.26451,Aminoacid,Dopa,3",
            "TE.37365,Aminoacid,Glycine,2",
            "TE.49937,Aminoacid,Methionine,5",
            "TE.56707,Aminoacid,Ornithine,1",
            "TE.59968,Aminoacid,Phenylalanine,4",
            "TE.72605,Aminoacid,Serine,5",
            "TE.77737,Aminoacid,Taurine,1",
            "TE.82261,Aminoacid,Tryptophan,1",
            "TE.82700,Aminoacid,Tyrosine,7",
            "TE.83350,Aminoacid,Valine,1",
            "TE.17435,Ester,Cocaine,1",
            "TE.29180,Ester,Enbucrilate,1",
            "TE.64134,Ester,Procaine,1",
            "TE.4178,Carbohydrate,Starch,5",
            "TE.14154,Carbohydrate,Cellulose,7",
            "TE.37173,Carbohydrate,Glucose,1",
            "TE.65238,Polymer,Protein,5",
            "TE.82959,Polymer,Urea,9",
            "TE.3246,aliphatic hydrocarbons,Alkane,9",
            "TE.3263,aliphatic hydrocarbons,Alkene,1",
            "TE.3328,aliphatic hydrocarbons,Alkyne,5",
            "TE.18780,aromatic hydrocarbons,Polycyclic aromatic compound,2",
            "TE.80325,aromatic hydrocarbons,Toluene,12",
            "TE.96418,Apatite,carbonate apatite,1",
            "TE.183757,Apatite,Hydroxyapatites,1",
            "TE.103192,Apatite,hydroxylapatite,1",
            "TE.5971,Calcium phosphate,Apatite,11",
            "TE.25630,Phosphate polymer,Diphosphates,2",
            "TE.36263,Gaseous state,Noble gas,9",
            "TE.4357,Gases,Ammonia,1",
            "TE.13118,Gases,Carbon dioxide,1",
            "TE.36263,Gases,Noble gas,9",
            "TE.183736,Gases,Hydrogen,3",
            "TE.8538,Gases,Nitrogen oxide,3",
            "TE.57341,Gases,Oxygen,1",
            "TE.183739,Gases,Hydrogen Sulfide,1",
            "TE.180300,Isotopes,Nitrogen Isotopes,1",
            "TE.181826,Isotopes,Calcium Isotopes,1",
            "TE.181784,Isotopes,Carbon Isotopes,1",
            "TE.181636,Isotopes,Cerium Isotopes,1",
            "TE.181650,Isotopes,Cesium Isotopes,1",
            "TE.181558,Isotopes,Chromium Isotopes,1",
            "TE.181499,Isotopes,Cobalt Isotopes,1",
            "TE.24539,Isotopes,Deuterium,1",
            "TE.184208,Isotopes,Iron Isotopes,1",
            "TE.182932,Isotopes,Gallium Isotopes,1",
            "TE.184164,Isotopes,Iodine Isotopes,1",
            "TE.103659,Isotopes,stable isotopes,55",
            "TE.180624,Isotopes,Mercury Isotopes,1",
            "TE.183153,Isotopes,Gold Isotopes,1",
            "TE.180110,Isotopes,Oxygen Isotopes,1",
            "TE.179901,Isotopes,Phosphorus Isotopes,1",
            "TE.177599,Isotopes,Potassium Isotopes,1",
            "TE.66857,Isotopes,Radioisotope,76",
            "TE.178244,Isotopes,Radioisotopes,37",
            "TE.189709,Isotopes,Sodium Isotopes,1",
            "TE.177379,Isotopes,Sulfur Isotopes,1",
            "TE.189613,Isotopes,Strontium Isotopes,1",
            "TE.189104,Isotopes,Xenon Isotopes,1",
            "TE.189559,Isotopes,Yttrium Isotopes,1",
            "TE.189563,Isotopes,Zinc Isotopes,1",
            "TE.63190,Evoked potential,Auditory evoked potential,2",
            "TE.63155,Membrane potential,Action potential,1",
            "TE.183432,Ultrafiltration,Hemofiltration,1",
            "TE.150030,Ge nord-ouest (L.),Kayap ň (L.),1",
            "TE.50930,Electron microscopy,Transmission electron microscopy,2",
            "TE.185475,Image Enhancement,Radiographic Image Enhancement,4",
            "TE.80361,Image Enhancement,Emission tomography,2",
            "TE.173883,Radioactivity,Radio élément,4",
            "TE.56024,Non ionizing radiation,Electromagnetic wave,1",
            "TE.181940,Radiation Monitoring,Body Burden,2",
            "TE.184438,Light,Lasers,5",
            "TE.47016,Light,Luminescence,1"
        ]

        /*   var rootTermId="TE.77922"
           var hierarchy = {name: "conceptsTechnology", id: rootTermId, children: []}
            crawler_termSciences.queryTermScience(rootTermId, function (err, result) {
                if (err)
                    return console.log(err);
           var rootTermConcept = crawler_termSciences.xmlToSkosConcept(result);

                   async.eachSeries( rootTermConcept.narrowers,function(narrower1, callbackEach1){*/

        /*    var hierarchy = {name: "domaines techniques", id: rootTermId, children: []}
            async.eachSeries(domains, function (narrower1, callbackEach1) {*/

        var hierarchy = {name: "TSterms", id: rootTermId, children: []}
        async.eachSeries(domains, function (domain, callbackEach1) {
            var narrower1 = domain.split(",")[0]
            //  var hierarchy = {name: "conceptsTechnology", id: rootTermId, children: []}
            crawler_termSciences.queryTermScience(narrower1, function (err, result1) {
                if (err)
                    return console.log(err);
                var narrower1Concept = crawler_termSciences.xmlToSkosConcept(result1);
                var obj1 = {name: getPrefLabelEN(narrower1Concept.prefLabels), id: narrower1Concept.id, children: []}
                hierarchy.children.push(obj1);
                console.log(obj1.name, obj1.id);
                if (obj1.name == "Radio")
                    var ww = 1
                //return callbackEach1();

                //   narrower1Concept.narrowers.forEach(function (narrower2, index2) {
                async.eachSeries(narrower1Concept.narrowers, function (narrower2, callbackEach2) {


                    if (false && filter.indexOf(obj1.name) != 0) {
                        return callbackEach2()
                    } else {
                        crawler_termSciences.queryTermScience(narrower2, function (err, result2) {
                            if (err)
                                return console.log(err);
                            var narrower2Concept = crawler_termSciences.xmlToSkosConcept(result2);
                            var obj2 = {name: getPrefLabelEN(narrower2Concept.prefLabels), id: narrower2Concept.id, children: []}
                            console.log(obj1.name + " : " + obj2.name);
                            obj1.children.push(obj2);
                            if (false)
                                return callbackEach2();
                            //  narrower2Concept.narrowers.forEach(function (narrower3, index3) {
                            async.eachSeries(narrower2Concept.narrowers, function (narrower3, callbackEach3) {

                                crawler_termSciences.queryTermScience(narrower3, function (err, result3) {
                                    if (err)
                                        return console.log(err);
                                    var narrower3Concept = crawler_termSciences.xmlToSkosConcept(result3);
                                    var obj3 = {name: getPrefLabelEN(narrower3Concept.prefLabels), id: narrower3Concept.id, children: []}
                                    obj2.children.push(obj3);

                                    if (narrower3Concept.narrowers.length == 0)
                                        return callbackEach3();
                                    async.eachSeries(narrower3Concept.narrowers, function (narrower4, callbackEach4) {

                                        crawler_termSciences.queryTermScience(narrower4, function (err, result4) {
                                            if (err)
                                                return console.log(err);
                                            var narrower4Concept = crawler_termSciences.xmlToSkosConcept(result4);
                                            var obj4 = {name: getPrefLabelEN(narrower4Concept.prefLabels), id: narrower4Concept.id, children: narrower4Concept.narrowers.length}
                                            obj3.children.push(obj4);
                                            callbackEach4();
                                        })
                                    }, function (err) {

                                        callbackEach3();


                                    })
                                })

                            }, function (err) {
                                callbackEach2();
                            })

                        })
                    }


                }, function (err) {
                    callbackEach1();
                })

            })

        }, function (err) {
            var xx = hierarchy
        })

        //    })


    },


    getTermScienceMap: function (key) {
        // set TS_ map
        var keyIndex = 0;
        if (key == "id")
            keyIndex = 1;
        else if (key == "name")
            keyIndex = 0;

        var TS_raw = "" + fs.readFileSync("D:\\NLP\\termScience\\consolidation\\termSciences_raw.txt");
        //  var TS_raw = "" + fs.readFileSync("D:\\NLP\\termScience\\consolidation\\termSciences_technology_raw.txt");
        var termScienceMap = {}
        var lines = TS_raw.split("\n");
        lines.forEach(function (line, index) {
            if (index == 0)
                return;
            var cols = line.split("\t");
            var keyValue = cols[keyIndex];
            if (key == "name") {
                keyValue = keyValue.toLowerCase().trim();


                if (!termScienceMap[keyValue])
                    termScienceMap[keyValue] = [];
                termScienceMap[keyValue].push({id: cols[1], name: cols[0], parents: cols[2]})
            } else if (!termScienceMap[keyValue])
                termScienceMap[keyValue] = {id: cols[1], name: cols[0], parents: cols[2]}
        })

        return termScienceMap;

    },

    getAllTermScienceMap: function () {
        var TS_allterms = JSON.parse("" + fs.readFileSync("D:\\NLP\\termScience\\consolidation\\allterms.alphabetic_no_n.csv"));
        var map = {};
        TS_allterms.forEach(function (term) {

            map[term.name.toLowerCase()] = term;
        })
        return map;
    },


    setCommonConcepts_TS_CTG: function () {

        function isSame(a, b) {
            if (a.length > 3 && b.length > 3 && Math.abs(a.length - b.length) < 2 && isNaN(a) && isNaN(b)) {
                if (a.indexOf(b) > -1 || b.indexOf(a) > -1)
                    return true;
            }
            return false;
        }


        var skosReader = require("../../backoffice/skosReader.")
        skosReader.rdfToFlat("D:\\NLP\\thesaurusCTG-02-20.rdf", {}, function (err, ctgArray) {
            var ctgMap = {};
            ctgArray.forEach(function (concept) {

                ctgMap[concept.prefLabel.toLowerCase()] = concept
            })

            // var TS_Map = crawler_termSciences.getTermScienceMap("name");
            var TS_Map = crawler_termSciences.getAllTermScienceMap("name");


            function getDistinctTokens(key) {
                var tokens = key.split(/[\s-_;.]/g);
                var distinctTokens = [];
                tokens.forEach(function (token) {
                    if (distinctTokens.indexOf(token) < 0)
                        distinctTokens.push(token)
                })
                return distinctTokens;
            }


            var ctgCount = 0
            var commonConcepts = [];
            for (var ctgKey in ctgMap) {
                if (true || ctgKey == "defoliant") {
                    ctgCount += 1
                    ctgCount += 1
                    var ctgTokens = getDistinctTokens(ctgKey)

                    if (Array.isArray(ctgTokens)) {
                        for (var TS_Key in TS_Map) {


                            var TS_Tokens = getDistinctTokens(TS_Key)
                            if (ctgTokens.length == TS_Tokens.length) {
                                if (ctgTokens.length == 1 && TS_Tokens.length == 1) {
                                    if (isSame(ctgKey, TS_Key)) {

                                        commonConcepts.push({ctg: ctgMap[ctgKey], TS_: TS_Map[TS_Key]})

                                    }
                                } else {//composé
                                    if (Array.isArray(TS_Tokens)) {
                                        var nSame = 0;
                                        ctgTokens.forEach(function (ctgToken) {
                                            TS_Tokens.forEach(function (TS_Token) {
                                                if (isSame(ctgToken, TS_Token)) {
                                                    nSame += 1
                                                }
                                            })

                                        })
                                        if (nSame > 1 && (Math.abs(ctgTokens.length - TS_Tokens.length)) < 2)
                                            commonConcepts.push({ctg: ctgMap[ctgKey], TS_: TS_Map[TS_Key]})
                                    }
                                }
                            }

                        }
                    }
                    if (ctgCount % 10 == 0)
                        console.log(ctgCount + " / " + commonConcepts.length)
                }
            }

            var xx = commonConcepts;
            fs.writeFileSync("D:\\NLP\\termScience\\consolidation\\commonConcepts_LTS_CTG_all.json", JSON.stringify(commonConcepts, null, 2))
            //    fs.writeFileSync("D:\\NLP\\termScience\\consolidation\\commonConcepts_LTS_CTG_technology.json", JSON.stringify(commonConcepts, null, 2))
            //    fs.writeFileSync("D:\\NLP\\termScience\\consolidation\\commonConcepts_LTS_CTG.json", JSON.stringify(commonConcepts, null, 2))
        })


    },
    writeCommonConcepts_CSV: function (TS_Map) {

        var commonConcepts = JSON.parse("" + fs.readFileSync("D:\\NLP\\termScience\\consolidation\\commonConcepts_LTS_CTG.json"));

        // var  commonConcepts = JSON.parse("" + fs.readFileSync("D:\\NLP\\termScience\\consolidation\\commonConcepts_LTS_CTG_technology.json"));

        function setIdsValues(TS_Map) {
            for (var key in TS_Map) {
                var item = TS_Map[key]
                item.parentNames = "";
                item.childrenNames = ""
                if (item.parents) {
                    var parentGroupIds = item.parents.split(",");
                    parentGroupIds.forEach(function (parentGroupId) {
                        var groupNames = ""
                        var parentSubgroupIds = parentGroupId.split(";")
                        parentSubgroupIds.forEach(function (parentId) {
                            if (!TS_Map[parentId])
                                return;
                            if (groupNames != "")
                                groupNames += ","
                            groupNames += TS_Map[parentId].name;
                        })
                        if (item.parentNames != "")
                            item.parentNames += ","
                        item.parentNames += groupNames;
                    })
                }
                if (item.children) {
                    var childrenIds = item.children.split(",");
                    childrenIds.forEach(function (childrenId) {
                        if (!TS_Map[childrenId])
                            return;
                        if (item.childrenNames != "")
                            item.childrenNames += ","
                        item.childrenNames += TS_Map[childrenId].name;
                    })
                }
                TS_Map[key] = item;
            }
            return TS_Map;
        }

        function printTS_Map(TS_Map) {
            var str = "CTG_concept\tCTG_id\tTS__concept\tTS__id\tTS__parents\n";
            commonConcepts.forEach(function (item) {
                item.TS_.forEach(function (TS_Item_) {
                    var TS_Id = TS_Item_.id;
                    if (TS_Id == "sh85084167")
                        var vv = 3
                    var TS_Item = TS_Map[TS_Id];
                    if (!TS_Item)
                        return;

                    var target = item.ctg
                    var targetId = "";
                    if (target.pathIds && target.pathIds.length > 0)
                        targetId = target.pathIds[0];


                    var str2 = target.prefLabel + "\t" + targetId + "\t" + TS_Item.name + "\t" + TS_Item.id + "\t" + TS_Item.parentNames + "\n"
                    if (str.indexOf(str2) < 0)
                        str += str2

                })


            })
            fs.writeFileSync("D:\\NLP\\termScience\\consolidation\\commonConcepts_TS__CTG.csv", str)

        }


        var TS_Map = crawler_termSciences.getTermScienceMap("id");
        //  console.log(JSON.stringify(TS_Map["sh85136954"]))

        TS_Map = setIdsValues(TS_Map);
        //console.log(JSON.stringify(TS_Map["sh85136954"]))
        printTS_Map(TS_Map)


        return;


    }
    ,

    getConceptsCsv: function () {
        var tree = JSON.parse("" + fs.readFileSync("D:\\NLP\\termScience\\consolidation\\termSciencesHierarchy_levels.txt"))

        var tree = JSON.parse("" + fs.readFileSync("D:\\NLP\\termScience\\consolidation\\termSciencesHierarchy_technology.txt"))
        var concepts = [];

        function recurseChildren(node, parentIds) {
            parentIds += "," + node.id;
            var obj = {name: node.name, id: node.id, parents: parentIds}
            concepts.push(obj)
            if (node.children && Array.isArray(node.children)) {
                node.children.forEach(function (child) {
                    recurseChildren(child, parentIds)
                })
            }


        }

        recurseChildren(tree, "")
        var x = concepts;
        var strOut = 'name\tid\tparents\n';
        concepts.forEach(function (concept) {
            strOut += concept.name + "\t" + concept.id + "\t" + concept.parents + "\n"
        });

        //   fs.writeFileSync("D:\\NLP\\termScience\\consolidation\\termSciences_raw.txt", strOut)
        fs.writeFileSync("D:\\NLP\\termScience\\consolidation\\termSciences_technology_raw.txt", strOut)


    },
    getDeepConcepts: function () {

        var tree4 = JSON.parse("" + fs.readFileSync("D:\\NLP\\termScience\\consolidation\\termSciencesHierarchy_levels4.txt"))
        var tree8 = JSON.parse("" + fs.readFileSync("D:\\NLP\\termScience\\consolidation\\termSciencesHierarchy_levels8.txt"))
        var tree12 = JSON.parse("" + fs.readFileSync("D:\\NLP\\termScience\\consolidation\\termSciencesHierarchy_levels12.txt"))


        var leafConcepts = [];

        function setNewDescendants(node, descendantsTree) {
            var descendants = null;
            descendantsTree.children.forEach(function (child) {
                if (node.id == child.id) {
                    descendants = child.children
                }
            })
            return descendants;

        }

        function recurseChildren(node, descendantsTree) {
            if (!node.children)
                return;
            if (!Array.isArray(node.children) && node.children > 0)
            //leafConcepts.push(node.id)
                node.children = setNewDescendants(node, descendantsTree)
            else
                node.children.forEach(function (child) {
                    recurseChildren(child, descendantsTree)
                })
        }

        recurseChildren(tree8, tree12)
        recurseChildren(tree4, tree8)

        var xx = tree4;
    }

    ,
    compareAll: function () {
        var commonConceptsA = JSON.parse("" + fs.readFileSync("D:\\NLP\\termScience\\consolidation\\commonConcepts_LTS_CTG_all.json"));
        // var commonConceptsA = JSON.parse("" + fs.readFileSync("D:\\NLP\\termScience\\consolidation\\commonConcepts_TS__CTGalphabetic.csv"));

        var existingTSCommon = []


        var conceptsA = []


        function getTSIds(array) {
            var ids = [];
            array.forEach(function (item) {
                if (ids.indexOf(item.TS_.id) < 0)
                    ids.push(item.TS_.id)
            })
            return ids

        }


        function getCtgIds(array) {
            var ids = [];
            array.forEach(function (item) {
                item.ctg.pathIds.forEach(function (pathId) {
                    ids.push(pathId);
                    console.log(item.TS_.name + "\t" + item.TS_.id + '\t' + pathId)
                })


            })
            return ids;
        }


        // var idsH = getCtgIds(commonConceptsH)
        //  var idsA = getCtgIds(commonConceptsA)
        var idsA = getTSIds(commonConceptsA)

        var conceptsA = []
        idsA.forEach(function (id) {
            if (existingTSCommon.indexOf(id) < 0)
                conceptsA.push(id)
        })
        var x = conceptsA;

        var nonCommonA = [];
        idsA.forEach(function (id) {
            if (idsH.indexOf(id) < 0)
                nonCommonA.push(id)
        })

        var nonCommonH = [];
        idsH.forEach(function (id) {
            if (idsA.indexOf(id) < 0)
                nonCommonH.push(id)
        })


    }
    , getNewConceptsFromAll: function () {


    }

    , processNewConcepts: function () {

        var commonConceptsA = JSON.parse("" + fs.readFileSync("D:\\NLP\\termScience\\consolidation\\commonConcepts_LTS_CTG_all.json"));
        var newConcepts = JSON.parse("" + fs.readFileSync("D:\\NLP\\termScience\\consolidation\\temp\\newConcepts.json"));
        var commonConceptsA = JSON.parse("" + fs.readFileSync("D:\\NLP\\termScience\\consolidation\\commonConcepts_LTS_CTG_all.json"));

        //   var oldConcepts= JSON.parse("" + fs.readFileSync("D:\\NLP\\termScience\\consolidation\\commonConcepts_LTS_CTG_all.json"));
        var newConceptsMap = {}
        newConcepts.forEach(function (concept) {
            newConceptsMap[concept.id] = concept;
        })


        function getPrefLabelEN(prefLabels) {
            var prefLabelStr = null;
            if (prefLabels == null)
                return "?"
            if (!Array.isArray(prefLabels))
                prefLabels = [prefLabels]
            if (prefLabels.length == 0)
                return "?"
            prefLabels.forEach(function (prefLabel, index) {
                if (prefLabelStr == null && prefLabel.lang == "en")
                    prefLabelStr = prefLabels[index].value
            })
            if (prefLabelStr == null) {

                prefLabelStr = prefLabels[0].value

            }

            return prefLabelStr
        }

        var orphanConcepts = []
        commonConceptsA.forEach(function (concept, index) {

            var conceptX = newConceptsMap[concept.TS_.id]

            if (!conceptX || !conceptX.broaders) {
                orphanConcepts.push(concept.TS_.id)
                return;
            }
            var parents = "";
            var parentNames = "";

            conceptX.broaders.forEach(function (broader, index2) {
                if (index != 0)
                    parents += ","
                parents += broader.id;
                if (parents == "") {
                    orphanConcepts.push(concept)
                } else {
                    var parentName = getPrefLabelEN(broader.prefLabels)
                    if (index != 0)
                        parentNames = "," + parentNames
                    parentNames = parentName + parentNames;
                }


            })

            concept.TS_.parents = parents;
            concept.TS_.parentNames = parentNames;
            // commonConceptsA[index]=concept;

        })

        var x = orphanConcepts;
        var str = "CTG_concept\tCTG_id\tTS__concept\tTS__id\tTS__parents\n";
        commonConceptsA.forEach(function (item) {


            var target = item.ctg
            var targetId = "";
            if (target.pathIds && target.pathIds.length > 0)
                targetId = target.pathIds[0];
            var TS_Item = item.TS_;
            if (TS_Item.parents != "")
                var xx = 3

            var str2 = target.prefLabel + "\t" + targetId + "\t" + TS_Item.name + "\t" + TS_Item.id + "\t" + TS_Item.parentNames + "\n"
            if (str.indexOf(str2) < 0)
                str += str2

        })


        fs.writeFileSync("D:\\NLP\\termScience\\consolidation\\temp\\commonConcepts_TS__CTG.csv", str)


    }
    , listHierarchy: function () {
        var filter = [
            "Chemistry,Biochemistry,16",
            "Chemistry,Chemistry, Agricultural,1",
            "Chemistry,Analytical chemistry,35",
            "Chemistry,Inorganic chemistry,1",
            "Chemistry,Organic chemistry,14",
            "Chemistry,Chemistry, Pharmaceutical,2",
            "Chemistry,Physical chemistry,38",
            "Chemistry,Chemical compound,42",
            "Chemistry,Chemical element,30",
            "Chemistry,Chemical reaction,1",
            "Chemistry,Chemical structure,2",
            "Energy,Nuclear energy,2",
            "Mathematics,Mathematical Computing,2",
            "Physics,Acoustics,3",
            "Physics,Biophysics,8",
            "Physics,Displacement,5",
            "Physics,Hardness,1",
            "Physics,Electricity,7",
            "Physics,Energy,9",
            "Physics,Gravitation,1",
            "Physics,Magnetics,1",
            "Physics,Matter,9",
            "Physics,Mechanics,13",
            "Physics,Mesure physique,1",
            "Physics,Optics,9",
            "Physics,Ph énomène physique,16",
            "Physics,Nuclear physics,11",
            "Physics,Porosity,1",
            "Physics,Pressure,5",
            "Physics,Radiation,6",
            "Physics,Rheology,4",
            "Physics,Temperature,6",
            "Physics,Thermodynamics,3",


        ]
        var terms = JSON.parse("" + fs.readFileSync("D:\\NLP\\termScience\\consolidation\\termSciencesHierarchy_levels.txt"))
        var terms2 = JSON.parse("" + fs.readFileSync("D:\\NLP\\termScience\\consolidation\\termSciencesHierarchy_technology.txt"))
        terms.children = terms.children.concat(terms2.children)
        var terms = JSON.parse("" + fs.readFileSync("D:\\NLP\\termScience\\consolidation\\temp2\\conceptsLevel4.json"));


        var array = [];
        terms.children.forEach(function (term) {
            term.children.forEach(function (child) {
                var ok = true


                /*   filter.forEach(function(item){
                       if(item.indexOf(child.name)>-1)
                           ok=true
                   })*/
                if (!ok)
                    return;
                if (child.children.length > 0) {
                    array.push(child.id + "," + term.name + "," + child.name + "," + child.children.length)
                    console.log(child.id + "," + term.name + "," + child.name + "," + child.children.length)
                }


            })

        })
        var x = array


    }
    , TS_ToFlat: function (options) {

        function setMap() {
            var map = {};

            for (var i = 1; i < 5; i++) {
                var terms = JSON.parse("" + fs.readFileSync("D:\\NLP\\termScience\\consolidation\\temp2\\conceptsLevel" + i + ".json"));
                var terms2 = JSON.parse("" + fs.readFileSync("D:\\NLP\\termScience\\consolidation\\temp2\\conceptsLevel" + (i + 1) + ".json"));
                terms.children.forEach(function (term, indexTerm) {
                    if (i == 1)
                        map[term.id] = term;

                    terms2.children.forEach(function (term2) {
                        if (term2.id == term.id)
                            terms.children[indexTerm] = term2
                    })
                })

                //  console.log(Object.keys(map).length)
            }
            return map;
        }


        var rootMap = setMap();
        var allMap = {};
        //  var x = Object.keys(map).length

        var uniqueChildren = []

        function recurseSetParents(node) {

            if (!node)
                return;

            allMap[node.id] = node;
            if (!Array.isArray(node.children))
                return;
            node.children.forEach(function (child2) {

                if (uniqueChildren.indexOf(child2.id) < 0) {
                    uniqueChildren.push(child2.id);
                    if (child2.id != node.id) {
                        if (child2.parents)
                            var x = 3
                        if (node.parents.length == 0)
                            child2.parents = [node.id]
                        else
                            child2.parents = JSON.parse(JSON.stringify(node.parents))

                        child2.parents.push(child2.id);
                        recurseSetParents(child2);
                    } else {
                        var x = 3
                    }
                }
            })


        }

        for (var key in rootMap) {
            rootMap[key].parents = [];

            recurseSetParents(rootMap[key])
        }


        var jsonArray = [];

        function recurseSetArray(node) {
            var parentNames = [];
            if (!node.parents || !node.parents.forEach)
                return;
            node.parents.forEach(function (parent) {
                var item = allMap[parent];
                if (item)
                    parentNames.push(item.name)

            })
            jsonArray.push({id: node.id, name: node.name, parents: node.parents, parentNames: parentNames})
            if (!Array.isArray(node.children))
                return;
            node.children.forEach(function (child) {
                recurseSetArray(child)
            })
        }


        for (var key in rootMap) {
            recurseSetArray(rootMap[key])
        }

        var x = jsonArray


        var flatArray = [];
        var skosEditorArray = [];


        // creat flat json
        jsonArray.forEach(function (item) {
            var parentsStr = ""
            item.parents.forEach(function (parent, index) {
                if (index > 0)
                    parentsStr += ","
                parentsStr += parent
            })
            var parentNamesStr = ""
            item.parentNames.forEach(function (parent, index) {
                if (index > 0)
                    parentNamesStr += ","
                parentNamesStr += parent
            })
            flatArray.push({id: item.id, ancestorsIds: parentsStr, ancestors: parentNamesStr, prefLabels: item.name, altLabels: ""})
        })
        fs.writeFileSync("D:\\NLP\\termScience\\consolidation\\temp2\\TS_flat.json", JSON.stringify(flatArray, null, 2))


        // create skos
        var skosEditorArray = []
        jsonArray.forEach(function (item) {
            var broaders = [];
            if (item.parents.length > 1)
                broaders = [item.parents[item.parents.length - 2]]
            var concept = {
                id: item.id,
                prefLabels: [{lang: "en", value: item.name}],
                altLabels: [],
                broaders: broaders,
                relateds: [],
                definitions: [],
                notes: []
            }

            skosEditorArray.push(concept)

        })

        skosReader.skosEditorToRdf("D:\\NLP\\termScience\\consolidation\\temp2\\termScience.rdf", skosEditorArray)


        return;

        function recurseAncestors(nodeId, ancestorsIdsStr, level) {
            var node = locMap[nodeId];
            if (!node)
                return ancestorsIdsStr;

            if (ancestorsIdsStr != "")
                ancestorsIdsStr = "," + ancestorsIdsStr
            ancestorsIdsStr = node.id + ancestorsIdsStr;


            if (node.parents) {
                var parentsArray = node.parents.split(",")
                parentsArray.forEach(function (parent, indexParent) {
                    if (indexParent > 0)
                        return; //  ancestorsIdsStr = "|" + ancestorsIdsStr
                    ancestorsIdsStr = recurseAncestors(parent, ancestorsIdsStr, level + 1)


                })
            } else {
                return ancestorsIdsStr;
            }
            return ancestorsIdsStr;
        }


        var jsonArray = [];
        var str = "";

        var uniqueTopConcepts = []
        for (var key in map) {
            var item = map[key]
            var ancestorsIdStr = recurseAncestors(item.id, "", 0);

            var ancestorsNames = "";
            ancestorsIdStr.split("|").forEach(function (ancestorGroupId, groupIndex) {
                if (groupIndex > 0)
                    var x = 5;// ancestorsNames += "|"
                ancestorGroupId.split(",").forEach(function (ancestorId, ancestorIndex) {
                    if (ancestorIndex > 0)
                        ancestorsNames += ","
                    var ancestor = locMap[ancestorId];
                    if (ancestor) {

                        /*  if(uniqueTopConcepts.indexOf(ancestor.name)<0 )
                              uniqueTopConcepts.push(ancestor.name)*/
                        ancestorsNames += ancestor.name;
                    } else {
                        ancestorsNames += "?"
                    }

                })
                if (options.output == 'json') {
                    jsonArray.push({id: item.id, ancestorsIds: ancestorsIdStr, ancestors: ancestorsNames, prefLabels: item.name, altLabels: ""})
                } else {
                    str += item.id;
                    if (options.withAncestors) {
                        str += "\t" + ancestorsIdStr + "\t" + ancestorsNames
                    }
                    str += "\t" + item.name + "\t" + "" + "\n"
                }

            })


        }

        var xxx = uniqueTopConcepts.length
        if (options.output == 'json') {
            return jsonArray;
        } else
            return str
    },

    TStoElastic: function () {
        var json = JSON.parse("" + fs.readFileSync("D:\\NLP\\termScience\\consolidation\\temp2\\TS_flat.json"))

        var all = [];
        var fetch = []
        var count = 0;
        json.forEach(function (item) {
            item.thesaurus = "TS"
            fetch.push(item)
            if (fetch.length > 1000) {
                all.push(fetch)
                fetch = [];
            }
        })
        all.push(fetch)


        async.eachSeries(all, function (json, callbackSeries) {
                var x = json
                skosToElastic.flatToElastic(json, count, function (err, result) {
                    if (err)
                        console.log(err)
                    count += result
                    console.log(count)
                    var x = err;
                    callbackSeries()
                })
            }


            , function (err) {
                if (err)
                    console.log(err);
                console.log("done" + count)
            })

    }


}
module.exports = crawler_termSciences;

if (false) {
    crawler_termSciences.buildHierarchy()
}
if (false) {
    crawler_termSciences.setCommonConcepts_TS_CTG()
}
if (false) {
    crawler_termSciences.writeCommonConcepts_CSV();
}

if (false) {
    crawler_termSciences.getDeepConcepts()

}
if (false) {
    crawler_termSciences.getConceptsCsv()
}

if (false) {
    crawler_termSciences.compareAll()
}
if (false) {
    crawler_termSciences.buildHierarchyBroaders();
}

if (false) {
    crawler_termSciences.processNewConcepts();
}

if (false) {
    crawler_termSciences.listHierarchy()

}

if (false) {
    crawler_termSciences.TS_ToFlat()

}

if(true){
    crawler_termSciences.TStoElastic();
}
