var Heatmap = (function () {

    var self = {};


    self.bindCanvasHeatMapData = function (data, xField, yField, valueField, idLabelMap, mapWidth, mapHeight) {

        if (!xField || !yField || !valueField)
            return null
        var maxValue = 0;
        var distinctValues = [];
        var coocValues = {}
        var dataMap={}
        data.forEach(function (item) {
            var xValue = item[xField];
            var yValue = item[yField];
            var valueValue = item[valueField]

            if (!xValue || !yValue || !valueValue || isNaN(valueValue))
                return;
            maxValue = Math.max(maxValue, valueValue)
            if (distinctValues.indexOf(xValue) < 0) {
                distinctValues.push(xValue)
            }
            if (distinctValues.indexOf(yValue) < 0) {
                distinctValues.push(yValue)
            }
            var obj={
                value:valueValue,
                xId:xValue,
                yId:yValue
            }
            coocValues[xValue + "_" + yValue] = obj;


        })

        var X = []
        distinctValues.sort();
        distinctValues.forEach(function (itemX) {
            var line = [];
            distinctValues.forEach(function (itemY) {
                if (coocValues[itemX + "_" + itemY])
                    line.push(coocValues[itemX + "_" + itemY])
                else if (coocValues[itemY + "_" + itemX])
                    line.push(coocValues[itemY + "_" + itemX])
                else
                    line.push(0)
            })
            X.push(line)
        })


        var interpolateColorFn = d3.scaleSequential(d3.interpolateYlOrRd).domain([1, maxValue]);

        var canvasData = [];
        self.commonIntersections = {}
        var margin = 100;
        var x = margin;
        var y = margin;
        var y2 = y;
        var bgColor;
        var w = Math.round((mapWidth - margin - 30) / distinctValues.length)
        var h = Math.round((mapHeight - margin - 30) / distinctValues.length)
        X.forEach(function (line, lineIndex) {
            x = margin;
         var lineData = idLabelMap[distinctValues[lineIndex]]
            var lineLabel =lineData.label;
            line.forEach(function (row, rowIndex) {

                if (!row.value|| row.value == 0)
                    bgColor = "ddd"
                else
                    bgColor = interpolateColorFn(row.value)
// cell with value color
                if (rowIndex < lineIndex) {
                    var rect = {
                        type: "rect",
                        x: x,
                        y: y,
                        w: w,
                        h: h,
                        bgColor: bgColor,
                        lineWidth: 1,
                        color: "#aaa",
                       data:row
                        //  id: {h: conceptH.data.id, v: conceptV.data.id, ancestors: []}
                    }

                    canvasData.push(rect);
                }
                if (rowIndex == 0) {
                    var bgColor = "#aaa";
                    canvasData.push({
                        type: "text",
                        text: lineLabel,
                        textAlign: "end",
                        font: "12px  normal",
                        color: "black",
                        x: margin - 15,
                        y: y + (h / 2),
                    })
                    canvasData.push({
                        type: "rect",
                        x: margin - 13,
                        y: y + (h / 2) - 10,
                        w: 10,
                        h: 10,
                        bgColor: bgColor,
                        lineWidth: 1,
                        //  coords: {x: lineIndex, y: rowIndex, type: "V"}
                    })

                }

                if (lineIndex == 0) {
                    var data = idLabelMap[distinctValues[rowIndex]]
                    var rowLabel = data.label;
                    var bgColor = "#aaa";
                    canvasData.push({
                        type: "text",
                        text: rowLabel,
                        textAlign: "start",
                        font: "12px  normal",
                        color: "black",
                        x: x + (w / 2),
                        y: y2 - 20,
                        vertical: true
                    })
                    canvasData.push({
                        type: "rect",
                        x: x + (w / 2) - 10,
                        y: y2 - 18,
                        w: 10,
                        h: 10,
                        bgColor: bgColor,
                        lineWidth: 1,
                        data: data,

                    })
                    y2 += h

                }


                x += w
            })
            y += h
        })


        return canvasData;


    }

    self.onCellClick = function (point, cell, event) {
      /*  var conceptSets=[{ids:[cell.data.xId]},{ids:[cell.data.yId]}]
        paragraphs.sparql_getEntitiesParagraphs ( null,conceptSets, {}, function(err,result){

        })*/

        var conceptSets=[cell.data.xId,cell.data.yId]
        paragraphs.getResourcesCooccurences(conceptSets, {}, function(err,result){
            $("#heatMapParagraphsDiv").html("")
            var html="<ul>"
            result.forEach(function(item){
                html+="<li>"+item.paragraph.value+"</li>"
            })
            html+="</ul>"
            $("#heatMapParagraphsDiv").html(html)
        })
    }


    return self;


})()
