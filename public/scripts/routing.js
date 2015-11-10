'use strict';
/*
    Routing for the clientSide app.
*/
angular.module('ourPlace.routing', ['ngRoute'])

.config(['$routeProvider', function($route) {

    $route.when('/home/', {
        templateUrl: 'views/homepage.html',
        controller: 'homepageCtrl'
    });

    $route.when('/rss', {
        templateUrl: 'views/rss.html',
        controller: 'rssCtrl'
    });

    $route.when('/note', {
        templateUrl: 'views/note.html',
        controller: 'noteCtrl'
    });

    $route.otherwise({
        redirectTo: '/home'
    });

}]);
/*.run(['$rootScope', '$location', 'localStorageService',function($rootScope, $location, localStorage) {
    $rootScope.$on( "$routeChangeStart", function() {
        var user = localStorage.get('user');
        if(user === null && ['/', '/home'].indexOf($location.url()) === -1 ){
             window.location = '/#/home';
        }else{
            console.log(user);
        }
    });
}]);*/
