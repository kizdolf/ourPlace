'use strict';



var
    mainConf        = require('./config').conf,
    conf            = require('./config').couch,
    couchbase       = require('couchbase'),
    Cluster         = new couchbase.Cluster(conf.host),
    sock            = require('./socket'),
    fs              = require('fs'),
    mm              = require('musicmetadata'),
    accepted_mimes  = [
        'audio/mp3'
    ];

var getMetaData = function(path, cb){
    mm(fs.createReadStream(path), function(err, meta){
        if(err){
            console.log('err');
            console.log(err);
            cb(err, null);
        }else{
            console.log(meta);
            cb(null, meta);
        }
    });
};

exports.delete = function(name){
    var Bucket = Cluster.openBucket(conf.filesBucket, function(err){
        if(err){
            console.log(err);
        }
    });
    Bucket.remove(name, function(err){
        if(err){
            console.log(err);
        }else{
            exports.all();
        }
    });
};

exports.handle = function(file, cb){
    if(accepted_mimes.indexOf(file.mimetype) === -1){
        //delete file via fs
        return false;
    }else{
        getMetaData(file.path, function(err, meta){
            if(!err){
                var obj = {
                    name : file.originalname,
                    path : '/' + file.path,
                    size : file.size,
                    date : new Date(),
                    type : file.mimetype,
                    meta : meta
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
                if(one.value.meta.picture[0]){
                    var pic = new Buffer(one.value.meta.picture[0].data.data);
                    pic = 'data:image/gif;base64,' + pic.toString('base64');
                    one.value.meta.pic = pic;
                    delete one.value.meta.picture;
                }
                files.push(one.value);
            });
            sock.files(files);
        }
    });
};
