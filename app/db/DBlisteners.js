'use strict';
/*
    Pseudo logic:
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
var r       = require('rethinkdb'),
    cnf     = require(global.core + '/config.js').rethink,
    dbCnf   = require(global.core + '/criticalConf.js'),
    s       = require(global.core + '/socket')();

var
//detect what kind of change for one change val returned by the db.
getKind = (val)=>{
    var n = val.new_val, o = val.old_val;
    return (n !== null && o === null) ? 'new' : (n === null && o !== null) ? 'delete' : 'changed';
},
//trigger the sockets.
sendTo = (type, obj)=>{
    obj.type = type;
    s.send(obj, '', true, obj.kind);
},
//main.
getChanges = (cursor, cb)=>{
    cursor.each((e, val)=>{
        var kind    = getKind(val);
        cb({
            kind: kind,
            obj : (kind != 'delete') ? (val.new_val) : (val.old_val.id)
        });
    });
},
listenChangeNote = (er, cursor)=>{
    if(!er) getChanges(cursor, (obj)=>{ sendTo('note', obj); });
},
listenChangeSong = (er, cursor)=>{
    if(!er) getChanges(cursor, (obj)=>{ sendTo('song', obj); });
},
listenChangeVideo = (er, cursor)=>{
    if(!er) getChanges(cursor, (obj)=>{ sendTo('cloud', obj); });
};

/* Listen changes.*/
r.connect(dbCnf.connect, (e, c)=>{
    if(!e){
        r.table(cnf.tables.note).changes().run(c, listenChangeNote);
        r.table(cnf.tables.song).changes().run(c, listenChangeSong);
        r.table(cnf.tables.video).changes().run(c, listenChangeVideo);
    }
});
