'use strict';

var
    tbls        = require(global.core + '/config').rethink.tables,
    cnf         = require(global.core + '/config').conf,
    critCnf     = require(global.core + '/criticalConf'),
    wording     = require(global.core + '/wording'),
    re          = require(global.core + '/db/rethink'),
    randToken   = require('rand-token'),
    pass        = require('password-hash'),
    randToken   = require('rand-token'),
    path        = require('path'),
    mandrill    = require('node-mandrill')(critCnf.extern.mandrillApiKey),
    _r          = require('rethinkdbdash')(critCnf.connect),
    isDev       = cnf.devMode;

var log = require('simple-node-logger').createSimpleFileLogger('infos.log');

var lo = require('./tools').lo;

var userExist = function(pseudo, password){
    return new Promise(function(ful, rej){
        var tbl = tbls.user;
        re.getSome(tbl, {pseudo: pseudo}).then(function(res){
            if(res.length === 0)
                rej({message : 'wrong pseudo'});
            else if(pass.verify(password, res[0].password))
                ful(res[0]);
            else
                rej({message : 'wrong password'});
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

var logedIn = (req, res, userName, password, cb, txtLog)=>{
    userExist(userName, password)
    .then(function(user){
        if(txtLog) lo.info('loged in', {pseudo: userName, who: user.id, txt: txtLog});
        else lo.info('loged in', {pseudo: userName, who: user.id});
        req.session.uuid = user.id;
        req.session.logued = true;
        req.session.pseudo = userName;
        req.session.date = new Date();
        req.session.token = null;
        req.session.lastAction = new Date();
        cb(true, null);
    }).catch(function(err){
        lo.error('log-in', {pseudo: userName, error: err});
        cb(false, err);
    });
};
/*
    Login logic:
    if it's your first time you can set a password.
    If not just login as usual.
    Set password if: token passed by post match token in session and have a match in token welcome table.
    tokenWelcome arrive directly from the link, before render any file. It's as well a csrf protection.

*/
var login = function(req, res, next){
    if (cnf.devMode) require('./root/main').makeMeRoot(); //yup.
    var params = req.body;
    if(params.welcome && params.welcome == 'true' &&                // First connection from mail, with token.
    params.token && params.token == req.session.tokenWelcome &&     // We set the password in the same time,
    params.password){                                               // and then login as usual. Purpose is
        _r.table(tbls.tokens).filter({                              // an easy and direct registration.
            token: params.token,                                    // Click link in mail you received, choose password,
            uuid: req.session.welcomeUuid                           // you're loged-in and password is set.
        })
        .then((resp)=>{
            if(resp[0]){
                resp = resp[0];
                var hash = pass.generate(params.password);
                _r.table(tbls.user).get(resp.uuid).update({password: hash})
                .then(()=>{
                    logedIn(req, res, params.userName, params.password, (ok, err)=>{ // Once set we don't keep the welcome session.
                        if(ok){                                                 // It's now a normal user.
                            re.delSome(tbls.tokens, {token: params.token})
                            .then((done)=>{
                                params.password = '';
                                delete req.session.welcomeUuid;
                                delete req.session.welcomePseudo;
                                res.json({ok : true});
                            }).catch((e)=>{ });
                        }else res.json({ok: false, err: err});
                    }, 'welcome');
                });
            }
        }).catch((e)=>{
            lo.error('token welcome', {pseudo: params.userName, error: e, token: params.token});
            next();
        });
    }else if(params.token == req.session.token){
        logedIn(req, res, params.userName, params.password, (ok, err)=>{
            if(ok){
                params.password = '';
                res.json({ok : true});
            }else res.json({ok: false, err: err});
        });
    }else next();
};

var isLoggued = function(req, cb){
    return cb( (!req.session.logued) ? false : true );
};

var isRoot = function(req){
    return new Promise(function(ful, rej){
        var tbl = tbls.user;
        var pseudo = req.session.pseudo;
        re.getSome(tbl, {pseudo: pseudo}).then(function(res){
            if(res.length === 0) rej({message : 'pseudo not founded'});
            if(res[0].root && res[0].root === true) ful(true);
            else ful(false);
        }).catch(function(err){
            log.error(err);
            rej({message : 'error'});
        });
    });
};

var createUser = function(pseudo, password, email, session, cb){
    var token = randToken.generate(16),
    hash = '',
    o = {
        pseudo : pseudo,
        password: hash,
        root: false
    },
    tbl = tbls.user;
    re.getSome(tbl, {pseudo: o.pseudo}).then((ex)=>{
        if(ex[0]){
            lo.error('Try to create existing user',{obj: o, byWho: session.uuid});
            cb(false);
        }else{
            re.insert(tbl, o).then((res)=>{
                lo.info('user ' + pseudo + ' was created: ', {res: res, byWho: session.uuid});
                var stats = {
                    notes: {},
                    songs: {},
                    totalSongs: 0,
                    uuid: res.generated_keys[0]
                };
                re.insert(tbls.stats, stats);

                re.insert(tbls.tokens, {uuid: res.generated_keys[0], pseudo: pseudo, token: token})
                .then(()=>{

                    var url = cnf.ndd + '/welcome/' + token;
                    var fromPseudo = session.pseudo;
                    if(typeof email !== 'undefined' && email !== ""){
                        wording.htmlWelcome(url, pseudo, fromPseudo, (html)=>{
                            mandrill('/messages/send', {
                                message: {
                                    to: [{email: email, name: pseudo}],
                                    from_email: cnf.fromMail,
                                    subject: "An account was created for you on OurPlace!",
                                    html: html
                                }
                            },(e)=>{
                                if (e) lo.error('unable to send mail:', {error: e, mail: email});
                                else lo.info('mail sent', {to: email});
                                if(cb) cb(true);
                            });
                        });
                    }else{
                        lo.error('wrong mail!', {email: email, url: url});
                        if(cb) cb(true);
                    }
                }).catch((err)=>{
                    lo.error('error inserting token', {pseudo: pseudo, err: err});
                    if(cb) cb(false);
                });
            }).catch((err)=>{
                lo.error('error creating user', {pseudo: pseudo, err: err});
                if(cb) cb(false);
            });
        }
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

var welcome = (req, res, next)=>{
    isLoggued(req, (loggued)=>{
        if(!loggued){
            if(req.params.token){
                var token = req.params.token;
                _r.table(tbls.tokens).get(token)
                .then((resp)=>{
                    if(resp && resp.uuid){
                        req.session.tokenWelcome = token;
                        res.sendFile(path.join(__dirname, '..', 'welcome', 'index.html'), {root : '/'});
                    }else next();
                });
            }else next();
        }else next(); //delete token in db? heu. not sure.
    });
};

var getWelcome = (req, res, next)=>{
    var token = req.session.tokenWelcome || false;
    if(token){
        _r.table(tbls.tokens).get(token)
        .then((resp)=>{
            if(resp && resp.uuid){
                req.session.welcomeUuid = resp.uuid;
                req.session.welcomePseudo = resp.pseudo;
                res.json({pseudo: resp.pseudo, token: token});
            }else next();
        }).catch((e)=>{
            next();
        });
    }else next();
};

module.exports = {
    getToken: getToken,
    login: login,
    isLoggued: isLoggued,
    isRoot: isRoot,
    createUser: createUser,
    shouldLogin: shouldLogin,
    welcome: welcome,
    getWelcome: getWelcome
};
