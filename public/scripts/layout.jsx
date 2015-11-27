
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
            current: {}
        };
    },
    byDate: function(a, b){
        if(a.date > b.date) return -1;
        else return 1;
    },
    getMusicFromAPI: function(){
        $.get(this.url, function(data){
            data.music = data.music.sort(this.byDate);
            this.setState({musics: data.music});
        }.bind(this));
    },
    componentDidMount: function(){
        this.getMusicFromAPI();
        this.load = setInterval(this.getMusicFromAPI, this.inter);
    },
    componentWillUnmount: function(){
        clearInterval(this.load);
    },
    play: function(path, type, meta){
        this.setState({path: path, type: type, current: meta});
        this.state.musics.forEach(function(music, i){
            if(music.path === path){
                this.setState({index: i});
                return;
            }
        }.bind(this));
    },
    next: function(){
        var n = (this.state.musics[this.state.index + 1]) ? this.state.musics[this.state.index + 1] :  this.state.musics[0];
        this.play(n.path, n.type, n.meta);
    },
    prev: function(){
        var n =(this.state.index > 0) ? this.state.musics[this.state.index - 1] : this.state.musics[this.state.musics.length - 1];
        this.play(n.path, n.type, n.meta);
    },
    removed: function(name){
        console.log(name + ' had beed removed');
        var actuals = this.state.musics;
        actuals.forEach((music, i)=>{
            if(music.name === name){
                actuals.splice(i, 1);
                return;
            }
        });
        this.setState({musics: actuals});
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
