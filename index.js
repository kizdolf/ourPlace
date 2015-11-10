/*
    Entry point.

    Ideas:
        - clusturize the application. Carefully because websockets don't like it really much.
          Solutions are out there to manage them, the pid used by one user need to stay the same all along the process.
        - Run tests at startup. (this implies to BUILD and CODE tests. humpfff)
*/
'use strict';

var
    express     = require('express'),
    bodyParser  = require('body-parser'),
    conf        = require('./app/config').conf,
    api         = require('./app/api'),
    login       = require('./app/login'),
    session     = require('express-session');

    require('./app/socket');

    express()
    //middlewares
    .use(session({secret: 'thisIsSecretForSession', resave: false, saveUninitialized: true}))
    .use(bodyParser.urlencoded(conf.bodyParserOpt))
    .use(bodyParser.json())
    .use('/tokenLogin', login.getToken)
    .use('/login',  login.login)
    .use(function(req, res, next){
        if(!login.isLoggued(req))
            res.sendFile(__dirname + '/login/index.html', {root : '/', token: 123456});
        else
            next();
    })
    //serve webApp
    .use(conf.webPath, express.static(conf.webDir))
    //serve medias
    .use(conf.mediaPath, express.static(conf.mediaDir))
    //use api
    .use(conf.apiPrefix, api.main)
    //wrong path
    .use(function(req, res){
        //TODO: Send a 404 page. Or redirect somewhere.
        res.json({msg: '404'});
    })
    //ready for requests.
    //TODO: add log.
    .listen(conf.mainPort);
