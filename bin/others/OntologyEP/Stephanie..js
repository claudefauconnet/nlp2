var fs = require('fs');

var csvToJson = function (filePath) {
    var str = "" + fs.readFileSync(filePath);
    str = str.replace(/[\u{0080}-\u{FFFF}]/gu, "");//charactrese vides
    var lines = str.split("\r");
    var pagesJson = [];
    var cols = [];

    lines[0].split(";").forEach(function (cell) {
        cols.push(cell)
    })

    lines.forEach(function (line, lineIndex) {
        var cells = line.trim().split(";");
        var obj = {}
        cells.forEach(function (cell, index) {
            if (lineIndex == 0)
                cols.push(cell)
            else {
                obj[cols[index]] = cell;
            }
        })
        pagesJson.push(obj)
    })
    return pagesJson;
}

var json = csvToJson("D:\\Total\\2020\\Stephanie\\Rapports_eSearch.csv")

var countries =["Afghanistan","Albania","Algeria","Andorra","Angola","Antigua and Barbuda","Argentina","Armenia","Australia","Austria","Azerbaijan","Bahamas","Bahrain","Bangladesh","Barbados","Belarus","Belgium","Belize","Benin","Bhutan","Bolivia","Bosnia and Herzegovina","Botswana","Brazil","Brunei","Bulgaria","Burkina Faso","Burundi","Côte d'Ivoire","Cabo Verde","Cambodia","Cameroon","Canada","Central African Republic","Chad","Chile","China","Colombia","Comoros","Congo","Costa Rica","Croatia","Cuba","Cyprus","Czechia","Democratic Republic of the Congo","Denmark","Djibouti","Dominica","Dominican Republic","Ecuador","Egypt","El Salvador","Equatorial Guinea","Eritrea","Estonia","Eswatini","Ethiopia","Fiji","Finland","France","Gabon","Gambia","Georgia","Germany","Ghana","Greece","Grenada","Guatemala","Guinea","Guinea-Bissau","Guyana","Haiti","Holy See","Honduras","Hungary","Iceland","India","Indonesia","Iran","Iraq","Ireland","Israel","Italy","Jamaica","Japan","Jordan","Kazakhstan","Kenya","Kiribati","Kuwait","Kyrgyzstan","Laos","Latvia","Lebanon","Lesotho","Liberia","Libya","Liechtenstein","Lithuania","Luxembourg","Madagascar","Malawi","Malaysia","Maldives","Mali","Malta","Marshall Islands","Mauritania","Mauritius","Mexico","Micronesia","Moldova","Monaco","Mongolia","Montenegro","Morocco","Mozambique","Myanmar","Namibia","Nauru","Nepal","Netherlands","New Zealand","Nicaragua","Niger","Nigeria","North Korea","North Macedonia","Norway","Oman","Pakistan","Palau","Palestine State","Panama","Papua New Guinea","Paraguay","Peru","Philippines","Poland","Portugal","Qatar","Romania","Russia","Rwanda","Saint Kitts and Nevis","Saint Lucia","Saint Vincent and the Grenadines","Samoa","San Marino","Sao Tome and Principe","Saudi Arabia","Senegal","Serbia","Seychelles","Sierra Leone","Singapore","Slovakia","Slovenia","Solomon Islands","Somalia","South Africa","South Korea","South Sudan","Spain","Sri Lanka","Sudan","Suriname","Sweden","Switzerland","Syria","Tajikistan","Tanzania","Thailand","Timor-Leste","Togo","Tonga","Trinidad and Tobago","Tunisia","Turkey","Turkmenistan","Tuvalu","Uganda","Ukraine","United Arab Emirates","United Kingdom","United States of America","Uruguay","Uzbekistan","Vanuatu","Venezuela","Vietnam","Yemen","Zambia","Zimbabwe"]



    countries.forEach(function(country,index) {
    countries[index]=country.toUpperCase();
})

var existingCountries=[];
function extractCountryEntity(text){
    var textCountries=[]
    countries.forEach(function(country){
        if(text.indexOf(country)>-1)
            textCountries.push(country)
        if(existingCountries.indexOf(country)<0)
            existingCountries.push(country)


    })
    existingCountries.sort();
    return textCountries;

}






var motsClesMap = {}

json.forEach(function (item) {
    if (!item.MOTSCLES)
        return
    var array = item.MOTSCLES.split("|");
    array.forEach(function (item2) {
        var array2 = item2.split(">")


        for (var i = 0; i < array2.length; i++) {
            var mot = array2[i];
            var id = mot + "_" + i
            if (!motsClesMap[id]) {
                var parent = ""

                if (i == 0)
                    parent = "#"
                else
                    parent = array2[i - 1] + "_" + (i - 1)

                motsClesMap[id] = {text: mot, id: id, parent: parent, children: [], data: {docs: [],countries:[]}}
            }
            var titleCountries=extractCountryEntity(item.TITRE)
            titleCountries.forEach(function(country){
                if(  motsClesMap[id].data.countries.indexOf(country)<0)
                    motsClesMap[id].data.countries.push(country)
            })

            motsClesMap[id].data.docs.push({docId: item.DOC_ID.substring(1), title: item.TITRE,countries:titleCountries});

            if(i<array2.length-1 &&  motsClesMap[id].children.indexOf( array2[i+1] + "_" + (i+ 1))<0)
                motsClesMap[id].children.push( array2[i+1] + "_" + (i+ 1))

        }



    })

})




function recurse(id){
    var item=motsClesMap[id]
    var obj={name:item.id,shortName:item.text,children:[]};
    if(item.children.length>0  ) {
        item.children.forEach(function (item2) {

            obj.children.push(recurse(item2))
        })
    }else{
        obj.size=item.data.docs.length
        item.data.docs.sort(function(a,b){
            if(a.title>b.title)
                return 1;
            if(a.title<b.title)
                return -1;
            return 0;
        })
        obj.data={docs:item.data.docs}
    }
    return obj;

}
var uniqueTopMots=[]
var root={name:"EsearchDocs",shortName:"EsearchDocs",children:[]}
for(var key in motsClesMap){
   if (motsClesMap[key].parent=="#"){
       if(uniqueTopMots.indexOf(motsClesMap[key].text)<0) {
           uniqueTopMots.push(motsClesMap[key].text)

           root.children.push(recurse(key))
       }
   }


}
var json={countries:existingCountries,keyWordsMap:motsClesMap}

//console.log(JSON.stringify(root,null,2))
fs.writeFileSync("D:\\GitHub\\nlp2\\public\\semantEP\\eseachTreemap.json",JSON.stringify(json,null,2))
