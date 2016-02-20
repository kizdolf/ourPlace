'use strict';
/*
    Under dev. On change should send socket if needed.
    We could avoid to the dront to call the api just for one change.
    At the moment a socket 'update' is fired by the api call. 
    Once received by the front, the front call the api to retrieve all fields, and then do a diff.
    That's useless. We just have to trigger the good sockets from here.
*/

/*
    Pseudo logic to include:
    detect what kind of change.
    init the socket obj with the obj type (note or song)
    switch (kind)
        case insert: trigger 'new' socket with the new elem
        case delete: trigger 'delete' socket with type and id of the object.
        case update: trigger 'update' socket with the updated object.

    On the Front side:
        socket on 'new' || 'delete' || 'update'
            get type.(song or note?)
            dispatch in the appropriate function the event.
                on new : add object in the list, behave accordingly (update index, update playlist, etc)
                on delete: remove object with the id, behave accordingly.
                on update: replace obj directly. Should be enough.
*/

global.count = 0;

var r       = require('rethinkdb'),
    cnf     = require('./config.js').rethink,
    dbCnf   = require('./criticalConf.js'),
    s       = require('./socket')();

var

getKind = (val)=>{
    var n = val.new_val, o = val.old_val;
    return (n !== null && o === null) ? 'new' : (n === null && o !== null) ? 'delete' : 'changed';
},
sendTo = (type, obj)=>{
    obj.type = type;
    s.send(obj, '', true, obj.kind);
},
getChanges = (cursor, cb)=>{
    cursor.each((e, val)=>{
        var kind = getKind(val);
        var toSend = {kind: kind};
        toSend.obj = (kind != 'delete') ? (val.new_val) : (val.old_val.id);
        cb(toSend);
    });
},
listenChangeNote = (er, cursor)=>{
    if(!er) getChanges(cursor, (obj)=>{ sendTo('note', obj); });
},
listenChangeSong = (er, cursor)=>{
    if(!er) getChanges(cursor, (obj)=>{ sendTo('song', obj);});
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
