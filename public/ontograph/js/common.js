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

        data.forEach(function (item, index) {
            $("#" + selectId).append($('<option>', {
                text: item[textfield] || item,
                value: item[valueField] || item
            }));
        });

    }

    self.message = function (str) {
        $("#messageDiv").html(str);

    }


    self.loadJsTree = function (jstreeDiv, jstreeData, options, callback) {
        var plugins = [];
        if (options.withCheckboxes)
            plugins.push("checkbox")
        if ($('#' + jstreeDiv).jstree)
            $('#' + jstreeDiv).jstree("destroy")
        $('#' + jstreeDiv).jstree({

            "checkbox": {
                "keep_selected_style": false
            },
            "plugins":plugins,
            "core": {
                'check_callback': true,
                'data': jstreeData
            }, 'checkbox': {
                three_state: false,
                cascade: 'xxx',
                // tie_selection : false,
                whole_node: false
            },


        }).on('loaded.jstree', function () {
            $('#' + jstreeDiv).jstree(true).open_all();
            $(".jstree-themeicon").css("display", "none")
            $(".jstree-anchor").css("line-height", "18px")
            $(".jstree-anchor").css("height", "18px")
            $(".jstree-anchor").css("font-size", "14px")


        }).on("select_node.jstree",
            function (evt, obj) {

                if (options.selectNodeFn)
                    options.selectNodeFn(evt, obj);
            });

    }


    return self;


})()
