'use strict';
/*
    Controller for the homepage.
*/
angular.module('ourPlace.homepage', ['ngRoute', 'ngSanitize'])

.controller('homepageCtrl', ['ourPlace.socket', 'localStorageService', '$scope', '$http', 'Upload', '$timeout', '$interval', '$routeParams', 'ourPlace.music', '$rootScope',
function(socket, localStorage, $scope, $http, Upload, $timeout, $interval, $routeParams, musicService, $rootScope) {

    $scope.index = null; 
    $scope.streams = [];
    $scope.running  = false;

    $scope.loader = false;
    if($scope.streams && $scope.streams[0])
        $scope.loader = false;

    var optTrigger = false;
    $scope.options = function(index, e){
        optTrigger = !optTrigger;
        $scope.optionsIndex = index;
        var left    = e.clientX  - 120 + 'px',
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

    var oneIsPlaying = function(index){
        var classItem   = '.itemMusic.' + index,
        itemMusic   = $(classItem);
        $('.itemMusic').removeClass('current');
        itemMusic.addClass('current');
    };

    $scope.$on('playing', function(scope, index){
        oneIsPlaying(index);
    });

    $scope.play = function(index){
        musicService.play(index, true);
    };

    $scope.get_all = function(){
        musicService.getMusic(function(music){
            $scope.streams = music;
        });
    };

    $scope.get_all();

    $interval(function(){
        $scope.get_all();
    }, conf.delay);

    $scope.addFromYouTube = function(url){
        url = url.split('&')[0];
        if(url.indexOf('youtube.com') === -1){
            $scope.ytError = 'this url is not from youtube.';
            $timeout(function() {$scope.ytMsg = ''}, 2500);
        }else{
            socket.emit('fromYoutube', url);
            $scope.ytMsg = 'Sound will arrive soon...';
        }
    }

    socket.on('fromYoutube', function(data){
        $scope.ytMsg = data.msg;
        if(data.status === 1){
            $scope.ytUrl = '';
            $timeout(function(){
                $scope.ytMsg = '';
            }, 2500);
        }
    });

    $scope.search = function(str){
        $scope.streams.forEach(function(item, i){
            var classelem = '.itemMusic.' + i;
            var itemMusic = $(classelem);
            var show = false;
            if(item.name.toLowerCase().indexOf(str.toLowerCase()) !== -1) show = true;
            else if(item.meta.title && item.meta.title.toLowerCase().indexOf(str.toLowerCase()) !== -1) show = true;
            else if(item.meta.artist && item.meta.artist[0] && item.meta.artist[0].toLowerCase().indexOf(str.toLowerCase()) !== -1) show = true;
            else if(item.meta.album && item.meta.album.toLowerCase().indexOf(str.toLowerCase()) !== -1) show = true;
            if(!show) itemMusic.css('display', 'none');
            else itemMusic.css('display', 'inline-block');
        });
    };

    /*this is a bit dirty (quite a lot). angular.document.ready is not enough so...*/
    var playingItem = musicService.whichIsPlaying();
    if(playingItem !== false){
        $timeout(function(){
            $scope.index = playingItem;
            var classelem = '.itemMusic.' + playingItem;
            var itemMusic = $(classelem);
            itemMusic.addClass('current');
        }, 800);
    }

}]);
