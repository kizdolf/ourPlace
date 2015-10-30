'use strict';

var
conf        = require('./config').socket,
io          = require('socket.io')(conf.socketPort),
low             = require('lowdb'),
dbFile          = low('databases/files.json'),
user;

io.on('connection', function(socket){
    user = {
        id: socket.id,
        socket: socket
    };
    socket.emit('files', dbFile('files').cloneDeep());
    socket.on('hi', function(data){
        console.log('someone saying hi..');
        console.log(data);
    });
});

exports.files = function(){
    io.sockets.broadcast.emit('files', dbFile('files').cloneDeep());
};
