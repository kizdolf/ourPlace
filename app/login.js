'use strict';

var 
    randToken   = require('rand-token'),
    couchbase   = require('couchbase'),
    pass        = require('password-hash'),
    conf        = require('./config').couch,
    Cluster     = new couchbase.Cluster(conf.host);

var userExist = function(pseudo, password){
    return new Promise(function(ful, rej){  
        var Bucket = Cluster.openBucket(conf.users, function(err){
            if(err){
                rej(err);
            }
        });
        Bucket.get(pseudo, function(err, doc){
            if(err){
                rej(err);
            }else{
                var user = doc.value;
                if(user.pseudo === pseudo && pass.verify(password, user.password)){
                    ful(true);
                }else{
                    rej({message : 'wrong password'});
                }
            }
        });
    });
};

exports.getToken = function(req, res){
    var sess = req.session;
    var newToken = randToken.generate(16);
    sess.token = newToken;
    sess.logued = false;
    res.json({token: newToken});
};

exports.login = function(req, res, next){
    var sess = req.session;
    var params = req.body;
    if(sess.token !== params.token){
        next();
    }else{
        userExist(params.userName, params.password)
        .then(function(ok){
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

exports.isLoggued = function(req){
    return req.session.logued;
};

exports.isRoot = function(req){
    return new Promise(function(ful, rej){
        var Bucket = Cluster.openBucket(conf.users, function(err){
            if(err) {
                rej(false);
            }
        });
        Bucket.get(req.session.pseudo, function(err, doc){
            if(err) rej(err);
            else{
                var user = doc.value;
                if(user.root && user.root === true) {
                    ful(true);
                }
                else {
                    ful(false);
                }
            }
        });
    });
};

exports.createUser = function(pseudo, password){
    var hash = pass.generate(password);
    var o = {
        pseudo : pseudo,
        password: hash
    };
    var Bucket = Cluster.openBucket(conf.users, function(err){
        if(err){
            console.log(err); 
        }else{
            Bucket.insert(o.pseudo, o, function(err, res) {
                if (err){
                    console.log('err inserting obj');
                    console.log(err);
                }else{
                    console.log('obj inserted: ' + res.cas);
                }
            });
        }
    });
};

/*create some users:*/
// createUser('smia', 'smia');