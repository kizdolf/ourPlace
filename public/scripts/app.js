'use strict';
// Declare app level module which depends on views, and components
angular.module('ourPlace', [
    'ngWig',
    'LocalStorageModule',
    'ourPlace.routing',
    'ourPlace.homepage',
    'ourPlace.socket',
    'ngFileUpload'
])
.config(function(localStorageServiceProvider){
    localStorageServiceProvider
        .setPrefix('ourPlace');
});
