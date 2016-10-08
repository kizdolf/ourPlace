var
    React           = require('react'),
    $               = require('jquery'),
    ItemMenu        = require('./smalls.jsx').ItemMenu;

/*For later:*/
// var ext = song.type.split('/')[1];
    //     if(meta.title){
    //         name = meta.title + '_';
    //         name += (meta.artist) ? meta.artist[0] : '';
    //         name += '.' + ext;
    //     }else{
    //         console.log('NON e.meta.title');
    //         name = e.meta.name;
    //     }

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
        // this.props.showOnTop({
        //     position: {x: e.pageX, y: e.pageY},
        //     data: this.props.song,
        // });
        // this.props.switchMenu({
        //     position: {x: e.pageX, y: e.pageY},
        //     data: this.props.data
        // });
    },
    handleRightClick: function(e){
        e.preventDefault();
        this.showMenu(e);
        return false;
    },
    render: function(){
        var meta = this.props.song.meta;
        var name = this.props.song.name;
        var clss = this.props.now ? 'itemMusic current itemCls': 'itemMusic itemCls';
        return (
            <li className={clss}>
                <span onClick={this.play} onContextMenu={this.handleRightClick} className="clickable" >
                    <div className="cover" >
                        <img src={meta.picture || '/img/default_cover.png'} alt="cover" className="cov" draggable={false}/>
                    </div>
                    <div className="Meta">
                        <span className="artist">{(meta.artist) ? meta.artist[0] : ''}</span>
                        <span className="title">{(meta.title) ? meta.title : name}</span>
                        {(meta.album) ? <span className="album">{meta.album}</span> : ''}
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
        var url = ($('#inputs').val()).split('&')[0];
        var input = $('#inputs');
        if(url.indexOf('youtube') == -1){
            input.val('Not a youtube link..');
            setTimeout(()=>{
                input.val('Try a other one.');
            }, 1500);
        }else{
            input.val('Uploading...');
            $.post('/api/fromYoutube', {url: url}, (data)=>{ //jshint ignore:line
                input.val('Done!');
                setTimeout(()=>{
                    input.val('');
                }, 1500);
            });
        }
    },
    componentDidMount: function(){
        $('#changeAutoPlay').click(function(){
            this.props.changeAutoPlay(!this.props.autoPlay);
        }.bind(this));
    },
    search: function(e){
        var v = e.target.value;
        this.setState({search: v});
        if(v.indexOf('.youtube.') == -1)this.props.search(v);
    },
    clear : function(){
        this.setState({search: ''});
        this.props.search('');
    },
    render: function(){
        return(
            <div>
                <div className="inputBox input-group">
                    <div className="inputBtns">
                        <button id="changeAutoPlay" type="button" className="btn btn-default">{(this.props.autoPlay === true) ? 'Unset' : 'Set'} Autoplay</button>
                        <button onClick={this.clear} type="button" className="btn btn-default" >Clear</button>
                        <button onClick={this.sendFromYT} id="addMusBtn" className="btn btn-default" type="button">Add the music!</button>
                    </div>
                    <input id="inputs" className="add form-control" type="text" placeholder="...Type a search or paste a YouTube music link." onChange={this.search} value={this.state.search}/>
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
        //have to change to something like that (new menu).

        // var opts = {
        //         name: data.data.name,
        //         type: 'video',
        //         position: data.position
                // download: {name: data.data.name, src: data.data.path},
        //         share: false,
        //         source: false,
        //         id: data.data.id,
        //         edit: [
        //             {name : data.data.name},
        //             {type: ['movie', 'tvshow','other']},
        //             {season: season},
        //             {episode: episode},
        //         ],
        //     };


        // var toggle = !this.state.showMenu;
        // this.setState({showMenu: toggle});
        // if(toggle){
        //     var season = data.data.meta.season ? data.data.meta.season : '';
        //     var episode = data.data.meta.episode ? data.data.meta.episode : '';
        //     var name = data.data.meta.name ? data.data.meta.name : data.data.name;
        //     var opts = {
        //         name: name,
        //         download: {name: data.data.name, src: data.data.path},
        //         share: false,
        //         source: false,
        //         edit: [
        //             {name : data.data.name},
        //             {type: ['movie', 'tvshow','other']},
        //             {season: season},
        //             {episode: episode},
        //         ],
        //         type: 'video',
        //         id: data.data.id,
        //         position: data.position
        //     };
        //     this.setState({
        //         toMenu: opts
        //     });
        // }else{
        //     this.closeMenu();
        // }
    },
    closeMenu: function(){
        this.setState({showMenu: false});
    },
    search: function(str){
        var show, meta;

        this.props.musics.forEach((item, i)=>{
            meta = item.meta;
            show = false;
            if(item.name.toLowerCase().indexOf(str.toLowerCase()) !== -1) show = true;
            else if(meta.title && meta.title.toLowerCase().indexOf(str.toLowerCase()) !== -1) show = true;
            else if(meta.artist && meta.artist[0] && meta.artist[0].toLowerCase().indexOf(str.toLowerCase()) !== -1) show = true;
            else if(meta.album && meta.album.toLowerCase().indexOf(str.toLowerCase()) !== -1) show = true;

            this.props.musics[i].toShow = (show) ? true : false;
        });
        this.forceUpdate();
    },
    calculateLIsInRow: function (){
        var lisInRow = 0;
        $('.itemMusic').each(function() {
            if($(this).prev().length > 0) {
                if($(this).position().top != $(this).prev().position().top) return false;
                lisInRow++;
            }else lisInRow++;
        });
        return lisInRow;
    },
    componentDidMount: function(){
        $(document).keydown(function(e) {
            if ([39, 37, 40, 38].indexOf(e.keyCode) != -1){
                var tag = e.target.tagName.toLowerCase();
                if(tag != 'input' && tag != 'textarea' && tag != 'pre'){
                    if(e.keyCode == 39 ) this.props.next(1, true);
                    else if(e.keyCode == 37) this.props.prev(1, true);
                    else{
                        var nb = this.calculateLIsInRow();
                        e.preventDefault();
                        if(e.keyCode == 40) this.props.next(nb, true);
                        else if(e.keyCode == 38) this.props.prev(nb, true);
                        // var scrollTo = $('.current');
                        // var h = scrollTo.position().top;
                        // var less = ((h - 500) < 0) ? h : h - 500;
                        // $(window).scrollTop(h);
                        return false;
                    }
                }
            }else return true;
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
                            drag={this.props.drag}
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
            <span>
            <div id="music">
                <InputBox
                    search={this.search}
                    changeAutoPlay={this.props.changeAutoPlay}
                    autoPlay={this.props.autoPlay}
                />
                <ul className="listMusic">
                    {musicNodes}
                </ul>
            </div>
            { this.state.showMenu ? <ItemMenu e={this.state.toTop} closeMenu={this.closeMenu} type='song' removed={this.props.removed} /> : '' }
            </span>
        );
    }
});
