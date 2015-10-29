'use strict';
/*
    Controller for the homepage.
*/
angular.module('ourPlace.homepage', ['ngRoute'])

.controller('homepageCtrl', ['ourPlace.socket', 'localStorageService', '$scope', '$http', function(socket, localStorage, $scope, $http) {

    socket.on('msg', function(data){
        console.log(data);
    });

    socket.emit('hi', {data: 'none?'});

}]);
