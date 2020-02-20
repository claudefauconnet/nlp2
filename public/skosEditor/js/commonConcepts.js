var commonConcepts = (function () {
    var self = {};

    self.setAncestorsCommonConcepts = function (tree, commonConcepts) {
        function recurse(child) {

            if (child && child.parent && child.parent != "#") {
                if (child.parent == "xs:element_Kind_711")
                    var xx = 3;
                if (child.commonConceptCount > 0 && comparator.conceptsMap[child.parent]) {
                    comparator.conceptsMap[child.parent].commonConceptCount += child.commonConceptCount;
                    child.commonConcepts.forEach(function (commonConcept) {
                        var array = comparator.conceptsMap[child.parent].commonConcepts;
                        if (comparator.conceptsMap[child.parent].commonConcepts.indexOf(commonConcept) < 0)
                            comparator.conceptsMap[child.parent].commonConcepts.push(commonConcept)
                    })
                }
                //  console.log(child.id + "-------------\n" + JSON.stringify(comparator.conceptsMap[child.parent].commonConcepts, null, 2))
            }
            if (child && child.parent)
                recurse(comparator.conceptsMap[child.parent])
        }


        if (commonConcepts) {
            for (var key in comparator.conceptsMap) {
                if (key == "enumeration_LithologyQualifierKind_marl")
                    var xx = 3;
                recurse(comparator.conceptsMap[key]);
            }
        }
    }


    self.compareThesaurus = function (rdfPath1, rdfPath2, callback) {
        var lang = "en";
        var withSynonyms = true;
        callback = null;
        var options = {
            outputLangage: lang,
            extractedLangages: lang,
            withSynonyms: withSynonyms,
        }


        var payload = {
            compareThesaurus: 1,
            rdfPath1: rdfPath1,
            rdfPath2: rdfPath2,
            options: JSON.stringify(options)
        }
        $("#waitImg").css("display", "block");
        $.ajax({
            type: "POST",
            url: "/elastic",
            data: payload,
            dataType: "json",

            success: function (data, textStatus, jqXHR) {

             var xx= $("#commonConceptsTA").val();
             if(!xx || xx==""){
                 $("#graphDiv").html("<textArea id='commonConceptsTA' row='50' cols='150'></textArea>")
             }
              /*  if (callback)
                    return callback(null, data)*/
                var str = data.thesaurus1.name+"\t"+data.thesaurus1.commonConcepts.length + "\t" +data.thesaurus1.nonCommonConcepts.length +"\t";
               str += data.thesaurus2.name+"\t"+data.thesaurus2.commonConcepts.length + "\t" +data.thesaurus2.nonCommonConcepts.length + "\t" + data.commonConceptLemmas .toString()+ "\n";

               var oldStr= $("#commonConceptsTA").val()
                $("#commonConceptsTA").val(oldStr+str)
                $("#waitImg").css("display", "none");
            }
            , error: function (err) {
                if (callback)
                    callback(err.responseText)
                console.log(err.responseText)
                $("#waitImg").css("display", "none");


            }
        })


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


    self.isCommonConcept = function (a, b, withoutAlLabels) {
        var ok = false;
        if (!a.prefLabels || !a.prefLabels)
            return ok;

        var valuesA = [];
        var valuesB = [];
        a.prefLabels.forEach(function (prefLabelA) {
            b.prefLabels.forEach(function (prefLabelB) {
                if (prefLabelA.value.toLowerCase() == prefLabelB.value.toLowerCase())
                    ok = true;
                return ok;
            })

        })


        if (!withoutAlLabels) {
            a.altLabels.forEach(function (prefLabelA) {
                b.altLabels.forEach(function (prefLabelB) {
                    if (prefLabelA.value.toLowerCase() == prefLabelB.value.toLowerCase())
                        ok = true;
                    return ok;
                })

            })
        }

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


    self.showMapSelectionCommonConcepts = function (vId, hId) {
        $("#CommonConceptsDiv").html("");


        var selCommonConcepts = self.getIntersectionCommonConcepts(hId, vId)
        var html = "<ul>";

        selCommonConcepts.forEach(function (commonConcept) {
            var array = commonConcept.split(" | ")
            html += "<li><ul onclick=\"commonConcepts.onIntersectionCommonConceptsClick('" + array[0] + "','" + array[1] + "')\">" + "<li class='conceptH'>" + array[0] + "</li><li class='conceptV'>" + array[1] + "</li></ul></li>"
        })
        html += "</ul>";
        $("#CommonConceptsDiv").html(html)
        $("#CommonConceptsCount").html(selCommonConcepts.length)


    }


    self.onIntersectionCommonConceptsClick = function (commonConceptH, commonConceptV) {
        comparator.displayPopupDiv("popupDiv");
        var vConcept = comparator.conceptsMap[commonConceptV];
        var hConcept = comparator.conceptsMap[commonConceptH];
        var textHColor = $("#thesaurusH").css("background-color");
        var textVColor = $("#thesaurusV").css("background-color");
        $("#jstreeTtitleH").html($('#thesaurusH').val())
        $("#jstreeTtitleV").html($('#thesaurusV').val())
        skosEditor.conceptEditor.editConcept(vConcept.data, "editorDivVId", {readOnly: true, bgColor: textVColor})
        skosEditor.conceptEditor.editConcept(hConcept.data, "editorDivHId", {readOnly: true, bgColor: textHColor});

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

})
()
