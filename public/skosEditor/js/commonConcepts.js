var commonConcepts=(function(){
    var self={};

    self.setAncestorsCommonConcepts = function (tree, commonConcepts) {
        function recurse(child) {

            if ( child && child.parent && child.parent != "#") {
                if( child.parent=="xs:element_Kind_711")
                    var xx=3;
                if (child.commonConceptCount > 0) {
                    comparator.conceptsMap[child.parent].commonConceptCount += child.commonConceptCount;
                    child.commonConcepts.forEach(function (commonConcept) {
                        var array = comparator.conceptsMap[child.parent].commonConcepts;
                        if (comparator.conceptsMap[child.parent].commonConcepts.indexOf(commonConcept) < 0)
                            comparator.conceptsMap[child.parent].commonConcepts.push(commonConcept)
                    })
                }
                //  console.log(child.id + "-------------\n" + JSON.stringify(comparator.conceptsMap[child.parent].commonConcepts, null, 2))
            }
            if( child && child.parent)
                recurse(comparator.conceptsMap[child.parent])
        }


        if (commonConcepts) {
            for (var key in comparator.conceptsMap) {
                if(key=="enumeration_LithologyQualifierKind_marl")
                    var xx=3;
                recurse(comparator.conceptsMap[key]);
            }
        }
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

    self.getIntersectionCommonConcepts = function (hId, vId) {
        var vConcept = comparator.conceptsMap[vId];
        var hConcept = comparator.conceptsMap[hId];
        var selCommonConcepts = [];
        vConcept.commonConcepts.forEach(function (commonConceptV) {
            hConcept.commonConcepts.forEach(function (commonConceptH) {
                if (commonConceptV == commonConceptH) {
                    selCommonConcepts.push(commonConceptV)
                }
            })
        })
        return selCommonConcepts;
    }


    self.showMapSelectionCommonConcepts= function (vId, hId) {
        $("#CommonConceptsDiv").html("");


        var selCommonConcepts = self.getIntersectionCommonConcepts(hId, vId)
        var html = "<ul>";

        selCommonConcepts.forEach(function (commonConcept) {
            var array = commonConcept.split(" | ")
            html += "<li><ul onclick=\"commonConcepts.onIntersectionCommonConceptsClick('" + array[0] + "','" + array[1] + "')\">" + "<li class='conceptH'>"+array[0]+"</li><li class='conceptV'>"+array[1]+"</li></ul></li>"
        })
        html += "</ul>";
        $("#CommonConceptsDiv").html(html)
        $("#CommonConceptsCount").html(selCommonConcepts.length)


    }





    self.onIntersectionCommonConceptsClick = function (commonConceptH, commonConceptV) {
        var vConcept = comparator.conceptsMap[commonConceptV];
        var hConcept = comparator.conceptsMap[commonConceptH];
        skosEditor.conceptEditor.editConcept(vConcept.data, "editorDivVId",{readOnly: true})
        skosEditor.conceptEditor.editConcept(hConcept.data, "editorDivHId",{readOnly: true});
        $(".myClass").css("background-color", "#00FFFF");
        $(".myClass").css("background-color", "#00FFFF");
        $("#editorDivVId").animate({'zoom': .7}, 'slow');
        $("#editorDivHId").animate({'zoom': .7}, 'slow');
        return;
        self.commonConceptH = commonConceptH;
        self.commonConceptV = commonConceptV;

        function scrollToSelectdNode(jstreeDiv, callback) {
            var node = $('#' + jstreeDiv).jstree('get_selected', true)[0];
            var ancestors = node.parents;
            ancestors.push(node.id);
            var y = 0;
            ancestors.forEach(function (ancestor) {
                var node = $('#' + jstreeDiv).jstree(true).get_node(ancestor);
                if (node && node.li_attr) {
                    var li = node.li_attr.id;
                    var liElt = document.getElementById(li);
                    y += $(liElt).offset().top;
                }

            })
            y -= $('#' + jstreeDiv).scrollTop()
            $('#' + jstreeDiv).scrollTop(y - 150)
            callback()
        }

        async.series([

            function (callbackSeries) {

                $('#jsTreeDivV').jstree("deselect_all");
                callbackSeries();
            },
            function (callbackSeries) {
                $('#jsTreeDivV').jstree("deselect_all");
                callbackSeries();
            },
            function (callbackSeries) {
                $('#jsTreeDivV').jstree('select_node', commonConceptV);
                callbackSeries();
            },
            function (callbackSeries) {
                $("#jsTreeDivV").jstree("open_node", commonConceptV, function (e, d) {
                    for (var i = 0; i < e.parents.length; i++) {
                        $("#jsTreeDivV").jstree('open_node', e.parents[i]);

                    }
                    callbackSeries();
                })
            },
            function (callbackSeries) {
                $('#jsTreeDivH').jstree('select_node', commonConceptH);
                callbackSeries();
            },
            function (callbackSeries) {
                $("#jsTreeDivH").jstree("open_node", commonConceptH, function (e, d) {
                    for (var i = 0; i < e.parents.length; i++) {
                        $("#jsTreeDivH").jstree('open_node', e.parents[i]);

                    }
                    callbackSeries();
                })


            },
            function (callbackSeries) {
                scrollToSelectdNode("jsTreeDivH", function (err) {
                    callbackSeries();
                })

            },
            function (callbackSeries) {
                scrollToSelectdNode("jsTreeDivV", function (err) {
                    callbackSeries();
                })


            }


        ], function (err) {


        })
    }




    return self;

})()
