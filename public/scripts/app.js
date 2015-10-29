'use strict';
// Declare app level module which depends on views, and components
angular.module('ourPlace', [
    'LocalStorageModule',
    'ourPlace.routing',
    'ourPlace.homepage',
    'ourPlace.socket'
])
.config(function(localStorageServiceProvider){
    localStorageServiceProvider
        .setPrefix('ourPlace');
});
