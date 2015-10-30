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
    socket.emit('files', lib.all());

    socket.on('play', function(file){
        var meta = lib.play(file);
        socket.emit('meta', meta);
    });

    socket.on('get_all', function(){
        lib.all();
    });
});

exports.files = function(data){
    user.socket.emit('files', data);
};
