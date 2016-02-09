'use strict';

var
    mainConf        = require('./config').conf,
    re              = require('./rethink.js'),
    tbls            = require('./config').rethink.tables,
    tools           = require('./tools.js'),
    user            = require('./user'),
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


//simple logger is going to disappear. I want log in a db.
var log = require('simple-node-logger').createSimpleFileLogger('infos.log');
var lo = tools.lo;

require('./DBlisteners.js');

var s = require('./socket')();

//extract and save picture. if extract failed just delete pic without blocking process.
var extractPicture = (meta, path, cb)=>{
    var pic     = new Buffer(meta.picture[0].data),
        picName = path.split('/')[1] + '.' + meta.picture[0].format;
    pic = pic.toString('base64');
    fs.writeFile(mainConf.coversPath + picName, pic, 'base64', (err)=>{
        if(err){
            log.error('err wrinting img');
            log.error(err);
            delete meta.picture;
            cb(meta);
        }else{
            meta.picture = '/' + mainConf.coversPath + picName;
            cb(meta);
        }
    });
};

/*
Retrieve metadata from a file. Files are not always easy with that,
so in case of error an empty object is returned. The app continue to run.
*/
var getMetaData = (path, cb)=>{
    mm(fs.createReadStream(path), (err, meta)=>{
        if(err){
            log.error('err getting Metadata. Continuing with empty meta.');
            log.error(err);
            cb(null, {}); //do not let 0 metaData prevent the song to be listened.
        }else{
            if(meta.picture[0] && meta.picture[0].data){
                extractPicture(meta, path, (meta)=>{
                    cb(null, meta);
                });
            }else{ //if no picture in file, the prop need to be cleared.
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
    }else if (req.params.type == 'note'){
        obj = {
            'content' : changes.note
        };
    }
    re.update(tbl, id, obj).then((response)=>{
        lo.info('update', {tbl: tbl, byWho: req.session.uuid, id: id, update: obj});
        s.send(obj, req.session, true);
        res.json(response);
    }).catch((e)=>{
        lo.error('update', {tbl: tbl, byWho: req.session.uuid, id: id, update: obj, error: e});
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
                var ext = file.originalname.split('.').pop();
                var obj = {
                    name : file.originalname,
                    path : '/' + file.path,
                    size : file.size,
                    date : new Date(),
                    type : file.mimetype,
                    meta : meta,
                    ext  : ext
                };
                re.insert(tbls.song, obj).then((res)=>{
                    lo.info('insert', {tbl: tbls.song, obj: obj});
                    cb(null, true);
                }).catch((err)=>{
                    tools.rm(__dirname + '/..' + obj.path);
                    lo.error('insert', {tbl: tbls.song, obj: obj, error: err});
                    cb(err, null);
                });
            }
        });
    }
};

//best function ever !
var byDate = (a, b)=>{ return (a.date > b.date) ? -1 : 1; };

//TODO: add limitation number on demand. sorting options as well.
exports.allSongs = function(session){
    var files = [];
    var who = session.uuid;
    return new Promise(function(ful, rej){
        re.getAll(tbls.song).then((songs)=>{
            files = songs.sort(byDate);
            var lnght = files.length;
            files.forEach((sng, index)=>{
                user.getPlayed(sng.id, who).then((nb)=>{
                    lnght--;
                    files[index].playedBy = nb;
                    if(lnght == 0) ful(files);
                });
            });
        }).catch((e)=>{
            lo.error('get', {msg: 'requesting all songs.', tbl: tbls.song, error: e});
            rej(e);
        });
    });
};

//send all notes. TODO the same as for allSongs.
exports.allNotes = function(req, res){
    re.getAll(tbls.note).then((notes)=>{
        res.json(notes);
    }).catch((e)=>{
        lo.error('get', {msg: 'requesting all notes.', tbl: tbls.note, error: e});
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
        user.own(req.session.uuid, r);
        res.json({msg: 'note inserted.'});
    }).catch((e)=>{
        log.error('err inserting obj');
        log.error(e);
        res.json({msg: 'ERROR! note NOT inserted.'});
    });
};

/*
Retrieve a youTube song from url.
Use the awesome youtube-dl (https://rg3.github.io/youtube-dl/) to handle the download and song extraction.
Some modules exists do to the same, but honestly that's just better.
Just one thing: if youtube-dl is not up do date it can crash sometimes, but the song is still here.
So in case of error we nned to check if the download/extraction was killed or not.
*/
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
                },
                urlOrigin: url,
                ext : ret.ext
            };

            re.insert(tbls.song, obj).then((res)=>{ //jshint ignore: line
                log.info('obj inserted:');
                lo.info('insert', {tbl: tbls.song, obj: obj});
                cb(true);
            }).catch((err)=>{
                tools.rm(__dirname + '/..' + obj.path);
                tools.rm(__dirname + '/..' + obj.meta.picture);
                lo.error('error inserting song', {error: err});
                cb(err);
            });
        }else{
            lo.error('error with youtube-dl!, trying to update it.', {error: err});
            child_process.exec('youtube-dl -U');
            cb(err);
        }
    });
};
