var express = require('express');
var router = express.Router();
var serverParams = {routesRootUrl: ""}


var elasticRestProxy = require('../bin/elasticRestProxy..js');
var authentication = require('../bin/authentication..js');
var configLoader = require('../bin/configLoader..js');
var logger = require("../bin/logger..js");
var indexer = require("../bin/backoffice/indexer..js")
var imapMailExtractor = require("../bin/backoffice/imapMailExtractor.");
var jobScheduler = require("../bin/backoffice/jobScheduler.")
var statistics = require("../bin/backoffice/statistics.")
var questionAnswering = require("../bin/questionAnswering.");
var annotator_skos = require("../bin/backoffice/annotator_skos.");
var skosReader = require("../bin/backoffice/skosReader..js");
/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', {title: 'Express'});
});


router.post(serverParams.routesRootUrl + '/elastic', function (req, response) {

        if (req.body.executeQuery) {
            var queryObj = JSON.parse(req.body.executeQuery);
            var indexesStr = "";
            var indexes = JSON.parse(req.body.indexes);
            if (Array.isArray(indexes)) {
                indexes.forEach(function (index, p) {
                    if (p > 0)
                        indexesStr += ","
                    indexesStr += index;
                })
            } else
                indexesStr = indexes
            elasticRestProxy.executePostQuery(indexesStr + "/_search", queryObj, function (error, result) {
                logger.info("QUERY :" + JSON.stringify(queryObj.query.bool) + "\n indexes :" + req.body.indexes)
                processResponse(response, error, result);

            });

        }

        if (req.body.getUserIndexConfigs) {
            configLoader.getUserIndexConfigs(JSON.parse(req.body.userGroups), function (error, result) {
                processResponse(response, error, result)
            });

        }

        if (req.body.saveIndexConfig) {
            configLoader.saveIndexConfig(req.body.index, req.body.jsonStr, function (error, result) {
                processResponse(response, error, result)
            });

        }

        if (req.body.deleteIndexConfig) {
            var config = JSON.parse(req.body.config);
            if (req.body.deleteIndexContent) {
                indexer.deleteIndex(config, function (err, result) {
                    if (err)
                        return processResponse(response, error, result)

                    configLoader.deleteIndexConfig(config.general.indexName, function (error, result) {
                        processResponse(response, error, result)
                    });
                })

            } else {
                configLoader.deleteIndexConfig(req.body.config.general.indexName, function (error, result) {
                    processResponse(response, error, result)
                });
            }
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
            configLoader.getAllProfiles(function (error, result) {
                processResponse(response, error, result);
            })
        }
        if (req.body && req.body.writeAllProfiles) {
            configLoader.writeAllProfiles(req.body.profiles, function (error, result) {
                processResponse(response, error, result);
            })
        }

        if (req.body && req.body.getAllJobs) {
            configLoader.getAllJobs(function (error, result) {
                processResponse(response, error, result);
            })
        }
        if (req.body && req.body.saveAllJobs) {
            configLoader.saveAllJobs(req.body.jobsStr, function (error, result) {
                processResponse(response, error, result);
            })
        }


        if (req.body && req.body.getAllThesaurusConfig) {
            configLoader.getAllThesaurusConfig(function (error, result) {
                processResponse(response, error, result);
            })
        }

        if (req.body && req.body.saveThesaurusConfig) {
            configLoader.saveThesaurusConfig(req.body.name, req.body.content, function (error, result) {
                processResponse(response, error, result);
            })
        }
        if (req.body && req.body.getUserThesauri) {
            configLoader.getUserThesaurus(JSON.parse(req.body.userGroups), function (error, result) {
                return processResponse(response, error, result);
            })
        }


        if (req.body && req.body.jobScheduler) {
            if (req.body.run) {
                jobScheduler.run(function (error, result) {
                    processResponse(response, error, result);
                })
            }
            if (req.body.stop) {
                jobScheduler.stop(function (error, result) {
                    processResponse(response, error, result);
                })
            }
        }
        if (req.body.tryLogin) {
            authentication.loginInDB(req.body.login, req.body.password, function (err, result) {
                processResponse(response, err, result)

            })

        }
        if (req.body.annotateCorpusFromRDFfile) {
            annotator_skos.annotateCorpusFromRDFfile(JSON.parse(req.body.thesaurusConfig), req.body.index, req.body.elasticUrl, function (err, result) {
                processResponse(response, err, result)

            })

        }


        if (req.body.answerQuestion) {
            questionAnswering.processQuestion(req.body.question, JSON.parse(req.body.options), function (err, result) {
                processResponse(response, err, result)

            })

        }


        if (req.body.rdfToEditor) {
            skosReader.rdfToEditor(req.body.rdfPath, JSON.parse(req.body.options), function (err, result) {
                processResponse(response, err, result)
            })
        }
        if (req.body.skosEditorToRdf) {
            skosReader.skosEditorToRdf(req.body.rdfPath,JSON.parse(req.body.data) ,JSON.parse(req.body.options), function (err, result) {
                processResponse(response, err, result)
            })
        }


    },
    router.get('/heatMap', function (req, res, next) {
        var elasticQuery = JSON.parse(req.query.query);

        statistics.getEntitiesMatrix(null, elasticQuery, function (err, result) {
            processResponse(res, err, result)
        })
    })
)


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
                    response.setHeader('Content-type', "application/json");
                    // response.send(JSON.stringify(resultObj));
                    response.send(resultObj);
                }
            }
        }


    }
}

module.exports = router;
