'use strict';

var
    conf            = require(global.core + '/config'),
    mainConf        = conf.conf,
    re              = require(global.core + '/db/rethink'),
    tbls            = require(global.core + '/config').rethink.tables,
    tools           = require(global.core + '/tools'),
    user            = require(global.core + '/user'),
    cloud           = require(global.core + '/cloud/main'),
    torrent         = require(global.core + '/cloud/torrenting'),
    mime            = require('mime'),
    child_process   = require('child_process'),
    fs              = require('fs'),
    lo              = tools.lo;

//listen the dbs for changes, we should check if weather or not is already loaded.
require(global.core + '/db/DBlisteners.js');

/**
@params: req : request from express
@params: res : response to express
update some metadata fields. it DOES NOT Write them in the file.
TODO: write the new metadata IN the file AND in the db.
Data in request:
    song: {name, val, type},
    note: {name, val, type}
Data in URL:
    {type, id}
**/
const update = (req, res)=>{
    var tbl = tbls[req.params.type]; //song or note?
    var id = req.params.id; //id in db
    var changes = req.body; //chnages to perform
    var obj; //where to perform them.

    switch (req.params.type){
        case ('song'):
            obj = {
                meta:{
                    'artist': [changes.artist], //because hell, we could have several artists on one track. One day.
                    'album': changes.album,
                    'title': changes.title
                }
            };
            break;
        case ('note'):
            obj = {
                'content' : changes.note //note are quite straightforwarded. (not sure this is xss proofed honestly.)
            };
            break;
        case ('video'):
            obj = {
                meta: changes
            };
            break;
        default:
            lo.error('update type not known', {tbl: tbl, byWho: req.session.uuid, id: id});
            res.json({error: 'update failed due to unknwon type of data'}); //sorry
            return;
    }
    re.update(tbl, id, obj).then((response)=>{ //call db.
        lo.info('update', {tbl: tbl, byWho: req.session.uuid, id: id, update: obj});
        res.json(response); //send the db call succesfull result to the front.
    }).catch((e)=>{
        lo.error('update', {tbl: tbl, byWho: req.session.uuid, id: id, update: obj, error: e});
        res.json({error: 'update failed to record itself in the database.'}); //sorry
    });
};

/*
    Delete a db item.
    Should delete the related file as well.
    It's stupid to not. (you could just restart the server and enjoy the autocleaning. yup.)
*/
const deleteItem = function(type, id, cb){
    var tbl = tbls[type];
    re.rmById(tbl, id).then((res)=>{
        var old = res.changes[0].old_val; //nicely, rethinkDb allow us to see what was the object BEFORE we deleted, but after. I do like that.
        lo.info('removing item from db', {item: old, type: type});
        if (old.path){
            var path = global.appPath + old.path;
            tools.rm(path); //delete the song.
            if(old.meta && old.meta.picture){
                path = global.appPath + old.meta.picture;
                tools.rm(path); //delete the pic.
            }
        }
        cb(true); //Et bim!!
    }).catch((e)=>{
        lo.error('removing item from db', {error: e, deletedIdInDB: id, type: type});
        cb(false); //PoPoPoPo
    });
};

/*
    Handler for a new file.
    Should be able to manage several type, not just music.
    Next dev to do here:
        -put the mimetypes in db, with setter/getter.
        -use this table to check if mimetypes is ok.
        -if not, only the root can still upload it.
        -better handle of the erro case after getMetaData.
*/

var saveFile = (file, meta, cb)=>{
    var ext = file.originalname.split('.').pop();
    var obj = {
        name : file.originalname,
        path : '/' + file.path,
        type : 'audio/ogg', //to fix!
        size : file.size,
        date : new Date(),
        meta : meta,
        ext  : ext
    };
    re.insert(tbls.song, obj).then(()=>{
        lo.info('insert', {tbl: tbls.song, obj: obj});
        cb(null, true);
    }).catch((err)=>{
        tools.rm(__dirname + '/..' + obj.path);
        lo.error('insert', {tbl: tbls.song, obj: obj, error: err});
        cb(err, null);
    });
};

var convertToOgg = (path, file, cb)=>{
    var exec = 'avconv -v info -nostats  -y -i ' + path + ' -acodec libvorbis ' + path + '.ogg';
    child_process.exec(exec, (err)=>{
        if(err){
            lo.error('converting file to ogg.', {error: err, path: path, file: file});
            fs.unlinkSync(path);
            cb(true, null);
        }else{
            lo.info('converted file to ogg.', {path: path, file: file, newPath: (path + '.ogg')});
            fs.unlinkSync(path);
            file.path = file.path + '.ogg';
            cb(null, file);
        }
    });
};

const handle = (file, req, cb)=>{
    lo.info('file to add:', {file: file});
    var path = global.appPath + '/' + file.path;
    var  mimeToHandle = false;
    conf.OKmimes.forEach(function(mimetype){
        if(file.mimetype.indexOf(mimetype) !== -1){
            mimeToHandle = mimetype;
            return;
        }
    });
    switch (mimeToHandle){
        case 'video':
            cloud.handle(file, req, cb);
            break;
        case 'audio':
            tools.getMetaData(file.path, function(err, meta){
                if(!err){
                    convertToOgg(path, file, (err, file)=>{
                        if(err) cb('unable to convert file.', null);
                        else saveFile(file, meta, cb);
                    });
                }
            });
            break;
        case 'torrent':
            torrent.newTorrent(file, req, cb);
            break;
        default:
            lo.info('file ' + file.path + ' is to remove because it does not fit mimes types.', {file: file});
            fs.unlinkSync(path);
            cb('does not fit mimes types', null);
    }
};

//best function ever !
var byDate = (a, b)=>{ return (a.date > b.date) ? -1 : 1; };

//TODO: add limitation number on demand. sorting options as well.
const allSongs = function(){
    var files = [];
    return new Promise(function(ful, rej){
        re.getAll(tbls.song).then((songs)=>{
            files = songs.sort(byDate);
            ful(files);
        }).catch((e)=>{
            lo.error('get', {msg: 'requesting all songs.', tbl: tbls.song, error: e});
            rej(e);
        });
    });
};

//send all notes. TODO the same as for allSongs.
const allNotes = function(req, res){
    re.getAll(tbls.note).then((notes)=>{
        res.json(notes);
    }).catch((e)=>{
        lo.error('get', {msg: 'requesting all notes.', tbl: tbls.note, error: e});
        res.json([]);
    });
};

//add a note.
const addNote = function(req, res){
    var note = req.body.note;
    re.insert(tbls.note, note)
    .then((r)=>{ //jshint ignore: line
        lo.info('note inserted',{tbl: tbls.note, note: note, byWho: req.session.uuid});
        user.own(req.session.uuid, r);
        res.json({msg: 'note inserted.'});
    }).catch((e)=>{
        lo.info('inserting note',{tbl: tbls.note, note: note, byWho: req.session.uuid, error: e});
        res.json({msg: 'ERROR! note NOT inserted.'});
    });
};

/*
Retrieve a youTube song from url.
Use the awesome youtube-dl (https://rg3.github.io/youtube-dl/) to handle the download and song extraction.
Some modules exists do to the same, but honestly that's just better.
Just one thing: if youtube-dl is not up do date it can crash sometimes, but the song is still here.
So in case of error we need to check if the download/extraction was killed or not.
*/
const fromYoutube = function(url, cb){
    var d = (new Date().toISOString().substring(0,10)),
        dir = global.appPath + '/medias/' + d,
        path = mainConf.mediaPath + '/' + d;
    tools.mkdir(dir);

    var program = 'youtube-dl';

    var opts  = ' -4 --add-metadata --no-warnings --no-playlist';
        opts += ' --embed-thumbnail --prefer-ffmpeg -x --audio-format vorbis';
        opts += ' --print-json --cache-dir ' + dir + ' ';

    var destYt = ' -o \'' + dir + '/%(id)s.%(ext)s\'';

    const exec = program + opts + url + destYt;
    child_process.exec(exec, (err, out)=>{
        if(!err || err.killed === false){
            lo.info(' dowloaded from youtube', {url: url});
            var ret = JSON.parse(out),
            imgPath = path + '/' +  ret.id + '.jpg';
            tools.resizePic( global.appPath + imgPath, 'jpg', (ok)=>{
                lo.info('resize done', {img: imgPath, ok: ok});
                var obj = {
                    name : ret.fulltitle,
                    path : path + '/' +  ret.id + '.ogg',
                    size : ret.filesize,
                    date : new Date(),
                    type : mime.lookup(ret._filename),
                    meta : {
                        picture : imgPath
                    },
                    urlOrigin: url,
                    ext : ret.ext
                };

                re.insert(tbls.song, obj).then((res)=>{ //jshint ignore: line
                    lo.info('insert', {tbl: tbls.song, obj: obj});
                    cb(true);
                }).catch((err)=>{
                    tools.rm(__dirname + '/..' + obj.path);
                    tools.rm(__dirname + '/..' + obj.meta.picture);
                    lo.error('error inserting song', {error: err});
                    cb(err);
                });
            });
        }else{
            lo.error('error with youtube-dl!, trying to update it.', {error: err});
            child_process.exec('youtube-dl -U');
            cb(err);
        }
    });
};


module.exports = {
  update: update,
  delete : deleteItem,
  handle: handle,
  allSongs: allSongs,
  allNotes: allNotes,
  addNote: addNote,
  fromYoutube: fromYoutube,
  convertToOgg: convertToOgg,
  saveFile: saveFile
}
