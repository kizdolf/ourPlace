var r   = require('rethinkdb'),
    conCnf = require('./dbConf');

var log = require('simple-node-logger').createSimpleFileLogger('infos.log');
var c = null;

/*insure connection*/
var p = r.connect(conCnf.connect, (e, con)=>{
    if(e) log.error(e);
    else c = con;
});

/*helpers*/
var getCon = (cb)=>{
    p.then((c)=>{
        cb(c);
    });
};

var reqlToArray = (reQL, cb)=>{
    p.then((c)=>{
        reQL.run(c, (err, cursor)=>{
            if(err) cb(err, null);
            else {
                cursor.toArray((e, r)=>{
                    if(e) cb(e, null);
                    else cb(null, r);
                });
            }
        });
    });
};

/*exports*/
var insert = (tblName, json)=>{
    return new Promise((full, rej)=>{
        var reQL = r.table(tblName).insert(json);
        p.then((c)=>{
            reQL.run(c, (err, res)=>{
                if(err) rej(err);
                else full(res);
            });
        });
    });
};


var getSome = (tblName, predicate, some)=>{
    if (!some) some = 1;
    return new Promise((ful, rej)=>{
        var reQL = r.table(tblName).filter(predicate).limit(some);
        reqlToArray(reQL, (err, res)=>{
            if(err) rej(err);
            else ful(res);
        });
    });
};

var delSome = (tblName, predicate)=>{
    return new Promise((ful, rej)=>{
        var reQL = r.table(tblName).filter(predicate).delete();
        p.then((c)=>{
            reQL.run(c, (err, res)=>{
                if(err) rej(err);
                else ful(res);
            });
        });
    });
};

var getAll = (tblName)=>{
    return new Promise((ful, rej)=>{
        var reQL = r.table(tblName);
        reqlToArray(reQL, (err, res)=>{
            if(err) rej(err);
            else ful(res);
        });
    });
};

var rmById = (tblName, id)=>{
    return new Promise((ful, rej)=>{
        p.then((c)=>{
            r.table(tblName).get(id).delete({
                durability: 'soft',
                returnChanges: true
            }).run(c, (e, r)=>{
                if(e) rej(e);
                else ful(r);
            });
        });
    });
};

var update = (tblName, id, obj)=>{
    return new Promise((ful, rej)=>{
        p.then((c)=>{
            r.table(tblName).get(id).update(obj).run(c, (e, r)=>{
                if(e) rej(e);
                else ful(r);
            });
        });
    });
};


module.exports = {
    insert: insert,
    getAll: getAll,
    rmById: rmById,
    update: update,
    getCon: getCon,
    getSome: getSome,
    delSome: delSome
};
