
var skosviewer=(function(){

    var self={};

self.loadJstree=function(treeDiv,file) {
    $.getJSON("data/" + file+".json", function (json) {

        self.drawJsTree(treeDiv, json)
    })
}
        self.drawJsTree = function (treeDiv, jsTreeData) {

            var plugins = [];
            plugins.push("search");

            plugins.push("sort");
            /*   plugins.push("types");
               plugins.push("contextmenu");*/

            if ($('#' + treeDiv).jstree)
                $('#' + treeDiv).jstree("destroy")

            $('#' + treeDiv).jstree({
                'core': {
                    'check_callback': true,
                    'data': jsTreeData,


                }
                , 'contextmenu': {
                    'items': null
                },
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



})();
