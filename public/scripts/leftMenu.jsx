var
    React       = require('react'),
    Link        = require('react-router').Link;


var CurPlaylist = React.createClass({
    render: function(){
        var current = this.props.musics[this.props.playList[this.props.index]];
        var mountElems = this.props.playList.map(function(i){
            var song = this.props.musics[i];
            var clss = (current.id == song.id) ? 'current' : '';
            return(
                <li key={song.id} className={clss}>
                    {song.played} {song.meta.title || song.name}
                </li>
            )
        }.bind(this));
        console.log(current);
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
                />
            </div>
        );
    }
});


