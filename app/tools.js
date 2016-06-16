var
fs          = require('fs'),
mainConf    = require(global.core + '/config').conf,
re          = require(global.core + '/db/rethink'),
cnf         = require(global.core + '/config').conf,
lwip        = require('lwip'),
tbls        = require(global.core + '/config').rethink.tables;

var rm = (path)=>{
    fs.access(path, (err)=>{
        if(!err){
            fs.unlinkSync(path);
            lo().info('deleted file ', {path: path});
        }else
            lo().error('unable to supress file ', {path: path});
    });
};

var mkdir = (path)=>{
    try{
        fs.mkdirSync(path);
    }catch(e){}
};

var thisIs404 = (req, res)=>{
    //TODO: Send a 404 page. Or redirect somewhere.
    res.json({msg: '404'});
};

//save logs in logs table.
/*
    To do: handle table when it become too fat.
        Save data in a tar file, clean table (keep lasts nothing more tahsn 10 days or so)
*/
var lo = ()=>{
    var logIt = (level, log, attachment)=>{
        var toLog = {
            when : Date.now(),
            timestamp: ~~(new Date() / 1000),
            level : level,
            log: log,
            attachment: attachment
        };
        if(level === 'request')
            re.insert(tbls.request, toLog);
        else
            re.insert(tbls.log, toLog);
    };
    return{
        error: (log, attachment)=>{
            logIt('error', log, attachment);
        },
        info: (log, attachment)=>{
            logIt('info', log, attachment);
        },
        debug: (log, attachment)=>{
            logIt('debug', log, attachment);
        },
        request: (log, attachment)=>{
            logIt('request', log, attachment);
        },
    };
};

var makeItHttps = (req, res, next)=>{
    var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress,
    route = req.originalUrl;
    if(cnf.devMode) lo().request('request:', {ip: ip, route: route, method: req.method});
    if(req.secure || !cnf.httpsMode) next();
    else res.redirect('https://' + req.headers.host + req.url);
};

var resizePic = (fsPath, style, cb) =>{
    lwip.open(fsPath, style, (err, img)=>{ //resize the pic.let's store small stuff.
        if(!err){
            //scale should be done with the primary buffer.
            var ratio = Math.min(mainConf.imgMaxSize.width / img.width(), mainConf.imgMaxSize.height / img.height());
            lo().info('resize image ', {img: fsPath, ratio: ratio});  
            img.scale(ratio, (err, img)=>{
                if(!err){
                    img.writeFile(fsPath, style, (err)=>{
                        if(err){
                            lo().error('resizing image', {img: fsPath, error: err});
                            cb(false);
                        }else {
                            cb(true);
                        }
                    });
                }else{
                    lo().error('scaling image', {img: fsPath, error: err});
                    cb(false);
                }
            });
        }else{
            lo().error('opening image (lwip) image', {img: fsPath, error: err});
            cb(false);
        }
    });
};

module.exports = {
    rm: rm,
    mkdir: mkdir,
    thisIs404: thisIs404,
    lo: lo(),
    makeItHttps: makeItHttps,
    resizePic: resizePic
};
