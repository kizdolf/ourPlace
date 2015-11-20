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
    externSession = require('./app/externSession'),
    session     = require('express-session');

var log = require('simple-node-logger').createSimpleFileLogger('infos.log');

    require('./app/socket');

    express()
    //middlewares
    .use(session({secret: 'thisIsSecretForSession', resave: false, saveUninitialized: true}))
    .use(bodyParser.urlencoded(conf.bodyParserOpt))
    .use(bodyParser.json())
    .use('/play/:token', function(req, res){
        var token = req.params.token;
        externSession.tokenIsGood(token, function(err, name){
            if(!err) {
                log.info('allow playing for ', name);
                req.session.logued = true;
                if(!req.session.nbLeft && req.session.nbLeft !== 0)
                    req.session.nbLeft = 5;
                req.session.canPlay = true;
                req.session.name = name;
                res.sendFile(__dirname + '/play/index.html', {root: '/'});
            }else{
                res.json({err : 'not allowed.'});
                log.info('cannot play it anymore.');
            }
        });
    })
    .use('/tokenLogin', login.getToken)
    .use('/login',  login.login)
    .use(function(req, res, next){
        if(!login.isLoggued(req)){
            // res.sendFile(__dirname + '/login/index.html', {root : '/'});
            req.session.logued = true;
            next();
        }else
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
