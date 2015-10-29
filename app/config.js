'use strict';

exports.conf = {
    mainPort: 9090, //  this is 80 in production
    webDir: 'public', //   which directory should we serve?
    webPath: '/', //    on which path?
    apiPrefix: '/api',//API prefix (useless comment right?)

    bodyParserOpt:{ //options object for body-parser.
        extended: true
    }
};

exports.socket = {
    socketPort : 9091
};
