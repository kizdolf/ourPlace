'use strict';

angular.module('ourPlace.music',[])
.service('ourPlace.music',['ourPlace.socket', '$http', '$rootScope',
function(socket, $http, $rootScope){

    var musics = [];
    var presents = {};
    var currentIndex = null;
    var playList = [];
    var playing = false;

    var byDate = function(a, b){
        if(a.date > b.date) return -1;
        else return 1;
    };

    var shuffle = function(bool){
        if(!bool || bool === false)
            for(var j, x, i = playList.length; i; j = Math.floor(Math.random() * i), x = playList[--i], playList[i] = playList[j], playList[j] = x);
        else{
            playList = [];
            musics.forEach(function(m, i){
                playList.push(i);
            });
        }
    };

    var play = function(index, force){
        playing = true;
        currentIndex = index;
        var toPlay;
        if(force && force === true){
            toPlay = musics[index];
            $rootScope.$broadcast('playing', index);
            $rootScope.$broadcast('playSong', toPlay);
        }else{
            toPlay = musics[playList[index]];
            $rootScope.$broadcast('playSong', toPlay);
            $rootScope.$broadcast('playing', playList[index]);
        }
    };

    var next = function(){
        if(musics[currentIndex + 1])
            play(currentIndex + 1);
        else
            play(0);
    };

    var prev = function(){
        if(currentIndex > 0)
            play(currentIndex - 1);
        else
            play(musics.length);
    };
    
    var getMusic = function(cb){
        $http.get('/api/music').then(function(data){
            var streams = data.data.music;
            streams = streams.sort(byDate);
            streams.forEach(function(stream, i){
                if(!presents[stream.name]){
                    presents[stream.name] = true;
                    musics[i] = stream;
                    playList.push(i);
                }
            });
            cb(musics);
        });
    };

    var whichIsPlaying = function(){
        if(!playing)
            return false;
        else 
            return playList[currentIndex];
    };

    return {
        getMusic: getMusic,
        play: play,
        next: next,
        prev: prev,
        shuffle: shuffle,
        whichIsPlaying: whichIsPlaying
    };

}]);