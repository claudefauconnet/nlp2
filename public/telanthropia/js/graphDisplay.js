var graphDisplay = (function () {

    var self = {};
    self.loadThesaurus = function (rdfPath, graphDivId) {


        var payload = {
            rdfToEditor: 1,
            rdfPath: rdfPath,
            options: JSON.stringify({
                extractedLangages: "en,fr,sp",
                outputLangage: "en",
                lastBroader: true,
                thesaurusName: "telanthropia"

            })
        }
        $.ajax({
            type: "POST",
            url: "/elastic",
            data: payload,
            dataType: "json",

            success: function (data, textStatus, jqXHR) {
                var visjsData = self.getVisjsData(data);
                visjsGraph.draw(graphDivId, visjsData)


            }
            , error: function (err) {
                $("#messageDiv").html("error" + err.responseText)
                console.log(err.responseText)
                $("#waitImg").css("display", "none");


            }
        })
    }

    self.getVisjsData = function (data, maxLevels, options) {
        var data = data.skos;

        var allnodeIds = [];
        var nodes = [];
        var edges = [];
        var uniqueVedettes=[];

        data.forEach(function (item) {
            if (item.id && allnodeIds.indexOf(item.id) < 0) {
                allnodeIds.push(item.id);
                //
                if (!item.data.prefLabels || item.data.prefLabels.length==0)
                    return;
                var label = item.data.prefLabels[0].value;

                if (label.indexOf("cluster15") != 0)
                    return;




                var vedettes = item.data.altLabels[0].value;
                vedettes = vedettes.split(",")
                vedettes.forEach(function (vedette) {
                    if(uniqueVedettes.indexOf(vedette)<0) {
                        uniqueVedettes.push(vedette)

                        var color = "#d99"
                        var visNode = {
                            label: vedette,
                            id: vedette,
                            color: color,
                            initialColor: color,
                            data: {},
                            shape: "box",
                            size: 10
                        }
                        nodes.push(visNode)



                    }
                })
            }
        })


        data.forEach(function (item) {

                allnodeIds.push(item.id);
                //
                if (!item.data.prefLabels || item.data.prefLabels.length == 0)
                    return;
                var label = item.data.prefLabels[0].value;

                if (label.indexOf("cluster15") != 0)
                    return;

                var visNode = {
                    label: label,
                    id: label,
                    color: "#567",
                    initialColor: "#567",
                    data: {},
                    shape: "box",
                    size: 10
                }
                nodes.push(visNode)

                var vedettes = item.data.altLabels[0].value;
                vedettes = vedettes.split(",")
                vedettes.forEach(function (vedette) {
                    edges.push({
                        from: label,
                        to: vedette,
                        type: "cluster"
                    })
                })

        })


        var visjsData = {nodes: nodes, edges: edges};
        return visjsData
    }


    return self;

})()
