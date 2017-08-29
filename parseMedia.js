'use strict';

var conf    = require('./app/config').conf,
    mime    = require('mime'),
    fs      = require('fs'),
    isDir   = require('is-directory'),
    r       = require('rethinkdb'),
    tools   = require('./app/tools'),
    re      = require('./app/rethink');



var cleanMediasDir = ()=>{
    fs.readdir(conf.mediaDir, (err, files)=>{
        checkFiles(files);
    });
    fs.readdir(conf.coversPath, (err, pics)=>{
        checkPics(pics);
    });
};

var checkPics = (pics)=>{
    var toVerif = [];
    pics.forEach((file)=>{
        var path = conf.coversPath + file;
        if(!isDir.sync(path)){
            var type = mime.lookup(path);
            if(type.indexOf('image') !== -1) toVerif.push(path);
        }
    });
    callDb([], toVerif);
};

var checkFiles = (files)=>{
    var toVerif = [];
    var pics = [];
    files.forEach((file)=>{
        var path = conf.mediaDir + '/' + file;
        if(!isDir.sync(path)){
            var type = mime.lookup(path);
            if(type.indexOf('image') === -1) toVerif.push(path);
            else pics.push(path);
        }
    });
    callDb(toVerif, pics);
};

var callDb = (files, pics)=>{
    var toHandle = [];
    var size = files.length;
    re.getCon((c)=>{
        files.forEach((f)=>{
            r.db('ourPlace').table('songs').filter({path: '/' + f})
            .run(c, (e, cursor)=>{
                if(e) tools.lo.error('get from cleaning', {error: e, path: f, byWho: 'system'});
                else{
                    cursor.next((e, r)=>{
                        if(e) toHandle.push(f);
                        if(--size == 0) handleFiles(toHandle);
                    });
                }
            });
        });
        var pSize = pics.length;
        var delPics = [];
        pics.forEach((p)=>{
            r.db('ourPlace').table('songs').filter({meta: {picture: '/' + p}})
            .run(c, (e, cursor)=>{
                if(e){
                    tools.lo.error('get from cleaning', {error: e, path: f, byWho: 'system'});
                    console.log(e);
                }else{
                    cursor.next((e, r)=>{
                        pSize--;
                        if(e){
                            delPics.push(p);
                            tools.lo.info('deleting ', {pic: p, byWho: 'system'});
                            fs.unlinkSync(p);
                        }
                        if(pSize == 0){
                            tools.lo.info('deleted pics: ', {list: delPics, length: delPics.length, byWho: 'system'});
                        }
                    });
                }
            });
        });
    });
};

var handleFiles = (list)=>{
    if(list.length !== 0){
        tools.lo.info('going to delete (cleaning)', {length: list.length, list: list, byWho: 'system'});
        list.forEach((f)=>{
            tools.lo.info('deleting ', {file: f, byWho: 'system'});
            fs.unlinkSync(f);
        });
    }else{
        tools.lo.info('Nothing to delete (cleaning)', {byWho: 'system'});
    }
    return true;
};

/*
    Recover what I fucking deleted.
    I can just retrieve what's out there on the web.
    so stuff from youtube. (better than nothing hein)
    launch it by hand. It's not something we're SUPPOSED to launch every damn day, riiiiiggght?
    (just uncomment the call, and run "node parseMedia".)
*/
var request = require('request');

var download = (uri, filename, cb)=>{
    request.head(uri, function(err, res, body){
        request(uri).pipe(fs.createWriteStream(filename)).on('close', cb);
    });
};

var recovPicsYt = ()=>{
    var pics = [];
    re.getCon((c)=>{
        r.db('ourPlace').table('songs').filter(function(song){
            return song('meta')('picture').match('cover').not();
        }).run(c, (e, cur)=>{
            cur.each((e, s)=>{
                var videoId = s.meta.picture.split('/')[2],
                    id      = videoId.split('.')[0],
                    url     = 'https://i.ytimg.com/vi/' + id + '/mqdefault.jpg';
                pics.push({pic: videoId, url: url});
            }, ()=>{
                pics.forEach((p)=>{
                    download(p.url, (conf.mediaDir + '/' + (new Date().toISOString().substring(0,10)) + '/') + p.pic, ()=>{
                        tools.lo.info('Picture downloaded again' , {url: p.url, pic: p.pic, byWho: 'system'});
                    });
                });
            });
        });
    });
};

// recovPicsYt();

module.exports = {
    cleanMediasDir: cleanMediasDir
};
