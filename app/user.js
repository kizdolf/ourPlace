'use strict';

var
    mainConf        = require('./config').conf,
    conf            = require('./config').couch,
    re              = require('./rethink.js'),
    r               = require('rethinkdb'),
    tbls            = require('./config').rethink.tables,
    tools           = require('./tools.js'),
    log             = require('simple-node-logger').createSimpleFileLogger('infos.log');

exports.played = (id, req)=>{
    var pseudo = req.session.pseudo;
    var c = re.getCon();
    r.table(tbls.user).filter({pseudo: pseudo}).update({played: r.row('played').append(id)})
    .run(c);
};
