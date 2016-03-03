'use strict';

exports.conf = {
    mainPort: 80, //  this is 80 in production
    httpsPort: 443, // but will be redirect here, because security and stuff
    webDir: 'public', //   which directory should we serve for the front end?
    mediaDir: 'medias', //   which directory should we serve for the medias?
    mediaPath: '/medias', //    on which path?
    webPath: '/', //    on which path?
    WelcomePath: '/welcome/:token',
    apiPrefix: '/api',//API prefix (useless comment right?)
    coversPath: 'medias/covers/', //image are usually encoded in the metadata. It's nice but why store in a db a b64 img?
    bodyParserOpt:{ //options object for body-parser.
        extended: true
    },
    devMode: false,
    httpsMode: true,
    sessionCnf: {
        secret: 'thisIsSecretForSession',
        resave: false,
        saveUninitialized: true
    },
    pathPlay: '/play/:token',
    pathTokenWelcome: '/welcomeToken',
    pathTokenLogin: '/tokenLogin',
    pathLogin: '/login',
    cleanAtStartup: false, // delete existing media not in db at startUp.
    logsPerPage : 20, //could be a non fixed value.
    fromMail: 'info@azerty.gq',
    ndd: 'http://azerty.gq',
    bugsnag: false,
    imgMaxSize: {width: 200, height: 200}
};

exports.socket = {
    socketPort : 9091
};

exports.rethink = {
    tables: {
        user: 'users',
        note: 'notes',
        song: 'songs',
        log: 'logs',
        live: 'live',
        request: 'logRequests',
        share: 'share',
        stats: 'userStats',
        tokens: 'tokens'
    }
};

/*Unused. Need to be rethink. Need to be store in a db as well. To make it updatable.*/
exports.mimes = {
    'audio/mp3' : {
        directory : exports.conf.mediaPath + '/music'
    }
};
