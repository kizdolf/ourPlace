/*
    Entry point.

    Ideas:
        - clusturize the application. Carefully because websockets don't like it really much.
          Solutions are out there to manage them, the pid used by one user need to stay the same all along the process.
        - Run tests at startup. (this implies to BUILD and CODE tests. humpfff)
*/
'use strict';

var
    express         = require('express'),
    bodyParser      = require('body-parser'),
    fs              = require('fs'),
    http            = require('http'),

    conf            = require('./app/config').conf,
    confRe          = require('./app/criticalConf'),
    api             = require('./app/api'),
    login           = require('./app/login'),
    tools           = require('./app/tools'),
    externSession   = require('./app/externSession'),
    sessionRe       = require('./app/rethinkSession');

    var app =  express();

    app
    .use(sessionRe.Session)
    //externs middlewares
    .use(bodyParser.urlencoded(conf.bodyParserOpt))
    .use(bodyParser.json())
    //log request and redirect to https if needed.
    .use(tools.makeItHttps)
    //some cases
    .use('/stuff', express.static('stuff'))
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
    .use(tools.thisIs404);

    //ready for http[s]
    var httpServer = http.createServer(app);
    httpServer.listen(conf.mainPort);
    var mainServer = httpServer;
    if(conf.httpsMode){
        var privateKey  = fs.readFileSync(confRe.https.privKey, 'utf8'),
        ca              = fs.readFileSync(confRe.https.chain, 'utf8'),
        certificate     = fs.readFileSync(confRe.https.certificate, 'utf8'),
        credentials     = {key: privateKey, cert: certificate, ca: ca },
        https           = require('https'),
        httpsServer     = https.createServer(credentials, app);
        httpsServer.listen(conf.httpsPort);
        mainServer = httpsServer;
    }

    //sockets are safe as well, and can use session.
    require('./app/socket')(mainServer, sessionRe.Session, sessionRe.store);

    //because time to time cleaning is good..
    if(conf.cleanAtStartup){
        tools.lo.info('launch media cleaning.', {byWho: 'system'});
        require('./parseMedia').cleanMediasDir();
    }
