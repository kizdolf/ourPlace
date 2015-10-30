'use strict';
/*
    Controller for the homepage.
*/
angular.module('ourPlace.homepage', ['ngRoute'])

.controller('homepageCtrl', ['ourPlace.socket', 'localStorageService', '$scope', '$http', 'Upload',
function(socket, localStorage, $scope, $http, Upload) {

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
                }).then(function (resp) {
                    console.log('Success ' + resp.config.data.file.name + 'uploaded. Response: ' + resp.data);
                    $scope.uploading[file.name].ok = true;
                }, function (resp) { //jshint ignore:line
                    console.log('Error status: ' + resp.status);
                    $scope.uploading[file.name].error = resp.status;
                }, function (evt) { //jshint ignore:line
                    var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
                    $scope.uploading[evt.config.data.file.name].pct = progressPercentage;
                    console.log('progress: ' + progressPercentage + '% ' + evt.config.data.file.name);
                }); //jshint ignore:line
            });
        }
    };

    $scope.play = function(index){
        var run = $scope.streams[index];
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

}]);
