var
    React       = require('react'),
    $           = require('jquery'),
    ItemMenu    = require('./smalls.jsx').ItemMenu;

var MusicItem = React.createClass({
    play: function(){
        this.props.onWishPlay(this.props.index);
    },
    showMenu: function(e){
        this.props.showOnTop(
            {x: e.pageX, y: e.pageY},
            this.props.song,
            this.props.song.id
        );
    },
    render: function(){
        // console.log(this.props.song.played);
        var meta = this.props.song.meta;
        var name = this.props.song.name;
        var clss = this.props.now ? 'itemMusic current': 'itemMusic';
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

var InputBox = React.createClass({
    getInitialState: function(){
        return({
            search: '',
        });
    },
    sendFromYT: function(){
        var url = ($('#inYT').val()).split('&')[0];
        $('#inYT').val('');
        $('#addMusBtn').html('Uploading...');
        $.post('/api/fromYoutube', {url: url}, (data)=>{
            $('#addMusBtn').html('Done!');
            setTimeout(()=>{
                $('#addMusBtn').html('Add a other one.');
            }, 1500);
        });
    },
    search: function(e){
        var v = e.target.value;
        this.setState({search: v});
        this.props.search(v);
    },
    render: function(){
        return(
            <div className="inputBox row">
                <div className="col-lg-3">
                    <div className="input-group">
                        <input className="search form-control" type="text" placeholder="Search something" onChange={this.search} value={this.state.search} />
                        <span className="input-group-btn">
                            <button onClick={this.clear} className="btn btn-default" type="button">Clear</button>
                        </span>
                    </div>
                </div>
                <div className="col-lg-3">
                    <div className="input-group">
                        <input  id="inYT" className="add form-control" type="text" placeholder="Paste a You Tube url here."/>
                        <span className="input-group-btn">
                            <button onClick={this.sendFromYT} id="addMusBtn" className="btn btn-default" type="button">Add the music!</button>
                        </span>
                    </div>
                </div>
            </div>
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
    showOnTop: function(e, meta, id){
        this.setState({
            toTop: {meta: meta, e: e, type:'song', id: id},
            showMenu : !this.state.showMenu
        });
    },
    closeMenu: function(){
        this.setState({showMenu: false});
    },
    search: function(str){
        this.props.musics.forEach((item, i)=>{
            var show = false;
            if(item.name.toLowerCase().indexOf(str.toLowerCase()) !== -1)
                show = true;
            else if(item.meta.title && item.meta.title.toLowerCase().indexOf(str.toLowerCase()) !== -1)
                show = true;
            else if(item.meta.artist && item.meta.artist[0] && item.meta.artist[0].toLowerCase().indexOf(str.toLowerCase()) !== -1)
                show = true;
            else if(item.meta.album && item.meta.album.toLowerCase().indexOf(str.toLowerCase()) !== -1)
                show = true;

            if(!show)
                this.props.musics[i].toShow = false;
            else
                this.props.musics[i].toShow = true;
        });
        this.forceUpdate();
    },
    componentDidMount: function(){
        $(document).keyup(function(e) {
            if(e.keyCode == 32){
                e.preventDefault();
                this.props.switchPause();
            }else if(e.keyCode == 39 ){
                this.props.next();
            }else if(e.keyCode == 37){
                this.props.prev();
            }
        }.bind(this));
    },
    render: function(){
        var musicNodes;
        if(this.props.musics.length > 0){
            var i = 0;
            musicNodes = this.props.musics.map(function(music){
                if(typeof music.toShow === 'undefined' || music.toShow === true){
                    var currentlyPlaying = (i == this.props.indexPlaying) ? true: false;
                    return (
                        <MusicItem 
                            index={i++}
                            key={music.id}
                            song={music}
                            onWishPlay={this.props.forcePlay}
                            showOnTop={this.showOnTop}
                            now={currentlyPlaying}/>
                    );
                }
            }.bind(this));
        } else musicNodes = '';
        return (
            <div id="music">
                <InputBox
                    search={this.search}
                />
            <ul classNammusice="listMusic">
                    {musicNodes}
                </ul>
                { this.state.showMenu ? <ItemMenu e={this.state.toTop} closeMenu={this.closeMenu} type='song' removed={this.props.removed} /> : '' }
            </div>
        );
    }
});
