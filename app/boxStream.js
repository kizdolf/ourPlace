/*
    Use freebox-share module to get files from box, and stream them directly to the front.
    Necessary infos (token and app_definition) are stored in criticalConf.js
*/
'use strict';

var box     = require('./freebox-share/index'),
    boxConf = require('./criticalConf').freebox,
    appConf = boxConf.app,
    conf    = require('./config').conf,
    fs      = require('fs'),
    haveBox = false;

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
    var tmpFileName = path + '~' + Date.now();
    var pathFile = conf.tmpDir + '/' + tmpFileName + '.mp4';
    var wstream = fs.createWriteStream(pathFile);
    if(haveBox){
        box.streamFile(path)
        .on('data', (chunk)=>{
            wstream.write(chunk);
        });
        res.json({stream: conf.ndd + '/' + pathFile});
    }else{
        res.json({error: 'not loged on freebox.'});
    }
};

module.exports = {
    boxList: boxList,
    box64List: box64List,
    stream: stream
};