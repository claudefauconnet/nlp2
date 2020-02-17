var comparator = (function () {
    var self = {};

    self.context = {}
    var elasticUrl = "../elastic";
    self.conceptsMap = {};
    self.treeV = {};
    self.treeH = {};
    self.dataV = [];
    self.dataH = [];


    self.initThesaurusSelects = function () {
        common.fillSelectOptions("thesaurusSelectV", thesaurusList, true);
        common.fillSelectOptions("thesaurusSelectH", thesaurusList, true);
    }


    self.draw = function (outputType, thesaurusV, thesaurusH, type) {

        self.dataV = [];
        self.dataH = [];
        self.treeV = {};
        self.treeH = {};

        $("#waitImg").css("display", "block");

        $("#jstreeTtitleH").html("");
        $("#jsTreeDivH").html("");
        $("#editorDivHId").html("");


        $("#jstreeTtitleV").html("");
        $("#jsTreeDivV").html("");
        $("#editorDivVId").html("");


        async.series([
                function (callbackSeries) {

                    if (!thesaurusV || thesaurusV == "")
                        return callbackSeries();
                    self.loadThesaurus(thesaurusV, function (err, result) {
                        if (err)
                            return callbackSeries(err)
                        self.dataV = result;

                        return callbackSeries();
                    })
                }
                ,
                function (callbackSeries) {
                    if (!thesaurusH || thesaurusH == "")
                        return callbackSeries();
                    self.loadThesaurus(thesaurusH, function (err, result) {
                        if (err)
                            return callbackSeries(err)
                        self.dataH = result;

                        return callbackSeries();

                    })
                },

                function (callbackSeries) {
                    $("#waitImg").css("display", "none");
                    var thesaurusNameV=thesaurusV.substring(thesaurusV.lastIndexOf("\\")+1)
                    var thesaurusNameH=thesaurusH.substring(thesaurusV.lastIndexOf("\\")+1)
                    self.commonConcepts = commonConcepts.getCommonConcepts(self.dataH, self.dataV);
                    $('#statsSpan').html(thesaurusNameV+" : " + self.dataV.length +","+thesaurusNameH +" : " + self.dataH.length + ",  commonConcepts : " + self.commonConcepts.length);
                    self.treeV = self.buildTree(self.dataV, self.commonConcepts);

                    self.treeH = self.buildTree(self.dataH, self.commonConcepts);


                    if (outputType == 'map') {
                        comparator.displayPopupDiv("popupLargeDiv");
                        commonConcepts.setAncestorsCommonConcepts(self.treeV, self.commonConcepts)
                        commonConcepts.setAncestorsCommonConcepts(self.treeH, self.commonConcepts);

                        var canvasData = self.bindMapData(self.treeV, self.treeH);

                        drawCanvas.drawData(canvasData, {graphDiv: "mapDiv", onclickFn: comparator.onMapClickRect, onMouseOverFn: comparator.onMapMouseOverRect}, function (err, result) {
                            return callbackSeries();
                        })
                    } else if (outputType == 'graph') {
                        graphDisplay.drawTreeGraph()


                    }


                }

            ],
            function (err) {
                console.log(err);
            })


    }

    self.loadThesaurus = function (rdfPath, callback) {
        $("#graphDiv").html("");
        $("#mapDiv").html("");
        self.conceptsMap = {};

        var payload = {
            rdfToEditor: 1,
            rdfPath: rdfPath,
            options: JSON.stringify({
                extractedLangages: "en,fr,sp",
                outputLangage: "en",

            })
        }
        $.ajax({
            type: "POST",
            url: elasticUrl,
            data: payload,
            dataType: "json",

            success: function (data, textStatus, jqXHR) {
                if (data.mode && data.mode == "readOnly")
                    alert("this file is already editing : cannot be saved")
                callback(null, data.skos)
            }
            , error: function (err) {
                callback(err.responseText)
                console.log(err.responseText)


            }
        })
    }

    self.buildTree = function (childrenArray, commonConcepts) {
        var topNodesIds = []
        var topNodes = []
        childrenArray.forEach(function (child) {
            self.conceptsMap[child.id] = child;
            if (commonConcepts) {
                child.commonConceptCount = 0;
                child.commonConcepts = [];
                commonConcepts.forEach(function (commonConcept) {
                    if (commonConcept.indexOf(child.id) > -1) {
                        child.commonConceptCount += 1;
                        child.commonConcepts.push(commonConcept)
                    }
                })
            }

            if (!child.parent || child.parent == "#")
                topNodesIds.push(child.id)

        })


        childrenArray.forEach(function (child) {
            if (child.parent && child.parent != "#" && self.conceptsMap[child.parent]) {
                if (!self.conceptsMap[child.parent].children) {
                    self.conceptsMap[child.parent].children = [];
                }
                self.conceptsMap[child.parent].children.push(child);

            }
        })

        topNodesIds.forEach(function (id) {
            topNodes.push(self.conceptsMap[id])
        })

        var tree
        if (topNodes.length == 1)
            tree = {children: topNodes[0].children}
        else
            tree = {children: topNodes}
        return tree

    }


    self.onMapClickRect = function (point, obj, event) {
        if (!obj || !obj.id)
            return;
        commonConcepts.showMapSelectionCommonConcepts(obj.id.v, obj.id.h);


        if (event.ctrlKey) {
            var subTreeV = jsTreeEditor.getNodeChildrenSubTree(self.treeV, obj.id.v);
            if (!subTreeV.children)
                subTreeV = subTreeV
            var subTreeH = jsTreeEditor.getNodeChildrenSubTree(self.treeH, obj.id.h);
            if (!subTreeH.children)
                subTreeH = subTreeH
            /*    var html = JSON.stringify(obj.id)
                $("#infosDiv").html(html)*/
            var newCanvasData = self.bindMapData(subTreeV, subTreeH);
            if (!newCanvasData)
                return;
            //  drawCanvas.canvasData = drawCanvas.canvasData.concat(newCanvasData);
            $("#mapDiv").html("")
            $("#graphDiv").html("")
            $("#CommonConceptsDiv").html("")

            drawCanvas.drawData(newCanvasData, {graphDiv: "mapDiv", onclickFn: comparator.onMapClickRect, onMouseOverFn: comparator.onMapMouseOverRect})
            ;
        } else {

            //    return jsTreeEditor.showRectJsTree(obj)


            return;
            // var newCanvasData = self.bindMapDataToRect(nodeV, nodeH, obj);

        }
    }
    self.onMapMouseOverRect = function (point, obj) {
        var x = obj
    }


    self.bindMapData = function (nodeV, nodeH) {

        if (!nodeV.children || !nodeH.children)
            return null


        var interpolateColorFn = d3.scaleSequential(d3.interpolateYlOrRd).domain([1, Math.log(self.commonConcepts.length / 2)]);

        var canvasData = [];
        self.commonIntersections = {}
        var margin = 100;
        var x = margin;
        var y = margin;

        var w = Math.round((mapWidth - margin - 30) / nodeH.children.length)
        var h = Math.round((mapHeight - margin - 30) / nodeV.children.length)
        nodeV.children.forEach(function (conceptV, lineIndex) {

            x = margin


            nodeH.children.forEach(function (conceptH, rowIndex) {

                var intersectionCommonConcepts = commonConcepts.getIntersectionCommonConcepts(conceptH.id, conceptV.id)// conceptH.commonConceptCount * conceptV.commonConceptCount;
                var commonConceptCount = intersectionCommonConcepts.length
                var bgColor = "#eee"
                if (commonConceptCount > 0)
                    bgColor = interpolateColorFn(Math.log(commonConceptCount))

                var rect = {
                    type: "rect",
                    x: x,
                    y: y,
                    w: w,
                    h: h,
                    bgColor: bgColor,
                    lineWidth: 1,
                    color: "#aaa",
                    coords: {x: rowIndex, y: lineIndex, level: 0},
                    id: {h: conceptH.data.id, v: conceptV.data.id, ancestors: []}

                }
                canvasData.push(rect);

                if (rowIndex == 0) {
                    var bgColor = $("#thesaurusV").css("background-color");
                    canvasData.push({
                        type: "text",
                        text: conceptV.data.prefLabels[0].value,
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
                        coords: {x: lineIndex, y: rowIndex, type: "V"}
                    })

                }

                if (lineIndex == 0) {
                    var bgColor = $("#thesaurusH").css("background-color");
                    canvasData.push({
                        type: "text",
                        text: conceptH.data.prefLabels[0].value,
                        textAlign: "start",
                        font: "12px  normal",
                        color: "black",
                        x: x + (w / 2),
                        y: margin - 20,
                        vertical: true
                    })
                    canvasData.push({
                        type: "rect",
                        x: x + (w / 2) - 10,
                        y: margin - 18,
                        w: 10,
                        h: 10,
                        bgColor: bgColor,
                        lineWidth: 1,
                        coords: {x: lineIndex, y: rowIndex, type: "H"},

                    })

                }

                /*     var innerRects = self.bindMapDataToRect(conceptV, conceptH, rect, interpolateColorFn);
                     canvasData = canvasData.concat(innerRects)*/

                x += w
            })
            y += h
        })


        return canvasData;


    }

    self.bindMapDataToRect = function (nodeV, nodeH, toNode, interpolateColorFn) {
        var canvasData = [];
        if (!nodeV.children || !nodeH.children)
            return []

        var w = toNode.w / nodeH.children.length;
        var h = toNode.h / nodeV.children.length;
        var x = toNode.x;
        var y = toNode.y;

        nodeV.children.forEach(function (conceptV, lineIndex) {

            var x = toNode.x;

            nodeH.children.forEach(function (conceptH, rowIndex) {

                var bgColor = "#aaa"

                var commonConceptCount = conceptH.commonConceptCount * conceptV.commonConceptCount;
                bgColor = interpolateColorFn(commonConceptCount)

                var rect = {

                    type: "rect",
                    x: x,
                    y: y,
                    w: w,
                    h: h,
                    bgColor: bgColor,
                    lineWidth: 0.5,
                    coords: {x: lineIndex, y: rowIndex, level: toNode.coords.level + 1},
                    id: {h: conceptH.data.id, v: conceptV.data.id, ancestors: []}
                }
                canvasData.push(rect);
                /*    var innerRects = self.bindMapDataToRect(conceptV, conceptH, rect, interpolateColorFn);
                    canvasData = canvasData.concat(innerRects)*/
                x += w;
            })
            y += h

        })
        return canvasData;
    }


    self.displayPopupDiv = function (popupDiv) {

        $("#" + popupDiv).position({
            my: "top",
            at: "top",
            of: "#mapDiv", // or $("#otherdiv")
            collision: "fit"
        });
        $("#" + popupDiv).css("display", "flex")

    }
    self.hidePopupDiv = function (popupDiv) {
        $("#" + popupDiv).css("display", "none")

    }


    return self;


})()
