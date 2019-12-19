const request = require('request');


const elasticUrl = "http://localhost:9200/";
const debug=true;
var elasticRestProxy = {


    executePostQuery: function (url, query, callback) {
        if(url.toLowerCase().trim().indexOf("http")<0)
            url=elasticUrl+url;
        var options = {
            method: 'POST',
            json: query,
            headers: {
                'content-type': 'application/json'
            },
            url:  url
        };
        if(debug)
            console.log(JSON.stringify(query,null,2));
        request(options, function (error, response, body) {
            if (error)
                return callback(error);

            if (url.indexOf("_bulk") > -1) {
                checkBulkQueryResponse.checkBulkQueryResponse(body, function (err, result) {
                    if (err)
                        return callback(err);
                    var message = "indexed " + result.length + " records ";
                    if (socket)
                        socket.message(message)
                    return callback(null, result)

                })
            } else {
                callback(null, body)
            }
        })

    },


    checkBulkQueryResponse: function (responseBody, callback) {
        var body;
        if (typeof responseBody != "object")
            body = JSON.parse(responseBody.toString());
        else
            body = responseBody;
        var errors = [];
        if (body.error) {
            if (body.error.reason)
                return callback(body.error.reason)
            return callback(body.error)
        }

        if (!body.items)
            return callback(null, "done");
        body.items.forEach(function (item) {
            if (item.index && item.index.error)
                errors.push(item.index.error);
            else if (item.update && item.update.error)
                errors.push(item.update.error);
            else if (item.delete && item.delete.error)
                errors.push(item.delete.error);
        })

        if (errors.length > 0) {
            errors = errors.slice(0, 20);
            return callback(errors);
        }
        return callback(null, body.items.length);
    }


}

module.exports = elasticRestProxy;
