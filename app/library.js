'use strict';



var
    mainConf        = require('./config').conf,
    conf            = require('./config').couch,
    couchbase       = require('couchbase'),
    Cluster         = new couchbase.Cluster(conf.host),
    sock            = require('./socket'),
    moment          = require('moment'),
    fs              = require('fs'),
    // ffmetadata      = require('ffmetadata'),
    mm              = require('musicmetadata'),
    accepted_mimes  = [
        'audio/mp3',
        'audio/x-m4a'
    ];
//Uncomment this to delete all docs in bucket.
    // var ViewQuery = couchbase.ViewQuery;
    // var bucket = Cluster.openBucket(conf.filesBucket);
    // var q = ViewQuery.from('listing', 'allNames');
    // bucket.query(q, function(err, res){
    //     if(err){
    //         console.log("err");
    //         console.log(err);
    //     }else{
    //         res.forEach(function(one){
    //             bucket.remove(one.key, function(err){
    //                 console.log('removed ' + one.key);
    //             });
    //         });
    //     }
    // });

var getMetaData = function(path, cb){
    mm(fs.createReadStream(path), function(err, meta){
        if(err){
            console.log('err getting Metadata. Continuing with empty meta.');
            console.log(err);
            cb(null, {});
        }else{
            if(meta.picture[0] && meta.picture[0].data){
                var pic     = new Buffer(meta.picture[0].data),
                    picName = path.split('/')[1] + '.' + meta.picture[0].format;
                pic = pic.toString('base64');
                fs.writeFile(mainConf.coversPath + picName, pic, 'base64', function(err){
                    if(err){
                        console.log('err wrinting img');
                        console.log(err);
                        cb(err, null);
                    }else{
                        meta.picture = '/' + mainConf.coversPath + picName;
                        cb(null, meta);
                    }
                });
            }else{
                delete meta.picture
                cb(null, meta);
            }
        }
    });
};

exports.updateMeta = function(data){
    var name = data.name;
    var Bucket = Cluster.openBucket(conf.filesBucket, function(err){
        if(err){ console.log(err); }
    });
    Bucket.get(name, function(err, doc){
        if(!err){
            doc.value.meta.artist = data.artist;
            doc.value.meta.album = data.album;
            doc.value.meta.title = data.title;
            Bucket.replace(name, doc.value, function(err){
                if(err) console.log(err);
                else exports.all();
            });
        }
    });
};

exports.delete = function(name){
    if(name){
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
    }
};

exports.handle = function(file, cb){
    console.log(file.mimetype);
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
                        console.log('err inserting obj');
                        console.log(err);
                        cb(err, null);
                    }else{
                        console.log('obj inserted:'+ res);
                        exports.all();
                        cb(null, true);
                    }
                });
            }
        });
    }
};

exports.all = function(){
    var files = [];
    var ViewQuery = couchbase.ViewQuery;
    var bucket = Cluster.openBucket(conf.filesBucket);
    var q = ViewQuery.from('listing', 'allNames');
    bucket.query(q, function(err, res){
        if(err){
            console.log('err requesting all');
            console.log(err);
        }else{
            res.forEach(function(one){
                files.push(one.value);
            });
            sock.files(files);
        }
    });
};

exports.allNotes = function(){
    var ViewQuery   = couchbase.ViewQuery,
        bucket      = Cluster.openBucket(conf.filesBucket),
        q           = ViewQuery.from('listing', 'allNotes'),
        notes       = [];
    bucket.query(q, function(err, res){
        if(err){
            console.log('err requesting all Notes');
            console.log(err);
        }else{
            res.forEach(function(one){
                one.value.date = moment(one.value.date).format('ddd DD MMMM YYYY HH:mm');
                notes.push(one.value);
            });
            sock.notes(notes);
        }
    });
};

exports.addNote = function(note){
    console.log(note);
    var Bucket = Cluster.openBucket(conf.filesBucket, function(err){
        if(err) console.log(err);
        else{
            Bucket.insert(note.name, note, function(err) {
                if (err){
                    console.log('err inserting obj');
                    console.log(err);
                }else{
                    console.log('obj inserted:'+ note.name);
                    exports.allNotes();
                }
            });
        }
    });
};
