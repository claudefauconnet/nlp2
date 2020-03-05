var fs = require('fs');
const async = require('async');
const request = require('request')
const sax = require("sax");
var DOMParser = require('xmldom').DOMParser;

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



        var children=JSON.parse(""+fs.readFileSync("D:\\NLP\\termScience\\consolidation\\temp\\newIdsOrphans.txt"))

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
                if(broader1Concept.broaders.length>1)
                    var x=3
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
            var xxx =hierarchy;
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

        var domains =
            [


                {
                    "name": "Chemistry",
                    "id": "TE.15428",
                    "children": []
                },

                {
                    "name": "Energy",
                    "id": "TE.29455",
                    "children": []
                },


                {
                    "name": "Spare-time activities",
                    "id": "TE.156452",
                    "children": []
                },
                {
                    "name": "Mathematics",
                    "id": "TE.48512",
                    "children": []
                },

                {
                    "name": "Physics",
                    "id": "TE.60624",
                    "children": []
                },

            ];


        var deepConcepts = [
            "TE.183956",
            "TE.183956",
            "TE.74482",
            "TE.74484",
            "TE.74487",
            "TE.74500",
            "TE.74551",
            "TE.185728",
            "TE.184995",
            "TE.16038",
            "TE.16040",
            "TE.25154",
            "TE.28730",
            "TE.178241",
            "TE.178251",
            "TE.28736",
            "TE.41344",
            "TE.82803",
            "TE.183956",
            "TE.23745",
            "TE.184665",
            "TE.74551",
            "TE.185750",
            "TE.185749",
            "TE.14340",
            "TE.180336",
            "TE.4273",
            "TE.50428",
            "TE.2685",
            "TE.180784",
            "TE.182968",
            "TE.25154",
            "TE.28649",
            "TE.28727",
            "TE.82803",
            "TE.60527",
            "TE.180513",
            "TE.72519",
            "TE.72527",
            "TE.72542",
            "TE.76329",
            "TE.178846",
            "TE.12496",
            "TE.57753",
            "TE.71824",
            "TE.83901",
            "TE.182058",
            "TE.182588",
            "TE.178665",
            "TE.181586",
            "TE.31421",
            "TE.183124",
            "TE.49899",
            "TE.189590",
            "TE.176867",
            "TE.75269",
            "TE.1203",
            "TE.182822",
            "TE.178087",
            "TE.183141",
            "TE.177923",
            "TE.4357",
            "TE.73448",
            "TE.183733",
            "TE.54598",
            "TE.54612",
            "TE.4357",
            "TE.8481",
            "TE.178792",
            "TE.186932",
            "TE.8538",
            "TE.1224",
            "TE.1501",
            "TE.3302",
            "TE.4258",
            "TE.31146",
            "TE.37143",
            "TE.62460",
            "TE.182636",
            "TE.36249",
            "TE.103164",
            "TE.103165",
            "TE.40198",
            "TE.59637",
            "TE.29180",
            "TE.5971",
            "TE.105103",
            "TE.12208",
            "TE.60193",
            "TE.94878",
            "TE.100456",
            "TE.104176",
            "TE.104733",
            "TE.79710",
            "TE.94964",
            "TE.178292",
            "TE.74620",
            "TE.104545",
            "TE.35604",
            "TE.37887",
            "TE.31335",
            "TE.36202",
            "TE.36249",
            "TE.38559",
            "TE.43777",
            "TE.49696",
            "TE.54309",
            "TE.79210",
            "TE.11529",
            "TE.28482",
            "TE.19236",
            "TE.63189",
            "TE.63216",
            "TE.82803",
            "TE.63155",
            "TE.180824",
            "TE.180811",
            "TE.177267",
            "TE.149350",
            "TE.35470",
            "TE.184438",
            "TE.47016",
            "TE.50915",
            "TE.50916",
            "TE.50919",
            "TE.50933",
            "TE.50941",
            "TE.183908",
            "TE.60436",
            "TE.66809",
            "TE.67244",
            "TE.54309",
            "TE.178070",
            "TE.190028",
            "TE.185454",
            "TE.74484",
            "TE.74487",
            "TE.184578",
            "TE.185468"
        ]
        var deepConcepts2 = [
            "TE.16026",
            "TE.187947",
            "TE.188763",
            "TE.198950",
            "TE.183942",
            "TE.187554",
            "TE.187554",
            "TE.180974",
            "TE.180972",
            "TE.186020",
            "TE.188040",
            "TE.188598",
            "TE.12183",
            "TE.12194",
            "TE.40250",
            "TE.47575",
            "TE.106226",
            "TE.105268",
            "TE.73448",
            "TE.73451",
            "TE.182636",
            "TE.4128",
            "TE.94947",
            "TE.94360",
            "TE.94371",
            "TE.60588",
            "TE.177022",
            "TE.178716",
            "TE.94625",
            "TE.94367",
            "TE.179897",
            "TE.60182",
            "TE.188152",
            "TE.188153",
            "TE.76227",
            "TE.94964",
            "TE.178292",
            "TE.74620",
            "TE.104545",
            "TE.54934",
            "TE.32455",
            "TE.189437",
            "TE.3819",
            "TE.61009",
            "TE.54934",
            "TE.32455",
            "TE.189437",
            "TE.179893",
            "TE.3819",
            "TE.61009",
            "TE.32455",
            "TE.189437",
            "TE.183766",
            "TE.186833",
            "TE.45682",
            "TE.177594",
            "TE.189414",
            "TE.182229",
            "TE.184589",
            "TE.184590",
            "TE.181315",
            "TE.180214",
            "TE.184589",
            "TE.182229",
            "TE.45682",
            "TE.177594",
            "TE.189414",
            "TE.178823",
            "TE.1238",
            "TE.176880",
            "TE.1588",
            "TE.179897",
            "TE.187599",
            "TE.11922",
            "TE.1457",
            "TE.178673",
            "TE.181315",
            "TE.1418",
            "TE.178050",
            "TE.185208",
            "TE.180005",
            "TE.181226",
            "TE.181295",
            "TE.2555",
            "TE.15857",
            "TE.54934",
            "TE.56473",
            "TE.60000",
            "TE.3819",
            "TE.179433",
            "TE.60004",
            "TE.61009",
            "TE.2555",
            "TE.15857",
            "TE.54934",
            "TE.56473",
            "TE.60000",
            "TE.15530",
            "TE.31541",
            "TE.15534",
            "TE.178091",
            "TE.184050",
            "TE.43725",
            "TE.48916",
            "TE.3819",
            "TE.179433",
            "TE.60004",
            "TE.61009",
            "TE.178095",
            "TE.50437",
            "TE.177373",
            "TE.50437",
            "TE.181291",
            "TE.187108",
            "TE.187109",
            "TE.31213",
            "TE.183742",
            "TE.133",
            "TE.13104",
            "TE.3568",
            "TE.23",
            "TE.177",
            "TE.77",
            "TE.46810",
            "TE.178497",
            "TE.177670",
            "TE.197832",
            "TE.94964",
            "TE.178292",
            "TE.74620",
            "TE.104545"
        ]
        var deepConcepts3 = [
            "TE.16026",
            "TE.183947",
            "TE.94333",
            "TE.94643",
            "TE.100731",
            "TE.95316",
            "TE.104708",
            "TE.95063",
            "TE.94358",
            "TE.29744",
            "TE.52178",
            "TE.94355",
            "TE.100625",
            "TE.96418",
            "TE.183757",
            "TE.103192",
            "TE.177373",
            "TE.45684",
            "TE.45685",
            "TE.45686",
            "TE.65132",
            "TE.177584",
            "TE.177585",
            "TE.45684",
            "TE.45685",
            "TE.45686",
            "TE.65132",
            "TE.177584",
            "TE.177585",
            "TE.2394",
            "TE.7844",
            "TE.11962",
            "TE.53211",
            "TE.183238",
            "TE.186337",
            "TE.65270",
            "TE.667",
            "TE.2389",
            "TE.55830",
            "TE.1309",
            "TE.15867",
            "TE.526",
            "TE.81536",
            "TE.184597",
            "TE.1301",
            "TE.12296",
            "TE.67",
            "TE.23797",
            "TE.25639",
            "TE.526",
            "TE.182486",
            "TE.182488",
            "TE.60293",
            "TE.21",
            "TE.235",
            "TE.7303",
            "TE.7313",
            "TE.389",
            "TE.22671",
            "TE.182486",
            "TE.60296",
            "TE.199063",
            "TE.337",
            "TE.338",
            "TE.526",
            "TE.21",
            "TE.199077",
            "TE.60320",
            "TE.65235",
            "TE.198918",
            "TE.7312",
            "TE.15902",
            "TE.1301",
            "TE.55830",
            "TE.22670",
            "TE.14",
            "TE.656",
            "TE.37458",
            "TE.14",
            "TE.4309",
            "TE.184519",
            "TE.1872",
            "TE.69034",
            "TE.1983",
            "TE.197895",
            "TE.197896",
            "TE.59041",
            "TE.671",
            "TE.671",
            "TE.617",
            "TE.199089",
            "TE.59050",
            "TE.188143",
            "TE.26253",
            "TE.227",
            "TE.201",
            "TE.188100",
            "TE.188098",
            "TE.188099",
            "TE.188102",
            "TE.188101",
            "TE.82726",
            "TE.6938",
            "TE.22993",
            "TE.39633",
            "TE.56710",
            "TE.6845",
            "TE.1801",
            "TE.13111",
            "TE.60322",
            "TE.1801",
            "TE.13111",
            "TE.60322",
            "TE.15902",
            "TE.7313",
            "TE.38272",
            "TE.38272",
            "TE.183776",
            "TE.183651",
            "TE.198832",
            "TE.183084",
            "TE.189589",
            "TE.115",
            "TE.189068",
            "TE.410",
            "TE.5635",
            "TE.6833",
            "TE.290",
            "TE.13705",
            "TE.46317",
            "TE.687",
            "TE.54589",
            "TE.3337",
            "TE.203504",
            "TE.184309",
            "TE.82892",
            "TE.37371",
            "TE.54600",
            "TE.76258",
            "TE.76260",
            "TE.76260",
            "TE.76262",
            "TE.13709",
            "TE.22580",
            "TE.176552",
            "TE.687",
            "TE.183416",
            "TE.185230",
            "TE.189624",
            "TE.53174",
            "TE.53449",
            "TE.198832",
            "TE.71130",
            "TE.189862",
            "TE.82892",
            "TE.3337",
            "TE.34800",
            "TE.25363",
            "TE.76075",
            "TE.7419",
            "TE.75",
            "TE.695",
            "TE.13366",
            "TE.39670",
            "TE.185245",
            "TE.39670",
            "TE.21428",
            "TE.186005",
            "TE.185627",
            "TE.185625",
            "TE.185628",
            "TE.185612",
            "TE.182923",
            "TE.183099",
            "TE.53430",
            "TE.53434",
            "TE.51",
            "TE.185242",
            "TE.7419",
            "TE.185241",
            "TE.79886",
            "TE.26232",
            "TE.26233",
            "TE.70469",
            "TE.190624",
            "TE.199107",
            "TE.199108",
            "TE.182859",
            "TE.185239",
            "TE.7412",
            "TE.21428",
            "TE.186992",
            "TE.55327",
            "TE.177"
        ]

        var tehcnoConcepts=[
            'TE.8221',
            'TE.184779',
            'TE.77925',
            'TE.87265',
            'TE.185419',
            'TE.28707',
            'TE.184985',
            'TE.70502',
            'TE.184779',
            'TE.77925',
            'TE.78002',
            'TE.80927',
            'TE.83692',
            'TE.217486',

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

             var hierarchy = {name: "technoConcepts", id: rootTermId, children: []}
              async.eachSeries(tehcnoConcepts, function (narrower1, callbackEach1) {

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
if(false)
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


            function getDistinctTokens(key){
              var   tokens = key.split(/[\s-_;.]/g);
              var distinctTokens=[];
                tokens.forEach(function(token){
                    if(distinctTokens.indexOf(token)<0)
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
                    var ctgTokens=getDistinctTokens(ctgKey)

                    if (Array.isArray(ctgTokens)) {
                        for (var TS_Key in TS_Map) {


                           var TS_Tokens=getDistinctTokens(TS_Key)
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

        var existingTSCommon=[


        ]


        var conceptsA = []


        function getTSIds(array){
            var ids=[];
            array.forEach(function (item) {
                if(ids.indexOf(item.TS_.id)<0)
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
        idsA.forEach(function(id){
            if(existingTSCommon.indexOf(id)<0)
               conceptsA.push(id)
        })
var x=conceptsA;

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
    , getNewConceptsFromAll:function(){


    }

    ,processNewConcepts:function(){

        var commonConceptsA = JSON.parse("" + fs.readFileSync("D:\\NLP\\termScience\\consolidation\\commonConcepts_LTS_CTG_all.json"));
        var newConcepts = JSON.parse("" + fs.readFileSync("D:\\NLP\\termScience\\consolidation\\temp\\newConcepts.json"));
        var commonConceptsA = JSON.parse("" + fs.readFileSync("D:\\NLP\\termScience\\consolidation\\commonConcepts_LTS_CTG_all.json"));

     //   var oldConcepts= JSON.parse("" + fs.readFileSync("D:\\NLP\\termScience\\consolidation\\commonConcepts_LTS_CTG_all.json"));
        var newConceptsMap={}
        newConcepts.forEach(function(concept){
            newConceptsMap[concept.id]=concept;
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
        var orphanConcepts=[]
        commonConceptsA.forEach(function(concept,index){

            var conceptX=newConceptsMap[concept.TS_.id]

            if(!conceptX ||  !conceptX.broaders ) {
                orphanConcepts.push(concept.TS_.id)
                return;
            }
            var parents="";
            var parentNames="";

            conceptX.broaders.forEach(function(broader,index2){
                if(index!=0)
                    parents+=","
                parents+=broader.id;
                if(parents==""){
                    orphanConcepts.push(concept)
                }else {
                    var parentName = getPrefLabelEN(broader.prefLabels)
                    if (index != 0)
                        parentNames = "," + parentNames
                    parentNames = parentName + parentNames;
                }


            })

            concept.TS_.parents=parents;
            concept.TS_.parentNames=parentNames;
           // commonConceptsA[index]=concept;

        })

        var x=orphanConcepts;
        var str = "CTG_concept\tCTG_id\tTS__concept\tTS__id\tTS__parents\n";
        commonConceptsA.forEach(function (item) {


                var target = item.ctg
                var targetId = "";
                if (target.pathIds && target.pathIds.length > 0)
                    targetId = target.pathIds[0];
var TS_Item=item.TS_;
            if (TS_Item.parents!="")
             var xx=3

                var str2 = target.prefLabel + "\t" + targetId + "\t" + TS_Item.name + "\t" + TS_Item.id + "\t" + TS_Item.parentNames + "\n"
                if (str.indexOf(str2) < 0)
                    str += str2

            })



        fs.writeFileSync("D:\\NLP\\termScience\\consolidation\\temp\\commonConcepts_TS__CTG.csv", str)


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
if(false){
    crawler_termSciences.buildHierarchyBroaders();
}

if(true){
    crawler_termSciences.processNewConcepts();
}
