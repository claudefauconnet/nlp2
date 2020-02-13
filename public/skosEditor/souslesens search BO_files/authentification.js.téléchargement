var authentication = (function () {

    var self = {}

    self.authenticationDBUrl =appConfig.elasticUrl
    self.userIndexes = [];
   


    self.init = function (activate,callback) {
        context = appConfig;
        var url = window.location.host;
        if (appConfig.loginMode != "none") {//  && url.indexOf("localhost")<0 && url.indexOf("127.0.0.1")<0){


            $("#loginDiv").css("visibility", "visible");
            $("#panels").css("visibility", "hidden");
            var width = $(window).width()
            var height = $(window).height()
            $("#loginDiv").width(width).height(height).css("background-color", "#e5ebea").css("top", "0px").css("left", "0");
            ;
            // $("#panels").css("display", "none")

        } else {
            context.currentUser = {
                identifiant: "admin",
                login: "none",
                groups: ["ADMIN","search"]
            }
            mainController.init0();
        }
    }

    self.doLogin = function () {
        var login = $("#loginInput").val();
        var password = $("#passwordInput").val();
        $("#main").css("visibility", "hidden");

        /*   if (!password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/)) {
               $("#loginMessage").html("invalid  login : Minimum eight characters, at least one uppercase letter, one lowercase letter and one number");
           }*/
        var user = null;
        async.series([
            function (callbackSeries) {
                if (appConfig.loginMode == "none") {
                    user = {
                        identifiant: "none",
                        login: "none",
                        groups: "ADMIN"
                    }
                }
                if (appConfig.loginMode != "database")
                    return callbackSeries();
                self.doLoginDatabase(login, password, function (err, result) {
                    if (err)
                        return callbackSeries(err);
                    user = result;
                    return callbackSeries();
                });

            },
            function (callbackSeries) {
                if (appConfig.loginMode != "json")
                    return callbackSeries();
                self.doLoginJson(login, password, function (err, result) {
                    if (err)
                        return callbackSeries(err);
                    user = result;
                    return callbackSeries();
                });

            }


        ], function (err) {
            if (err && err.responseJSON) {
                if (err.responseJSON.ERROR == "changePassword") {
                    //    $("#loginMessage").html("le mot de passe doit être changé (<a href='htmlSnippets/changerMotDePasse.html'>cliquer ici</a>)");
                    $("#loginMessage").html("le mot de passe doit être changé <button onclick='authentication.showChangePasswordDialog()'>OK</button>");
                    context.currentUser = user;
                    mainController.init0();

                    return
                } else if (err.responseJSON.ERROR == "invalidLogin") {
                    return $("#loginMessage").html("identifiant et/ou mot de passe invalide");


                } else {
                    return $("#loginMessage").html(err.responseText);
                }


            }else if(err){
                return $("#loginMessage").html(err.responseText);
            }
            if (!user)
                return $("#loginMessage").html("invalid  login or password");

            var userGroups = user.groups.split(",");
            if (userGroups.indexOf("admin") < 0 && userGroups.indexOf(appConfig.appName) < 0)
                return $("#loginMessage").html("user not allowed on this application  : " + appConfig.appName);

            $("#loginDiv").css("visibility", "hidden");
            $("#main").css("visibility", "visible");
            context.currentUser = user;
            mainController.init0();

        })


    }


    self.doLoginDatabase = function (login, password, callback) {


        var payload = {
            tryLogin: 1,
            login: login,
            password: password,


        }

        $.ajax({
            type: "POST",
            url: self.authenticationDBUrl,
            data: payload,
            dataType: "json",
            success: function (data, textStatus, jqXHR) {
                return callback(null, data);


            }, error: function (err) {

                return callback(err);


            }
        })
        /* var sql = "select * from utilisateur where identifiant='" + login + "' and motDepasse='" + password + "'";
         mainController.execSql(sql, function (err, result) {
             if (err) {
                return callback(err);
             }
             if (result.length == 0)
                return callback();
             return callback(null,result[0]);

         })*/


    }

    self.doLoginJson = function (login, password, callback) {


        var payload = {
            authentify: 1,
            login: login,
            password: password

        }
        $.ajax({
            type: "POST",
            url: self.authenticationUrl,
            data: payload,
            dataType: "json",
            success: function (data, textStatus, jqXHR) {

                if (!$.isArray(data))
                    return callback(err);

                else if (data.length == 0) {
                    return callback();

                }
                var user = {
                    identifiant: login,
                    nomComplet: login,
                    groups: data,
                };
                return callback(null, user);

                // $("#panels").css("display", "block")


            }, error: function (err) {
                return callback(err);


            }
        })

    }


    self.showChangePasswordDialog = function () {
        $("#dialogDiv").dialog("open");

        $("#dialogDiv").load("./htmlSnippets/changerMotDePasse.html"), function () {

        }
    }


    self.changePassword = function () {//page htmlSnippets/ changerMotDePasse.html
        $("#changePassword_message").html("");
        var login = $("#changePassword_identifiant").val();
        var password = $("#changePassword_ancienMotDePasse").val();
        var newPassword = $("#changePassword_nouveauMotDePasse").val();
        var newPassword2 = $("#changePassword_nouveauMotDePasseConfirm").val();
        if (newPassword != newPassword2)
            return $("#changePassword_message").html("le nouveau mot de passe n'est pas le même");
        if (!newPassword.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/))
            return $("#changePassword_message").html("invalid  login : Minimum eight characters, at least one uppercase letter, one lowercase letter and one number");


        var payload = {
            changePassword: 1,
            login: login,
            oldPassword: password,
            newPassword: newPassword,

        }

        $.ajax({
            type: "POST",
            url: self.authenticationDBUrl,
            data: payload,
            dataType: "json",
            success: function (data, textStatus, jqXHR) {
                $("#dialogD3").dialog("close");
                $("#loginMessage").html("le nouveau mot de passe a été changé, identifiez vous a nouveau");
                $("#changePassword_message").html("le nouveau mot de passe a été changé");


            }, error: function (err) {
                $("#changePassword_message").html(err.responseText);


            }
        })


    }

    //save record for authentication : call special method to encrypt password on server
    self.onBeforeSave = function (options, callback) {
        for (var key in options.changes) {
            options.currentRecord[key] = options.changes[key];
        }


        var payload = {
            enrole: 1,
            users: JSON.stringify(options.currentRecord)


        }

        $.ajax({
            type: "POST",
            url: self.authenticationDBUrl,
            data: payload,
            dataType: "json",
            success: function (data, textStatus, jqXHR) {
                mainController.setRecordMessage("enregistrement sauvé");
                return callback("stop");


            }, error: function (err) {

                return callback(err);


            }
        })

    }


    return self;
})()
