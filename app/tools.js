var
fs      = require('fs'),
re      = require(global.core + '/db/rethink'),
cnf     = require(global.core + '/config').conf,
tbls    = require(global.core + '/config').rethink.tables;

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

module.exports = {
    rm: rm,
    mkdir: mkdir,
    thisIs404: thisIs404,
    lo: lo(),
    makeItHttps: makeItHttps
};
