var fs = require('fs');
var log = require('simple-node-logger').createSimpleFileLogger('infos.log');

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

/*J'ai la flemme, la grosse flemme.
    Bref. j'ai envie de log en base, accessible, sur lesquels on puisse construire une api.
    et la j'ai la flemme. flemme de le construire et flemme d'aller regarder des modules. Pourtant y'en a des biens...
*/
var lo = ()=>{
    var logBase = {
        when : Date.now(),
        level : '',
        log: '',
        attachment: {}
    };
    return{
        error: (log, attachment)=>{
            var l = {
                when : Date.now(),
                level : 'ERREUR',
                log: log,
                attachment: attachment
            };
        },
        info: (log, attachment)=>{

        },
        debug: (log, attachment)=>{

        }
    };
};

module.exports = {
    rm: rm,
    thisIs404: thisIs404,
    lo: lo
};
