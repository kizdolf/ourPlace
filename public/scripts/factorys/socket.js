'use strict';

angular.module('ourPlace.socket',[])
.factory('ourPlace.socket', function ($rootScope) {
    var host = "149.202.44.123";
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
});
