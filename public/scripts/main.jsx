/*
    First bunch of React code. Nice.
    TODO:
            -sockets. this will probably be in a mixin.
            -menu for each MusicItem
            -onTop component to edit stuff.
            -Upload. probably in a mixin as well.
            -Layout, menu, others views. ahah. ... -_-" (I have still no idea for that. routing? how the fuck?)
*/

var
    React       = require('react'),
    ReactDOM    = require('react-dom'),
    $           = require('jquery');


// MusicList should be called MusicBox, or MusicWrapper. Beginner mistake.
var MusicList = React.createClass({
    getInitialState: function(){
        return {
            musics: [],
            type: '',
            path: ''
        };
    },
    getMusicFromAPI: function(){
        $.get(this.props.url, function(data){
            this.setState({musics: data.music});
        }.bind(this));
    },
    componentDidMount: function(){
        this.getMusicFromAPI();
        setInterval(this.getMusicFromAPI, this.props.inter);
    },
    play: function(path, type){
        this.setState({
            type: type,
            path: path
        });
    },
    render: function(){
        var musicNodes = this.state.musics.map(function(music){
            return (
                <MusicItem
                    key={music.id}
                    meta={music.meta}
                    src={music.path}
                    type={music.type}
                    onWishPlay={this.play}
                     />
            );
        }.bind(this));
        return (
            <span>
                <AudioPlayer type={this.state.type} path={'http://azerty.gq' + this.state.path} />
                <div id="music">
                    <ul className="listMusic">
                        {musicNodes}
                    </ul>
                </div>
            </span>
        );
    }
});

var AudioPlayer = React.createClass({
    componentDidUpdate: function(prev){
        /*Something unfortunate here:
            MusicList change is state each two seconds.
            Changing this state also change the props here, even they remain the same.
            e.g : before : 'coucou', after 'coucou'. DOM is not updated, props are. (thanks react)
            So componentDidUpdate is called. But we don't want to touch to the audio element. So "if" ..
        */
        if(prev.path != this.props.path){
            var player = $('#audioPlayer')[0];
            var audioSource = $('#audioSource');
            audioSource.attr('src', this.props.path);
            audioSource.attr('type', this.props.type);
            player.pause();
            player.load();
            player.oncanplaythrough = player.play();
        }
    },
    render: function(){
        return(
            <div id="player">
                <audio controls id="audioPlayer">
                    <source src={this.props.path} type={this.props.type} autoPlay id="audioSource" />
                    Your browser does not support the audio element.
                </audio>
                /* Controls (not working yet) should be in their own component. with handlers here. */
                <div className="ctrls">
                    <img src="img/ic_skip_previous_black_24dp.png" alt="prev" />
                    <img src="img/ic_play_arrow_black_24dp.png" alt="pause_play" className="pause_play" />
                    <img src="img/ic_skip_next_black_24dp.png" alt="next"/>
                    <img src="img/ic_shuffle_black_24dp.png" alt="next" />
                </div>
            </div>
        );
    }
});

var MusicItem = React.createClass({
    play: function(){
        this.props.onWishPlay(this.props.src, this.props.type);
    },
    render: function(){
        return (
            <li onClick={this.play} className="itemMusic">
                /*
                    As well here, all the meta stuff is for now dumb, but should be in it's own component (and remain dumb)
                    Something else is missing: this 'menu', to give the possibility to update/delete/comment/download each song.
                    Guess what? It's gonna be a component.
                */
                <div className="Meta">
                    <div className="textItem">
                        <span className="title" >
                            {this.props.meta.title}
                        </span>
                        <span className="artist">
                            <i>From: </i>{this.props.meta.artist[0]}
                        </span>
                        <span className="album">
                            <i>Album: </i>{this.props.meta.album}
                        </span>
                    </div>
                </div>
                <div className="cover">
                    <img src={'http://azerty.gq' + (this.props.meta.picture || '/img/default_cover.png')} alt="cover" className="cov"/>
                </div>
            </li>
        );
    }
});

ReactDOM.render(
    <MusicList url="/api/music" inter={2000}/>,
    document.getElementById('wrapper')
);
