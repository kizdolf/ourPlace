'use strict';

var
    mainConf        = require('./config').conf,
    conf            = require('./config').couch,
    re              = require('./rethink.js'),
    r               = require('rethinkdb'),
    tbls            = require('./config').rethink.tables,
    tools           = require('./tools.js'),
    login           = require('./login.js'),
    log             = require('simple-node-logger').createSimpleFileLogger('infos.log');

var played = (id, req)=>{
    var pseudo = req.session.pseudo;
    var c = re.getCon();
    r.table(tbls.user).filter({pseudo: pseudo}).update({played: r.row('played').append(id)})
    .run(c);
};

var root = (req, res)=>{
    var first = req.params.first;
    var second = null;
    if (req.params.second) second = req.params.second;

    if(first == 'amI'){
        login.isRoot(req).then(function(isIt){
            if(!!isIt){
                res.json(true);
            }else{
                res.json(false);
            }
        });
    }else{
        res.json(false);
    }
};

module.exports = {
    played: played,
    root: root
};