'use strict';

angular.module('ourPlace.music',[])
.service('ourPlace.music',['ourPlace.socket', '$http', '$rootScope',
function(socket, $http, $rootScope){

    var musics = [], presents = {}, currentIndex = null,
        playList = [], shuffling = false, playing = false;

    /*  Under dev. function unused. */
    var createPlayer = function(i){
        if(!musics[i].loading && !musics[i].canBePlayed){
            console.log('loading ' + musics[i].name);
            musics[i].loading = true;
            var song = musics[i];
            musics[i].player = new Audio(song.path);
            musics[i].player.preload = 'auto';
            musics[i].player.load();
        }
        musics[i].player.onerror = function(e){
            console.log('ereur on ' + musics[i].name);
            console.log(e);
        };
        musics[i].player.onloadstart = function(){
            console.log('load start for ' + musics[i].name);
        };
        musics[i].player.oncanplaythrough = function(){
            console.log('can play ' + song.name);
            musics[i].loading = false;
            musics[i].canBePlayed = true;
            if(musics[i + 1])
                createPlayer(i + 1);
        };
    };

    var forcePlay = function(song, cb){
        musics.forEach(function(s, i){
            if(s.loading === true && s.player){
                console.log('stop loading ' + s.name);
                musics[i].player.src = '';
                musics[i].player.load();
                delete musics[i].player;
                musics[i].loading = false;
            }
            if(s.name === song.name){
                console.log('start loading ' + s.name);
                musics[i].player = new Audio(song.path);
                musics[i].player.preload = 'auto';
                musics[i].player.load();
                musics[i].player.oncanplaythrough = function(){
                    console.log('can play ' + s.name);
                    musics[i].loading = false;
                    musics[i].canBePlayed = true;
                    createPlayer(0);
                    cb();
                };
            }
        });
    };

    var byDate = function(a, b){
        if(a.date > b.date) return -1;
        else return 1;
    };

    var shuffle = function(bool){
        if(!bool || bool === false){
            shuffling = true;
            for(var j, x, i = playList.length; i; j = Math.floor(Math.random() * i), x = playList[--i], playList[i] = playList[j], playList[j] = x);
        }else{
            shuffling = false;
            playList = (function(l, a){
                            while(l--) a[l] = l;
                            return a;
                        })(musics.length -1, []);
        }
        if(!playing) play(0);
    };

    var play = function(index, force){
        if(musics.length === 0){
            getMusic(function(){ play(index, force); });
        }else{
            playing = true;
            currentIndex = index;
            var toPlay;
            if(force && force === true)
                toPlay = musics[index];
            else{
                toPlay = musics[playList[index]];
                index = playList[index];
            }
            $rootScope.$broadcast('playing', index);
            $rootScope.$broadcast('playSong', toPlay);
        }
    };

    var next = function(){
        if(musics[currentIndex + 1])
            play(currentIndex + 1);
        else
            play(0);
    };

    var prev = function(){
        if(currentIndex > 0) play(currentIndex - 1);
        else play(musics.length - 1);
    };

    var getMusic = function(cb){
        $http.get('/api/music').then(function(data){
            var streams = data.data.music;
            streams = streams.sort(byDate);
            streams.forEach(function(stream){
                if(!presents[stream.name]){
                    presents[stream.name] = true;
                    stream.canBePlayed = false;
                    musics.push(stream);
                    playList.push(musics.length - 1);
                }
            });
            if(shuffling) shuffle();
            // createPlayer(0);
            cb(musics);
        });
    };

    var whichIsPlaying = function(){
        if(!playing) return false;
        else return playList[currentIndex];
    };

    return {
        getMusic: getMusic,
        play: play,
        next: next,
        prev: prev,
        shuffle: shuffle,
        whichIsPlaying: whichIsPlaying,
        forcePlay : forcePlay
    };

}]);
