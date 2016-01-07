'use strict';

var 
    randToken   = require('rand-token'),
    pass        = require('password-hash'),
    tbls        = require('./config').rethink.tables,
    isDev       = require('./config').conf.devMode,
    path        = require('path'),
    moment      = require('moment'),
    re          = require('./rethink');

var log = require('simple-node-logger').createSimpleFileLogger('infos.log');

var userExist = function(pseudo, password){
    return new Promise(function(ful, rej){
        var tbl = tbls.user;
        re.getSome(tbl, {pseudo: pseudo}).then(function(res){
            if(res.length === 0) rej({message : 'wrong pseudo'});
            if(pass.verify(password, res[0].password)) ful(true);
            else rej({message : 'wrong password'});
        }).catch(function(err){
            log.error(err);
            rej({message : 'error'});
        });
    });
};

var getToken = function(req, res){
    var id = req.session.id;
    var newToken = randToken.generate(16);
    var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    req.session.date = new Date();
    req.session.token = newToken;
    req.session.sid = id;
    req.session.ip = ip;
    req.session.logued = false;
    req.session.countActions = 0;
    req.session.lastAction = new Date();
    res.json({token: newToken});
};

var login = function(req, res, next){
    var params = req.body;
    if(params.token !== req.session.token){
        next();
    }else{
        userExist(params.userName, params.password).then(function(ok){
            log.info(params.userName + ' just logued.');
            req.session.logued = true;
            req.session.pseudo = params.userName;
            req.session.date = new Date();
            req.session.token = null;
            req.session.lastAction = new Date();
            res.json({ok : true});
        }).catch(function(err){
            res.json({ok: false, err: err});
        });
    }
};

var isLoggued = function(req, cb){
    if(!req.session.logued){
        return cb(false);
    }else{
        return cb(true);
    }
};

var isRoot = function(req){
    return new Promise(function(ful, rej){
        var tbl = tbls.user;
        re.getSome(tbl, {pseudo: req.sessionpseudo}).then(function(res){
            if(res.length === 0) rej({message : 'pseudo not founded'});
            if(res[0].root && res[0].root === true) ful(true);
            else ful(false);
        }).catch(function(err){
            log.error(err);
            rej({message : 'error'});
        });
    });
};

var createUser = function(pseudo, password){
    var hash = pass.generate(password),
    o = {
        pseudo : pseudo,
        password: hash,
        played: [],
        root: false
    },
    tbl = tbls.user;
    re.insert(tbl, o).then((res)=>{
        log.info('user ' + pseudo + ' was created: ');
        log.info(res);
    }).catch((err)=>{
        log.error('error creating user ' + pseudo);
        log.error(err);
    });
};

var shouldLogin = function(req, res, next){
    isLoggued(req, (loggued)=>{
        if(!loggued){
            if(!isDev) res.sendFile(path.join(__dirname, '..', 'login', 'index.html'), {root : '/'});
            else next();
        }else next();
    });
};

/*create some users:*/
// createUser('smia', 'smia');

module.exports = {
    getToken: getToken,
    login: login,
    isLoggued: isLoggued,
    isRoot: isRoot,
    createUser: createUser,
    shouldLogin: shouldLogin,
};