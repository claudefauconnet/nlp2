var questions = (function () {
    var self = {};


    self.testQuestions = [
        "",
        " What is the definition of runout? ",
        "What is the class balancing of a fan? ",
        "On which equipments should we High speed balance the rotor",
        "What is the vibration limit before to perform an High speed balance. ",
        "Which bearing should be used to perform High speed balance",
        "Should we install the coupling hub to perform an High speed balance.",
        "What is the recommended maintenance startegy of valves for unspared reciprocating compressors",
        "What is the normal clerance between unloader spindle and valve lifter ",
        "What are the recommended spare parts for reciprocating compressors valves",
        "What is the appropriate strategy to apply on stand-by oil pumps. ",
        "What are the preventiv tasks on a stand-by turbine",
        "Can I operate a turbine equipped with dry gas seal at slowroll speed",
        "Which kind of analyses are recommended on lubrification oil ",
        "What is the definition of a critical equipement level 1",
        "What are the recommended shutdown functions of a process gas system  of  reciprocating compressors",
        "What is the recommended basic instrumentation for the monitoring and protection of electric motor direct driven reciprocating  compressors",
        "Which trip logic is recommended for reciprocating compressors machine protection?",
        "Is there a time delay for trip by crosshead vibrations?",
        "How to trip a reciprocating compressor ?",
        "what is the minimum monitoring for reciprocating compressor",
        "what is the typical duration between major overhaul of centrifugal compressor",
        "when can I accept an inducer in a API pump",
        "What is the maximum response time of an anti-surge system ",
        "What is the response time of an anti-surge controller",
        "What is a surge control line",
        "What is the definition of the surge",
        "What is a SCL",
        "What is the definition of the surge phenomenon",
        "What are the consequence of a surge",
        "what are the main components of anti surge system",
        "What are factors which generate surge event",
        "What is the consequence of compressor flow decrease. ",
        "Do we need redundant antisurge control system?",
        "what is the liftime of rider rings",
        "what is the best monitoring for rider ring wearing",
        "What are the recommended mineral oil grades for reciprocating compressors cylinders lubrication",
        "What is the maximum allowable vibration on a radial bearing?  ",
        "What is the maximum allowable differential casing temperature on steam turbine",
        "what is maximum casing differential temperature on steam turbine during startup",
        "Where shall be located inlet pressure measurment on a steam turbine",
        "what is typical filter mesh size for lube oil during flushing",
        "what is an acceptable oil cleanliness"
    ]

    self.testAnswers = []

    self.testQuestions.sort()
    self.loadQuestions = function () {

        self.testQuestions.forEach(function (item, index) {
            $("#testQuestionsSelect").append($('<option>', {
                text: item,
                value: item
            }));
        });
    }

    self.processQuestion = function (question, callback) {

        var payload = {
            answerQuestion: 1,
            question: question,
            options: JSON.stringify({
                questionsIndex: "question_en",
                corpusIndex: "gmec_par",
                thesaurusIndex: "thesaurus_ctg",

            })
        }
        $.ajax({
            type: "POST",
            url: appConfig.elasticUrl,
            data: payload,
            dataType: "json",
            success: function (data, textStatus, jqXHR) {
                callback(null, data)
            }
            , error: function (err) {
                console.log(err.responseText)
                callback(err.responseText)
            }
        });

    }

    self.listAnswers = function (question) {
        if (question == "")
            return;

        self.processQuestion(question, function (err, result) {
            if (err)
                ("#responsesDiv").html(err);


            var allHtml = "";
            var entityNames = [];
            result.responses.forEach(function (response) {
                response.matchingEntities.forEach(function (entity) {
                    if (entityNames.indexOf(entity.id) < 0)
                        entityNames.push(entity.id)
                })

                var html=self.getResponseHtml(response, entityNames)




                allHtml += html
            })
            $("#responsesDiv").html(allHtml);


        })


    }
    self.getResponseHtml = function (hit, entityNames) {
        var documentHtml = hit.document;
        var chapterHtml = hit.chapter;
        var paragraphHtml = hit.paragraph;
        hit.matchingEntities.forEach(function (entity) {


            entity.offsets.sort(function (a, b) {
                if (a.start > b.start)
                    return -1;
                if (b.start > a.start)
                    return 1;
                return 0;


            })
            if (true) {

                function insertEm(html,offset,emClassIndex){
                    return html;
                    var p=html.toLowerCase().lastIndexOf(offset.syn.toLowerCase())
                    if(p<0)
                        return html;
                    var q=p+1+offset.syn.length
                    var str1=html.slice(0, p);
                    var str2=offset.syn
                    var str3=html.slice(q,html.length-1);
                  return str1+ "<em class='E_" +( entityNames.length - 1) + "'>"+str2+"</em>"+str3;
                }

                entity.offsets.forEach(function (offset) {
                    if (offset.field = "docTitle") {
                        documentHtml =insertEm(documentHtml,offset, entityNames.length - 1)

                    }
                    if (offset.field = "parentChapter") {
                        chapterHtml =insertEm(chapterHtml,offset, entityNames.length - 1)               }
                    if (offset.field = "text") {
                        paragraphHtml =insertEm(paragraphHtml,offset, entityNames.length - 1)                         }
                })



            }
        })
       var  html = "<div style='border-color: #6a7179;border-style: solid; border-radius: 5px'>"
        html += "<div style='font-weight: bold'>" + documentHtml + "</div>"
        html += "<div style='font-weight: normal;font-style: italic;'>" + chapterHtml + "</div>";
        html += "<div>" + paragraphHtml + "</div></div>"

        return html;

    }


    return self;
})()
