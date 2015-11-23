var
    React       = require('react');

var MusicItem = React.createClass({
    play: function(){
        this.props.onWishPlay(this.props.src, this.props.type, this.props.meta);
    },
    render: function(){
        return (
            <li onClick={this.play} className="itemMusic">
                {/*
                As well here, all the meta stuff is for now dumb, but should be in it's own component (and remain dumb)
                Something else is missing: this 'menu', to give the possibility to update/delete/comment/download each song.
                Guess what? It's gonna be a component.
                */}
                <div className="Meta">
                    <div className="textItem">
                        <span className="title" >
                            {this.props.meta.title}
                        </span>
                        <span className="artist">
                            <i>From: </i>{(this.props.meta.artist) ? this.props.meta.artist[0] : ''}
                        </span>
                        <span className="album">
                            <i>Album: </i>{this.props.meta.album || ''}
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

exports.MusicBox = React.createClass({
    render: function(){
        var musicNodes;
        if(this.props.musics.length > 0){
            musicNodes = this.props.musics.map(function(music){
                return (
                    <MusicItem
                        key={music.id}
                        meta={music.meta}
                        src={music.path}
                        type={music.type}
                        onWishPlay={this.props.play}
                    />
                );
            }.bind(this));
        }else{
            musicNodes = '';
        }
        return (
            <div id="music">
                <ul className="listMusic">
                    {musicNodes}
                </ul>
            </div>
        );
    }
});
