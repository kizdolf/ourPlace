'use strict';
var React       = require('react'),
    $           = require('jquery'),
    Player      = require('./player.jsx').Player,
    Menu        = require('./smalls.jsx').Menu,
    Upload      = require('./upload.jsx').Upload;



var SongBox = React.createClass({
    playItem: (id)=>{
        this.props.playItem(id);
        this.activate(id);
    },
    playByIndex: (index)=>{
        var id = this.getIdFromIndex(index);
        this.playItem(id);
    },
    shuffle: ()=>{
        //do or undo shuffle
    },
    playNext: ()=>{
        var index = this.getNextIndex();
        var id = this.getIdFromIndex(index);
        this.playItem(id);
    },
    playPrev: ()=>{
        var index = this.getPrevIndex();
        var id = this.getIdFromIndex(index);
        this.playItem(id);
    },
    activate: (id)=>{
        var indexInSongs = this.getIndexFromId(id);
        var songs = this.state.songs;
        songs.forEach((s, i)=>{
            if(i === indexInSongs)
                songs[i].active = true;
            else
                songs[i].active = false;
        });
        this.setState({songs: songs});
    },
    getInitialState: ()=>{
        return {
            currentIndex: 0,
            songs: [],
            playList: []
        };
    },
    componentDidMount: ()=>{
        this.getSongs((sngs)=>{
            this.setState({songs: sngs});
            this.buildDefaultPlaylist();
        });
    },
    render: ()=>{
        return(
            <ul>
                <li></li>
                <li></li>
                <li></li>
                <li></li>
            </ul>
        );
    }
});

var Player = React.createClass({
    componentDidUpdate: ()=>{
        var p = this.props.playing;
        if(!!p.is){
            this.getSong(p.id).then((s)=>{
                this.play(s);
            });
        }
    },
    playCurrent: ()=>{
        this.props.doFromPlayer('default');
    },
    render: ()=>{
        return(
            <div>
                stuff
            </div>
        );
    }
});

var Layout = React.createClass({
    playItem: (id)=>{
        var playing = {is: true, id: id};
        this.setState({playing: playing});
    },
    doFromPlayer: (kind)=>{
        switch (kind) {
            case 'default':
                this.refs.SongBox.playByIndex(0);
                break;
            case 'shuffle':
                this.refs.SongBox.shuffle();
                break;
            case 'next':
                this.refs.SongBox.playNext();
                break;
            case 'prev':
                this.refs.SongBox.playPrev();
                break;
        }
    },
    getInitialState: ()=>{
        return{
            playing: {is: false, id: null},
        };
    },
    render: ()=>{
        return(
            <div>
                <Player/>
                <Menu/>
                {
                    this.props.children &&
                    React.cloneElement(this.props.children,
                        {
                            playing: this.state.playing,
                            playItem: this.playItem,
                            doFromPlayer: this.playFromPlayer,
                            fromPlayer: this.state.fromPlayer
                        }
                    )
                }
                <Upload/>
                <MicroMenu/>
                <TopScreen/>
            </div>
        );
    }
});
