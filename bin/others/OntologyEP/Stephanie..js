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

var levels = [];

for (var i = 0; i < 5; i++) {
    levels.push({})
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

                motsClesMap[id] = {text: mot, id: id, parent: parent, children: [], data: {docs: []}}
            }
            motsClesMap[id].data.docs.push({docId: item.DOC_ID.substring(1), Title: item.TITRE});
            if(i<array2.length-1 &&  motsClesMap[id].children.indexOf( array2[i+1] + "_" + (i+ 1))<0)
                motsClesMap[id].children.push( array2[i+1] + "_" + (i+ 1))

        }


        /*    array2.forEach(function(item3,index) {
                var
                if(i==0){
                    var mot0=item
                if(motsClesMap[item3]
                    }
                if(!levels[index][item3])
                    levels[index][item3]=[];
                levels[index][item3].push({titre:item.TITRE,id:item.DOC_ID})
            })*/
    })

})
var xx = motsClesMap

var array=[]

function recurse(id){
    var item=motsClesMap[id]
    var obj={name:item.id,shortName:item.text,children:[]};
    if(item.children.length>0  ) {
        item.children.forEach(function (item2) {

            obj.children.push(recurse(item2))
        })
    }else{
        obj.size=item.data.docs.length
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

var xx=root
//console.log(JSON.stringify(root,null,2))
fs.writeFileSync("D:\\GitHub\\nlp2\\public\\semantEP\\eseachTreemap.json",JSON.stringify(root,null,2))
