'use strict';

var
conf        = require('./config').socket,
io          = require('socket.io')(conf.socketPort),
lib         = require('./library'),
moment      = require('moment'),
user;

/*This my whole stats system. How many pepole are online?*/
var liveUsers = 0;

io.on('connection', function(socket){
    liveUsers++;
    console.log('[ ' + moment().format('D/M/YY H:m:s:S') + ' ] live users : ' + liveUsers);

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
        console.log('[ ' + moment().format('D/M/YY H:m:s:S') + ' ] live users : ' + liveUsers);
    });

    socket.on('fromYoutube', function(url){
        console.log('[ ' + moment().format('D/M/YY H:m:s:S') + ' ] From youtube : ' + url);
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