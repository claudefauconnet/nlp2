const async = require("async");
const util = require("./util.");
const socket = require('../../routes/socket.js');
const request = require('request');
const imapMailExtractor = require("./imapMailExtractor.")

//lien pour ouvrir imap
//https://myaccount.google.com/lesssecureapps

var imapCrawler = {

    indexSource: function (config, callback) {

        imapMailExtractor.generateMultiFoldersHierarchyMessages(config,function (err, result) {


        })
    },
    indexJsonArray: function (config,mailsToIndex, callback) {
        var str = "";
        mailsToIndex.forEach(function (mail, pageIndex) {
            var elasticId = Math.round(Math.random() * 100000000);

            var id = "" + elasticId;
           var fields=["Subject","From","To","Reply","Cc","text"];
           var content="";
            fields.forEach(function(key){
                content+="[#"+key+"] "+mail[key]+" [/#]"
            })

            mail["attachment.content"] =content;
         //   mail["attachment.content"] = mail.Subject + ";" + mail.From + ";" + mail.To + ";" + mail.Reply + ";" + mail.Cc + ";" + mail.text + ";"
            str += JSON.stringify({index: {"_index": config.general.indexName, "_type": config.general.indexName, "_id": id}}) + "\r\n"
            str += JSON.stringify(mail) + "\r\n"


        })

        if(config.indexation.elasticUrl.charAt(config.indexation.elasticUrl.length-1)!="/")
            config.indexation.elasticUrl+="/"

        var options = {
            method: 'POST',
            body: str,
            encoding: null,
            headers: {
                'content-type': 'application/json'
            },
            url: config.indexation.elasticUrl+"_bulk"
        };

        request(options, function (error, response, body) {

            if (error)
                return callback(err);
            const elasticRestProxy=require('../elasticRestProxy..js')
            elasticRestProxy.checkBulkQueryResponse(body, function(err,result){
                if(err)
                    return callback(err);
                var message = "indexed " + result.length + " records ";
                socket.message(message)
                return callback()

            })
        })
    }


    , generateDefaultMappingFields: function (connector, callback) {
        var fields= {
                "attachment.To": {type: "text"},
                "attachment.Subject": {type: "text"},
                "attachment.From": {type: "text"},
                "attachment.Reply": {type: "text"},
                "attachment.Cc": {type: "text"},
                "attachment.Date": {type: "date"},
                "attachment.text": {type: "text"}
            }
            return callback(null,fields)
        callback(null, fields)

    }



}
module.exports = imapCrawler;



