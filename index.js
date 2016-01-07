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
    confRe      = require('./app/config').rethink,
    api         = require('./app/api'),
    login       = require('./app/login'),
    tools       = require('./app/tools'),
    externSession = require('./app/externSession');

    var session = require('express-session'),
    RDBStore    = require('session-rethinkdb')(session);
    const options = {
        servers: [confRe.connect],
        clearInterval: 5000, 
        table: 'session' 
    };
    var store = new RDBStore(options); 
    var Session = session({
        secret: 'somethinglikeBllaaaaaahhh',
        resave: false,
        saveUninitialized: true,
        store: store
    });

    var app =  express();

    app
    .use(Session)
    //externs middlewares
    .use(bodyParser.urlencoded(conf.bodyParserOpt))
    .use(bodyParser.json())
    //some cases
    .use(conf.pathPlay, externSession.play)
    //login
    .use(conf.pathTokenLogin, login.getToken)
    .use(conf.pathLogin, login.login)
    .use(login.shouldLogin)
    //serve webApp
    .use(conf.webPath, express.static(conf.webDir))
    //serve medias
    .use(conf.mediaPath, express.static(conf.mediaDir))
    //use api
    .use(conf.apiPrefix, api.main)
    //wrong path
    .use(tools.thisIs404)
    //ready for requests.
    //TODO: add log.
    .listen(conf.mainPort);

    require('./app/socket')(app, Session, store);
