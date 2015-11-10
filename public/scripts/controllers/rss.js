'use strict';
/*
    Controller for the homepage.
*/
angular.module('ourPlace.rss', ['ngRoute', 'ngSanitize'])

.controller('rssCtrl', ['ourPlace.socket', 'localStorageService', '$scope', '$http', 'Upload', '$timeout', '$interval',
function(socket, localStorage, $scope, $http, Upload, $timeout, $interval) {

    $scope.msg = 'here will be the rss.';

}]); 