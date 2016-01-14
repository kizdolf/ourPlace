'use strict';

global.count = 0;

var r = require('rethinkdb'),
    cnf = require('./config.js').rethink,
    dbCnf = require('./criticalConf.js'),

log = require('simple-node-logger').createSimpleFileLogger('infos.log'),

socket = require('./socket')(),

listenChangeNote = (er, cursor)=>{
    cursor.each((e, val)=>{
        // socket.send(val);
    });
},
listenChangeSong = (er, cursor)=>{
    cursor.each((e, val)=>{
        // socket.send(val);
    });
};

r.connect(dbCnf.connect, (e, c)=>{
    if(e){
        console.log('erreur=>catch for changes');
        console.log(e);
    }else{
        r.table(cnf.tables.note).changes().run(c, listenChangeNote);
        r.table(cnf.tables.song).changes().run(c, listenChangeSong);
    }
});
