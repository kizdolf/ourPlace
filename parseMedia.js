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
};

var checkFiles = (files)=>{
    var toVerif = [];
    files.forEach((file)=>{
        var path = conf.mediaDir + '/' + file;
        if(!isDir.sync(path)){
            var type = mime.lookup(path);
            if(type.indexOf('image') === -1){
                toVerif.push(path);
            }
        }
    });
    callDb(toVerif);
};

var callDb = (files)=>{
    var toHandle = [];
    var size = files.length;
    re.getCon((c)=>{
        files.forEach((f)=>{
            r.db('ourPlace').table('songs').filter({path: '/' + f})
            .run(c, (e, cursor)=>{
                if(e){
                    tools.lo.error('get from cleaning', {error: e, path: f, byWho: 'system'});
                    console.log(e);
                }else{
                    cursor.next((e, r)=>{
                        if(e) toHandle.push(f);
                        size--;
                        if(size == 0){
                            handleFiles(toHandle);
                        }
                    });
                }
            });
        });
    });
};

var handleFiles = (list)=>{
    tools.lo.info('going to delete (cleaning)', {length: list.length, list: list, byWho: 'system'});
    list.forEach((f)=>{
        tools.lo.info('deleting ', {file: f, byWho: 'system'});
        fs.unlinkSync(f);
    });
    return true;
};

module.exports = {
    cleanMediasDir: cleanMediasDir
};