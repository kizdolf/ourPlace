var
    React       = require('react'),
    $           = require('jquery'),
    Dropzone    = require('react-dropzone'),
    ItemMenu    = require('./smalls.jsx').ItemMenu;


var MusicItem = React.createClass({
    play: function(){
        this.props.onWishPlay(this.props.song.id);
    },
    showMenu: function(e){
        this.props.showOnTop(
            {x: e.pageX, y: e.pageY},
            this.props.song,
            this.props.song.id
        );
    },
    onDrop: function(li){
        console.log(li);
        console.log(this.props);
    },
    onDrag: function(e){
        console.log(e);
    },
    render: function(){
        // console.log(this.props.song.played);
        // <Dropzone onDrop={this.onDrop}>
        var meta = this.props.song.meta;
        var name = this.props.song.name;
        var clss = this.props.now ? 'itemMusic current': 'itemMusic';
        return (
            <li className={clss} ondrop={this.onDrop}>
                <span onClick={this.play} className="clickable" >
                    <div className="cover" >
                        <img src={meta.picture || '/img/default_cover.png'} alt="cover" className="cov" />
                    </div>
                    <div className="Meta">
                        <span className="artist">{(meta.artist) ? meta.artist[0] : ''}</span>
                        <span className="title">{(meta.title) ? meta.title : name}</span>
                        {(meta.album) ? <span className="album"><i>{meta.album}</i></span> : ''}
                    </div>
                </span>
                <img className="itemMenu" src="img/ic_more_vert_black_24dp_1x.png" onClick={this.showMenu} />
            </li>
        );
    }
});

var InputBox = React.createClass({
    getInitialState: function(){
        return({
            search: ''
        });
    },
    sendFromYT: function(){
        var url = ($('#inYT').val()).split('&')[0];
        $('#inYT').val('');
        $('#addMusBtn').html('Uploading...');
        $.post('/api/fromYoutube', {url: url}, (data)=>{ //jshint ignore:line
            $('#addMusBtn').html('Done!');
            setTimeout(()=>{
                $('#addMusBtn').html('Add a other one.');
            }, 1500);
        });
    },
    componentDidMount: function(){
        $('#changeAutoPlay').click(function(){
            this.props.changeAutoPlay(!this.props.autoPlay);
        }.bind(this));
    },
    search: function(e){
        var v = e.target.value;
        this.setState({search: v});
        this.props.search(v);
    },
    clear : function(){
        this.setState({search: ''});
        this.props.search('');  
    },
    render: function(){
        return(
            <div className="inputBox">
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
                <button id="changeAutoPlay" className="btn btn-xs">{(this.props.autoPlay == true) ? 'Unset' : 'Set'} Autoplay</button>
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
    calculateLIsInRow: function (){
        var lisInRow = 0;
        $('.itemMusic').each(function() {
            if($(this).prev().length > 0) {
                if($(this).position().top != $(this).prev().position().top) return false;
                lisInRow++;
            }
            else {
                lisInRow++;   
            }
        });
        return lisInRow;
    },
    componentDidMount: function(){
        $(document).keydown(function(e) {
            if ([39, 37, 40, 38].indexOf(e.keyCode) != -1){
                var tag = e.target.tagName.toLowerCase();
                if(tag != 'input' && tag != 'textarea' && tag != 'pre'){
                    if(e.keyCode == 39 ) this.props.next();
                    else if(e.keyCode == 37) this.props.prev();
                    else{
                        var nb = this.calculateLIsInRow();
                        e.preventDefault();
                        if(e.keyCode == 40) this.props.next(nb);
                        else if(e.keyCode == 38) this.props.prev(nb);
                        var scrollTo = $('.current');
                        var h = scrollTo.position().top;
                        var less = ((h - 500) < 0) ? h : h - 500;
                        $(window).scrollTop(h);
                        return false;
                    }
                }
            }else{
                return true;
            }
        }.bind(this));
        // this.getRightMenu();
    },
    // getRightMenu: function(){
    //     $('#music').mousedown(function(e){
    //         if( e.button == 2 ) {
    //             console.log('trigger menu');
    //             console.log($($(e.target)[0]));
    //         }
    //     });
    // },
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
                    changeAutoPlay={this.props.changeAutoPlay}
                    autoPlay={this.props.autoPlay}
                />
            <ul classNammusice="listMusic">
                    {musicNodes}
                </ul>
                { this.state.showMenu ? <ItemMenu e={this.state.toTop} closeMenu={this.closeMenu} type='song' removed={this.props.removed} /> : '' }
            </div>
        );
    }
});
