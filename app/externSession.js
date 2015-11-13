'use strict';

var 
    randToken   = require('rand-token'),
    couchbase   = require('couchbase'),
    conf        = require('./config').couch,
    Cluster     = new couchbase.Cluster(conf.host);

var log = require('simple-node-logger').createSimpleFileLogger('infos.log');

exports.generateToken = function(name, cb){
    var token = randToken.generate(16);
    var Bucket = Cluster.openBucket(conf.tokenBucket, function(err){
        if(err){
            console.log(err);
            cb(err, null);
        }
    });
    var obj = {
        token: token,
        date : new Date().getTime(),
        target : name
    };
    Bucket.insert(token, obj, function(err, res) {
        if (err){
            log.error(' inserting obj');
            log.error(err);
            cb(err, null);
        }else{
            //this log is bad.
            log.info(' token inserted:',  res.cas);
            cb(null, token);            
        }
    });
};

exports.tokenIsGood = function(token, cb){
    var Bucket = Cluster.openBucket(conf.tokenBucket, function(err){
        if(err){
            console.log(err);
            cb(err, null);
        }
    });
    Bucket.get(token, function(err, res){
        if(err){
            cb(err, null);
        }else{
            cb(null, res.value.target);
        }
    });
};

exports.getPath = function(name, cb){
    var Bucket = Cluster.openBucket(conf.filesBucket, function(err){
        if(err){
            console.log(err);
            cb(err, null);
        }
    });
    Bucket.get(name, function(err, res){
        if(err){
            cb(err, null);
        }else{
            cb(null, {file: res.value.path, type: res.value.type});
        }
    });
};

exports.delToken = function(token){
    console.log('remove token ' + token);
    var Bucket = Cluster.openBucket(conf.tokenBucket, function(err){
        if(err){
            console.log(err);
        }
    });
    Bucket.remove(token, function(err){
        if(err){
            log.error(err);
        }
    });
};