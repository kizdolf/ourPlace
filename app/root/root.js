'use strict';

var
    mainConf        = require(global.core + '/config').conf,
    conCnf          = require(global.core + '/criticalConf'),
    re              = require(global.core + '/db/rethink.js'),
    tbls            = require(global.core + '/config').rethink.tables,
    tools           = require(global.core + '/tools.js'),
    login           = require(global.core + '/login'),
    lo              = tools.lo,
    r               = require('rethinkdb'),
    _r              = require('rethinkdbdash')(conCnf.connect),
    log             = require('simple-node-logger').createSimpleFileLogger('infos.log');

var rootSu = (req, res)=>{

    login.isRoot(req).then((isIt)=>{
        var isRoot = isIt;
        if(!isRoot){
            require('express').static('login');
            lo.info('Tried to enter root whitout rights', { who: req.session.uuid, pseudo: req.session.pseudo });
            res.json(false);
        }else{
            var first = req.params.first;
            var second = null;
            if (req.params.second) second = req.params.second;
            if(first == 'amI'){
                res.json(isRoot);
            }else if (first == 'users'){
                if(second && second == 'all'){
                    _r.table(tbls.user).eqJoin(("id"), _r.table(tbls.stats)).without({
                        'left' : {'password': true},
                        'right': {'uuid': true}
                    }).zip().then((users)=>{
                        res.json(users);
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
    }).catch(()=>{
        res.redirect(301, mainConf.ndd);
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
                login.createUser(obj.pseudo, obj.password, (obj.email || ''), req.session, (resp)=>{
                    res.json(resp);
                });
            }else{//take IP as well
                log.info('trying to access root function which do not exist:', req.session, param, req.body);
            }
        }else{//take IP as well
            lo.info('Tried to enter root whitout rights', { who: req.session.uuid, pseudo: req.session.pseudo, param: req.body });
        }
    }).catch((e)=>{//take IP as well
        log.error('error isRoot', req.body, req.session, param, e);
        res.json(false);
    });
};

var rootDelete = (req, res)=>{
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
            lo.info('Tried to enter root whitout rights', { who: req.session.uuid, pseudo: req.session.pseudo});
        }
    }).catch((e)=>{
        log.error('error isRoot', req.session, e);
        res.json(false);
    });
};

/*Because I don't want to not be root.*/
var makeMeRoot = ()=>{
    re.getSome(tbls.user, {pseudo: 'dk'}).then((me)=>{
        if(me[0].root !== true) re.update(tbls.user, me[0].id, {root: true});
    });
};


module.exports = {
    root: rootSu,
    rootPost: rootPost,
    rootDelete: rootDelete,
    makeMeRoot: makeMeRoot,
};
