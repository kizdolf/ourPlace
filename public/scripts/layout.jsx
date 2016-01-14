    var React       = require('react'),
    $           = require('jquery'),
    Player      = require('./player.jsx').Player,
    Menu        = require('./smalls.jsx').Menu,
    Visualizer  = require('./songViszu.jsx').Visualizer,
    Upload      = require('./upload.jsx').Upload;

var Layout = React.createClass({
    url: '/api/music',
    uploadAPI: '/api/upload',
    inter: 1000,
    notesUrl: '/api/notes',
    apiAddNote: '/api/note',
    socketHost: '//azerty.gq:9091',
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
            console.log(indexesOrder[this.state.index]);
            this.setState({shuffling: false});
            indexesOrder =  Array.from(Array(this.state.musics.length - 1).keys());
            console.log(this.state.index);
        }else{
            this.setState({shuffling: true});
            for(var j, x, i = indexesOrder.length; i; j = Math.floor(Math.random() * i), x = indexesOrder[--i], indexesOrder[i] = indexesOrder[j], indexesOrder[j] = x);
            indexesOrder.forEach(function(ind, key){
                if(ind == this.state.index){
                    console.log('new index is ' + key);
                    this.setState({index: key});
                }
            }.bind(this));
        }
        this.setState({playList: indexesOrder});

    },
    componentDidMount: function(){
        this.getMusicFromAPI(function(){
            var indexesOrder = Array.from(Array(this.state.musics.length).keys());
            this.setState({playList: indexesOrder});
        }.bind(this));
        this.socket = io(this.socketHost);
        this.socket.on('update', function(data){ //jshint ignore: line
            this.getMusicFromAPI();
        }.bind(this));
        this.rootKeyCode();
    },
    rootKeyCode: function(){
        var down = [];
        $(document).keydown(function(e) {
            down[e.keyCode] = true;
        }).keyup(function(e) {
            if (down[18] && down[13]) {
                console.log(window.location.href);
                window.location.href = '#/root';
            }
            down[e.keyCode] = false;
        }.bind(this));
    },
    componentWillUnmount: function(){
        // clearInterval(this.load);
        this.socket.on('update', function(data){}); //jshint ignore:line
    },
    play: function(path, type, meta, index){
        if(typeof index === 'undefined')
            index = 0;

        var toPlay = this.state.musics[this.state.playList[index]];
        this.setState({path: toPlay.path, type: toPlay.type, current: toPlay.meta, index: index});
    },
    forcePlay: function(index){
        var toPlay = this.state.musics[index];
        this.state.playList.forEach((i, key)=>{
            if(i == index){
                this.setState({path: toPlay.path, type: toPlay.type, current: toPlay.meta, index: key});
                return;
            }
        });
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
    addPlayed: function(){
        var sng = this.state.musics[this.state.playList[this.state.index - 1]];
        if(sng) this.socket.emit('play', {id: sng.id});
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
                    addPlayed={this.addPlayed}
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
                                forcePlay: this.forcePlay,
                                prev: this.prev,
                                next: this.next,
                                removed: this.removed,
                                musics: this.state.musics,
                                apiAddNote: this.apiAddNote,
                                indexPlaying: this.state.playList[this.state.index]
                            }
                        )
                    }
                <Visualizer url={this.state.musics[this.state.playList[this.state.index - 1]]} />
            </div>
        );
    }
});

module.exports = {
    Layout: Layout
};
