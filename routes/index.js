var express = require('express');
var router = express.Router();
var serverParams = {routesRootUrl: ""}


var elasticProxy = require('../bin/elasticProxy');
var authentication=require('../bin/authentication..js');
var configLoader=require('../bin/configLoader..js');
var logger = require("../bin/logger..js");


/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', {title: 'Express'});
});

router.post(serverParams.routesRootUrl + '/elastic', function (req, response) {

    if (req.body.executeQuery) {
        var queryObj=JSON.parse(req.body.executeQuery);
        elasticProxy.executeQuery(queryObj, JSON.parse(req.body.indexes), function (error, result) {
            logger.info("QUERY :"+JSON.stringify(queryObj.query.bool)+ "\n indexes :"+req.body.indexes)
            processResponse(response, error, result);
          /*  if( error)
              return  processResponse(response, error, result)
            configLoader.getIndexConfigs(JSON.parse(req.body.indexes),function(err, configs){
                result.configs=configs;
                processResponse(response, error, result)
            })*/

        });

    }

    if (req.body.getIndexConfigs) {
        configLoader.getIndexConfigs(JSON.parse(req.body.indexes),function(error, result){
            processResponse(response, error, result)
        });

    }


    if (req.body.executeMsearch) {
        elasticProxy.executeMsearch(req.body.ndjson, function (error, result) {
            processResponse(response, error, result)
        });

    }


    if (req.body && req.body.searchWordAll)
        elasticProxy.searchWordAll(req.body.searchWordAll, function (error, result) {
            processResponse(response, error, result)
        });
    else if (req.body && req.body.searchDo)
        elasticProxy.searchUI.search(req.body.indexName, req.body.type, req.body.payload, function (error, result) {
            processResponse(response, error, result)
        });
    else if (req.body && req.body.indexOneDoc)
        elasticProxy.indexOneDoc(req.body.indexName, req.body.type, req.body.id, req.body.payload, function (error, result) {
            processResponse(response, error, result)
        });

    else if (req.body && req.body.findTerms)
        elasticProxy.findTerms(req.body.indexName, req.body.type, req.body.field, req.body.terms, function (error, result) {
            processResponse(response, error, result)
        });

    else if (req.body && req.body.findDocuments) {
        //  var options = req.body.options;
        if (typeof req.body == "string")
            var options = JSON.parse(req.body).options
        elasticProxy.findDocuments(req.body.options, function (error, result) {
            processResponse(response, error, result)
        });
    } else if (req.body && req.body.findDocumentsById)
        elasticProxy.findDocumentsById(req.body.indexName, req.body.ids, req.body.words, function (error, result) {
            processResponse(response, error, result)
        });

    else if (req.body && req.body.findByIds)
        elasticProxy.findByIds(req.body.options.indexName, req.body.ids, req.body.returnFields, function (error, result) {
            processResponse(response, error, result)
        });
})


router.post('/authDB', function (req, res, next) {
    console.log(JSON.stringify(req.body))
    if (req.body.tryLogin) {
        authentication.loginInDB(req.body.login, req.body.password, function (err, result) {
            processResponse(res, err, result)

        })

    }
})
router.post('/bailletarchives-authentication', function (req, response) {
    if (req.body.authentify)
        authentication.authentify(req.body.login, req.body.password, function (error, result) {
            processResponse(response, error, result)
        });

});

function processResponse(response, error, result) {
    if (response && !response.finished) {
        /* res.setHeader('Access-Control-Allow-Origin', '*');
         res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE'); // If needed
         res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,contenttype'); // If needed
         res.setHeader('Access-Control-Allow-Credentials', true); // If needed.setHeader('Content-Type', 'application/json');
         */
        response.setHeader('Access-Control-Allow-Origin', '*');
        response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE'); // If needed
        response.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,contenttype'); // If needed
        response.setHeader('Access-Control-Allow-Credentials', true); // If needed


        if (error) {
            if (typeof error == "object") {
                error = JSON.stringify(error, null, 2);
            }
            console.log("ERROR !!" + error);
            //   socket.message("ERROR !!" + error);
            response.status(404).send({ERROR: error});

        } else if (!result) {
            response.send({done: true});
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
