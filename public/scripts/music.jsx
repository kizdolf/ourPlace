var
    React       = require('react'),
    $           = require('jquery'),
    ItemMenu    = require('./smalls.jsx').ItemMenu;

var MusicItem = React.createClass({
    play: function(){
        this.props.onWishPlay(this.props.src, this.props.type, this.props.meta);
    },
    showMenu: function(e){
        this.props.showOnTop({x: e.pageX, y: e.pageY}, this.props.meta, this.props.src, this.props.name);
    },
    render: function(){
        return (
            <li className="itemMusic">
                <span onClick={this.play}>
                    <div className="Meta">
                        <span className="title">{this.props.meta.title}</span>
                        <span className="artist"><i>From: </i>{(this.props.meta.artist) ? this.props.meta.artist[0] : ''}</span>
                        <span className="album"><i>Album: </i>{this.props.meta.album || ''}</span>
                    </div>
                    <div className="cover">
                        <img src={this.props.meta.picture || '/img/default_cover.png'} alt="cover" className="cov"/>
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

exports.MusicBox = React.createClass({
    getInitialState: function(){
        return {
            toTop: {},
            showMenu: false
        };
    },
    showOnTop: function(e, meta, src, name){
        this.setState({
            toTop: {meta: meta, e: e, src:src, name: name},
            showMenu : !this.state.showMenu
        });
    },
    closeMenu: function(){
        this.setState({showMenu: false});
    },
    render: function(){
        var musicNodes;
        if(this.props.musics.length > 0){
            musicNodes = this.props.musics.map(function(music){
                return (
                    <MusicItem
                        key={music.id}
                        meta={music.meta}
                        name={music.name}
                        src={music.path}
                        type={music.type}
                        onWishPlay={this.props.play}
                        showOnTop={this.showOnTop}
                    />
                );
            }.bind(this));
        } else musicNodes = '';
        return (
            <div id="music">
                <ul className="listMusic">
                    {musicNodes}
                </ul>
                {
                    this.state.showMenu ?
                        <ItemMenu
                            e={this.state.toTop}
                            closeMenu={this.closeMenu}
                            type='music'
                            removed={this.props.removed}
                        />
                    : null
                }
            </div>
        );
    }
});
