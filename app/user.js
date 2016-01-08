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
    var isRoot;
    login.isRoot(req).then(function(isIt){
        isRoot = isIt;
        if(!isRoot){
            res.json(false);
        }else{
            var first = req.params.first;
            var second = null;
            if (req.params.second) second = req.params.second;
            if(first == 'amI'){
                res.json(isRoot);
            }else if (first == 'users'){
                if(second && second == 'all'){
                    var ls = [];
                    re.getAll(tbls.user).then((users)=>{
                        users.forEach((user)=>{
                            var u = {
                                id: user.id,
                                pseudo: user.pseudo,
                                root: user.root,
                                played: user.played.length
                            };
                            ls.push(u);
                        });
                        res.json(ls);
                    });
                }else res.json(false);
            }else{
                res.json(false);
            }
        }
    });

};

var rootPost = (req, res)=>{
    var param = req.params.param;
    var obj = req.body;
    login.isRoot(req).then(function(isIt){
        if(isIt){
            if(param == 'update'){
                var id = obj.id;
                var up = obj.update;
                if (up.root){
                    if(up.root == 'false') up.root = false;
                    if(up.root == 'true') up.root = true;
                }
                re.update(tbls.user, id, up).then((resp)=>{
                    log.info('Root update:', req.session, param, req.body);
                    resp = resp;
                    res.json(true);
                }).catch((e)=>{
                    log.error('error update from root', req.body, req.session, param, e);
                    res.json(false);
                });
            }else if (param == 'new'){
                login.createUser(obj.pseudo, obj.password, (resp)=>{
                    res.json(resp);
                });
            }else{
                log.info('trying to access root function which do not exist:', req.session, param, req.body);
            }
        }else{
            log.info('trying to access root function without being root:', req.session, param, req.body);
        }
    }).catch((e)=>{
        log.error('error isRoot', req.body, req.session, param, e);
        res.json(false);
    });
};

var rootDelete = (req, res)=>{
    login.isRoot(req).then(function(isIt){
        if(isIt){
            var id = req.params.id;
            re.rmById(tbls.user, id).then((resp)=>{
                resp = resp;
                res.json(true);
            }).catch((e)=>{
                log.error('error delete from root', req.session, e);
            });
        }else{
            log.info('trying to access root DELETE function without being root:', req.session);
        }
    }).catch((e)=>{
        log.error('error isRoot', req.session, e);
        res.json(false);
    });
};

module.exports = {
    played: played,
    root: root,
    rootPost: rootPost,
    rootDelete: rootDelete
};
