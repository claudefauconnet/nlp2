var cooccurrences=(function(){

    var self={};

    self.displayGraphEntitiesCooccurrences = function (entities, options) {
        if (!options)
            options = {}
        ontograph.context.currentGraphType = "displayGraphEntitiesCooccurrences"
        ontograph.context.currentGraphOptions = options
        $('#dialogDiv').dialog('close')
        ontograph.context.currentParagraphs = {};
        var depth = 1
        var depthArray = [];
        uniqueNodeIds = [];
        var uniqueEdgesIds = [];
        var totalTypeOccurences = {}
        var visjsData = {nodes: [], edges: []}
        for (var i = 0; i < depth; i++) {
            depthArray.push(i)
        }
        var selectedEntities = entities;
        if (!selectedEntities)
            selectedEntities = ontograph.getSelectedEntities();
        var startEntityTypes = [];
        ontograph.context.selectedEntities = selectedEntities;


        sparql.queryEntitiesCooccurrences(selectedEntities, {minManadatoryEntities: minManadatoryEntities}, function (err, result) {
            if(err)
                return $("#messageDiv").html(err);
            var endEntityTypes = {}


            result.forEach(function (item, indexLine) {

                var obj2 = {id: item.entity2.value, label: item.entity2Label.value, type: ontograph.getTypeFromEntityUri(item.entity2.value)}
                var type2 = obj2.type.substring(obj2.type.lastIndexOf("/") + 1)
                if (!endEntityTypes[type2])
                    endEntityTypes[type2] = 0
                endEntityTypes[type2] += parseInt(item.nOccurrences.value)
            })
            self.showEntitiesFilteringPanel(endEntityTypes)


        })


    }

    self.showEntitiesFilteringPanel = function (endEntityTypes) {
        var typesMap = []
        var html = "<ul>";
        for (var entityType in endEntityTypes) {
            var checkedStr = "";

            html += "<li  style='background-color: " + ontograph.entityTypeColors[entityType] + "'><input type='checkbox' class='filteredGraphEntityCBX' value='" + ontograph.entityTypeDictionary[entityType] + checkedStr + "'>" + entityType + " (" + endEntityTypes[entityType] + ")</li>"

        }
        html += "</ul>";
        html += "<div>"
        html += "<button onclick='ontograph.showSearchDialog(true)'>Search</button>"
        html += "<button onclick='cooccurrences.showFilteredEntityCooccurrencesGraph()'>show graph</button>";
        html += "</html"


        $('#dialogDiv').dialog('open')
        $("#filteredEntitiesPanel").html(html);
        $("#filteredEntitiesPanel").css("display", "flex");
        $("#searchPanel").css("display", "none");


    }
    self.showFilteredEntityCooccurrencesGraph = function () {
        $("#dialogDiv").dialog("close");
        uniqueNodeIds = [];
        var uniqueEdgesIds = [];
        var totalTypeOccurences = {}
        var visjsData = {nodes: [], edges: []}
        var filteredEntityTypes = [];

        $(".filteredGraphEntityCBX").each(function () {
            if ($(this).prop("checked")) {
                filteredEntityTypes.push($(this).val())
            }

        })
        var selectedEntities = self.context.selectedEntities;

        sparql.queryEntitiesCooccurrences(selectedEntities, {filterEntityTypes: filteredEntityTypes}, function (err, result) {


            result.forEach(function (item, indexLine) {

                var obj1 = {id: item.entity1.value, label: item.entity1Label.value, type: self.getTypeFromEntityUri(item.entity1.value)}

                if (uniqueNodeIds.indexOf(obj1.id) < 0) {
                    uniqueNodeIds.push(obj1.id)
                    var type1 = obj1.type.substring(obj1.type.lastIndexOf("/") + 1)

                    var vijsNode = {
                        label: obj1.label,
                        id: obj1.id,
                        color: self.entityTypeColors[type1],
                        data: {type: "Entity", entityType: type1},
                        shape: "box",

                    }
                    visjsData.nodes.push(vijsNode)
                }
                var nOccurences = parseInt(item.nOccurrences.value)
                var obj2 = {id: item.entity2.value, label: item.entity2Label.value, type: self.getTypeFromEntityUri(item.entity2.value)};
                selectedEntities.push(obj2.id)

                if (uniqueNodeIds.indexOf(obj2.id) < 0) {
                    uniqueNodeIds.push(obj2.id)
                    var type2 = obj2.type.substring(obj2.type.lastIndexOf("/") + 1)
                    var vijsNode = {
                        label: obj2.label,
                        id: obj2.id,
                        color: self.entityTypeColors[type2],
                        data: {type: "Entity", entityType: type2},
                        shape: "box",

                    }
                    visjsData.nodes.push(vijsNode)
                }

                var edgeId = obj1.id + "_" + obj2.id
                if (!totalTypeOccurences[edgeId])
                    totalTypeOccurences[edgeId] = 0
                totalTypeOccurences[edgeId] += nOccurences
                if (uniqueEdgesIds.indexOf(edgeId) < 0) {
                    uniqueEdgesIds.push(edgeId)
                    var edgeType = {
                        from: obj1.id,
                        to: obj2.id,
                        id: edgeId,
                        value: nOccurences,
                        smooth: true,

                    }
                    visjsData.edges.push(edgeType)
                }


            })
            self.drawGraph(visjsData)

        })
    }







    return self;



})();
