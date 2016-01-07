'use strict';

var
    mainConf        = require('./config').conf,
    conf            = require('./config').couch,
    re              = require('./rethink.js'),
    tbls            = require('./config').rethink.tables,
    tools           = require('./tools.js'),
    couchbase       = require('couchbase'),
    Cluster         = new couchbase.Cluster(conf.host),
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

require('./DBlisteners.js');

var s = require('./socket')();
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
                        cb(null, {});
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
exports.update = (req, res)=>{
    var tbl = tbls[req.params.type];
    var id = req.params.id;
    var changes = req.body;
    var obj;
    if(req.params.type == 'song'){
        obj = {meta:{
            'artist': [changes.artist],
            'album': changes.album,
            'title': changes.title
        }};
    }
    re.update(tbl, id, obj).then((response)=>{
        log.info(id + ' on ' + tbl + ' was updated.');
        s.send(obj, req.session, true);
        res.json(response);
    }).catch((e)=>{
        log.error('updating ' + id + ' on ' + tbl);
        log.error(e);
        res.json(e);
    });
};

//delete a db item. Should delete the related file as well. It's stupid to not.
exports.delete = function(type, id, cb){
    var tbl = tbls[type];
    re.rmById(tbl, id).then((res)=>{
        var old = res.changes.old_val;
        if (old.path){
            var path = __dirname + '/..' + res.value.path;
            tools.rm(path);
        }
        cb(true);
    }).catch((e)=>{
        log.error('error removing item from db');
        log.error(e);
        cb(false);
    });
};

/*
Handler for a new file.
Should be able to manage several type, not just music.
*/
exports.handle = (file, cb)=>{
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
                re.insert(tbls.song, obj).then((res)=>{
                    log.info('obj inserted:', res);
                    cb(null, true);
                }).catch((err)=>{
                    tools.rm(__dirname + '/..' + obj.path);
                    log.error('error inserting song');
                    log.error(err);
                    cb(err, null);
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
    return new Promise(function(ful, rej){
        re.getAll(tbls.song).then((songs)=>{
            files = songs.sort(byDate);
            ful(files);
        }).catch((e)=>{
            log.error('err requesting all');
            log.error(e);
            rej(e);
        });
    });
};

//send all notes.
exports.allNotes = function(req, res){
    re.getAll(tbls.note).then((notes)=>{
        res.json(notes);
    }).catch((e)=>{
        log.error('err requesting all');
        log.error(e);
        res.json([]);
    });
};

//add a note.
exports.addNote = function(req, res){
    var note = req.body.note;
    re.insert(tbls.note, note)
    .then((r)=>{ //jshint ignore: line
        log.info('note inserted: '+ note.name);
        s.send(note, req.session, true);
        res.json({msg: 'note inserted.'});
    }).catch((e)=>{
        log.error('err inserting obj');
        log.error(e);
        res.json({msg: 'ERROR! note NOT inserted.'});
    });
};

exports.fromYoutube = function(url, cb){
    var dir = process.env.PWD + '/medias';
    var opts = ' --add-metadata --no-warnings --no-playlist --embed-thumbnail --prefer-ffmpeg -f bestaudio --print-json --cache-dir ' + dir + ' ';
    var exec = 'youtube-dl' + opts + url + ' -o \'' + dir + '/%(id)s.%(ext)s\'';
    log.info(' dowloading from youtube url : ' + url);
    child_process.exec(exec, function(err, out){
        if(!err || err.killed === false){
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

            re.insert(tbls.song, obj).then((res)=>{ //jshint ignore: line
                log.info('obj inserted:');
                cb(true);
            }).catch((err)=>{
                tools.rm(__dirname + '/..' + obj.path);
                log.error('error inserting song');
                log.error(err);
                cb(false);
            });
        }else{
            log.error(' with youtube-dl!');
            log.error(err);
        }
    });
};
