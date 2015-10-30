'use strict';
/*
    Controller for the homepage.
*/
angular.module('ourPlace.homepage', ['ngRoute'])

.controller('homepageCtrl', ['ourPlace.socket', 'localStorageService', '$scope', '$http', 'Upload',
function(socket, localStorage, $scope, $http, Upload) {

    socket.on('msg', function(data){

    });

    socket.on('files', function(data){
        $scope.streams = data;
        console.log($scope.streams);
    });

    socket.emit('hi', {data: 'none?'});

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
    $scope.uploadFiles = function (files) {
        if (files && files.length) {
            for (var i = 0; i < files.length; i++) {
                var file = files[i];
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
            }
            // or send them all together for HTML5 browsers:
            // Upload.upload({..., data: {file: files}, ...})...;
        }
    };

}]);
