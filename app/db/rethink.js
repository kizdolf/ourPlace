var r   = require('rethinkdb'),
conCnf  = require(global.core + '/criticalConf'),
_r      = require('rethinkdbdash')(conCnf.connect);

var log = require('simple-node-logger').createSimpleFileLogger('infos.log');

/*helpers*/
var getCon = (cb)=>{
    r.connect(conCnf.connect, (e, con)=>{
        if(e) log.error(e);
        else cb(con);
    });
};

/*exports*/
var insert = (tblName, json)=>{
    return new Promise((full, rej)=>{
        _r.table(tblName).insert(json)
        .run().then((res)=>{
            full(res);
        }).catch((e)=>{
            rej(e);
        });
    });
};


var getSome = (tblName, predicate, some)=>{
    if (!some) some = 1;
    return new Promise((ful, rej)=>{
        _r.table(tblName).filter(predicate).limit(some)
        .run().then((res)=>{
            ful(res);
        }).catch((e)=>{
            rej(e);
        });
    });
};

var delSome = (tblName, predicate)=>{
    return new Promise((ful, rej)=>{
        _r.table(tblName).filter(predicate).delete()
        .run().then((res)=>{
            ful(res);
        }).catch((e)=>{
            rej(e);
        });
    });
};

var getAll = (tblName)=>{
    return new Promise((ful, rej)=>{
        _r.table(tblName).run().then((res)=>{
            ful(res);
        }).catch((e)=>{
            rej(e);
        });
    });
};

var rmById = (tblName, id)=>{
    return new Promise((ful, rej)=>{
        _r.table(tblName).get(id).delete({
            durability: 'soft',
            returnChanges: true
        }).run().then((r)=>{
            ful(r);
        }).catch((e)=>{
            rej(e);
        });
    });
};

var update = (tblName, id, obj)=>{
    return new Promise((ful, rej)=>{
        _r.table(tblName).get(id).update(obj)
        .run().then((r)=>{
            ful(r);
        }).catch((e)=>{
            rej(e);
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
