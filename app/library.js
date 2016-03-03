'use strict';

var
    mainConf        = require('./config').conf,
    critCnf         = require('./criticalConf'),
    re              = require('./rethink.js'),
    tbls            = require('./config').rethink.tables,
    tools           = require('./tools.js'),
    user            = require('./user'),
    lwip            = require('lwip'),
    mime            = require('mime'),
    child_process   = require('child_process'),
    fs              = require('fs'),
    lo              = tools.lo,
    // ffmetadata      = require('ffmetadata'),
    mm              = require('musicmetadata'),
    accepted_mimes  = [ //should not be here. See config.js
        'audio/mp3',
        'audio/x-m4a',
        'audio/aac',
        'audio/mp4',
        'audio/mpeg',
        'audio/ogg',
        'audio/wav',
        'audio/webm',
        'audio/flac'
    ];


//listen the dbs for changes, we should check if weather or not is already loaded.
require('./DBlisteners.js');


//extract and save picture. if extract failed just delete pic without blocking process.
var extractPicture = (meta, path, cb)=>{
    var pic     = new Buffer(meta.picture[0].data), //read picture
        style   = meta.picture[0].format,
        picName = path.split('/').pop() + '.' + style, //deduct name.
        comp    = path.split('/');
    comp.pop();
    path = comp.join('/') + '/';
    var fsPath  = path + picName;
    pic = pic.toString('base64'); //convert the pic in readable data.
    fs.writeFile(fsPath, pic, 'base64', (err)=>{ //write data in it's own file.
        if(err){
            lo.error('writing img', {picName: picName, err: err});
            delete meta.picture; //do not keep the useless file.
            cb(meta); //pretend everything was fine.
        }else{
            lo.info('extracted img', {picName: picName, path: path});
            meta.picture = '/' + fsPath; //save new pic path
            lwip.open(fsPath, style ,(err, img)=>{ //resize the pic.let's store small stuff.
                if(!err){
                    //scale should be done with the primary buffer.
                    var ratio = Math.min(mainConf.imgMaxSize.width / img.width(), mainConf.imgMaxSize.height / img.height());
                    img.scale(ratio, (err, img)=>{
                        if(!err){
                            img.writeFile(fsPath, style, (err)=>{
                                if(err) lo.error('resizing image', {img: fsPath, error: err});
                                cb(meta);
                            });
                        }else lo.error('scaling image', {img: fsPath, error: err});
                    });
                }else lo.error('opening image (lwip) image', {img: fsPath, error: err});
            });
        }
    });
};

/*
Retrieve metadata from a file. Files are not always easy with that, because of the
differents format we are facing. We should try to implement other metadata formats actually.
Maybe later.
So in case of error an empty object is returned. The app continue to run. See ya!
*/
var getMetaData = (path, cb)=>{
    mm(fs.createReadStream(path), (err, meta)=>{ //send all the algo to mm (music metadata package)
        if(err){
            lo.error('getting Metadata. Continuing with empty meta.', {pathWeKnow: path, err: err});
            cb(null, {}); //do not let 0 metaData prevent the song to be listened.
        }else{
            if(meta.picture[0] && meta.picture[0].data){ //there is a pic. Extract it.
                extractPicture(meta, path, (meta)=>{
                    cb(null, meta); //and go on..
                });
            }else{ //if no picture in file, the prop need to be cleared.
                delete meta.picture; //dont keep the picture field in the metadata.
                cb(null, meta);
            }
        }
    });
};

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
exports.update = (req, res)=>{
    var tbl = tbls[req.params.type]; //song or note?
    var id = req.params.id; //id in db
    var changes = req.body; //chnages to perform
    var obj; //where to perform them.

    if(req.params.type == 'song'){
        obj = {meta:{
            'artist': [changes.artist], //because hell, we could have several artists on one track. One day.
            'album': changes.album,
            'title': changes.title
        }};
    }else if (req.params.type == 'note'){
        obj = {
            'content' : changes.note //note are quite straightforwarded. (not sure this is xss proofed honestly.)
        };
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
exports.delete = function(type, id, cb){
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

exports.handle = (file, cb)=>{
    lo.info('file to add:', {file: file});
    var path = global.appPath + '/' + file.path;
    if(accepted_mimes.indexOf(file.mimetype) === -1){
        lo.info('file ' + file.path + ' is to remove because it does not fit mimes types.', {file: file});
        fs.unlinkSync(path);
        cb('does not fit mimes types', null);
    }else{
        getMetaData(file.path, function(err, meta){
            if(!err){
                convertToOgg(path, file, (err, file)=>{
                    if(err) cb('unable to convert file.', null);
                    else saveFile(file, meta, cb);
                });
            }
        });
    }
};

//best function ever !
var byDate = (a, b)=>{ return (a.date > b.date) ? -1 : 1; };

//TODO: add limitation number on demand. sorting options as well.
exports.allSongs = function(){
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
So in case of error we nned to check if the download/extraction was killed or not.
*/
exports.fromYoutube = function(url, cb){
    var d = (new Date().toISOString().substring(0,10)),
        dir = global.appPath + '/medias/' + d,
        path = mainConf.mediaPath + '/' + d;
    tools.mkdir(dir);
    var opts = ' --add-metadata --no-warnings --no-playlist --embed-thumbnail --prefer-ffmpeg -x --audio-format vorbis --print-json --cache-dir ' + dir + ' ';
    var exec = 'youtube-dl' + opts + url + ' -o \'' + dir + '/%(id)s.%(ext)s\'';
    lo.info(' dowloading from youtube', {url: url});
    child_process.exec(exec, (err, out)=>{
        if(!err || err.killed === false){
            var ret = JSON.parse(out);
            var obj = {
                name : ret.fulltitle,
                path : path + '/' +  ret.id + '.' + ret.ext,
                size : ret.filesize,
                date : new Date(),
                type : mime.lookup(ret._filename),
                meta : {
                    picture : path + '/' +  ret.id + '.jpg'
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
        }else{
            lo.error('error with youtube-dl!, trying to update it.', {error: err});
            child_process.exec('youtube-dl -U');
            cb(err);
        }
    });
};
