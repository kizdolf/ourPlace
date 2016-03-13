'use strict';

var
    conCnf          = require(global.core + '/criticalConf'),
    re              = require(global.core + '/db/rethink.js'),
    tbls            = require(global.core + '/config').rethink.tables,
    lo              = require(global.core + '/tools.js').lo,
    r               = require('rethinkdb'),
    _r              = require('rethinkdbdash')(conCnf.connect);

var played = (id, req)=>{
    var idUser = req.session.uuid;
    re.getCon((c)=>{
        r.table(tbls.stats).get(idUser).update({
            songs: {
                [id] : {
                    count: r.row('songs')(id)('count').add(1).default(1),
                    when:  r.row('songs')(id)('when').append(new Date()).default([new Date()])
                }
            },
            totalSongs: r.row('totalSongs').add(1).default(1)
        }).run(c);
        r.table(tbls.song).get(id)
        .update({played: r.row('played').add(1).default(1)})
        .run(c);
    });
};

/*A finir, pour savoir qui à mis quoi où..*/
var own = (id, resp)=>{
    var objId;
    if(resp.generated_keys){
        objId = resp.generated_keys;
    }
};

/*return count ids for user.*/
var getPlayed = (id, uuid)=>{
    return new Promise((ful)=>{
        _r.table(tbls.stats).get(uuid)('songs')(id)('count')
        .then((res)=>{
            ful(res);
        }).catch(()=>{
            _r.table(tbls.stats).get(uuid).update({
                songs: { [id] : { count: 0, when:  [new Date()] } }
            }).run();
            lo.error('catching played:', {byWho: uuid, idSng: id});
            ful(0);
        });
    });
};

/*return count ids for user.*/
var getTotPlayed = (uuid)=>{
    return new Promise((ful)=>{
        _r.table(tbls.stats).get(uuid)('totalSongs')
        .then((res)=>{
            ful(res);
        }).catch(()=>{
            _r.table(tbls.stats).get(uuid).update({
                totalSongs: 0
            }).run();
            lo.error('catching totPlayed:', {byWho: uuid});
            ful(0);
        });
    });
};

var getStatus = (req, res)=>{
    var uuid = req.session.uuid;
    _r.table(tbls.user).get(uuid)('status')
    .run().then((resp)=>{
        res.json(resp);
    })
    .catch(()=>{
        _r.table(tbls.user).get(uuid).update({status: {}});
        res.json({});
    });
};

var setStatus =  (req, res)=>{
    var status = req.body;
    var uuid = req.session.uuid;
    re.update(tbls.user, uuid, {status: status}).then(()=>{
        res.json(true);
    }).catch(()=>{
        res.json(false);
    });
};

module.exports = {
    played: played,
    own: own,
    getPlayed: getPlayed,
    setStatus: setStatus,
    getStatus: getStatus,
    getTotPlayed: getTotPlayed
};
