const async = require("async");
const util = require("./util.");
const socket = require('../../routes/socket.js');
const request = require('request');
const fs = require('fs');
const csv = require('csv-parser');


function readCsv(path, callback) {
    var separator = ",";
    var headers = [];
    var jsonData = [];
    fs.createReadStream(path)
        .pipe(csv(
            {
                separator: separator,
                mapHeaders: ({header, index}) =>
                    util.normalizeHeader(headers, header)
                ,


            })
            .on('header', function (header) {
                headers.push(header);

            })

            .on('data', function (data) {


                jsonData.push(data)


            })
            .on('end', function () {
                return callback(null, jsonData);
            })
        );
}


var mainPath = "D:\\NLP\\nopd\\wellbore_exploration_last_10_years.csv"

var mainOilPath = "D:\\NLP\\nopd\\wellbore_oil_sample.csv"

var mainLithoPath = "D:\\NLP\\nopd\\wellbore_formation_top.csv"

var mainCoresPath = "D:\\NLP\\nopd\\wellbore_core.csv"

var mainJson = [];
var oilJson = [];
var lithoJson = [];
var coresJson = [];
async.series([


    // read csv
    function (callbackseries) {
        readCsv(mainPath, function (err, result) {
            mainJson = result;
            callbackseries();
        })
    },
    function (callbackseries) {
        readCsv(mainOilPath, function (err, result) {
            oilJson = result;
            callbackseries();
        })
    },
    function (callbackseries) {
        readCsv(mainLithoPath, function (err, result) {
            lithoJson = result;
            callbackseries();
        })
    },
    function (callbackseries) {
        readCsv(mainCoresPath, function (err, result) {
            coresJson = result;
            callbackseries();
        })


    }

    ,
    //prepare payload
    function (callbackseries) {
        var wells = [];

        mainJson.forEach(function (well, index) {

            mainJson[index].formations = [];
            mainJson[index].fuidSamples = [];
            mainJson[index].cores = [];
            if(!mainJson[index].wlbWellboreName)
                return;
            //  lithoJson.forEach(function (litho) {
            for (var i = 0; i < lithoJson.length-1; i++) {
                var litho = lithoJson[i]

                if (mainJson[index].wlbWellboreName == litho.wlbName) {
                    mainJson[index].formations.push(litho);
                }
            }


          oilJson.forEach(function (oil) {
                  if (mainJson[index].wlbWellboreName == oil.wlbName) {
                      mainJson[index].fuidSamples.push(oil);
                  }
              }),

              coresJson.forEach(function (core) {
                  if (mainJson[index].wlbWellboreName == core.wlbName) {
                      mainJson[index].cores.push(core);
                  }
              })


        })


            fs.writeFileSync("D:\\NLP\\nopd\\nopd.json", JSON.stringify(mainJson, null, 2))
        }
    ],

        function (err) {

        }

    )
