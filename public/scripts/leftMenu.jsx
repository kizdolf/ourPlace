var
    React       = require('react'),
    Link        = require('react-router').Link;


var CurPlaylist = React.createClass({
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
                    <li onClick={this.play.bind(this, song)} key={song.id} className={clss}>
                        <span className="statsName">
                            {toDisplay}
                        </span>
                        <span className="stats">
                            played {song.playedBy} times.
                        </span>
                    </li>
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

