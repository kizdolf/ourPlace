'use strict';



var
    conf            = require('./config').couch,
    couchbase       = require('couchbase'),
    Cluster         = new couchbase.Cluster(conf.host),
    sock            = require('./socket'),
    accepted_mimes  = [
        'audio/mp3'
    ];

exports.handle = function(file, cb){
    if(accepted_mimes.indexOf(file.mimetype) === -1){
        //delete file via fs
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
            if(err){
                console.log(err);
                cb(err, null);
            }
        });
        Bucket.insert(obj.name, obj, function(err, res) {
            if (err){
                console.log(err);
                cb(err, null);
            }else{
                console.log(res);
                exports.all();
                cb(null, true);
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
