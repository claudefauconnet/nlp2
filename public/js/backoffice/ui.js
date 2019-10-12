var ui = (function () {
    var self = {};
    self.jsonEditor=null;


    self.initSourcesList=function(){
        var indexNames=Object.keys(context.indexConfigs);
        indexNames.sort();

        mainController.fillSelectOptions("sourcesSelect",indexNames);




    }

    self.showIndexConfig=function(){

        var config=context.indexConfigs[context.currentIndexName];


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

    self.selectIndexConfig=function(indexName){
        context.currentIndexName=indexName;

    }


    return self;
})()
