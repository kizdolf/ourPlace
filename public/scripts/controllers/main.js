'use strict';
/*
    Controller for the layout.
*/
angular.module('ourPlace.main', ['ngRoute', 'ngSanitize'])

.controller('mainCtrl', ['ourPlace.socket', 'localStorageService', '$scope', '$http', 'Upload', '$timeout', '$interval', '$routeParams', '$rootScope', 'ourPlace.music',
function(socket, localStorage, $scope, $http, Upload, $timeout, $interval, $routeParams, $rootScope, musicService) {

    $('.metaPlayer').hide(0);
    $('.player').hide(0);
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
    var player = $('#audioPlayer')[0];
    var audioSource = $('#audioSource');
    var playingAudio = false;
    var shuffle = false;

    // var play = function(song){
    //     console.log(song);
    //     $scope.running = song;
    //     if(!song.canBePlayed){
    //         musicService.forcePlay(song, function(){
    //             console.log('not ready.');
    //             song.player.play();

    //             // $('.pause_play').attr('src', 'img/ic_pause_black_24dp.png');
    //             // $('.metaPlayer').show(80);
    //             // $('.player').show(0);
    //             // audioSource.attr('src', song.path);
    //             // audioSource.attr('type', song.type);
    //             // player.pause();
    //             // player.load();
    //             // player.oncanplaythrough = player.play();
    //         });
    //     }else{
    //         console.log('was ready.');
    //         song.player.play();
    //     }
    // };

    var play = function(song){
        $scope.running = song;
        $('.pause_play').attr('src', 'img/ic_pause_black_24dp.png');
        $('.metaPlayer').show(80);
        $('.player').show(0);
        audioSource.attr('src', song.path);
        audioSource.attr('type', song.type);
        if(song.meta.title){
            $('title').html(song.meta.title);
        }
        player.pause();
        player.load();
        player.oncanplaythrough = player.play();
    };

    $scope.$on('playSong', function(scope, song){
        playingAudio = true;
        play(song);
    });

    $scope.audioPlay = function(){
        if(playingAudio){
            $('.pause_play').attr('src', 'img/ic_play_arrow_black_24dp.png');
            player.pause();
        }else{
            if(audioSource.attr('src') === 'null'){
                musicService.play(0);
            }else{
                player.play();
            }
            $('.pause_play').attr('src', 'img/ic_pause_black_24dp.png');
        }
        playingAudio = !playingAudio;
    };

    $scope.audioPrev = function(){
        musicService.prev();
    };

    $scope.audioNext = function(){
        musicService.next();
    };

    $scope.audioShuffle = function(){
        var img = $($('.ctrls').find('img')[3]);
        if(!shuffle){
            musicService.shuffle();
            img.attr('src', 'img/ic_sort_black_24dp.png');
        }else{
            musicService.shuffle(true);
            img.attr('src', 'img/ic_shuffle_black_24dp.png');
        }
        shuffle = !shuffle;
    };

    player.onended = function(){
        musicService.next();
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
                }).then(function (ret) {
                    if(!ret.data.err){
                        $scope.index++;
                        $scope.uploading[file.name].ok = true;
                    }else{
                        $scope.uploading[file.name].error = ret.err;
                    }
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

    $('body').bind('keydown', function(e){
        if((!$('#Notes').is(e.target) && $('#Notes').has(e.target).length === 0) &&
           (!$('.onTop').is(e.target) && $('.onTop').has(e.target).length === 0) &&
           (!$('input').is(e.target))) {
            if(e.keyCode == 32) {e.preventDefault();$scope.audioPlay(); }
            else if(e.keyCode == 39) $scope.audioNext();
            else if(e.keyCode == 37) $scope.audioPrev();
        }
    });

    /*
    Is user root ?
    */
    $scope.isRoot = false;
    $scope.showRoot = false;
    $http.get('/api/amiroot')
    .then(function(data){
        if(data.data === true){
            $scope.isRoot = true;
        }
    });

    $scope.createUser = function (newUser){
        if($scope.isRoot){
            $http.post('/api/newUser', newUser)
            .then(function(data){
                $scope.RootMsg = data.data.done;
            });
        }
    };
}]);
