'use strict';


    var
        // conf        = require('./config').socket,
        user        = require('./user'),
        login       = require('./login'),
        io          = require('socket.io'),
        cnf         = require('./config'),
        lo          = require('./tools').lo,
        conCnf      = require('./criticalConf'),
        _r          = require('rethinkdbdash')(conCnf.connect),
        ios         = require('socket.io-express-session');

    var sockets  = {};

module.exports = function(app, session){

    var module = {};

    if(app && session){
        io = io(app);
        io.use(ios(session));
        io.on('connection', function(socket){

            socket.handshake.session.sokId = socket.id;
            socket.handshake.session.save();
            sockets[socket.id] = socket;

            socket.on('play', (data)=>{
                user.played(data.id, {session: socket.handshake.session});
            });

            socket.on('played', (data)=>{
                var uuid = socket.handshake.session.uuid;
                user.getPlayed(data.id, uuid).then((nb)=>{
                    socket.emit('playedBy', nb);
                });
            });

            socket.on('totPlayed', (data)=>{
                var uuid = socket.handshake.session.uuid;
                _r.table(cnf.rethink.tables.user).filter({id: uuid, 'root': true}).count()
                .then((count)=>{
                    if(count === 1){
                        user.getTotPlayed(data.id).then((nb)=>{
                            socket.emit('totPlayedBy', nb);
                        });
                    }
                });
            });
        });
    }

    module.send = (what, whom, abroad, name)=>{
        var sok = (abroad && !!abroad) ? io : sockets[whom.sokId];
        if(typeof name === 'undefined') name = 'update';
        sok.emit(name, what);
    };

    return module;
};
