var fs = require('fs');
var log = require('simple-node-logger').createSimpleFileLogger('infos.log');
var re = require('./rethink'),
    tbls = require('./config').rethink.tables;

var rm = (path)=>{
    fs.access(path, (err)=>{
        if(!err){
            fs.unlinkSync(path);
            log.error('file ' + path + ' had beed deleted.');
        }else{
            log.error('! unable to supress file ' + path);
        }
    });
};

var thisIs404 = (req, res)=>{
    //TODO: Send a 404 page. Or redirect somewhere.
    res.json({msg: '404'});
};

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
    var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    var route = req.originalUrl;
    lo().request('request:', {ip: ip, route: route, method: req.method});
    if(req.secure) next();
    else res.redirect('https://' + req.headers.host + req.url);
}

module.exports = {
    rm: rm,
    thisIs404: thisIs404,
    lo: lo(),
    makeItHttps: makeItHttps
};
