/*
    Use freebox-share module to get files from box, and stream them directly to the front.
    Necessary infos (token and app_definition) are stored in criticalConf.js
*/
'use strict';

var box         = require(global.core + '/freebox-share/index'),
    boxConf     = require(global.core + '/criticalConf').freebox,
    conf        = require(global.core + '/config').conf,
    fs          = require('fs'),
    mime        = require('mime'),
    appConf     = boxConf.app,
    haveBox     = false;

box.getBox(appConf.id, appConf.appName, appConf.version, appConf.device, appConf.ip, ()=>{
    box.login(boxConf.token, (loged)=>{
        if(loged){
            haveBox = true;
        }
    });
});

var boxList = (req, res)=>{
    if(!haveBox){
        res.json({error: 'not loged on freebox.'});
    }else{
        var files = [];
        box.lsFiles(boxConf.paths.movies, (list)=>{
            list.forEach((item)=>{
                if(!item.hidden){
                    files.push(item);
                }
            });
            res.json({list: files});
        });
    }
};

var box64List = (req, res)=>{
    var path = req.params.path;
    if(!haveBox){
        res.json({error: 'not loged on freebox.'});
    }else{
        var files = [];
        box.b64lsFiles(path, (list)=>{
            list.forEach((item)=>{
                if(!item.hidden){
                    files.push(item);
                }
            });
            res.json({list: files});
        });
    }
};

/*
To do:
    check if file already downloaded (or in download)
    if so
        reset the timer to X seconds
        send info
    else
        get file info from box
        get file stream
        convert stream to mp4
        stream into unique file
        save in db the path
        on stream end mark the file as ready to be deleted
    delete file after X seconds (something like 4 or 5 hours?)
    mark file as deleted in db.
*/
var stream = (req, res)=>{
    var path = req.params.path;
    box.b64lsFiles(path, (list)=>{
        var file = list[0],
        ext = mime.extension(file.mimetype),
        tmpFileName = path + '~' + Date.now(),
        relPath = '/' + conf.tmpDir + '/' + tmpFileName + '.mp4',
        pathFile = global.appPath + '/' + conf.tmpDir + '/' + tmpFileName + '.mp4';
        fs.writeFileSync(pathFile, '');
        box.streamFile(path, pathFile, ext);
        res.json({path: relPath});
    });
};

module.exports = {
    boxList: boxList,
    box64List: box64List,
    stream: stream
};
