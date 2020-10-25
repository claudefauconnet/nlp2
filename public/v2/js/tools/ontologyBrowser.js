var OntologyBrowser = (function () {
    var self = {}

   self.schemasConfig
   self.currentSourceSchema
   self.currentSourceLabel
   self.currentSourceUri
    self.nodeProperties
    self.onSourceSelect = function (sourceLabel) {
        self.currentSourceLabel = sourceLabel;
        self.currentSourceUri = Config.sources[sourceLabel].graphIri
            if (Config.sources[sourceLabel].sourceSchema) {
                //  if(! self.schemasConfig) {
                $.getJSON("config/schemas.json", function (json) {
                    self.schemasConfig = json;
                    self.currentSourceSchema = self.schemasConfig[Config.sources[sourceLabel].sourceSchema]
                    ThesaurusBrowser.showThesaurusTopConcepts(sourceLabel, {treeSelectNodeFn: OntologyBrowser.onNodeSelect, contextMenu: {}})
                    $("#graphDiv").load("snippets/ontologyBrowser.html")
                    $("#SourceEditor_NewObjectDiv").css("display", "none")
                    $("#actionDivContolPanelDiv").html("<button onclick='SourceEditor.onAddNewObject()'>+</button>")
                })
            } else
                return MainController.UI.message("no Schema for source " + sourceLabel)

    }

    self.onNodeSelect=function(event, obj){


       Sparql_schema.getObjectDomainProperties(self.currentSourceSchema,obj.node.id,function(err,result){
          var nodeProperties=[];
          result.forEach(function(item){
             nodeProperties.push({id:item.domain.value,label:common.getItemLabel(item,"domain")})
          })
          /* Sparql_schema.getObjectRangeProperties(self.currentSourceSchema,obj.node.id,function(err,result){

               result.forEach(function(item){
                   nodeProperties.push({id:item.prop.value,label:common.getItemLabel(item,"prop")})
               })


           })*/
        common.fillSelectOptions("OntologyBrowser_filter_ObjectpropertiesSelect",nodeProperties,true,"label","id")
           self.showDatatypeProperties(obj.node.id);

       })




    }



    self.showDatatypeProperties=function(classId){
        Sparql_schema.getDataTypeProperties(self.currentSourceSchema,classId,function(err,result){
            self.nodeProperties=[];
            result.forEach(function(item){
                var range="";
                if(item.range)
                    range=item.range.value
                self.nodeProperties.push({id:item.property.value,label:common.getItemLabel(item,"property"),range:range})
            })
            common.fillSelectOptions("OntologyBrowser_filter_DataPropertiesSelect", self.nodeProperties,true,"label","id")

        })
    }


    return self;


})()
