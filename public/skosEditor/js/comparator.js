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
        var thesaurusList = [


            "D:\\NLP\\eurovoc_in_skos_core_concepts.rdf",
            "D:\\NLP\\geochemistry.rdf",
            "D:\\NLP\\measurement-unit-skos.rdf",
            "D:\\NLP\\quantum_F_all.rdf",
            "D:\\NLP\\thesaurusIngenieur.rdf",
            "D:\\NLP\\Tulsa_all.rdf",
            "D:\\NLP\\Tulsa_COMMON ATTRIBUTE.rdf",
            "D:\\NLP\\Tulsa_EARTH AND SPACE CONCEPTS.rdf",
            "D:\\NLP\\Tulsa_ECONOMIC FACTOR.rdf",
            "D:\\NLP\\Tulsa_EQUIPMENT.rdf",
            "D:\\NLP\\Tulsa_LIFE FORM.rdf",
            "D:\\NLP\\Tulsa_MATERIAL.rdf",
            "D:\\NLP\\Tulsa_OPERATING CONDITION.rdf",
            "D:\\NLP\\Tulsa_PHENOMENON.rdf",
            "D:\\NLP\\Tulsa_PROCESS.rdf",
            "D:\\NLP\\Tulsa_PROPERTY.rdf",
            "D:\\NLP\\Tulsa_WORLD.rdf",
            "D:\\NLP\\unesco.rdf",
            "D:\\NLP\\unescothes.rdf",

            "D:\\NLP\\cgi\\eventenvironment.rdf",
            "D:\\NLP\\cgi\\eventprocess.rdf",
            "D:\\NLP\\cgi\\eventprocess2.rdf",
            "D:\\NLP\\cgi\\explorationResults.rdf",
            "D:\\NLP\\cgi\\isc2014.rdf",
            "D:\\NLP\\cgi\\isc2017.rdf",
            "D:\\NLP\\cgi\\lithology.rdf",
            "D:\\NLP\\cgi\\simplelithology.rdf",


        ];

        common.fillSelectOptions("thesaurusSelect1", thesaurusList, true);
        common.fillSelectOptions("thesaurusSelect2", thesaurusList, true);
    }


    self.loadThesaurus = function (rdfPath, callback) {
        $("#graphDiv").html("");
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
                callback(null, data)
            }
            , error: function (err) {
                callback(err.responseText)
                console.log(err.responseText)


            }
        })
    }

    self.getTree = function (childrenArray, commonConcepts) {


        var topNodesIds = []
        var topNodes = []
        childrenArray.forEach(function (child) {

            self.conceptsMap[child.id] = child;
            if (commonConcepts) {
                child.commonConceptCount = 0;
                commonConcepts.forEach(function (commonConcept) {
                    if (commonConcept.indexOf(child.id) > -1)
                        child.commonConceptCount += 1;
                })
            }

            if (!child.parent || child.parent == "#")
                topNodesIds.push(child.id)

        })


        childrenArray.forEach(function (child) {
            if (child.parent && child.parent != "#") {
                if (!self.conceptsMap[child.parent].children) {
                    self.conceptsMap[child.parent].children = [];
                }
                self.conceptsMap[child.parent].children.push(child);
                if (commonConcepts) {
                    self.conceptsMap[child.parent].commonConceptCount += child.commonConceptCount;
                }
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
    self.getCommonConcepts = function (thesaurusArrayA, thesaurusArrayB) {
        var commonConcepts = []
        thesaurusArrayA.forEach(function (conceptA) {
            thesaurusArrayB.forEach(function (conceptB) {
                if (self.isCommonConcept(conceptA.data, conceptB.data)) {
                    commonConcepts.push(conceptA.id + " | " + conceptB.id)
                }
            })
        })
        return commonConcepts;

    }


    self.isCommonConcept = function (a, b) {
        var ok = false;
        a.prefLabels.forEach(function (prefLabelA) {
            b.prefLabels.forEach(function (prefLabelB) {
                if (prefLabelA.value.toLowerCase() == prefLabelB.value.toLowerCase())
                    return ok = true;

            })
        })
        a.altLabels.forEach(function (altLabelA) {
            b.altLabels.forEach(function (altLabelB) {
                if (altLabelA.value.toLowerCase() == altLabelB.value.toLowerCase())
                    return ok = true;

            })
        })
        return ok;
    }


    self.drawMap = function (thesaurusV, thesaurusH) {
        self.dataV = [];
        self.dataH = [];
        self.treeV = {};
        self.treeH = {};
        async.series([
                function (callbackSeries) {
                    self.loadThesaurus(thesaurusV, function (err, result) {
                        if (err)
                            return callbackSeries(err)
                        self.dataV = result;

                        return callbackSeries();
                    })
                }
                ,
                function (callbackSeries) {
                    self.loadThesaurus(thesaurusH, function (err, result) {
                        if (err)
                            return callbackSeries(err)
                        self.dataH = result;

                        return callbackSeries();

                    })
                },

                function (callbackSeries) {

                    var commonConcepts = self.getCommonConcepts(self.dataH, self.dataV);
                    self.treeV = self.getTree(self.dataV, commonConcepts);
                    self.treeH = self.getTree(self.dataH, commonConcepts);
                    var canvasData = self.bindData(self.treeV, self.treeH);
                    drawCanvas.drawData(canvasData, {onclickFn: comparator.onClickRect, onMouseOverFn: comparator.onMouseOverRect}, function (err, result) {
                        return callbackSeries();
                    })

                }

            ],
            function (err) {
                console.log(err);
            })


    }


    self.getNodeSubjsTree = function (tree, rootNodeId, parentName) {
        var jsTree = {};
        var currentParent = null;

        function recurse(node) {
            delete node.parent;
            if (node.id == rootNodeId) {

                jsTree = node
                currentParent = node.id
            }
            /*  if (node.parent && node.parent == currentParent) {
                  jsTreeData.push(node)
                  currentParent = node.id
              }*/
            if (node.children) {
                node.children.forEach(function (child) {
                    if (child.commonConceptCount > 0)
                        child.type = "commonConcept"
                    else
                        child.type = "default"
                    recurse(child);

                })
            } else
                node.children = [];

        }

        recurse(tree);

        return jsTree;


    }
    self.getNodeChildrenSubTree = function (tree, rootNodeId) {
        var subTree = {};
        var currentParent = null;

        function recurse(node) {
            delete node.data;
            if (node.id == rootNodeId) {
                //  node.parent="#"
                subTree = node;
            } else {
                if (node.children)
                    node.children.forEach(function (child) {
                        recurse(child)
                    })
            }
        }

        recurse(tree);
        return subTree;
    }


    self.onClickRect = function (point, obj, event) {
        if (!obj || !obj.id)
            return;

        function showRectJsTree(obj) {

            var jsTreeData = [{
                text: "vertical",
                parent: "#",
                id: "vertical",
            },
                {
                    text: "horizontal",
                    parent: "#",
                    id: "horizontal",
                }
            ]
            var subTreeV = self.getNodeSubjsTree(self.treeV, obj.id.v, "#")
            var subTreeH = self.getNodeSubjsTree(self.treeH, obj.id.h, "#");


            /*    jsTreeData=jsTreeData.concat(subTreeV);
                jsTreeData=jsTreeData.concat(subTreeH);
                console.log(JSON.stringify(jsTreeData,null,2))*/


            self.drawJsTree("jsTreeDivV", subTreeV)
            self.drawJsTree("jsTreeDivH", subTreeH)

        }

        var subTreeV = self.getNodeChildrenSubTree(self.treeV, obj.id.v)
        var subTreeH = self.getNodeChildrenSubTree(self.treeH, obj.id.h)


        if (event.ctrlKey) {

            if (!subTreeH.children || !subTreeV.children)
                return;

            /*    var html = JSON.stringify(obj.id)
                $("#infosDiv").html(html)*/
            var newCanvasData = self.bindData(subTreeV, subTreeH);
            //  drawCanvas.canvasData = drawCanvas.canvasData.concat(newCanvasData);
            $("#graphDiv").html("")
            drawCanvas.drawData(newCanvasData, {})


            ;
        } else {





                return showRectJsTree(obj)


            return;
            // var newCanvasData = self.bindDataToRect(nodeV, nodeH, obj);

        }
    }
    self.onMouseOverRect = function (point, obj) {
        var x = obj

    }


    self.countCommonConcepts = function (conceptA, conceptB) {
        var countCommon = 0;

        function recurse(conceptA, conceptB) {
            if (self.isCommonConcept(conceptA.data, conceptB.data))
                countCommon += 1
            if (conceptA.children)
                conceptA.children.forEach(function (childA) {
                    recurse(childA, conceptB);
                });
            if (conceptB.children)
                conceptB.children.forEach(function (childB) {
                    recurse(childB, conceptA);
                });


        }

        recurse(conceptA, conceptB);
        return countCommon;

    }

    self.getMaxCommonConceptCount = function (node) {
        var max = 0;
        if (node.commonConceptCount)
            max == node.commonConceptCount
        if (node.children) {
            node.children.forEach(function (concept) {
                max = Math.max(concept.commonConceptCount, max)
            })
        }
        return max;
    }

    self.bindData = function (nodeV, nodeH) {

        if (!nodeV.children || !nodeH.children)
            return []
        var interpolateColorFn = d3.scaleSequential(d3.interpolateYlOrRd).domain([0, (self.getMaxCommonConceptCount(nodeH) * self.getMaxCommonConceptCount(nodeH))]);

        var canvasData = [];
        self.commonIntersections = {}
        var margin = 100;
        var x = margin;
        var y = margin;

        var w = Math.round((totalWidth - margin-30) / nodeH.children.length)
        var h = Math.round((totalHeight - margin-30) / nodeV.children.length)
        nodeV.children.forEach(function (conceptV, lineIndex) {

            x = margin


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
                    lineWidth: 1,
                    coords: {x: rowIndex, y: lineIndex, level: 0},
                    id: {h: conceptH.data.id, v: conceptV.data.id, ancestors: []}

                }
                canvasData.push(rect);

                if (rowIndex == 0) {
                    canvasData.push({
                        type: "text",
                        text: conceptV.data.prefLabels[0].value,
                        textAlign: "end",
                        font: "12px  normal",
                        color: "black",
                        x: margin - 15,
                        y: y + (h / 2),
                    })
                    /*    canvasData.push({
                            type: "rect",
                            x: margin - 13,
                            y: y + (h / 2),
                            w: 10,
                            h: 10,
                            bgColor: "#ddd",
                            lineWidth: 1,
                            coords: {x: lineIndex, y: rowIndex, type: "V"}
                        })*/

                }

                if (lineIndex == 0) {

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
                    /*   canvasData.push({
                           type: "rect",
                           x: x + (w / 2),
                           y: margin - 18,
                           w: 10,
                           h: 10,
                           bgColor: "#ddd",
                           lineWidth: 1,
                           coords: {x: lineIndex, y: rowIndex, type: "H"},

                       })*/

                }

                /*     var innerRects = self.bindDataToRect(conceptV, conceptH, rect, interpolateColorFn);
                     canvasData = canvasData.concat(innerRects)*/

                x += w
            })
            y += h
        })


        return canvasData;


    }

    self.bindDataToRect = function (nodeV, nodeH, toNode, interpolateColorFn) {
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
                /*    var innerRects = self.bindDataToRect(conceptV, conceptH, rect, interpolateColorFn);
                    canvasData = canvasData.concat(innerRects)*/
                x += w;
            })
            y += h

        })
        return canvasData;
    }

    self.drawJsTree = function (treeDiv, jsTreeData) {

        var plugins = ["types"];
        /*   plugins.push("search");

           plugins.push("sort");
           //   plugins.push("types");
           plugins.push("contextmenu");
           plugins.push("dnd");
           plugins.push("search");*/

        if ($('#' + treeDiv).jstree)
            $('#' + treeDiv).jstree("destroy")

        $('#' + treeDiv).jstree({
            'core': {
                'check_callback': true,
                'data': jsTreeData,
            },
            "types": {
                "commonConcept": {
                    "icon": "concept-icon.png"
                },
                "default": {
                   // "icon": "concept-icon.png"
                }
            }
            ,
            'plugins': plugins,
            "search": {
                "case_sensitive": false,
                "show_only_matches": true
            }
        }).on("select_node.jstree",
            function (evt, obj) {

            })
    }
    return self;


})()
