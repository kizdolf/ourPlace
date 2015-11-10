'use strict';
/*
    Controller for the homepage.
*/
angular.module('ourPlace.note', ['ngRoute', 'ngSanitize'])

.controller('noteCtrl', ['ourPlace.socket', 'localStorageService', '$scope', '$http', 'Upload', '$timeout', '$interval', '$routeParams',
function(socket, localStorage, $scope, $http, Upload, $timeout, $interval, $routeParams) {

    socket.emit('getNotes');
    $scope.notes = [];

    var byName = function(a, b){
        var dOne = new Date(a.date).getTime();
        var dTwo = new Date(b.date).getTime();
        if(dOne > dTwo) return -1;
        else return 1;
    };

    var notesPresent = {};
    socket.on('notes', function(notes){
        notes = notes.sort(byName);
        notes.forEach(function(note, i){
            if(note.name && !notesPresent[note.name]){
                notesPresent[note.name] = true;
                $scope.notes[i] = note;
            }
        });
    });
    var getNotes = function(){
        socket.emit('getNotes');
    };

    $scope.sendNote = function(note){
        note.date = Date.now();
        note.name = 'ourNote' + note.date;
        socket.emit('newNote', note);
        $('.nw-editor__res').html('');
        $scope.msgNote = 'note sent.';
        $timeout(function(){
            $scope.msgNote = '';
        }, 3500);
        $timeout(function(){
            getNotes();
        }, 1500);
    };


    var optTrigger = false;
    $scope.options = function(index, e){
        optTrigger = !optTrigger;
        $scope.optionsIndex = index;
        var left    = e.clientX - 120 + 'px',
            top     = e.clientY  + 10 + 'px',
            btn     = $('.optItem'),
            opts    = $('#optsItem');
        opts.show(80);
        opts.css('top', top);
        opts.css('left', left);
        $('html').click(function(e){
            if ((!btn.is(e.target) || !optTrigger) && !opts.is(e.target) && opts.has(e.target).length === 0){
                opts.hide(20);
                optTrigger = false;
            }
        });
    };

    //TO DO: Add a warning, and a validation there.
    $scope.delete = function(index) {
        socket.emit('delete', {name : $scope.notes[index].name});
        $('.oneNote.' + index).remove();
        $('#optsItem').hide(0);
        optTrigger = false;
    };

    $scope.download = function(index){
        var media = $scope.streams[index], cl = '.itemMusic.' + index,
            dl = document.createElement('a'),opts = $(cl).find('.optsItem');
            opts.toggle(0);
        dl.setAttribute('href', media.path);
        dl.setAttribute('download', media.name);
        dl.click();
    };

    $scope.onTop = {
        show: false,
        meta: false,
        comment: false
    };
    $scope.edit = function(index){
        $scope.onTop.show       = true;
        $scope.onTop.meta       = true;
        $scope.editMeta         = $scope.streams[index].meta;
        $scope.editMeta.path    = $scope.streams[index].path;
        $scope.editMeta.index   = index;
        $scope.editMeta.name    = $scope.streams[index].name;
    };

    $scope.comment = function(index){
        $scope.onTop.show       = true;
        $scope.onTop.comment    = true;
        $scope.editComment      = {
            name : $scope.streams[index].name,
            comment : '',
            meta : $scope.streams[index].meta
        };
    };

    $scope.updateMeta = function(editMeta){
        var meta = {
            name: editMeta.name,
            title : editMeta.title,
            album: editMeta.album,
            artist: editMeta.artist
        };
        socket.emit('updateMeta', meta);
        $scope.onTop.show = false;
        $scope.onTop.meta = false;
    };

    $scope.closeMeta = function(){
        $scope.editMeta = {};
        $scope.onTop.show = false;
        $scope.onTop.meta = false;
    };

}]);