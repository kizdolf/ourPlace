
var React       = require('react'),
    $           = require('jquery'),
    Player      = require('./player.jsx').Player,
    Menu        = require('./smalls.jsx').Menu,
    Upload      = require('./upload.jsx').Upload;



var Layout = React.createClass({
    url: "/api/music",
    uploadAPI: "/api/upload",
    inter: 20000,
    notesUrl: "/api/notes",
    apiAddNote: "/api/note",
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
        console.log(indexesOrder);
        this.setState({playList: indexesOrder});
    },
    componentDidMount: function(){
        this.getMusicFromAPI(function(){
            var indexesOrder = Array.from(Array(this.state.musics.length).keys());
            this.setState({playList: indexesOrder});
        }.bind(this));
        this.load = setInterval(this.getMusicFromAPI, this.inter);
    },
    componentWillUnmount: function(){
        clearInterval(this.load);
    },
    play: function(path, type, meta, index){
        if(typeof path == 'undefined'){
            var toPlay = this.state.musics[this.state.playList[this.state.index]];
            path = toPlay.path;
            type = toPlay.type;
            meta = toPlay.meta;
            index = toPlay.id;
        }
        this.state.playList.forEach((item, key)=>{
            if(item === index){
                index = key;
                return;
            }
        });
        this.setState({path: path, type: type, current: meta, index: index});
    },
    next: function(){
        console.log(this.state.playList);
        console.log(this.state.index);
        console.log(this.state.playList[this.state.index]);
        var n = (this.state.musics[this.state.playList[this.state.index + 1]]) ?
                    this.state.musics[this.state.playList[this.state.index + 1]]
                : this.state.musics[this.state.playList[0]];
        console.log(n);
        this.play(n.path, n.type, n.meta);
    },
    prev: function(){
        var n =(this.state.index > 0) ?
                    this.state.musics[this.state.playList[this.state.index - 1]]
                : this.state.musics[this.state.playList[this.state.playList.length - 1]];
        this.play(n.path, n.type, n.meta);
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
                                apiAddNote: this.apiAddNote
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
