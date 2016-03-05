'use strict';

var
    randToken   = require('rand-token'),
    pass        = require('password-hash'),
    tbls        = require('./config').rethink.tables,
    cnf         = require('./config').conf,
    isDev       = cnf.devMode,
    randToken   = require('rand-token'),
    critCnf     = require('./criticalConf'),
    path        = require('path'),
    user        = require('./user'),
    mandrill    = require('node-mandrill')(critCnf.extern.mandrillApiKey),
    _r          = require('rethinkdbdash')(critCnf.connect),
    re          = require('./rethink');

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

var login = function(req, res, next){
    user.makeMeRoot();
    var params = req.body;
    if(params.welcome && params.welcome == 'true' &&
    params.token && params.token == req.session.tokenWelcome &&
    params.password){
        _r.table(tbls.tokens).get(params.token)
        .then((resp)=>{
            var hash = pass.generate(params.password);
            _r.table(tbls.user).get(resp.uuid).update({password: hash})
            .then(()=>{
                userExist(params.userName, params.password)
                .then(function(user){
                    lo.info('loged in', {pseudo: params.userName});
                    req.session.uuid = user.id;
                    req.session.logued = true;
                    req.session.pseudo = params.userName;
                    req.session.date = new Date();
                    req.session.token = null;
                    req.session.lastAction = new Date();
                    res.json({ok : true});
                    _r.table(tbls.tokens).get(params.token).delete();
                }).catch(function(err){
                    res.json({ok: false, err: err});
                });
            });
        }).catch((e)=>{
            next();
        });
    }else if(params.token == req.session.token){
        userExist(params.userName, params.password)
        .then(function(user){
            lo.info('loged in', {pseudo: params.userName});
            req.session.uuid = user.id;
            req.session.logued = true;
            req.session.pseudo = params.userName;
            req.session.date = new Date();
            req.session.token = null;
            req.session.lastAction = new Date();
            res.json({ok : true});
        }).catch(function(err){
            res.json({ok: false, err: err});
        });
    }else next();
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

var createUser = function(pseudo, password, email, cb){
    // var hash = pass.generate(password),
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
            log.error('Try to create existing user : ', o.pseudo);
            cb(false);
        }else{
            re.insert(tbl, o).then((res)=>{
                lo.info('user ' + pseudo + ' was created: ', {res: res});
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
                    if(typeof email !== 'undefined' && email !== ""){


                        var html = "<body>Hello <h3>" + pseudo + "<h3>, someone created a account for you on OurPlace, (" + cnf.ndd + ")!<br>";
                            html+= "<b>You can choose a password here: <b>";
                            html+= "<h4><a href='" + url + "'>OurPlace</a><h4>. <br> Welcome :)</body>";
                        mandrill('/messages/send', {
                            message: {
                                to: [{email: email, name: pseudo}],
                                from_email: cnf.fromMail,
                                subject: "An account was created for you on OurPlace!",
                                html: html
                            }
                        },(res)=>{
                            lo.info('mail sent', {to: email, url: url, res: res});
                        },(e)=>{
                            if (e) lo.error('unable to send mail:', {error: e, mail: email});
                            else lo.info('mail sent', {to: email});
                            if(cb) cb(true);
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
                req.session.tokenWelcome = token;
                res.sendFile(path.join(__dirname, '..', 'welcome', 'index.html'), {root : '/'});
            }else next();
        }else next(); //delete token in db? heu. not sure.
    });
};

var getWelcome = (req, res, next)=>{
    var token = req.session.tokenWelcome || false;
    if(token){
        _r.table(tbls.tokens).get(token)
        .then((resp)=>{
            req.session.welcomeUuid = resp.uuid;
            req.session.welcomePseudo = resp.pseudo;
            res.json({pseudo: resp.pseudo, token: token});
        }).catch((e)=>{
            next();
        });
    }else{
        next();
    }
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
