var MainController=(function(){

    var self={};

    self.initClasses=function(){


        Sparql_facade.getClasses(function(err, result){
            if(err)
                return self.setMessage(err)
            var color="#ddd"
            var nodes=[];
            result.forEach(function(item){
                nodes.push({id: item.class.value, text: "<span class='tree_level_1' style='background-color: " + color + "'>" + item.classLabel.value + "</span>", children: [], parent: "#"})
            })

            if ($('#jstreeClassDiv').jstree)
                $('#jstreeClassDiv').jstree("destroy")
            $("#jstreeClassDiv").jstree({

                "checkbox": {
                    "keep_selected_style": false
                },
                "plugins": ["checkbox"],
                "core": {
                    'check_callback': true,
                    'data': nodes
                }


            });


        })


    }


    self.graphClasses=function(word) {


    }
    self.setMessage=function(message) {
    $("#messageDiv").html(message)
    }

    return self;


})()
