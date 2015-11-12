'use strict';
// Declare app level module which depends on views, and components
angular.module('ourPlace', [
    'ngWig',
    'LocalStorageModule',
    'ourPlace.routing',
    'ourPlace.main',
    'ourPlace.note',
    'ourPlace.homepage',
    'ourPlace.rss',
    'ourPlace.socket',
    'ourPlace.music',
    'ngFileUpload'
])
.config(['localStorageServiceProvider', function(localStorageServiceProvider){
    localStorageServiceProvider
        .setPrefix('ourPlace');
}]);
