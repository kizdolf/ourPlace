'use strict';


var
    user        = require(global.core + '/user'),
    io          = require('socket.io'),
    lo          = require(global.core + '/tools').lo, //jshint ignore:line
    ios         = require('socket.io-express-session');

var sockets  = {};

module.exports = function(app, session){

    var module = {};

    if(app && session){ //init.
        io = io(app);
        io.use(ios(session));
        io.on('connection', function(socket){

            socket.handshake.session.sokId = socket.id;
            socket.handshake.session.save();
            sockets[socket.handshake.session.uuid] = socket;

            socket.on('play', (data)=>{
                user.played(data.id, {session: socket.handshake.session});
            });

            socket.on('played', (data)=>{
                var uuid = socket.handshake.session.uuid;
                user.getPlayed(data.id, uuid).then((nb)=>{
                    socket.emit('playedBy', nb);
                });
            });

            socket.on('hasDownload', (data)=>{
                user.played(data.id, {session: socket.handshake.session}, data.type);
            });
        });
    }

    //methods.
    module.send = (what, whom, abroad, name)=>{
        var sok = (abroad && !!abroad) ? io : sockets[whom];
        if(typeof name === 'undefined') name = 'update';
        sok.emit(name, what);
    };

    return module;
};
