var React       = require('react'),
    $           = require('jquery'),
    Player      = require('./player.jsx').Player,
    Menu        = require('./smalls.jsx').Menu,
    Upload      = require('./upload.jsx').Upload;

var Layout = React.createClass({
    url: '/api/music',
    uploadAPI: '/api/upload',
    inter: 1000,
    notesUrl: '/api/notes',
    apiAddNote: '/api/note',
    socketHost: 'http://azerty.gq:9091',
    getInitialState: function(){
        return {
            musics: [],
            type: '',
            path: '',
            index: 0,
            current: {},
            playList: [],
            shuffling: false
        };
    },
    byDate: function(a, b){
        if(a.date > b.date) return -1;
        else return 1;
    },
    getMusicFromAPI: function(cb){
        $.get(this.url, function(data){
            data.music = data.music.sort(this.byDate);
            this.setState({musics: data.music});
            if(cb) cb();
        }.bind(this));
    },
    shuffle: function(){
        var indexesOrder = this.state.playList;
        if(this.state.shuffling){
            this.setState({shuffling: false});
            indexesOrder = [...Array(this.state.musics.length - 1).keys()];
        }else{
            this.setState({shuffling: true});
            for(var j, x, i = indexesOrder.length; i; j = Math.floor(Math.random() * i), x = indexesOrder[--i], indexesOrder[i] = indexesOrder[j], indexesOrder[j] = x);
        }
        this.setState({playList: indexesOrder});
    },
    componentDidMount: function(){
        this.getMusicFromAPI(function(){
            var indexesOrder = Array.from(Array(this.state.musics.length).keys());
            this.setState({playList: indexesOrder});
        }.bind(this));
        // this.load = setInterval(this.getMusicFromAPI, this.inter);
        this.socket = io(this.socketHost);
        this.socket.on('update', function(data){
            console.log('received update');
            this.getMusicFromAPI();
        }.bind(this));
    },
    componentWillUnmount: function(){
        // clearInterval(this.load);
        this.socket.on('update', function(data){});
    },
    play: function(path, type, meta, index){
        if(typeof path == 'undefined'){
            var toPlay = this.state.musics[this.state.playList[this.state.index]];
            path = toPlay.path;
            type = toPlay.type;
            meta = toPlay.meta;
            index = toPlay.id;
        }
        this.setState({path: path, type: type, current: meta, index: index});
    },
    next: function(){
        var list    = this.state.playList,
            i       = this.state.index;

        i = (i + 1 < list.length) ? (i + 1) : 0;
        var n = this.state.musics[list[i]];
        this.play(n.path, n.type, n.meta, i);
    },
    prev: function(){
        var list    = this.state.playList,
            i       = this.state.index;

        i = (i - 1 >= 0) ? (i - 1) : (list.length - 1);
        var n = this.state.musics[list[i]];
        this.play(n.path, n.type, n.meta, i);
    },
    removed: function(name){
        console.log(name + ' had beed removed');
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
    render: function(){
        return (
            <div>
                <Upload url={this.uploadAPI} />
                <Player
                    path={this.state.path}
                    type={this.state.type}
                    meta={this.state.current}
                    next={this.next}
                    prev={this.prev}
                    play={this.play}
                    shuffle={this.shuffle}
                />
                <Menu />
                    {
                        this.props.children &&
                        React.cloneElement(this.props.children,
                            {
                                noteAPI: this.notesUrl,
                                play: this.play,
                                prev: this.prev,
                                next: this.next,
                                removed: this.removed,
                                musics: this.state.musics,
                                apiAddNote: this.apiAddNote,
                                indexPlaying: this.state.playList[this.state.index]
                            }
                        )
                    }
            </div>
        );
    }
});

module.exports = {
    Layout: Layout
};
