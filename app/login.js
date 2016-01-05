'use strict';

var 
    randToken   = require('rand-token'),
    pass        = require('password-hash'),
    tbls        = require('./config').rethink.tables,
    isDev       = require('./config').conf.devMode,
    path        = require('path'),
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
    var sess = req.session;
    var newToken = randToken.generate(16);
    sess.token = newToken;
    sess.logued = false;
    res.json({token: newToken});
};

var login = function(req, res, next){
    var sess = req.session;
    var params = req.body;
    if(sess.token !== params.token){
        next();
    }else{
        userExist(params.userName, params.password)
        .then(function(ok){
            log.info(params.userName + ' just logued.');
            sess.logued = true;
            sess.pseudo = params.userName;
            sess.date = new Date();
            sess.token = null;
            res.json({ok : ok});
        }).catch(function(err){
            res.json({ok: false, err: err});
        });
    }
};

var isLoggued = function(req){
    return req.session.logued;
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
    if(!isLoggued(req)){
        if(!isDev)
            res.sendFile(path.join(__dirname, '..', 'login', 'index.html'), {root : '/'});
        else{
            req.session.logued = true;
            next();
        }
    }else
        next();
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