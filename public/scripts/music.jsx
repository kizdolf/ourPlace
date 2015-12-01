var
    React       = require('react'),
    $           = require('jquery'),
    ItemMenu    = require('./smalls.jsx').ItemMenu;

var MusicItem = React.createClass({
    play: function(){
        this.props.onWishPlay(this.props.src, this.props.type, this.props.meta, this.props.index);
    },
    showMenu: function(e){
        this.props.showOnTop({x: e.pageX, y: e.pageY}, this.props.meta, this.props.src, this.props.name);
    },
    render: function(){
        return (
            <li className="itemMusic">
                <span onClick={this.play}>
                    <div className="cover">
                        <img src={this.props.meta.picture || '/img/default_cover.png'} alt="cover" className="cov"/>
                    </div>
                    <div className="Meta">
                        <span className="title">{this.props.meta.title}</span>
                        <span className="artist"><i>From: </i>{(this.props.meta.artist) ? this.props.meta.artist[0] : ''}</span>
                        {(this.props.meta.album) ? <span className="album"><i>Album: </i>{this.props.meta.album}</span> : ''}
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
        var url = ($('#inYT').val());
        console.log('url == ' + url);
        if(url.match(/^http(s?):\/\/(?:www\.)?youtube.com\/watch\?(?=.*v=\w+)(?:\S+)?$/)){
            console.log('url match!');
            $.post('/api/fromYoutube', {url: url}, (data)=>{
                console.log('resp for youtube:');
                console.log(data);
            });
        }else{
            console.log('url DO NOT match!');
        }
    },
    search: function(e){
        var v = e.target.value;
        this.setState({search: v});
        this.props.search(v);
    },
    render: function(){
        return(
            <div className="inputBox">
                <input className="search" type="text" placeholder="Search something" onChange={this.search} value={this.state.search} />
                <button onClick={this.clear}>Clear</button>
                <input  id="inYT" className="add" type="text" placeholder="Paste a You Tube url here."/>
                <button onClick={this.sendFromYT}>Add the music!</button>
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
    showOnTop: function(e, meta, src, name){
        this.setState({
            toTop: {meta: meta, e: e, src:src, name: name},
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
    render: function(){
        var musicNodes;
        if(this.props.musics.length > 0){
            musicNodes = this.props.musics.map(function(music){
                if(typeof music.toShow === 'undefined' || music.toShow === true){
                    return (
                        <MusicItem
                            index={music.id}
                            key={music.id}
                            meta={music.meta}
                            name={music.name}
                            src={music.path}
                            type={music.type}
                            onWishPlay={this.props.play}
                            showOnTop={this.showOnTop}
                        />
                    );
                }
            }.bind(this));
        } else musicNodes = '';
        return (
            <div id="music">
                <InputBox
                    search={this.search}
                />
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
