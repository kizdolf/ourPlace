/*
    launch this script via "node defaultPropsMedia"
    Add props to all medias objects (notes, songs, videos) in db.
*/

'use strict';

var owner       = null; //will be the uuid of the admin (me atm)

const   conCnf  = require('./../app/criticalConf'),
   	    tbls    = require('./../app/config').rethink.tables,
        _r      = require('rethinkdbdash')(conCnf.connect);


var getMainUuid = (pseudo, cb)=>{
    _r.table(tbls.user).filter({pseudo: pseudo}).run()
    .then((user)=>{
        cb(null, user[0].id);
    })
    .catch((err)=>{
        cb(err, null);
    });
};

var addPropsToTable = (table, cb)=>{
    _r.table(table).run()
    .then((medias)=>{
        var last = medias.length - 1;
        medias.forEach((media, i)=>{
            media.visibility = {
                owner: owner,
                isPrivate: (table == tbls.note) ? true : false
            };
            _r.table(table).get(media.id).update(media).run()
            .then((res)=>{
                if(i == (last)){
                    cb(null, true);
                }
            })
            .catch((err)=>{
                console.error('update FAIL');
                console.error(err);
                if(i == (last)){
                    cb(err, null);
                }
            });
        });
    })
    .catch((err)=>{
        console.error(err);
        cb(err, null);
    });
};

var setUsersDefaultProps = (cb)=>{
    _r.table(tbls.user).run()
    .then((users)=>{
        var last = users.length - 1,
            i = 0;
        users.forEach((user)=>{
            var defaultVisibilityUser = {
                'songs' : 'public',
                'videos' : 'public',
                'notes' : 'private'
            };
            _r.table(tbls.user).get(user.id).update({
                status: {
                    defaultVisibility: defaultVisibilityUser
                }
            }).run()
            .then((res)=>{
                i++;
                if(i == last){
                    cb(null, true);
                }
            })
            .catch((err)=>{
                console.log('error getting one user');
                console.error(err);
                cb(err, null);
            });
        });
    })
    .catch((err)=>{
        console.log('error getting all users');
        console.log(err);
        cb(err, null);
    });
};

var run = ()=>{
    var mediasTables = [
        tbls.note,
        tbls.song,
        tbls.video
    ];
    getMainUuid('dk',(err, res)=>{
        if(!err){
            console.log('uuid is ' + res);
            owner = res;
        }else{
            console.error(err);
        }
        var i = 0,
            last = mediasTables.length - 1;
        mediasTables.forEach((table)=>{
            console.log('Adding props to table ' + table);
            addPropsToTable(table, (err, res)=>{
                i++;
                if(i == last){
                    console.log('Setting default visibility for users.');
                    setUsersDefaultProps((err, res)=>{
                        console.log('script ended!');
                        console.log('killing process now.');
                        process.exit();
                    });
                }
            });
        });
    });
};

run();
