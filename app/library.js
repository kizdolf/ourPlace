'use strict';

var
    low             = require('lowdb'),
    dbFile          = low('databases/files.json'),
    sock            = require('./socket'),
    accepted_mimes  = [
        'audio/mp3'
    ];

exports.handle = function(file){
    console.log(file);
    if(accepted_mimes.indexOf(file.mimetype) === -1){
        return false;
    }else{
        var obj = {
            name : file.originalname,
            path : '/' + file.path,
            size : file.size,
            date : new Date(),
            type : file.mimetype
        };
        dbFile('files').push(obj);
        sock.files();
        return true;
    }
};
