var r   = require('rethinkdb'),
    cnf = require('./config.js').rethink;

var log = require('simple-node-logger').createSimpleFileLogger('infos.log');
var c;

r.connect(cnf.connect, (e, con)=>{
    if(e) log.error(e);
    else c = con;
});

var insert = (tblName, json)=>{
    return new Promise((full, rej)=>{
        var reQL = r.table(tblName).insert(json);
        reQL.run(c, (err, res)=>{
            if(err) rej(err);
            else full(res);
        });
    });
};

var getAll = (tblName)=>{
    return new Promise((ful, rej)=>{
        var reQL = r.table(tblName);
        reQL.run(c, (err, cursor)=>{
            if(err) rej(err);
            else {
                cursor.toArray((e, r)=>{
                    if(e) rej(e);
                    else ful(r);
                });
            }
        });
    });
};

var rmById = (tblName, id)=>{
    return new Promise((ful, rej)=>{
        r.table(tblName).get(id).delete({
            durability: "soft",
            returnChanges: true
        })
        .run(c, (e, r)=>{
            if(e) rej(e);
            else ful(r);
        });
    });
};

// re.update(tbl, id, changes).then((res)=>{
var update = (tblName, id, obj)=>{
    return new Promise((ful, rej)=>{
        r.table(tblName).get(id).update(obj)
        .run(c, (e, r)=>{
            if(e) rej(e);
            else ful(r);
        });
    });
};


module.exports = {
    insert: insert,
    getAll: getAll,
    rmById: rmById,
    update: update
};
