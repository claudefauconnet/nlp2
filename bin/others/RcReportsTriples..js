var fs = require('fs');
var async = require('async')
var RcReportsTriples = {
    csvToJson: function (filePath, sep) {
        if (!sep)
            sep = "\t";
        var str = "" + fs.readFileSync(filePath);
       //str = str.replace(/[\u{0080}-\u{FFFF}]/gu, "");//charactrese vides
        var lines = str.split("\n");
        var objs = [];
        var cols = [];

        lines[0].trim().split(sep).forEach(function (cell) {
            cols.push(cell)
        })

        lines.forEach(function (line, lineIndex) {
            if(line.indexOf("é")>-1)
                line= line.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            var cells = line.trim().split(sep);
            var obj = {}
            cells.forEach(function (cell, index) {
                if (lineIndex == 0)
                    cols.push(cell)
                else {
                    obj[cols[index]] = cell;
                }
            })
            objs.push(obj)
        })
        return objs;
    }

    ,

    formatString: function (str, forUri) {
        if (!str || !str.replace)
            return null;


        str = str.replace(/"/gm, "\\\"")
        str = str.replace(/;/gm, " ")
        str = str.replace(/\n/gm, "\\\\n")
        str = str.replace(/\r/gm, "")
        str = str.replace(/\t/gm, " ")
        str = str.replace(/\(/gm, "-")
        str = str.replace(/\)/gm, "-")
        str = str.replace(/\\xa0/gm, " ")
        str = str.replace(/'/gm, "\\\'")
        if (forUri)
            str = str.replace(/ /gm, "_")


        return str;
    },

    csvToTriples: function (filePath) {
        var json = RcReportsTriples.csvToJson(filePath, ",");
        var graphUri = "http://data.total.com/resource/reportsRC/"
        var strConcepts = ""
        var strCorpus=""


      strCorpus += "<" + graphUri + "SAP_report" + "> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://www.w3.org/2004/02/skos/core#ConceptScheme>.\n";
        strCorpus += "<http://data.total.com/resource/reportsRC/Report>  <http://www.w3.org/2004/02/skos/core#topConceptOf> <http://data.total.com/resource/reportsRC/corpus/>.\n";
      strCorpus += "<" + graphUri + "SAP_report" + ">  <http://www.w3.org/2004/02/skos/core#prefLabel> 'SAP_report'@en .\n";
        strCorpus += "<" + graphUri + "Report" + ">  <http://www.w3.org/2004/02/skos/core#broader> <" + graphUri + "SAP_report" + "> .\n";
        strCorpus += "<" + graphUri + "Report" + ">  <http://www.w3.org/2004/02/skos/core#prefLabel> 'Report'@en .\n";

        var map = {

            "concept": ["concept_Niv1", "concept_Niv2", "concept_Niv3", "concept_Niv4", "concept_Niv5", "concept_Niv6"],
            "equipment": ["equipment_manufactuter", "equipment_modelNumber", "equipment_id"]

        }
        var types = [];

        //A	report_id	location_id	equipment_id	E	F	concept_Niv1	concept_Niv2	concept_Niv3	concept_Niv4	concept_Niv5	concept_Niv6		location_site	O	P	equipment_manufactuter	equipment_modelNumber	equipment_3_label	location_plant_section	location_plant unit

        json.forEach(function (item, index) {

            if (!item.report_id)
                return;

            var date=item["notif_date"]
            var site=item["location_site"]
            var reportUri = "<" + graphUri + item.report_id + ">";
            if(!date || !site)
                return;

            for (var key in map) {
                if (types.indexOf(key) < 0) {
                    types.push(key)
                    strConcepts += "<" + graphUri + key + "> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://www.w3.org/2004/02/skos/core#ConceptScheme>.\n";
                    strConcepts += "<" + graphUri + key + ">  <http://www.w3.org/2004/02/skos/core#prefLabel> '"+key+"' .\n";
                }
                var fields = map[key];
                fields.forEach(function (field, index) {
                    if (!item[field])
                        return




                    var fieldUri="<" + graphUri + RcReportsTriples.formatString(field, true) + ">";
                    if (types.indexOf(field) < 0) {
                        types.push(field)
                        if (index == 0)
                            strConcepts += fieldUri + " <http://www.w3.org/2004/02/skos/core#broader> <" + graphUri + key + ">.\n";
                        else {
                            var uriBroader = "<" + graphUri + fields[index - 1] + ">";
                            strConcepts += fieldUri + " <http://www.w3.org/2004/02/skos/core#broader> " + uriBroader + ".\n";
                        }
                        if(field=="equipment_id" && item["equipment_3_label"]){
                            strConcepts += fieldUri + " <http://www.w3.org/2004/02/skos/core#prefLabel> '" + RcReportsTriples.formatString(item["equipment_3_label"]) + "'@en.\n";
                        }
                        else{
                            strConcepts += fieldUri + " <http://www.w3.org/2004/02/skos/core#prefLabel> '" + RcReportsTriples.formatString(field) + "'@en.\n";
                        }
                    }
                    //on rattache le report au plus bas niveau de la herarchie des concepts
                    if (index < fields.length - 1 && item[fields[index + 1]] == "") {
                        var uri = "<" + graphUri + RcReportsTriples.formatString(item[field], true) + ">";
                        if (types.indexOf(item[field]) < 0) {
                            types.push(item[field])

                            if (index > 0) {
                            var broaderFieldValueUri = "<" + graphUri + RcReportsTriples.formatString(fields[index - 1], true) + ">";
                                strConcepts += uri + " <http://www.w3.org/2004/02/skos/core#related> " + broaderFieldValueUri + ".\n";
                        }
                            strConcepts += uri + " <http://www.w3.org/2004/02/skos/core#broader> " + fieldUri + ".\n";
                            strConcepts += uri + " <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> " + fieldUri + ".\n";
                            strConcepts +=  uri +" <http://www.w3.org/2004/02/skos/core#prefLabel> '" +RcReportsTriples.formatString(item[field]) + "'@en.\n";
                        }
                        strCorpus += reportUri + " <http://purl.org/dc/terms/subject> " + uri + ".\n";
                    }

                })


                // corpus

                if (types.indexOf(item.report_id) < 0) {
                    types.push(item.report_id)
                    strCorpus += reportUri + " <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <" + graphUri + "Report" + ">.\n";
                    strCorpus += reportUri + " <http://www.w3.org/2004/02/skos/core#prefLabel> '"+RcReportsTriples.formatString(item.report_id)+"'.\n";



                    var year=date.substring(0,4);
                    if(types.indexOf(site)<0){
                        types.push(site)
                        strCorpus += "<" + graphUri + site + ">  <http://www.w3.org/2004/02/skos/core#broader> <" + graphUri + "Report" + ">.\n";
                        strCorpus += "<" + graphUri + site + ">  <http://www.w3.org/2004/02/skos/core#prefLabel> '" + site + "'@en.\n";
                    }
                    var siteYear=site+"_"+year
                    if(types.indexOf(siteYear)<0){
                        types.push(siteYear)
                        strCorpus += "<" + graphUri + siteYear + ">  <http://www.w3.org/2004/02/skos/core#broader> <" + graphUri + site +">.\n";
                        strCorpus += "<" + graphUri + siteYear + ">  <http://www.w3.org/2004/02/skos/core#prefLabel> '" + year + "'@en.\n";
                    }


                    strCorpus += reportUri + " <http://www.w3.org/2004/02/skos/core#broader> <" + graphUri + siteYear + ">.\n";
                }


            }


            // var label = gaiaToSkos.formatString(item.Term);

        })

        fs.writeFileSync(filePath.replace(".txt", "_corpus.rdf.nt"), strCorpus)
        fs.writeFileSync(filePath.replace(".txt", "_concept.rdf.nt"), strConcepts)

    }


}
module.exports = RcReportsTriples


RcReportsTriples.csvToTriples("D:\\Total\\2020\\Pierre\\RcReportsExtracts.txt")
