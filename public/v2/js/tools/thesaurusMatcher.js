var ThesaurusMatcher=(function(){
   var self={}

self.init=function(thesaurusLabel){

 //  $("#actionDivContolPanelDiv").html("<button onclick='ThesaurusMatcher.showcompareWithDialog()'>Compare with...</button>")
   $("#actionDivContolPanelDiv").load("snippets/thesaurusMatcher.html")
   ThesaurusBrowser.showThesaurusTopConcepts (thesaurusLabel)

   setTimeout(function(){
   for (var key in Config.sources) {
      var selected = ""
      if (key !=MainController.currentSource) {
         $("#ThesaurusMatcher_targetGraphUriSelect").append(new Option(key, key));
      }
   }
   },2000)




}

self.showcompareWithDialog=function(){


}





   return self;


})()
