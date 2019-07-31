var mainController=(function(){

    var self={};
    self.minAutoValidateQuestionLength=4
   self.windowHeight=$(window).height();
    self.windowWidth=$(window).width();

    self.bindControls=function(){

        $("#questionInput").keyup(function(){
           var str=$(this).val();
           if(str.length>=minAutoValidateQuestionLength)
               context.question=str;
        })
    }



    return self;


})();
