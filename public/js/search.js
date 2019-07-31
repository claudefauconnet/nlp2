var Search=(function(){
var self={};


self.analyzeQuestion=function(question, callback){
    var regex=/[.*^\s]\s*/gm
 var words=question.trim().split(regex);

    var sentencesArray=[];
    var currentSentence=null;
    var simpleWordsArray=[];
    var wildCardWordsArray=[];
    var wordsArray=[];


    // analyze question step 1 ! separate words and sentences
    var status="word"
 words.forEach(function(word){

    if(word.charAt(0)=='"'){
        currentSentence=word;
        status="sentence"
    }
    else if(status=="sentence") {
        currentSentence += " " + word;

        if (word.charAt(word.length) == '"') {
            sentencesArray.push(currentSentence);
            currentSentence=null;
        }
    }
    else{
        wordsArray.push(word);
    }
 })

    // analyze question step 2 ! process wildcard in wordsArray

    wordsArray.forEach(function(word){
        if( word.indexOf("*")>-1){
            wildCardWordsArray.push(word)
        }
        else{
            simpleWordsArray.push(word)
        }


    })




    //getElementaryQuery match +slop  -->sentencesArray

    // wordArray bool should (or)
      //if * in word array should clause  "wildcard": {"content": word}

    // beetween words wordArray bool must
    //if * in word array should clause  "wildcard": {"content": word}



}







return self;


})()
