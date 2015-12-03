'use strict';

var r = require('rethinkdb'),
    cnf = require('./config.js').rethink,

log = require('simple-node-logger').createSimpleFileLogger('infos.log'),


listenChangeNote = (er, cursor)=>{
    cursor.each((e, val)=>{
        console.log(val);
    });
},
listenChangeSong = (er, cursor)=>{
    cursor.each((e, val)=>{
        console.log(val);
    });
};

r.connect(cnf.connect, (e, c)=>{
    if(e){
        console.log('erreur=>catch for changes');
        console.log(e);
    }else{
        r.table(cnf.tables.note).changes().run(c, listenChangeNote);
        r.table(cnf.tables.song).changes().run(c, listenChangeSong);
    }
});
