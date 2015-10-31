'use strict';

exports.conf = {
    mainPort: 9090, //  this is 80 in production
    webDir: 'public', //   which directory should we serve?
    mediaDir: 'medias', //   which directory should we serve?
    mediaPath: '/medias', //    on which path?
    webPath: '/', //    on which path?
    apiPrefix: '/api',//API prefix (useless comment right?)

    bodyParserOpt:{ //options object for body-parser.
        extended: true
    }
};

exports.socket = {
    socketPort : 9091
};

exports.couch = {
    host: '149.202.44.123',
    filesBucket: 'filesForUs'
};

exports.mimes = {
    'audio/mp3' : {
        directory : exports.conf.mediaPath + '/music'
    }
};
