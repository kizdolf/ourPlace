'use strict';

exports.conf = {
    mainPort: 9090, //  this is 80 in production
    webDir: 'public', //   which directory should we serve for the front end?
    mediaDir: 'medias', //   which directory should we serve for the medias?
    mediaPath: '/medias', //    on which path?
    webPath: '/', //    on which path?
    apiPrefix: '/api',//API prefix (useless comment right?)
    coversPath: 'medias/covers/', //image are usually encoded in the metadata. It's nice but why store in a db a b64 img?
    bodyParserOpt:{ //options object for body-parser.
        extended: true
    }
};

exports.socket = {
    socketPort : 9091
};

/* Couchbase NEED to be protected somehow.*/
exports.couch = {
    host: '149.202.44.123',
    filesBucket: 'filesForUs'
};

/*Unused. Need to be rethink. Need to be store in a db as well. To make it updatable.*/
exports.mimes = {
    'audio/mp3' : {
        directory : exports.conf.mediaPath + '/music'
    }
};
