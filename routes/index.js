var express = require('express');
var router = express.Router();
var serverParams = {routesRootUrl: ""}


var elasticProxy = require('../bin/elasticProxy');
var authentication = require('../bin/authentication..js');
var configLoader = require('../bin/configLoader..js');
var logger = require("../bin/logger..js");
var indexer = require("../bin/backoffice/indexer..js")
var imapMailExtractor=require("../bin/backoffice/imapMailExtractor.")

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', {title: 'Express'});
});

router.post(serverParams.routesRootUrl + '/elastic', function (req, response) {

    if (req.body.executeQuery) {
        var queryObj = JSON.parse(req.body.executeQuery);
        elasticProxy.executeQuery(queryObj, JSON.parse(req.body.indexes), function (error, result) {
            logger.info("QUERY :" + JSON.stringify(queryObj.query.bool) + "\n indexes :" + req.body.indexes)
            processResponse(response, error, result);

        });

    }

    if (req.body.getIndexConfigs) {
        configLoader.getIndexConfigs(JSON.parse(req.body.userGroups), function (error, result) {
            processResponse(response, error, result)
        });

    }

    if (req.body.saveIndexConfig) {
        configLoader.saveIndexConfig(req.body.index, req.body.jsonStr, function (error, result) {
            processResponse(response, error, result)
        });

    }

    if (req.body.deleteIndexConfig) {
        configLoader.deleteIndexConfig(req.body.index, function (error, result) {
            processResponse(response, error, result)
        });

    }


    if (req.body.executeMsearch) {
        elasticProxy.executeMsearch(req.body.ndjson, function (error, result) {
            processResponse(response, error, result)
        });

    }

    if (req.body && req.body.getTemplates) {
        configLoader.getTemplates(function (error, result) {
            processResponse(response, error, result)
        });
    }
    if (req.body && req.body.generateDefaultMappingFields) {

        configLoader.generateDefaultMappingFields(JSON.parse(req.body.connector), function (error, result) {
            processResponse(response, error, result);

        })

    }
    if (req.body && req.body.runIndexation) {

        indexer.runIndexation(JSON.parse(req.body.config), function (error, result) {
            processResponse(response, error, result);

        })

    }
    if (req.body && req.body.getAllProfiles) {
        configLoader.getAllProfiles (function (error, result) {
            processResponse(response, error, result);
        })
    }
    if (req.body && req.body.writeAllProfiles) {
        configLoader.writeAllProfiles (req.body.profiles,function (error, result) {
            processResponse(response, error, result);
        })
    }




})


router.post('/authDB', function (req, res, next) {
    // console.log(JSON.stringify(req.body))
    if (req.body.tryLogin) {
        authentication.loginInDB(req.body.login, req.body.password, function (err, result) {
            processResponse(res, err, result)

        })

    }
    if (req.body.enrole) {
        if (req.body.enrole) {
            if (typeof req.body.users === "string")
                req.body.users = JSON.parse(req.body.users)
            authentication.enrole(req.body.users, function (err, result) {
                processResponse(res, err, result)

            })
        }
    }
    if (req.body.changePassword) {
        if (req.body.changePassword) {
            authentication.changePassword(req.body.login, req.body.oldPassword, req.body.newPassword, function (err, result) {
                processResponse(res, err, result)

            })
        }
    }





})
router.post('/bailletarchives-authentication', function (req, response) {
    if (req.body.authentify)
        authentication.authentify(req.body.login, req.body.password, function (error, result) {
            processResponse(response, error, result)
        });

});

router.post('/imap', function (req, response) {
    //  console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!" + JSON.stringify(req.body));
    if (req.body.getFolderHierarchy)
        imapMailExtractor.getFolderHierarchy(req.body.imapServer, req.body.mailAdress, req.body.password, req.body.rootFolder, req.body.folderId, function (error, result) {
            processResponse(response, error, result)
        });
});

function processResponse(response, error, result) {
    if (response && !response.finished) {
        /*   res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE'); // If needed
            res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,contenttype'); // If needed
            res.setHeader('Access-Control-Allow-Credentials', true); // If needed.setHeader('Content-Type', 'application/json');*/

        response.setHeader('Access-Control-Allow-Origin', '*');
        response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE'); // If needed
        response.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,contenttype'); // If needed
        response.setHeader('Access-Control-Allow-Credentials', true); // If needed*/


        if (error) {

            if (typeof error == "object") {
                if (error.message)
                    error = error.message
                else
                    error = JSON.stringify(error, null, 2);
            }
            console.log("ERROR !!" + error);
            //   socket.message("ERROR !!" + error);
            return response.status(404).send({ERROR: error});

        } else if (!result) {
            return response.send({done: true});
        } else {

            if (typeof result == "string") {
                resultObj = {result: result};
                //  socket.message(resultObj);
                response.send(JSON.stringify(resultObj));
            } else {
                if (result.contentType && result.data) {
                    response.setHeader('Content-type', result.contentType);
                    if (typeof result.data == "object")
                        response.send(JSON.stringify(result.data));
                    else
                        response.send(result.data);
                } else {
                    var resultObj = result;
                    // response.send(JSON.stringify(resultObj));
                    response.send(resultObj);
                }
            }
        }


    }
}

module.exports = router;
