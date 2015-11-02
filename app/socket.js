'use strict';

var
conf        = require('./config').socket,
io          = require('socket.io')(conf.socketPort),
lib         = require('./library'),
user;

io.on('connection', function(socket){
    user = {
        id: socket.id,
        socket: socket
    };
    console.log('connection received');
    console.log(user.id);
    socket.emit('files', lib.all());
    socket.on('get_all', function(){
        console.log('received a socket to get all.');
        lib.all();
    });

    socket.on('delete', function(data){
        lib.delete(data.name);
    });

    socket.on('updateMeta', lib.updateMeta);
});

exports.files = function(data){
    user.socket.emit('files', data);
};
