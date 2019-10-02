var ui = (function () {
    var self = {};
    self.jsonEditor=null;


    self.showIndexList=function(){
        var indexNames=Object.keys(context.indexConfigs);
        var htmlSources="<ul>";
        var htmlIndexation="<ul>";

        indexNames.forEach(function(index){
            htmlSources+="<li onclick=ui.showIndexConfig('"+index+"')>"+index+"</li>";
            htmlIndexation+="<li onclick=ui.showIndexationForm('"+index+"')>"+index+"</li>"

        })
        htmlSources+="</ul>";
        $("#sourcesDiv").html(htmlSources);
        $("#indexationDiv").html(htmlIndexation);

    }

    self.showIndexConfig=function(indexName){
        var config=context.indexConfigs[indexName];
        context.currentIndexName=indexName;

        $("#mainDiv").html("<div>" +
            "<span class='title'>index : "+indexName+"</span>&nbsp;&nbsp;"+
            "<button onclick='mainController.saveIndexConfig()'>Save</button>" +
            " <button onclick='mainController.deleteIndexConfig()'>Delete</button>" +
            " <button onclick='mainController.duplicateCurrentIndexConfig()'>Duplicate</button>" +
            "</div>" +
            "<hr> <pre id=\"json-display\"></pre>\n");
   self.jsonEditor=new JsonEditor('#json-display', config);


    }


    self.showIndexationForm=function(indexName){
        context.currentIndexName=indexName;
        $("#mainDiv").load("htmlSnippets/indexation.html")


    }


    return self;
})()
