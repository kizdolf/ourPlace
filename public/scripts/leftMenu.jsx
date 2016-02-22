var
    React       = require('react'),
    Link        = require('react-router').Link;


var ItemPlaylist = React.createClass({
    getInitialState: function(){
        return{
            played: 0
        }
    },
    getStats: function(){
        this.props.played(this.props.song.id, function(data){
            this.setState({played: data});
        }.bind(this));
    },
    play: function(){
        this.props.play(this.props.song);
    },
    render: function(){
        return(
            <li onClick={this.play} key={this.props.song.id} className={this.props.clss} onMouseEnter={this.getStats}>
                <span className="statsName">
                    {this.props.show}
                </span>
                <span className="stats">
                    played {this.state.played} times.
                </span>
            </li>
        );
    }
});

var CurPlaylist = React.createClass({
    componentDidMount: function(){
        this.socket = io({secure: true});
    },
    componentWillUnmount: function(){
        this.socket = null;
    },
    played: function(id, cb){
        this.socket.emit('played', {id: id});
        this.socket.on('playedBy', function(data){
            cb(data);
        }.bind(this));
    },
    play: function(song){
        this.props.playList.forEach(function(i, index){
            if(this.props.musics[i].id == song.id){
                this.props.play(song.path, song.type, song.meta, index);
                return;
            }
        }.bind(this));
    },
    render: function(){
        var current = this.props.musics[this.props.playList[this.props.index]];
        var mountElems = this.props.playList.map(function(i){
            var song = this.props.musics[i];
            if(typeof song !== 'undefined'){
                var toDisplay = (song.meta.title) ? song.meta.title : song.name;
                var clss = (current.id == song.id) ? 'current' : '';
                return(
                    <ItemPlaylist play={this.play} song={song} clss={clss} show={toDisplay} key={i} played={this.played}/>
                )
            }
        }.bind(this));
        return(
            <div id="curPlaylist">
                <p>Current Playlist:</p>
                <ul>
                    {mountElems}
                </ul>
            </div>
        )
    }

});

exports.Menu = React.createClass({
    render: function(){
        return (
            <div className="WrapperMenu">
                <ul className="links">
                    <li className="oneLink"><Link to="/notes">Notes</Link></li>
                    <li className="oneLink"><Link to="/">Music</Link></li>
                    <li className="oneLink"><Link to="/rss">Rss</Link></li>
                </ul>
                <CurPlaylist 
                    musics={this.props.musics}
                    playList={this.props.playList}
                    index={this.props.index}
                    play={this.props.play}
                />
            </div>
        );
    }
});


