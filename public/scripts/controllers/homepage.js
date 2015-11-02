'use strict';
/*
    Controller for the homepage.
*/
angular.module('ourPlace.homepage', ['ngRoute'])

.controller('homepageCtrl', ['ourPlace.socket', 'localStorageService', '$scope', '$http', 'Upload', '$timeout', '$interval',
function(socket, localStorage, $scope, $http, Upload, $timeout, $interval) {

    $scope.index = 0;
    var player = $('#audioPlayer')[0];
    var audioSource = $('#audioSource');

    var byDate = function(a, b){
        if(a.date > b.date) return -1;
        else return 1;
    };

    $scope.loader = true;

    socket.on('files', function(data){
        $scope.loader = false;
        var streams = data;
        if(streams){
            $scope.streams = streams.sort(byDate);
        }
    });

    var smallMusic = false;
    $scope.reduceMusic = function(){
        var m = $('#music'), l = $('.itemMusic'), c = $('.cover'), r = $('.reduceMusic'),
            M = $('.Meta'), t = $('.title'), a = $('.album'), A = $('.artist');
        if(!smallMusic){
            smallMusic = true;
            a.css('font-size', '10px');A.css('font-size', '10px');t.css('font-size', '10px');M.css('max-width', '100%');
            m.css('width', '150px');m.css('height', '60vh');m.css('overflow', 'auto');l.css('width', '120px');
            l.css('height', '120px');c.hide(0);r.html('Expend Music');
        }else{
            smallMusic = false;
            m.removeAttr('style');l.removeAttr('style');c.removeAttr('style');M.removeAttr('style');
            t.removeAttr('style');a.removeAttr('style');A.removeAttr('style');r.html('Reduce Music');
        }
    };

    $scope.uploading = {};
    $scope.uploadFiles = function (files) {
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

    $scope.options = function(index){
        var cl = '.itemMusic.' + index,
            opts = $(cl).find('.optsItem'),
            doMore = $(cl).find('.doMore');
        opts.toggle(0);
        $('html').click(function(e){
            if (!doMore.is(e.target) && doMore.has(e.target).length === 0){
                opts.hide(0);
           }
        });
    };

    $scope.delete = function(index) {
        $('.itemMusic.' + index).find('.optsItem').hide(0);
        var media = $scope.streams[index];
        socket.emit('delete', {name : media.name});
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
        meta: false
    };
    $scope.edit = function(index){
        $scope.onTop.show = true;
        $scope.onTop.meta = true;
        $scope.editMeta = $scope.streams[index].meta;
        $scope.editMeta.index = index;
        $scope.editMeta.name = $scope.streams[index].name;
    };

    $scope.updateMeta = function(editMeta){
        socket.emit('updateMeta', editMeta);
        $scope.onTop.show = false;
        $scope.onTop.meta = false;
    };

    $scope.closeMeta = function(){
        $scope.editMeta = {};
        $scope.onTop.show = false;
        $scope.onTop.meta = false;
    };

    $scope.play = function(index){
        $scope.index = (index >= $scope.streams.length) ? 0 : index;
        var run = $scope.streams[$scope.index];
        var classItem = '.itemMusic.'+$scope.index;
        var itemMusic = $(classItem);
        $('.itemMusic').removeClass('current');
        itemMusic.addClass('current');
        $scope.running = run;
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
        if($scope.streams)
            $scope.play($scope.index + 1);
    };

    $interval(function(){
        $scope.get_all();
    }, 15000);

}]);
