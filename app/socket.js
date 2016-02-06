'use strict';


    var
        conf        = require('./config').socket,
        user        = require('./user'),
        io          = require('socket.io'),
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
        });
    }

    module.send = (what, whom, abroad)=>{
        var sok = (abroad && !!abroad) ? io : sockets[whom.sokId];
        sok.emit('update', what);
    };

    return module;
};
