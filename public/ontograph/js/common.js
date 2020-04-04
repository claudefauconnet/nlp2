var common=(function(){
    var self={};
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

    self.message=function(str){
        $("#messageDiv").html(str);

    }


    self.loadJsTree=function(jstreeDiv,jstreeData,otpions,callback){

        if ($('#'+jstreeDiv).jstree)
            $('#'+jstreeDiv).jstree("destroy")
        $('#'+jstreeDiv).jstree({

            "checkbox": {
                "keep_selected_style": false
            },
            "plugins": ["checkbox"],
            "core": {
                'check_callback': true,
                'data': jstreeData
            }


        }).on('loaded.jstree', function () {
            $('#'+jstreeDiv).jstree(true).open_all();
            $(".jstree-themeicon").css("display","none")
                $(".jstree-anchor").css("line-height","18px")
            $(".jstree-anchor").css("height","18px")
            $(".jstree-anchor").css("font-size","14px")


        });
        ;

    }



        return self;



})()
