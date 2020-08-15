var fs=require ('fs');

var  csvToJson= function (filePath) {
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

var json=csvToJson("D:\\Total\\2020\\Stephanie\\Rapports_eSearch.csv")

var levels=[];
for(var i=0;i<5;i++){
    levels.push({})
}
json.forEach(function(item){
    if(!item.MOTSCLES)
        return
 var array=item.MOTSCLES.split("|");
 array.forEach(function(item2){
     var array2=item2.split(">")
     array2.forEach(function(item3,index) {
         if(!levels[index][item3])
             levels[index][item3]={docs:[],};
         var obj={titre:item.TITRE,id:item.DOC_ID}
         if(index==0)
             obj.parent="#"
         else
             obj.parent=
         levels[index][item3].push(obj)
     })
 })
})

var x=levels

var map={};
levels.forEach(function(level){
    for
    map[lec]




})
