/*
    Entry point.

    Ideas:
        - clusturize the application. Carefully because websockets don't like it really much.
          Solutions are out there to manage them, the pid used by one user need to stay the same all along the process.
        - Run tests at startup. (this implies to BUILD and CODE tests. humpfff)
*/
'use strict';

//globals (tranquille)
global.appPath  = __dirname;
global.core     = global.appPath + '/app';

var //extern dependencies
    express         = require('express'),
    bodyParser      = require('body-parser'),
    fs              = require('fs'),
    http            = require('http'),
    //inner dependencies
    conf            = require(global.core + '/config').conf,
    confRe          = require(global.core + '/criticalConf'),
    api             = require(global.core + '/api'),
    login           = require(global.core + '/login'),
    tools           = require(global.core + '/tools'),
    sessionRe       = require(global.core + '/db/rethinkSession');


    //main object.
    var app =  express();
    //Logic:
    app
    //intern Session to have the session in sockets.
    .use(sessionRe.Session)
    //externs middlewares
    .use(bodyParser.urlencoded(conf.bodyParserOpt))
    .use(bodyParser.json())
    //log request and redirect to https if needed.
    .use(tools.makeItHttps)
    //because I might try some stuff. So let's think about it now.
    .use('/stuff', express.static('stuff'))
    //someone not loged-in can still listen some songs. On condtions.
	// .use(conf.pathPlay, externSession.play)
    //login mechanisms.
    .use(conf.WelcomePath, login.welcome)
    .use(conf.pathTokenWelcome, login.getWelcome)
    .use(conf.pathTokenLogin, login.getToken)
    .use(conf.pathLogin, login.login)
    //loged-in check. at this point if not loged-in bye.
    .use(login.shouldLogin)
    //serve webApp
    .use(conf.webPath, express.static(conf.webDir))
    //serve medias (this should evolve deeply :/)
    .use(conf.mediaPath, express.static(conf.mediaDir))
    .use(conf.tmpPath, express.static(conf.tmpDir))
    //use api
    .use(conf.apiPrefix, api.main)
    //wrong path
    .use((req, res)=>{res.redirect('/');});

    //ready for  requests. Http/Https. We have to handle both.
    //Start a HTTP server.
    var httpServer = http.createServer(app);
    httpServer.listen(conf.mainPort);
    if(conf.httpsMode){
        //https.
        var privateKey  = fs.readFileSync(confRe.https.privKey, 'utf8'),
        ca              = fs.readFileSync(confRe.https.chain, 'utf8'),
        certificate     = fs.readFileSync(confRe.https.certificate, 'utf8'),
        credentials     = {key: privateKey, cert: certificate, ca: ca },
        https           = require('https'),
        //start a HTTPS server.
        httpsServer     = https.createServer(credentials, app);
        httpsServer.listen(conf.httpsPort);
        //sockets are safe as well, and can use session.
        require(global.core + '/socket')(httpsServer, sessionRe.Session, sessionRe.store);
    }else require(global.core + '/socket')(httpServer, sessionRe.Session, sessionRe.store);

    //because time to time cleaning is good.. launched only on start.
    if(conf.cleanAtStartup){
        tools.lo.info('launch media cleaning.', {byWho: 'system'});
        require('./parseMedia').cleanMediasDir();
    }
