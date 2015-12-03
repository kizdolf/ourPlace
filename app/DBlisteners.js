'use strict';

var r = require('rethinkdb'),
    cnf = require('./config.js').rethink;

var log = require('simple-node-logger').createSimpleFileLogger('infos.log');

r.connect(cnf.connect)
.then((c)=>{
    for(let tbl of cnf.tables){
        r.table(tbl).changes().run(c, listenChange);
    }
})
.catch((e)=>{
    console.log(e);
});

var listenChange = (er, cursor)=>{
    if(!er){
        cursor.each((doc)=>{
            console.log(doc);
        });
    }
};
