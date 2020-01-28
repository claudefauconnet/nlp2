var imapUI=(function(){

var self={};

    self.showFoldersDialog=function(imapServerUrl,emailAdress,emailpassword,rootDir,callback) {

        var html = "  <div id=\"jstreeDiv\" style=\"font-weight: normal;color: saddlebrown;height: 450px; overflow: auto;\"><input type='hidden' id='imapSelectdBox'></div>"
        asyncDialog.show("mainDiv", html, function (ok,selectedBox) {
            if (ok) {
                callback(null,selectedBox)
            }
            else{
                return callback()
            }

        })
        setTimeout(function(){
        imapUI.loadTreeHierarchy (imapServerUrl,emailAdress,emailpassword,rootDir,callback)
        },1000)
    }

self.loadTreeHierarchy = function (imapServerUrl,emailAdress,emailpassword,rootDir,callback){


    $("#waitImg").css("visibility", "visible")
    var payload = {
        getFolderHierarchy: 1,
        //   rootFolder: "testMail2Pdf",
        mailAdress:emailAdress,
        password:emailpassword,
        imapServer: imapServerUrl
    }

    $.ajax({
        type: "POST",
        url: appConfig.imapUrl,
        data: payload,
        dataType: "json",
        success: function (data, textStatus, jqXHR) {
            $("#waitImg").css("visibility", "hidden")
            if (data.length == 0) {
                return;

            }

            if ($("#imapServer").val() != self.storedImapServer)
                localStorage.setItem("mail2pdf_imapServer", $("#imapServer").val())
            if ($("#mailInput").val() != self.storedMailAdress)
                localStorage.setItem("mail2pdf_mailAdress", $("#mailInput").val())


            self.currentState = "OPENED";
            $("#messageDiv").html("Select a box to process");

            $('#jstreeDiv').jstree({
                'core': {
                    'data': data,
                    multiple: true
                }
            }).on('loaded.jstree', function () {
                $('#jstreeDiv').jstree('open_all');
            }).on('changed.jstree', function (e, data) {
                var i, j, r = [];
                var str = ""
            if( confirm("index box :"+data.node.text +"and all subFolders"))


                asyncDialog.validate(true,data.node.text)
                $("#messageDiv").html(data.node.text + " selected");


            })
        },
        error: function (err) {
            $("#waitImg").css("visibility", "hidden")
            console.log(err);
            self.currentState = "";
            $("#messageDiv").html("ERROR " + err.responseText);
        }
    })


}

self.getJsTreeSelectedNodes = function (dontCleanMessages) {
    var selectedData = [];
    var selectedIndexes;
    if (!dontCleanMessages) {
        $("#messageDiv2").html("");
        $("#messageDiv3").html("");
    }
    //  $("#messageDiv").html("");
    selectedIndexes = $("#jstreeDiv").jstree("get_selected", true);
    jQuery.each(selectedIndexes, function (index, value) {
        selectedData.push(selectedIndexes[index]);
    });
    return selectedData;
}

self.scanFolderPdfArchive = function () {
    self.generateFolderPdfArchive(false, true);

}

self.generateFolderPdfArchive = function (withAttachments, scanOnly) {


    var selectedNodes = self.getJsTreeSelectedNodes();
    if (selectedNodes.length == 0) {
        return alert("select a root folder first");

    }
    $("#messageDiv3").html("Processing...");
    $("#messageDiv2").html("");
    $("#messageDiv").html("");
    $("#waitImg").css("visibility", "visible")
    self.currentState = "ARCHIVE_PROCESSING";
    //  var folder = selectedNodes[0];
    var folderPathes = [];
    var folderIds = [];
    selectedNodes.forEach(function (folder) {
        var folderPath = ""
        for (var i = 0; i < folder.original.ancestors.length; i++) {
            if (i > 0)
                folderPath += "/";
            folderPath += folder.original.ancestors[i];
        }
        folderPathes.push(folderPath)
        folderIds.push(folder.id)
    })
    var payload = {
        generateMultiFoldersHierarchyMessages: 1,
        rootFolders: folderPathes,
        mailAdress: $("#mailInput").val(),
        password: $("#passwordInput").val(),
        imapServer: $("#imapServer").val(),
        folderIds: folderIds

    }
    if (scanOnly)
        payload.scanOnly = true
    else
        $("#generateFolderPdfArchiveWithAttachmentButton").css("visibility", "hidden");
    if (withAttachments)
        payload.withAttachments = true;

    $.ajax({
        type: "POST",
        url: serverUrl,
        data: payload,
        timeout: 1000 * 3600 * 2,
        dataType: "json",
        success: function (data, textStatus, jqXHR) {


            self.currentState = "ARCHIVE_DONE";
            $("#waitImg").css("visibility", "hidden");
            $("#downloadJournalButton").css("visibility", "visible")


            $("#messageDiv3").html("<B>" + data.text + "</B>");

            if (scanOnly) {
                //  self.downloadJournal();
                var status = data.status;
                var WithAttachmentButtonState = true;
                var messagesOnlyButtonState = true;
                if (status == "ko") {
                    WithAttachmentButtonState = true;
                    messagesOnlyButtonState = true;


                } else if (status == "okMessagesOnly") {
                    WithAttachmentButtonState = true;
                    messagesOnlyButtonState = false;
                } else if (status == "okAll") {
                    WithAttachmentButtonState = false;
                    messagesOnlyButtonState = false;
                }
                $("#generateFolderPdfArchive").css("visibility", "visible")
                $("#generateFolderPdfArchiveButton").css("visibility", "visible")
                $("#generateFolderPdfArchiveWithAttachmentButton").css("visibility", "visible")
                $("#generateFolderPdfArchiveButton").prop('disabled', messagesOnlyButtonState);
                $("#generateFolderPdfArchiveWithAttachmentButton").prop('disabled', WithAttachmentButtonState);


                return;
            }

            if (data.length == 0) {
                return;

            }
            setTimeout(function () {// time to effectivly write files on server (if zip is incomplete and delete dir fails ( not empty)
                self.downloadArchive(data.pdfArchiveRootPath)
            }, 3000)


        },
        error: function (err, status) {

            console.log(status);
            $("#downloadJournalButton").css("visibility", "visible")
            $("#waitImg").css("visibility", "hidden")
            console.log(err);
            self.currentState = "";
            $("#messageDiv").html("ERROR : " + err.responseText);
        }
    })


}
return self;
})()
