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
    confRe      = require('./app/criticalConf'),
    api         = require('./app/api'),
    login       = require('./app/login'),
    tools       = require('./app/tools'),
    externSession = require('./app/externSession');

    /*   HTTPS    */
    var fs          = require('fs'),
        http        = require('http'),
        https       = require('https'),
        privateKey  = fs.readFileSync(confRe.https.privKey, 'utf8'),
        ca          = fs.readFileSync(confRe.https.chain, 'utf8'),
        certificate = fs.readFileSync(confRe.https.certificate, 'utf8');
    var credentials = {key: privateKey, cert: certificate, ca: ca };

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
    /*
        Each request need to be loggued,
        as well I want to force https. Here it is.
    */
    .use((req, res, next)=>{
        var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        var route = req.originalUrl;
        tools.lo.request('request:', {ip: ip, route: route, method: req.method});
        if(req.secure)
            next();
        else
            res.redirect('https://' + req.headers.host + req.url);
    })
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
    //ready for requests.
    //TODO: add log.
    // .listen(conf.mainPort);


    var httpServer = http.createServer(app);
    var httpsServer = https.createServer(credentials, app);

    httpServer.listen(conf.mainPort);
    httpsServer.listen(conf.httpsPort);

    require('./app/socket')(httpsServer, Session, store);

    if(conf.cleanAtStartup){
        tools.lo.info('launch media cleaning.', {byWho: 'system'});
        require('./parseMedia').cleanMediasDir();
    }
