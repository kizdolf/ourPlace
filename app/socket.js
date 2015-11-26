'use strict';

var
conf        = require('./config').socket,
io          = require('socket.io')(conf.socketPort),
lib         = require('./library'),
moment      = require('moment'),
user;
var log = require('simple-node-logger').createSimpleFileLogger('infos.log');

/*This my whole stats system. How many pepole are online?*/
var liveUsers = 0;

io.on('connection', function(socket){
    liveUsers++;
    log.info('live users : ' , liveUsers);
    log.info('new user IP: ', socket.handshake.address);

    //used to broadcast essentially. users should be stored in a session to make the app able to select who
    // to talk too.
    user = {
        id: socket.id,
        socket: socket
    };

    //send what we have, when the user want it.
    //minus one user. You'll be much missed.
    socket.on('disconnect', function() {
        liveUsers--;
        log.info('live users : ' , liveUsers.toString());
    });

    socket.on('fromYoutube', function(url){
        log.info('From youtube : ' , url);
        lib.fromYoutube(url);
    });
});
