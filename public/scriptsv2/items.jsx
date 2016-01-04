'use strict';
var React = require('react');

exports.SongItem = React.createClass({
    play: function(){
        var id = this.props.song.id;
        this.props.play(id);
    },
    showMenu: function(e){
        this.props.showOnTop(
            {x: e.pageX, y: e.pageY},
            this.props.song,
            this.props.song.id
        );
    },
    render: function(){
        var meta = this.props.song.meta;
        var name = this.props.song.name;
        var clss = this.props.song.active ? 'itemMusic current': 'itemMusic';
        return (
            <li className={clss}>
                <span onClick={this.play}>
                    <div className="cover">
                        <img src={meta.picture || '/img/default_cover.png'} alt="cover" className="cov"/>
                    </div>
                    <div className="Meta">
                        <span className="title">{(meta.title) ? meta.title : name}</span>
                        <span className="artist"><i>From: </i>{(meta.artist) ? meta.artist[0] : ''}</span>
                        {(meta.album) ? <span className="album"><i>Album: </i>{meta.album}</span> : ''}
                    </div>
                </span>
                <img
                    className="itemMenu"
                    src="img/ic_more_vert_black_24dp_1x.png"
                    onClick={this.showMenu}
                />
            </li>
        );
    }
});
