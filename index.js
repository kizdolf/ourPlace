'use strict';

var
    express     = require('express'),
    bodyParser  = require('body-parser'),
    conf        = require('./app/config').conf,
    api         = require('./app/api');

    require('./app/socket');

    express()
    //middlewares
    .use(bodyParser.urlencoded(conf.bodyParserOpt))
    .use(bodyParser.json())
    //serve webApp
    .use(conf.webPath, express.static(conf.webDir))
    //use api
    .use(conf.apiPrefix, api.main)
    //wrong http request. 404 (should send a true 404 page instead.)
    .use(function(req, res){
        res.json({msg: '404'});
    })
    //ready for requests.
    .listen(conf.mainPort);
