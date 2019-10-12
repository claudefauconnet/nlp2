var asyncDialog=(function(){
    var self={}
    self.dialogValidated=false
    self.dialogTimer;
    self.validate = function (state) {
        self.dialogValidated=state;

    }


    self.show=function(divId,html,callbackFn){
        html += "<div><button onclick='asyncDialog.validate(true)'>OK</button>" +
            "<button onclick='asyncDialog.validate(false)'>Cancel</button>" +
            "</div>"


        $("#"+divId).html(html);

        self.dialogValidated = "wait";
        self.dialogTimer = setInterval(function () {
            if (self.dialogValidated !="wait") {
                clearInterval(self.dialogTimer)
                    callbackFn(self.dialogValidated);

            }
        }, 500);



    }




    return self;


})()
