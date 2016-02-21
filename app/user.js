'use strict';

var
    mainConf        = require('./config').conf,
    conf            = require('./config').couch,
    conCnf          = require('./criticalConf'),
    re              = require('./rethink.js'),
    r               = require('rethinkdb'),
    tbls            = require('./config').rethink.tables,
    _r              = require('rethinkdbdash')(conCnf.connect),
    tools           = require('./tools.js'),
    log             = require('simple-node-logger').createSimpleFileLogger('infos.log');

    var lo = tools.lo;

var played = (id, req)=>{
    var pseudo = req.session.pseudo;
    var idUser = req.session.uuid;
    re.getCon((c)=>{
        r.table(tbls.user).filter({pseudo: pseudo})
        // .update({played: r.row('played').append(id)})
        .update({played: r.row('played').append({id: id, when: new Date()})})
        .run(c);
        r.table(tbls.song).get(id)
        .update({played: r.row('played').add(1).default(1)})
        .run(c);
    });
};

var root = (req, res)=>{
    var login = require('./login');

    login.isRoot(req).then((isIt)=>{
        var isRoot = isIt;
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
            }else if (first == 'logs'){
                var n = 0;
                if (second){
                    n = parseInt(second) * (mainConf.logsPerPage);
                    if(typeof n != 'number') n = 0;
                }
                re.getCon((c)=>{
                    r.table(tbls.log).orderBy(r.desc('when')).skip(n).limit(mainConf.logsPerPage)
                    .run(c).then((logs)=>{
                        res.json({logs: logs, page: (n / mainConf.logsPerPage)});
                    }).catch((e)=>{
                        lo.error('getting logs', {error: e, params: {first: first, second: n}, byWho: req.session.uuid});
                    });
                });
            }else{
                res.json(false);
            }
        }
    });

};

var rootPost = (req, res)=>{
    var login = require('./login');
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
                if(req.session.uuid !== id){
                    re.update(tbls.user, id, up).then((resp)=>{
                        log.info('Root update:', req.session, param, req.body);
                        lo.info('Root update:', {param: req.body, byWho: req.session.uuid});
                        resp = resp;
                        res.json(true);
                    }).catch((e)=>{
                        log.error('error update from root', req.body, req.session.uuid, param, e);
                        lo.error('error update from root', {param: req.body, byWho: req.session.uuid, error: e});
                        res.json(false);
                    });
                }else{
                    res.json({err: 'this is you. I will not allow you to unRoot yourself...'});
                }
            }else if (param == 'new'){
                login.createUser(obj.pseudo, obj.password, (obj.email || ''), (resp)=>{
                    res.json(resp);
                });
            }else{//take IP as well
                log.info('trying to access root function which do not exist:', req.session, param, req.body);
            }
        }else{//take IP as well
            log.info('trying to access root function without being root:', req.session, param, req.body);
        }
    }).catch((e)=>{//take IP as well
        log.error('error isRoot', req.body, req.session, param, e);
        res.json(false);
    });
};

var rootDelete = (req, res)=>{
    var login = require('./login');
    login.isRoot(req).then(function(isIt){
        if(isIt){
            var id = req.params.id;
            if(id == req.session.uuid){
                res.json({err: 'this is you. I will not allow you to delete yourself...'});
            }else{
                re.rmById(tbls.user, id).then((resp)=>{
                    resp = resp;
                    lo.info('Root delete:', {idDeleted: id, byWho: req.session.uuid});
                    res.json(true);
                }).catch((e)=>{
                    log.error('error delete from root', req.session, e);
                });
            }
        }else{
            log.info('trying to access root DELETE function without being root:', req.session);
        }
    }).catch((e)=>{
        log.error('error isRoot', req.session, e);
        res.json(false);
    });
};

/*A finir, pour savoir qui à mis quoi où..*/
var own = (id, resp)=>{
    var objId;
    if(resp.generated_keys){
        objId = resp.generated_keys;
    }
};

/*Because I don't want to not be root.*/
var makeMeRoot = ()=>{
    re.getSome(tbls.user, {pseudo: 'dk'}).then((me)=>{
        if(me[0].root !== true) re.update(tbls.user, me[0].id, {root: true});
    });
};

/*return count ids for user.*/
var getPlayed = (id, uuid)=>{
    return new Promise((ful, rej)=>{
        _r.table(tbls.user).get(uuid)('played').filter(
            function (idSng){ return(idSng.eq(id)); }
        ).count().run().then((res)=>{
            ful(res);             
        }).catch((e)=>{
            lo.error('catching played:', {byWho: uuid, idSng: id, error: e});
            ful(0);
        });
    });
};

var getStatus = (req, res)=>{
    var uuid = req.session.uuid;
    _r.table(tbls.user).get(uuid)('status')
    .run().then((resp)=>{
        res.json(resp);
    })
    .catch((e)=>{
        _r.table(tbls.user).get(uuid).update({status: {}});
        res.json({});
    });
};

var setStatus =  (req, res)=>{
    var status = req.body;
    var uuid = req.session.uuid;
    re.update(tbls.user, uuid, {status: status}).then((resp)=>{
        res.json(true);
    }).catch((e)=>{
        res.json(false);
    });
};

module.exports = {
    played: played,
    root: root,
    rootPost: rootPost,
    rootDelete: rootDelete,
    own: own,
    makeMeRoot: makeMeRoot,
    getPlayed: getPlayed,
    setStatus: setStatus,
    getStatus: getStatus
};
