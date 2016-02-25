'use strict';

var
    mainConf        = require('./config').conf,
    critCnf         = require('./criticalConf'),
    re              = require('./rethink.js'),
    tbls            = require('./config').rethink.tables,
    tools           = require('./tools.js'),
    user            = require('./user'),
    mime            = require('mime'),
    child_process   = require('child_process'),
    fs              = require('fs'),
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


//simple logger is going to disappear. I want log in a db. (is disappearing.)
var log = require('simple-node-logger').createSimpleFileLogger('infos.log');
var lo  = tools.lo;

//listen the dbs for changes, we should check if weather or not is already loaded. 
require('./DBlisteners.js');


//extract and save picture. if extract failed just delete pic without blocking process.
var extractPicture = (meta, path, cb)=>{
    var pic     = new Buffer(meta.picture[0].data), //read picture
        picName = path.split('/').pop() + '.' + meta.picture[0].format, //deduct name.
        comp    = path.split('/');
    comp.pop();
    path = comp.join('/') + '/';
    pic = pic.toString('base64'); //convert the pic in readable data.
    fs.writeFile(path + picName, pic, 'base64', (err)=>{ //write data in it's own file.
        if(err){
            lo.error('writing img', {picName: picName, err: err});
            delete meta.picture; //do not keep the useless file.
            cb(meta); //pretend everything was fine.
        }else{
            lo.info('extracted img', {picName: picName, path: path});
            meta.picture = '/' + path + picName; //save new pic path
            cb(meta); //and return the updated object!
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
        if (old.path){
            var path = critCnf.local.appPath + old.path;
            tools.rm(path); //delete the song.
            if(old.meta && old.meta.picture){
                path = critCnf.local.appPath + old.meta.picture;
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
    I'm sure we can tell story with some code. First try:
    //Ding Dong, "I'm a file :) \o/"
//Hi, welcome to you, likeable file :)
//Do we like you? It's important!
//No we don't!
//PAN PAN PAN!
//See you never.
//You passed the first test! but will you finish them all ???
//We convert all songs in ogg format. Because it's the best for cross-browser html5 audio.
//first let's try to open you.
//There is usefull stuff here!
//I just need that, I'll remove it :)
//All that too actually!
//Who?
//Where?
//Can you specify where?
//How much?
//When? Ouh, sorry, we have a clock here.
//Give me your money!
//Even your Last Name!
//Now. I have it. I'll keep safe don't worry.
//I write it down even.
//Everything fine mate, was easy :)
//Fuck that shit. Fracking file did not fucking survived. Looser one.
//Let's burn it.
//Remember it.
//And say it. "Was a nice try kid."
//So he did not surived the inner examination.. I have no clue what will happened to that file. No trace of him!
*/
exports.handle = (file, cb)=>{
    lo.info('file to add:', {file: file});
    var path = critCnf.local.appPath + '/' + file.path;
    if(accepted_mimes.indexOf(file.mimetype) === -1){
        lo.info('file ' + file.path + ' is to remove because it does not fit mimes types.', {file: file});
        fs.unlinkSync(path);
        cb('does not fit mimes types', null);
    }else{
        var exec = 'avconv -v info -nostats  -y -i ' + path + ' -acodec libvorbis ' + path + '.ogg';
        child_process.exec(exec, (err)=>{
            if(err) lo.error('converting file to ogg.', {error: err, path: path, file: file});
            else{
                lo.info('converted file to ogg.', {path: path, file: file, newPath: (path + '.ogg')});
                fs.unlinkSync(path);
                file.path = file.path + '.ogg';
                getMetaData(file.path, function(err, meta){
                    if(!err){
                        var ext = file.originalname.split('.').pop();
                        var obj = {
                            name : file.originalname,
                            path : '/' + file.path,
                            type : file.mimetype,
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
                    }
                });

            } //you know what? if you're already dead I don't even give a fuck (actually it don't fail, because it's useless to fail here.)
        }); //Have a good night!

    } //Enjoy!
}; //Bacios!

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
        dir = critCnf.local.appPath + '/medias/' + d,
        path = mainConf.mediaPath + '/' + d;
    tools.mkdir(dir);
    var opts = ' --add-metadata --no-warnings --no-playlist --embed-thumbnail --prefer-ffmpeg -x --audio-format vorbis --print-json --cache-dir ' + dir + ' ';
    var exec = 'youtube-dl' + opts + url + ' -o \'' + dir + '/%(id)s.%(ext)s\'';
    log.info(' dowloading from youtube url : ' + url);
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
