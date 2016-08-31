'use strict';

exports.conf = {
    mainPort:       8000 , //  this is 80 in production
    //mainPort:       3000 , //  this is 80 in production
    httpsPort:      443, // but will be redirect here, because security and stuff
    webDir:         'public', //   which directory should we serve for the front end?
    mediaDir:       'medias', //   which directory should we serve for the medias?
    mediaPath:      '/medias', //    on which path?
    cloudDir:       'cloud', //    on which path?
    cloudPath:      '/cloud', //    on which path?
    tmpPath:        '/tmp', //used to serve streams.
    tmpDir:         'tmp',
    webPath:        '/', //    on which path?
    WelcomePath:    '/welcome/:token',
    apiPrefix:      '/api',//API prefix (useless comment right?)
    coversPath:     'medias/covers/', //image are usually encoded in the metadata. It's nice but why store in a db a b64 img?
    bodyParserOpt:  { //options object for body-parser.
        extended: true
    },
    devMode:        false,
    httpsMode:      false,
    sessionCnf:     {
        secret:     'thisIsSecretForSession',
        resave:     false,
        saveUninitialized: true
    },
    pathPlay: '/play/:token',
    pathTokenWelcome: '/welcomeToken',
    pathTokenLogin: '/tokenLogin',
    pathLogin: '/login',
    cleanAtStartup: false, // delete existing media not in db at startUp.
    logsPerPage : 20, //could be a non fixed value.
    fromMail: 'info@dkkddk.gq',
    ndd: 'https://dkkddk.gq',
    hostname: 'dkkddk.info',
    bugsnag: false, //never mind.
    imgMaxSize: {width: 200, height: 200}, //images are scaled automatically. This allow you to keep a good quality if you want.
    keepAliveTimeout: 30 * 1000
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
        video: 'videos',
        live: 'live',
        request: 'logRequests',
        share: 'share',
        stats: 'userStats',
        tokens: 'tokens'
    }
};

exports.OKmimes = [
    'video',
    'audio',
    'torrent'
];
