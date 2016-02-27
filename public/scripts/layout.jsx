    var React       = require('react'),
    $           = require('jquery'),
    Player      = require('./player.jsx').Player,
    Menu        = require('./leftMenu.jsx').Menu,
    Notify      = require('./notify.jsx').Notify,
    Visualizer  = require('./songViszu.jsx').Visualizer,
    Upload      = require('./upload.jsx').Upload;

var Layout = React.createClass({
    url: '/api/music',
    uploadAPI: '/api/upload',
    notesUrl: '/api/notes',
    apiAddNote: '/api/note',
    getInitialState: function(){
        return {
            musics: [],
            type: '',
            path: '',
            index: 0,
            current: {},
            playList: [],
            shuffling: false,
            canUpdateStatus: false,
            autoPlay: false,
            drag: false,
            allowNotif: false,
            notify: {}
        };
    },
    byDate: function(a, b){
        return ((a.date > b.date) ? -1 : 1);
    },
    getMusicFromAPI: function(cb){
        $.get(this.url, function(data){
            data.music = data.music.sort(this.byDate);
            this.setState({musics: data.music});
            if(cb) cb();
        }.bind(this));
    },
    shuffle: function(){
        /*
            when setting shuffle we need to retrieve the index in new playlist.
            when we turn off whuffle we need to retrieve the index in songs.
        */
        var indexesOrder = this.state.playList;
        if(this.state.shuffling){
            var newIndex = indexesOrder[this.state.index];
            this.setState({shuffling: false, index: newIndex});
            indexesOrder =  Array.from(Array(this.state.musics.length - 1).keys());
        }else{
            this.setState({shuffling: true});
            for(var j, x, i = indexesOrder.length; i; j = Math.floor(Math.random() * i), x = indexesOrder[--i], indexesOrder[i] = indexesOrder[j], indexesOrder[j] = x);
            indexesOrder.forEach(function(ind, key){
                if(ind == this.state.index) this.setState({index: key});
            }.bind(this));
        }
        this.setState({playList: indexesOrder});
    },
    changeAutoPlay: function(bool){
        this.setState({autoPlay: bool});
    },
    getUserStatus: function(){
        $.get('/api/user/status', function(data){
            if(data.index && data.shuffling && data.playlist){
                var state = {
                    index: parseInt(data.index),
                    shuffling: (data.shuffling == "true"),
                    playList: data.playlist.map(function(el){ return parseInt(el); })
                }
                this.setState(state);
                if(data.autoPlay){
                    var autoPlay = (data.autoPlay == 'true');
                    this.setState({autoPlay: autoPlay});
                    if(autoPlay) this.play();
                }
            }
            this.setState({canUpdateStatus: true});
        }.bind(this));
    },
    setUserStatus: function(){
        $.post('/api/user/status', {
            playlist: this.state.playList,
            index: this.state.index,
            shuffling: this.state.shuffling,
            autoPlay: this.state.autoPlay
        });
    },
    handlerSocket: function(name, data){
        if(data.type !== 'song') return false;
        var musics = this.state.musics;
        var index = this.state.index;
        var cb = function(){
            this.setState({
                musics: musics,
                index: index
            });
        }.bind(this);
        if(name == 'new'){
            musics.unshift(data.obj); 
            index++;
            return cb(); 
        }else{
            musics.forEach(function(note, i){
                if(name == 'changed'){
                    if(note.id === data.obj.id){
                        var playedBy = musics[i].playedBy + 1;
                        musics[i] = data.obj;
                        musics[i].playedBy = playedBy;
                        return cb();
                    }
                }else{
                    if(note.id === data.obj){
                        //get playlist index. 
                        //check if index is sup to playlist index.
                        //if yes index--.
                        musics.splice(i, 1);
                        return cb(); 
                    }
                }
            });
        }
    },
    componentDidMount: function(){
        this.getMusicFromAPI(function(){
            var indexesOrder = Array.from(Array(this.state.musics.length).keys());
            this.setState({playList: indexesOrder});
            this.getUserStatus();
        }.bind(this));
        this.socket = io({secure: true});
        this.socket.on('new', function(data){
            this.handlerSocket('new', data);
        }.bind(this));
        this.socket.on('changed', function(data){
            this.handlerSocket('changed', data);
        }.bind(this));
        this.socket.on('delete', function(data){
            this.handlerSocket('delete', data);
        }.bind(this));
        this.rootKeyCode();
        this.notifications();
    },
    notifications: function(){
        console.log('notif test');
        if("Notification" in window){
            Notification.requestPermission(function(perm){
                if(perm == 'granted'){
                    Notification.permission = perm;
                    if(Notification.permission && Notification.permission !== 'denied'){
                        this.setState({allowNotif: true});
                    }
                }
            }.bind(this));
            console.log('notif test');
        }
    },
    rootKeyCode: function(){ //alt enter lead you to root interface.
        var down = {};
        $(document).keydown(function(e) {
            down[e.keyCode] = true;
            return true;
        }).keyup(function(e) {
            if (down[18] && down[13]){
                window.location.href = '#/root';
                down = {};
            } else down[e.keyCode] = false;
            return true;
        });
    },
    componentWillUnmount: function(){
        this.socket = null;
    },
    play: function(path, type, meta, index){
            if(typeof index === 'undefined'){
                if(this.state.index)
                    index = this.state.index;
                else
                    index = 0;
            }

            var toPlay = this.state.musics[this.state.playList[index]];
            this.setState({path: toPlay.path, type: toPlay.type, current: toPlay.meta, index: index});
    },
    truePlay: function(indexToPlay, force){
        var list    = this.state.playList,
            ln      = list.length,
            songs   = this.state.musics;
        if(typeof indexToPlay === 'undefined' || typeof list[indexToPlay] === 'undefined') indexToPlay = 0;
        var indexInSongs;
        if(typeof force !== 'undefined' && force === true){
            indexInSongs = indexToPlay;
            for (var i = ln - 1; i >= 0; i--) {
                if (list[i] == indexInSongs){
                    indexToPlay = i;
                    break;
                }
            };
        }else indexInSongs = list[indexToPlay];
        var item = songs[indexInSongs]
        if(typeof item === 'undefined'){
            indexToPlay = 0;
            indexInSongs = 0;
            item = songs[indexInSongs];
        }
        this.setState({path: item.path, type: item.type, current: item.meta, index: indexToPlay, notify: item});
    },
    forcePlay: function(id){
        if(id){
            this.state.playList.forEach(function(i, key){
                if(this.state.musics[i] && this.state.musics[i].id == id){
                    this.truePlay(key);
                    return;
                }
            }.bind(this));
        }
    },
    componentDidUpdate: function(prevProps, prevState) {
        var n = this.state, p = prevState;
        if((n.shuffling !== p.shuffling || n.index !== p.index || n.playList !== p.playList || n.autoPlay !== p.autoPlay) && n.canUpdateStatus){
            this.setUserStatus();
        }
    },
    moveInSongs: function(dir, n, force){
        var list    = this.state.playList,
            i       = this.state.index,
            ln      = list.length;
         //force is used to switch between automatic and manual. (mouse and keyboard are manual..)
        if(force && force === true) i = this.state.playList[i];
        n = parseInt(n); 
        if(typeof n !== "number" || !isFinite(n)) n = 1;
        if(dir == 'prev')
            while(n--) i = (i - 1 >= 0) ? (i - 1) : (ln - 1);
        else if (dir == 'next')
            while(n--) i = (i + 1 < ln) ? (i + 1) : 0;
        else{
            console.log('[error], (function moveInSongs). Wrong move in songs. params:');
            console.log({dir: dir, n: n});
            return false;
        }
        this.truePlay(i, force);
    },
    prev: function(n, force){ this.moveInSongs('prev', n, force); },
    next: function(n, force){ this.moveInSongs('next', n, force); },
    removed: function(name){
        var actuals = this.state.musics;
        var indexes = this.state.playList;
        actuals.forEach((music, i)=>{
            if(music.name === name){
                actuals.splice(i, 1);
                indexes.forEach((index, key)=>{
                    if(index === i)
                        indexes.splice(key, 1);
                });
                return;
            }
        });
        this.setState({musics: actuals, playList: indexes});
    },
    drag: function(bool){
        this.setState({drag: bool});
    },
    addPlayed: function(){
        var sng = this.state.musics[this.state.playList[this.state.index - 1]];
        if(sng){
            this.socket.emit('play', {id: sng.id});
        }
    },
    render: function(){
        return (
            <div>
                <Notify can={this.state.allowNotif} what={this.state.notify} />
                <Upload url={this.uploadAPI} drag={this.state.drag}/>
                <Player
                    path={this.state.path}
                    type={this.state.type}
                    meta={this.state.current}
                    next={this.next}
                    prev={this.prev}
                    addPlayed={this.addPlayed}
                    play={this.play}
                    shuffle={this.shuffle}
                    isShuffling={this.state.shuffling}
                />
                <Menu 
                    musics={this.state.musics}
                    playList={this.state.playList}
                    index={this.state.index}
                    current={this.state.current}
                    play={this.play}
                />
                    {
                        this.props.children &&
                        React.cloneElement(this.props.children,
                            {
                                drag: this.drag,
                                noteAPI: this.notesUrl,
                                play: this.play,
                                forcePlay: this.forcePlay,
                                prev: this.prev,
                                next: this.next,
                                removed: this.removed,
                                musics: this.state.musics,
                                apiAddNote: this.apiAddNote,
                                indexPlaying: this.state.playList[this.state.index],
                                changeAutoPlay: this.changeAutoPlay,
                                autoPlay : this.state.autoPlay
                            }
                        )
                    }
            </div>
        );
    }
});
                // <Visualizer url={this.state.musics[this.state.playList[this.state.index - 1]]} />

module.exports = {
    Layout: Layout
};
