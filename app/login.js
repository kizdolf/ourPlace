'use strict';

var
    randToken   = require('rand-token'),
    pass        = require('password-hash'),
    tbls        = require('./config').rethink.tables,
    cnf         = require('./config').conf,
    isDev       = cnf.devMode,
    critCnf     = require('./criticalConf'),
    path        = require('path'),
    user        = require('./user'),
    mandrill    = require('node-mandrill')(critCnf.extern.mandrillApiKey),
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
    if(params.token !== req.session.token){
        next();
    }else{
        userExist(params.userName, params.password)
        .then(function(user){
            console.log(user.id);
            log.info(params.userName + ' just logued.');
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
    var hash = pass.generate(password),
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
                log.info('user ' + pseudo + ' was created: ');
                log.info(res);
                var stats = {
                    notes: {},
                    songs: {},
                    totalSongs: 0,
                    uuid: res.generated_keys[0]
                };
                re.insert(tbls.stats, stats);
                if(typeof email !== 'undefined' && email !== ""){
                    mandrill('/messages/send', {
                        message: {
                            to: [{email: email, name: pseudo}],
                            from_email: cnf.fromMail,
                            subject: "An account was created for you on OurPlace!",
                            text: "Hello " + pseudo + ", someone created a account for you. You can log in here: <a href='" + cnf.ndd + "'>OurPlace</a>. You should already know the password :)"
                        }
                    },(e)=>{
                        if (e) lo.error('unable to send mail:', {error: e, mail: email});
                        else lo.info('mail sent', {to: email});
                        if(cb) cb(true);
                    });
                }else{
                    if(cb) cb(true);
                }
            }).catch((err)=>{
                log.error('error creating user ' + pseudo);
                log.error(err);
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
