'use strict';
/*
    Controller for the homepage.
*/
angular.module('ourPlace.homepage', ['ngRoute', 'ngSanitize'])

.controller('homepageCtrl', ['ourPlace.socket', 'localStorageService', '$scope', '$http', 'Upload', '$timeout', '$interval',
function(socket, localStorage, $scope, $http, Upload, $timeout, $interval) {

    $scope.index = 0;
    var player = $('#audioPlayer')[0];
    var audioSource = $('#audioSource');
    var playingAudio = false;

    $('body').bind('keydown', function(e){
        if(!$('#Notes').is(e.target) && $('#Notes').has(e.target).length === 0){
            if(e.keyCode == 32) {e.preventDefault();$scope.audioPlay(); }
            else if(e.keyCode == 39) $scope.audioNext();
            else if(e.keyCode == 37) $scope.audioPrev();
        }
    });


    $('.metaPlayer').hide(0);
    $('.drop-box').hide(0);
    $('html').bind('dragenter', function(){
        $('.drop-box').show(0);
    });
    $('.drop-box').bind('dragleave', function(){
        $('.drop-box').hide(0);
    });
    $('.drop-box').bind('dragend', function(){
        $('.drop-box').hide(0);
    });

    var byDate = function(a, b){
        if(a.date > b.date) return -1;
        else return 1;
    };

    $scope.audioPlay = function(){
        if(playingAudio){
            playingAudio = false;
            $('.pause_play').attr('src', 'img/ic_play_arrow_black_24dp.png');
            player.pause();
        }else{
            playingAudio = true;
            player.play();
            $('.pause_play').attr('src', 'img/ic_pause_black_24dp.png');
        }
    };

    $scope.audioPrev = function(){
        if ($scope.index > 0) $scope.index--;
        else $scope.index = $scope.streams.length-1;
        $scope.play($scope.index);
    };

    $scope.audioNext = function(){
        $scope.index++;
        $scope.play($scope.index);
    };

    $scope.loader = true;

    socket.on('files', function(data){
        $scope.loader = false;
        var streams = data;
        if(streams) $scope.streams = streams.sort(byDate);
    });

    var smallMusic = false;
    $scope.reduceMusic = function(){
        var m = $('#music'), l = $('.itemMusic'), c = $('.cover'), r = $('.reduceMusic'),
            M = $('.Meta'), t = $('.title'), a = $('.album'), A = $('.artist');
        if(!smallMusic){
            smallMusic = true;
            a.css('font-size', '10px');A.css('font-size', '10px');t.css('font-size', '10px');M.css('max-width', '100%');
            m.css('width', '100%');m.css('height', '130px');m.css('overflow', 'auto');
            l.css('display', 'table-cell');
            l.css('border', '2px solid rgba(249, 181, 53, 0.34)');
            m.css('float', 'left'); m.css('margin-right', '20px'); l.css('width', '120px');
            l.css('height', '120px');c.hide(0);M.css('width', '100%');
        }else{
            smallMusic = false;
            m.removeAttr('style');l.removeAttr('style');c.removeAttr('style');M.removeAttr('style');
            t.removeAttr('style');a.removeAttr('style');A.removeAttr('style');
        }
    };

    $scope.uploading = {};
    $scope.uploadFiles = function (files) {
        $('.drop-box').hide(0);
        if (files && files.length) {
            files.forEach(function(file){
                $scope.uploading[file.name]= {
                    name: file.name,
                    pct: 0,
                    ok: false,
                    error: null
                };
                Upload.upload({
                    url: '/api/upload',
                    data: {file: file}
                }).then(function () {
                    $scope.index++;
                    $scope.uploading[file.name].ok = true;
                    $timeout(function(){
                        delete $scope.uploading[file.name];
                    }, 3000);
                }, function (resp) { //jshint ignore:line
                    $scope.uploading[file.name].error = resp.status;
                }, function (evt) { //jshint ignore:line
                    var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
                    $scope.uploading[evt.config.data.file.name].pct = progressPercentage;
                }); //jshint ignore:line
            });
        }
    };

    var optTrigger = false;
    $scope.options = function(index, e){
        optTrigger = !optTrigger;
        $scope.optionsIndex = index;
        var left    = e.clientX  + 10 + "px",
            top     = e.clientY  + 10 + "px",
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
        $('.itemMusic.' + index).find('.optsItem').hide(0);
        socket.emit('delete', {name : $scope.streams[index].name});
        $('.itemMusic.' + index).remove();
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

    $scope.play = function(index){
        playingAudio = true;
        $('.pause_play').attr('src', 'img/ic_pause_black_24dp.png');
        $('.metaPlayer').show(80);
        $scope.index    = (index >= $scope.streams.length) ? 0 : index;
        var run         = $scope.streams[$scope.index],
            classItem   = '.itemMusic.' + $scope.index,
            itemMusic   = $(classItem);
        $scope.running  = run;
        $('.itemMusic').removeClass('current');
        itemMusic.addClass('current');
        audioSource.attr('src', run.path);
        audioSource.attr('type', run.type);
        player.pause();
        player.load();
        player.oncanplaythrough = player.play();
    };

    $scope.get_all = function(){
        socket.emit('get_all');
    };

    player.onended = function(){
        if($scope.streams) $scope.play($scope.index + 1);
    };

    $interval(function(){
        $scope.get_all();
    }, 25000);

    /*NOTES*/

    socket.on('notes', function(notes){
        $scope.notes = notes;
    });

    $scope.displayNotes = function(){
        $scope.reduceMusic();
        $scope.get_all();
        $('#Notes').show(120);
    };

    $scope.sendNote = function(note){
        console.log('note is on his way');
        note.date = Date.now();
        note.name = "ourNote" + note.date;
        socket.emit('newNote', note);
    };

}]);
