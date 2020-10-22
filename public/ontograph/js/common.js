var common = (function () {
    var self = {};
    self.fillSelectOptions = function (selectId, data, withBlanckOption, textfield, valueField) {


        $("#" + selectId).find('option').remove().end()
        if (withBlanckOption) {
            $("#" + selectId).append($('<option>', {
                text: "",
                value: ""
            }));
        }
        if (Array.isArray(data)) {
            data.forEach(function (item, index) {
                $("#" + selectId).append($('<option>', {
                    text: item[textfield] || item,
                    value: item[valueField] || item
                }));
            });
        } else {
            for (var key in data) {
                var item = data[key]
                $("#" + selectId).append($('<option>', {
                    text: item[textfield] || item,
                    value: item[valueField] || item
                }));
            }
            ;
        }

    }

    self.message = function (str, append) {
        if (append) {
            str = $("#messageDiv").html() + str
        }
        $("#messageDiv").html(str);

    }


    self.loadJsTree = function (jstreeDiv, jstreeData, options, callback) {
        var plugins = [];
        if (!options.cascade)
            options.cascade = "xxx"
        if (options.selectDescendants)
            cascade = "down"
        if (options.withCheckboxes)
            plugins.push("checkbox")
        if (options.searchPlugin)
            plugins.push("search")
        if (options.types)
            plugins.push("types")
        if (options.contextMenu)
            plugins.push("contextmenu")
        if ($('#' + jstreeDiv).jstree)
            $('#' + jstreeDiv).jstree("destroy")
        $('#' + jstreeDiv).jstree({

            /* "checkbox": {
                 "keep_selected_style": false
             },*/
            "plugins": plugins,
            "core": {
                'check_callback': true,
                'data': jstreeData
            }, 'checkbox': {
                /*   three_state: options.three_state,
                  cascade: options.cascade,
                  // tie_selection : false,*/
                whole_node: false,
                tie_selection: false,
                three_state: false,
            },
            types: options.types,

            contextmenu: {items: options.contextMenu}


        }).on('loaded.jstree', function () {
            if (options.openAll)
                $('#' + jstreeDiv).jstree(true).open_all();
            $(".jstree-themeicon").css("display", "none")
            $(".jstree-anchor").css("line-height", "18px")
            $(".jstree-anchor").css("height", "18px")
            $(".jstree-anchor").css("font-size", "14px")


        }).on("select_node.jstree",
            function (evt, obj) {

                if (options.selectNodeFn)
                    options.selectNodeFn(evt, obj);
            }).on('open_node.jstree', function () {
            $(".jstree-themeicon").css("display", "none")
            $(".jstree-anchor").css("line-height", "18px")
            $(".jstree-anchor").css("height", "18px")
            $(".jstree-anchor").css("font-size", "14px")
        }).on("check_node.jstree", function (evt, obj) {

            if (options.onCheckNodeFn) {
                options.onCheckNodeFn(evt, obj);
            }


        }).on("uncheck_node.jstree", function (evt, obj) {


            if (options.onUncheckNodeFn) {
                options.onUncheckNodeFn(evt, obj);
            }


        });

    }

    self.addNodesToJstree = function (jstreeDiv, parentNodeId, jstreeData, options) {
        jstreeData.forEach(function (node) {
            $("#" + jstreeDiv).jstree(true).create_node(parentNodeId, node, "last", function () {


            })

        })
        $(".jstree-themeicon").css("display", "none")
        $(".jstree-anchor").css("line-height", "18px")
        $(".jstree-anchor").css("height", "18px")
        $(".jstree-anchor").css("font-size", "14px")
        $("#" + jstreeDiv).jstree(true).open_node(parentNodeId);
        var offset = $(document.getElementById(parentNodeId)).offset();
    }


    self.sliceArray = function (array, sliceSize) {
        var slices = [];
        var slice = []
        array.forEach(function (item) {
            if (slice.length >= sliceSize) {
                slices.push(slice);
                slice = [];
            }
            slice.push(item)
        })
        slices.push(slice);
        return slices;


    }

    self.formatUriToJqueryId = function (uri) {
        var str = uri.toLowerCase().replace("http://", "_");
        return str.replace(/\//g, "_").replace(/\./g, "_");

    }


    return self;


})()
