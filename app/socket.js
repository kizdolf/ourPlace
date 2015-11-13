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
    //send what we have.
    socket.emit('files', lib.allSongs());

    //send what we have, when the user want it.
    socket.on('get_all', function(){
        lib.allSongs();
        lib.allNotes();
    });

    socket.on('getMusic', function(){
        lib.all();
    });

    //send what we have, when the user want it.
    socket.on('getNotes', function(){
        lib.allNotes();
    });

    //delete stuff in db
    socket.on('delete', function(data){
        lib.delete(data.name);
    });

    //add a note
    socket.on('newNote', function(note){
        lib.addNote(note);
    });

    //update metaData
    socket.on('updateMeta', lib.updateMeta);

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

//send songs when a back-end function want.
exports.files = function(data){
    user.socket.emit('files', data);
};

//send notes when a back-end function want.
exports.notes = function(data){
    user.socket.emit('notes', data);
};

exports.send = function(chan, data){
    user.socket.emit(chan, data);
};