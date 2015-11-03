'use strict';

var
conf        = require('./config').socket,
io          = require('socket.io')(conf.socketPort),
lib         = require('./library'),
moment      = require('moment'),
user;

var liveUsers = 0;

io.on('connection', function(socket){
    liveUsers++;
    console.log('[ ' + moment().format('D/M/YY H:m:s:S') + ' ] live users : ' + liveUsers);

    user = {
        id: socket.id,
        socket: socket
    };
    socket.emit('files', lib.all());
    socket.on('get_all', function(){
        lib.all();
    });

    socket.on('delete', function(data){
        console.log(data);
        lib.delete(data.name);
    });

    socket.on('updateMeta', lib.updateMeta);

    socket.on('disconnect', function() {
        liveUsers--;
        console.log('[ ' + moment().format('D/M/YY H:m:s:S') + ' ] live users : ' + liveUsers);
    });
});

exports.files = function(data){
    user.socket.emit('files', data);
};
