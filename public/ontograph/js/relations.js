var relations = (function () {

    var self = {};


    self.displayGraphEntitiesRelations = function () {
        ontograph.context.currentGraphType = "displayEntitiesRelations"

        $('#dialogDiv').dialog('close')

        var selectedEntities = ontograph.getSelectedEntities();
        var startEntityTypes = [];
        ontograph.context.selectedEntities = selectedEntities;
        sparql.queryEntitiesRelations(selectedEntities, {}, function (err, result) {
            if (err)
                return $("#messageDiv").html(err);
            self.currentRelations = result;
            self.showEntitiesRelationsFilteringPanel(result)

        })
    }

    self.showEntitiesRelationsFilteringPanel = function (relations) {

        var relationsMap = []
        relations.forEach(function (relation) {
            var relType = relation.relationType.value;
            if (!relationsMap[relType])
                relationsMap[relType] = 0;
            relationsMap[relType] += 1


        })

        var html = "<ul>";
        for (var relType in relationsMap) {
            var checkedStr = "";

            html += "<li  style='background-color: " + ontograph.entityTypeColors["relationType"] + "'><input type='checkbox' class='entityRelationTypeCBX' value='" + relType + checkedStr + "'>" + relType + " (" + relationsMap[relType] + ")</li>"

        }
        html += "</ul>";
        html += "<div>"
        html += "<button onclick='ontograph.showSearchDialog(true)'>Search</button>"
        html += "<button onclick='relations.showRelationsGraph()'>show graph</button>";
        html += "</html"


        $('#dialogDiv').dialog('open')
        $("#filteredEntitiesPanel").html(html);
        $("#filteredEntitiesPanel").css("display", "flex");
        $("#searchPanel").css("display", "none");


    }

    self.showRelationsGraph = function () {
        var relations = self.currentRelations;
        var relationTypes = [];

        $(".entityRelationTypeCBX").each(function () {
            if ($(this).prop("checked")) {
                relationTypes.push($(this).val())
            }

        })
        var selectedEntityIds = []
        relations.forEach(function (relation) {
            if (relationTypes.indexOf(relation.relationType.value) > -1) {
                if (selectedEntityIds.indexOf(relation.startEntity.value) < 0)
                    selectedEntityIds.push(relation.startEntity.value);
                if (selectedEntityIds.indexOf(relation.endEntity.value) < 0)
                    selectedEntityIds.push(relation.endEntity.value);
            }
        })
        var entityInfosMap = {};
        sparql.queryEntitiesInfos(selectedEntityIds, {}, function (err, result) {

            result.forEach(function (item) {
                var definition="";
                if( item.definition)
                    definition= item.definition.value;
                var entityType=item.entityType.value
                entityType=entityType.substring(entityType.lastIndexOf("/")+1)
                entityInfosMap[item.entity.value] = {id: item.entity.value, label: item.entityLabel.value, type: entityType, definition:definition}
            })


            var visjsData = {
                nodes: [],
                edges: []
            }

            uniqueNodeIds = [];
            uniqueEdgesIds = [];
            relations.forEach(function (relation) {
                var startEntity = relation.startEntity.value;
                var relationType = relation.relationType.value;
                relationType = relationType.substring(relationType.lastIndexOf("#") + 1)
                var endEntity = relation.endEntity.value;

                if (entityInfosMap[startEntity]  && uniqueNodeIds.indexOf(startEntity) < 0) {
                    uniqueNodeIds.push(startEntity)
                    var node = {
                        label: entityInfosMap[startEntity].label,
                        id: startEntity,
                        data: entityInfosMap[startEntity],
                        color: ontograph.entityTypeColors[entityInfosMap[startEntity].type],
                        shape: "box",
                        font: {size: 14, color: "black"}


                    }
                    visjsData.nodes.push(node)
                }

                if (entityInfosMap[endEntity]  && uniqueNodeIds.indexOf(endEntity) < 0) {
                    uniqueNodeIds.push(endEntity)
                    var node = {
                        label: entityInfosMap[endEntity].label,
                        id: endEntity,
                        data: entityInfosMap[endEntity],
                        color: ontograph.entityTypeColors[entityInfosMap[endEntity].type],
                        shape: "box",
                        font: {size: 14, color: "black"}


                    }
                    visjsData.nodes.push(node)
                }


                var edgeId = startEntity + "_" + endEntity
                if (uniqueEdgesIds.indexOf(edgeId) < 0) {
                    uniqueEdgesIds.push(edgeId)
                    var edge = {
                        from: startEntity,
                        to: endEntity,
                        id: edgeId,
                        label: relationType

                    }
                    visjsData.edges.push(edge)
                }


                ontograph.drawGraph(visjsData)


            })
        })

    }


    return self;


})();
