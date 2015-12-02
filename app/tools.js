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


module.exports = {
    rm: rm
};
