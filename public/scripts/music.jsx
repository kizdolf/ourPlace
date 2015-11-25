var
    React       = require('react'),
    $           = require('jquery');


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
                        <img src={'http://azerty.gq' + (this.props.meta.picture || '/img/default_cover.png')} alt="cover" className="cov"/>
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

/*
    design toTop:
    title: string
    textEdits: [{label: value}]

*/

var OnTop = React.createClass({
    render: function(){
        console.log(this.props.elem);
        return (
            <div className="onTop">
                <span className="closeOnTop" onClick={this.props.close}>X</span>
                <div className="btnsSubOnTop">
                    <button>OK</button>
                    <button onClick={this.props.close}>Cancel</button>
                </div>
            </div>
        );
    }
});

var ItemMenu = React.createClass({
    getInitialState: function(){
        return {
            toTop: {},
            showOnTop: false,
        };
    },
    close: function(){
            this.setState({showOnTop: false});
    },
    showOnTop: function(){
        this.setState({
            showOnTop : !this.state.showOnTop
        });
    },
    download: function(){
        console.log(this.props);
        var dl = document.createElement('a');
        dl.setAttribute('href', this.props.e.src);
        dl.setAttribute('download', this.props.e.name);
        dl.click();
        dl = null;
        this.props.closeMenu();
    },
    componentDidMount: function(){
        $('#optsItem').css('top', this.props.e.e.y + 'px');
        $('#optsItem').css('left', this.props.e.e.x + 'px');
    },
    render: function(){
        return(
            <span>
                <div id="optsItem">
                    <span className="oneOpt" onClick={this.download}><img src="img/ic_file_download_black_24dp.png" alt="dl" className="imgOpt"/><span className="txtOpt">Download</span></span>
                    <span className="oneOpt" onClick={this.showOnTop}><img src="img/ic_edit_black_24dp.png" alt="edit" className="imgOpt"/><span className="txtOpt">Edit</span></span>
                    <span className="oneOpt" onClick={this.showOnTop}><img src="img/ic_comment_black_24dp.png" alt="edit" className="imgOpt"/><span className="txtOpt">Comment</span></span>
                    <span className="oneOpt" onClick={this.showOnTop}><img src="img/ic_delete_black_24dp.png" alt="del" className="imgOpt"/><span className="txtOpt">Delete</span></span>
                    <span className="oneOpt" onClick={this.showOnTop}><img src="img/ic_delete_black_24dp.png" alt="del" className="imgOpt"/><span className="txtOpt">Get link</span></span>
                </div>
                {
                    this.state.showOnTop ?
                        <OnTop
                            elem={this.state.toTop}
                            close={this.close}
                        />
                    : null
                }
            </span>
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
                        />
                    : null
                }
            </div>
        );
    }
});
