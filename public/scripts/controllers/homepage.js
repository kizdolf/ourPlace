'use strict';
/*
    Controller for the homepage.
*/
angular.module('ourPlace.homepage', ['ngRoute'])

.controller('homepageCtrl', ['ourPlace.socket', 'localStorageService', '$scope', '$http', 'Upload', '$timeout',
function(socket, localStorage, $scope, $http, Upload,$timeout) {

    $scope.index = 0;
    var player = $('#audioPlayer')[0];
    var audioSource = $('#audioSource');
    console.log(player);


    socket.on('files', function(data){
        $scope.streams = data;
    });

    socket.on('meta', function(data){
        $scope.playing = true;
        console.log(data);
        $scope.run = data;
    });

    // upload on file select or drop
    $scope.upload = function (file) {
        console.log(file);
        Upload.upload({
            url: '/api/upload',
            data: {file: file}
        }).then(function (resp) {
            console.log('Success ' + resp.config.data.file.name + 'uploaded. Response: ' + resp.data);
        }, function (resp) {
            console.log('Error status: ' + resp.status);
        }, function (evt) {
            var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
            console.log('progress: ' + progressPercentage + '% ' + evt.config.data.file.name);
        });
    };
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
        $scope.index = index;
        console.log('play num ' + index);
        var run = $scope.streams[$scope.index] || $scope.streams[0];
        audioSource.attr('src', run.path);
        audioSource.attr('type', run.type);
        player.pause();
        player.load();
        player.play();
        player.oncanplaythrough = player.play();
    };

    $scope.get_all = function(){
        socket.emit('get_all');
    };

    player.onended = function(){
        if($scope.index !== 0)
            $scope.play($scope.index + 1);
    };


}]);
