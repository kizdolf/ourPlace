'use strict';

var conf = {
    host: '149.202.44.123',
    filesBucket: 'filesForUs'
};

var N1qlQuery = require('couchbase').N1qlQuery;

var
    couchbase   = require('couchbase'),
    Cluster     = new couchbase.Cluster(conf.host),
    sock            = require('./socket'),
    accepted_mimes  = [
        'audio/mp3'
    ];

exports.handle = function(file){
    if(accepted_mimes.indexOf(file.mimetype) === -1){
        return false;
    }else{
        var obj = {
            name : file.originalname,
            path : '/' + file.path,
            size : file.size,
            date : new Date(),
            type : file.mimetype,
        };
        var Bucket = Cluster.openBucket(conf.filesBucket, function(err){
            if(err) console.log(err);
        });
        Bucket.insert(obj.name, obj, function(err, res) {
            if (err) console.log(err);
            else{
                console.log(res);
                exports.all();
                return true;
            }
        });
    }
};

exports.play = function(file){
    console.log(file.name);
};

exports.all = function(){
    var files = [];
    var ViewQuery = couchbase.ViewQuery;
    var bucket = Cluster.openBucket(conf.filesBucket);
    var q = ViewQuery.from('listing', 'allNames');
    bucket.query(q, function(err, res){
        if(err){
            console.log("err");
            console.log(err);
        }else{
            res.forEach(function(one){
                files.push(one.value);
            });
            sock.files(files);
        }
    });
};
