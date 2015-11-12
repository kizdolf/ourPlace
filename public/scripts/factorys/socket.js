'use strict';

angular.module('ourPlace.socket',[])
.factory('ourPlace.socket', ['$rootScope', function ($rootScope) {
    var host = "http://"+window.location.hostname;
    var port = conf.socketPort;
    var socket = io.connect(host + ':' + port);
  return {
    on: function (eventName, callback) {
      socket.on(eventName, function () {
        var args = arguments;
        $rootScope.$apply(function () {
          callback.apply(socket, args);
        });
      });
    },
    emit: function (eventName, data, callback) {
        socket.emit(eventName, data, function () {
            var args = arguments;
            $rootScope.$apply(function () {
                if (callback) {
                    callback.apply(socket, args);
                }
            });
        });
    }
  };
}]);
