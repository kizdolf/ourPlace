'use strict';

var
    mainConf        = require('./config').conf,
    re              = require('./rethink.js'),
    tbls            = require('./config').rethink.tables,
    tools           = require('./tools.js'),
    user            = require('./user'),
    s               = require('./socket')(),
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
    ];


//simple logger is going to disappear. I want log in a db. (is disappearing.)
var log = require('simple-node-logger').createSimpleFileLogger('infos.log');
var lo  = tools.lo;

//listen the dbs for changes, we should check if weather or not is already loaded. 
require('./DBlisteners.js');


//extract and save picture. if extract failed just delete pic without blocking process.
var extractPicture = (meta, path, cb)=>{
    var pic     = new Buffer(meta.picture[0].data), //read picture
        picName = path.split('/')[1] + '.' + meta.picture[0].format; //deduct name.
    pic = pic.toString('base64'); //convert the pic in readable data.

    fs.writeFile(mainConf.coversPath + picName, pic, 'base64', (err)=>{ //write data in it's own file.
        if(err){
            lo.error('writing img', {picName: picName, err: err});
            delete meta.picture; //do not keep the useless file.
            cb(meta); //pretend everything was fine.
        }else{
            meta.picture = '/' + mainConf.coversPath + picName; //save new pic path
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
            lo.error('getting Metadata. Continuing with empty meta.', {pathWeKnow: path, err, err});
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
        s.send(obj, req.session, true); //trigger sockets.
        res.json(response); //send the db call succesfull result to the front.
    }).catch((e)=>{
        //if error don't even say it to the front. Because naaaaaa. Wait what? Let's say it to the front. 
        lo.error('updte', {t bpicName: picNamel: tbl, byWho: req.session.uuid, id: id, update: obj, error: e, err: err});
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
        var old = res.changes.old_val; //nicely, rethinkDb allow us to see what was the object BEFORE we deleted, but after. I do like that.
        if (old.path){
            var path = __dirname + '/..' + res.value.path;
            tools.rm(path); //delete the song.
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
*/
exports.handle = (file, cb)=>{ //Ding Dong, "I'm a file :) \o/"
    lo.info('file to add:', {file: file}); //Hi, welcome to you, likeable file :)
    if(accepted_mimes.indexOf(file.mimetype) === -1){ //Do we like you? It's important!
        lo.info('file ' + file.path + ' is to remove because it does not fit mimes types.', {file: file}); //No we don't!
        var path = __dirname + '/../' + file.path; //We'll even fucking kill you!
        fs.unlinkSync(path); //PAN PAN PAN!
        cb('does not fit mimes types', null); //See you never.
    }else{ //You passed the first test! but will you finish them all ???
        getMetaData(file.path, function(err, meta){ //first let's try to open you.
            if(!err){ //There is usefull stuff here!
                var ext = file.originalname.split('.').pop(); //I just need that, I'll remove it :)
                var obj = { //All that too actually!
                    name : file.originalname, //Who?
                    path : '/' + file.path, //Where?
                    type : file.mimetype, //Can you specify where?
                    size : file.size, //How much?
                    date : new Date(), //When?
                    meta : meta, //Give me your money!
                    ext  : ext //Even your Last Name!
                };
                re.insert(tbls.song, obj).then((res)=>{ //Now. I have it. I'll keep safe don't worry.
                    lo.info('insert', {tbl: tbls.song, obj: obj});
                    cb(null, true); //everything fine mate, was easy :)
                }).catch((err)=>{ //Fuck that shit. Fracking file did not fucking survived. Looser one.
                    tools.rm(__dirname + '/..' + obj.path); //Let's burn it.
                    lo.error('insert', {tbl: tbls.song, obj: obj, error: err}); //Remember it.
                    cb(err, null); //And say it.
                });
            } //you know what? if you're already dead I don't even give a fuck (actually it don't fail, because it's useless to fail here.)
        }); //Have a good night!
    } //Enjoy!
}; //Bacios!

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
    child_process.exec(exec, (err, out)=>{
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
