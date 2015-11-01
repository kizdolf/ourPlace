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

    socket.on('files', function(data){
        $scope.streams = data;
        console.log($scope.streams);
    });

    // for multiple files:
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

    $scope.play = function(index){
        $scope.index = ($scope.streams[index] === 'undefined') ? 0 : index;
        var run = $scope.streams[$scope.index];
        var classItem = '.itemMusic.'+index;
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
