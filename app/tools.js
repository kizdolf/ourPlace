var fs = require('fs');
var log = require('simple-node-logger').createSimpleFileLogger('infos.log');

var rm = (path)=>{
    fs.access(path, function(err){
        if(!err){
            fs.unlinkSync(path);
            log.error('file ' + path + ' had beed deleted.');
        }else{
            log.error('! unable to supress file ' + path);
        }
    });
};

var thisIs404 = function(req, res){
    //TODO: Send a 404 page. Or redirect somewhere.
    res.json({msg: '404'});
};

module.exports = {
    rm: rm,
    thisIs404: thisIs404
};
