'use strict';

var
    mainConf        = require('./config').conf,
    conf            = require('./config').couch,
    couchbase       = require('couchbase'),
    Cluster         = new couchbase.Cluster(conf.host),
    sock            = require('./socket'),
    mime            = require('mime'),
    child_process   = require('child_process'),
    fs              = require('fs'),
    // ffmetadata      = require('ffmetadata'),
    mm              = require('musicmetadata'),
    accepted_mimes  = [ //should not be here. See config.jsf
        'audio/mp3',
        'audio/x-m4a',
        'audio/aac',
        'audio/mp4',
        'audio/mpeg',
        'audio/ogg',
        'audio/wav',
        'audio/webm',
    ];


var log = require('simple-node-logger').createSimpleFileLogger('infos.log');

var deleteAllFromBucket = function(){  // jshint ignore:line
    var ViewQuery = couchbase.ViewQuery;
    var bucket = Cluster.openBucket(conf.filesBucket);
    var q = ViewQuery.from('listing', 'allNames');
    bucket.query(q, function(err, res){
        if(err){
            log.error('err deleting something');
            log.error(err);
        }else{
            res.forEach(function(one){
                fs.unlinkSync(__dirname + '/..' + res.value.path);
                bucket.remove(one.key, function(){
                    console.log('removed ' + one.key);
                });
            });
        }
    });
};
//Uncomment this to delete all docs in bucket.
// deleteAllFromBucket();

/*
Retrieve metadata from a file. Files are not always easy with that,
so in case of error an empty object is returned. The app continue to run.
*/
var getMetaData = function(path, cb){
    mm(fs.createReadStream(path), function(err, meta){
        if(err){
            log.error('err getting Metadata. Continuing with empty meta.');
            log.error(err);
            cb(null, {});
        }else{
            //extract and save picture, need to be in it's own function.
            if(meta.picture[0] && meta.picture[0].data){
                var pic     = new Buffer(meta.picture[0].data),
                    picName = path.split('/')[1] + '.' + meta.picture[0].format;
                pic = pic.toString('base64');
                fs.writeFile(mainConf.coversPath + picName, pic, 'base64', function(err){
                    if(err){
                        log.error('err wrinting img');
                        log.error(err);
                        cb(err, null);
                    }else{
                        meta.picture = '/' + mainConf.coversPath + picName;
                        cb(null, meta);
                    }
                });
            }else{
                delete meta.picture;
                cb(null, meta);
            }
        }
    });
};

//update some metadata fields. it DOES NOT Write them in the file.
//TODO: write the new metadata IN the file AND in the db.
exports.updateMeta = function(data){
    var name = data.name;
    var Bucket = Cluster.openBucket(conf.filesBucket, function(err){
        if(err){
            log.error('openBucket failed ');
            log.error(err);
        }
    });
    Bucket.get(name, function(err, doc){
        if(!err){
            doc.value.meta.artist = data.artist;
            doc.value.meta.album = data.album;
            doc.value.meta.title = data.title;
            Bucket.replace(name, doc.value, function(err){
                if(err) {
                    log.error('updating meta for ', name);
                    log.error(err);
                }else exports.allSongs();
            });
        }
    });
};

//delete a db item. Should delete the related file as well. It's stupid to not.
exports.delete = function(name, cb){
    if(name){
        var Bucket = Cluster.openBucket(conf.filesBucket, function(err){
            if(err){
                console.log(err);
                cb(false);
            }
        });
        Bucket.get(name, function(err, res){
            if(!err){
                if (res.value.path){
                    log.info('deleting file: ' + res.value.path);
                    var path = __dirname + '/..' + res.value.path;
                    fs.access(path, function(err){
                        if(!err) fs.unlinkSync(path);
                    });
                }
            }else{
                cb(false);
            }
        });
        Bucket.remove(name, function(err){
            if(err){
                log.error('removing ', name);
                log.error(err);
                cb(false);
            }else{
                log.info('item ' + name + ' removed from database.');
                cb(true);
            }
        });
    }
};

/*
Handler for a new file.
Should be able to manage several type, not just music.
*/
exports.handle = function(file, cb){
    log.info('file to add:');
    log.info(file);
    if(accepted_mimes.indexOf(file.mimetype) === -1){
        log.info('file ' + file.path + ' is to remove because it does not fit mimes types.');
        var path = __dirname + '/../' + file.path;
        fs.unlinkSync(path);
        cb('does not fit mimes types', null);
    }else{
        getMetaData(file.path, function(err, meta){
            if(!err){ //else log. No?
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
                        log.error('inserting obj');
                        log.error(err);
                        var path = __dirname + '/..' + obj.path;
                        fs.access(path, function(err){
                            if(!err){
                                fs.unlinkSync(path);
                                log.error('file ' + path + ' had beed deleted.');
                            }
                        });
                        cb(err, null);
                    }else{
                        //this log is bad.
                        log.info('obj inserted:',  res.cas);
                        exports.allSongs();
                        cb(null, true);
                    }
                });
            }
        });
    }
};
var byDate = function(a, b){
    if(a.date > b.date) return -1;
    else return 1;
};
exports.allSongs = function(){
    var files = [];
    var ViewQuery = couchbase.ViewQuery;
    var bucket = Cluster.openBucket(conf.filesBucket);
    var q = ViewQuery.from('listing', 'allNames');
    return new Promise(function(ful, rej){
        bucket.query(q, function(err, res){
            if(err){
                console.log('err requesting all');
                console.log(err);
                rej(err);
            }else{
                res.forEach(function(one){
                    files.push(one.value);
                });
                files = files.sort(byDate);
                files.forEach((f, i)=>{
                    files[i].id = i;
                });
                ful(files);
            }
        });
    });
};

//send all notes.
exports.allNotes = function(req, res){
    var ViewQuery   = couchbase.ViewQuery,
        bucket      = Cluster.openBucket(conf.filesBucket),
        q           = ViewQuery.from('listing', 'allNotes'),
        notes       = [];
    bucket.query(q, function(err, result){
        if(err){
            console.log('err requesting all Notes');
            console.log(err);
        }else{
            result.forEach(function(one){
                // one.value.date = moment(one.value.date).format('ddd DD MMMM YYYY HH:mm');
                notes.push(one.value);
            });
            res.json(notes);
        }
    });
};

//add a note.
exports.addNote = function(req, res){
    var note = req.body.note;
    var Bucket = Cluster.openBucket(conf.filesBucket, function(err){
        if(err) console.log(err);
        else{
            Bucket.insert(note.name, note, function(err) {
                if (err){
                    log.error('err inserting obj');
                    log.error(err);
                }else{
                    log.info('note inserted: '+ note.name);
                    res.json({msg: 'note inserted.'});
                }
            });
        }
    });
};

exports.fromYoutube = function(url, cb){
    var dir = process.env.PWD + '/medias';
    var opts = ' --add-metadata --no-warnings --no-playlist --embed-thumbnail --prefer-ffmpeg -f bestaudio --print-json --cache-dir ' + dir + ' ';
    var exec = 'youtube-dl' + opts + url + ' -o \'' + dir + '/%(id)s.%(ext)s\'';
    log.info(' dowloading from youtube url : ' + url);
    child_process.exec(exec, function(err, out){
        var ret = JSON.parse(out);
        var obj = {
            name : ret.fulltitle,
            path :  mainConf.mediaPath + '/' +  ret.id + '.' + ret.ext,
            size : ret.filesize,
            date : new Date(),
            type : mime.lookup(ret._filename),
            meta : {
                picture : mainConf.mediaPath + '/' +  ret.id + '.jpg'
            }
        };
        var Bucket = Cluster.openBucket(conf.filesBucket, function(err){
            if(err){
                log.error(err);
                cb(false);
            }
        });
        Bucket.insert(obj.name, obj, function(err, res) {
            if (err){
                log.error('err inserting obj');
                log.error(err);
                cb(false);
            }else{
                log.info('obj inserted:'+ res.cas);
                log.info('extarct and saved from ' + url);
                cb(true);
            }
        });
    });
};
