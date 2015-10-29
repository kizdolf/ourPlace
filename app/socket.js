'use strict';

var
conf        = require('./config').socket,
io          = require('socket.io')(conf.socketPort);

io.on('connection', function(socket){
    var user = {
        id: socket.id,
        socket: socket
    };
    socket.emit('sessionId', socket.id);
    socket.on('hi', function(data){
        console.log('someone saying hi..');
        console.log(data);
    });
});
