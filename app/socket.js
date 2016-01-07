'use strict';


    var 
        conf        = require('./config').socket,
        io          = require('socket.io')(conf.socketPort),
        ios         = require('socket.io-express-session');

    var sockets  = {};

module.exports = function(app, session){

    var module = {};

    if(app && session){
        io.use(ios(session));
        io.on('connection', function(socket){
            socket.handshake.session.sokId = socket.id;
            socket.handshake.session.save();
            sockets[socket.id] = socket;
        });
    }

    module.send = (what, whom, abroad)=>{
        var sok = (abroad && !!abroad) ? io : sockets[whom.sokId];
        sok.emit('update', what);
    };

    return module;
};
