'use strict';
var React = require('react'),
    $ = require('jquery'),
    SongItem = require('./items.jsx').SongItem;

exports.SongBox = React.createClass({
    songsUrl: '/api/music',
    getSongs: function(cb){
        $.get(this.songsUrl, (resp)=>{
            if(resp.music) cb(resp.music);
            else cb(false);
        });
    },
    buildDefaultPlaylist: function(){
        var sngs = this.state.songs;
        var defaultPlaylist = [...Array(sngs.length - 1).keys()]; //jshint ignore:line
        this.setState({playList: defaultPlaylist});
    },
    playItem: function(id){
        this.props.playItem(id);
        this.activate(id);
    },
    playByIndex: function(index){
        this.getIdFromIndex(index, (id)=>{
            this.playItem(id);
        });
    },
    shuffle: function(){
        //do or undo shuffle
    },
    getIdFromIndex: function(index, cb){
        this.state.playList.forEach((i)=>{
            if(i == index){
                cb(this.state.songs[i].id);
            }
        });
    },
    playNext: function(){
        var index = this.getNextIndex();
        this.getIdFromIndex(index, (id)=>{
            this.playItem(id);
        });
    },
    playPrev: function(){
        var index = this.getPrevIndex();
        this.getIdFromIndex(index, (id)=>{
            this.playItem(id);
        });
    },
    getIndexFromId: function(id, cb){
        var songs = this.state.songs;
        songs.forEach((s, i)=>{
            if(s.id === id)
                return cb(i);
        });
    },
    activate: function(id){
        this.getIndexFromId(id, (indexInSongs)=>{
            var songs = this.state.songs;
            songs.forEach((s, i)=>{
                songs[i].active = (i === indexInSongs);
            });
            this.setState({songs: songs});
        });
    },
    getInitialState: function(){
        return {
            currentIndex: 0,
            songs: [],
            playList: []
        };
    },
    componentDidMount: function(){
        this.getSongs((sngs)=>{
            this.setState({songs: sngs});
            this.buildDefaultPlaylist();
        });
    },
    componentDidUpdate: function(prev){
        if(prev.actionFromPlayer.index != this.props.actionFromPlayer.index){
            this.playByIndex(this.props.actionFromPlayer.index);
        }
    },
    render: function(){
        var songs = this.state.songs;
        var songItems = songs.map(function(song){
            return (
                <SongItem key={song.id} song={song} play={this.playItem} showOnTop={this.showOnTop}/>
            );
        }.bind(this));
        return(
            <div id="music">
                <ul className="listMusic">
                    {songItems}
                </ul>
            </div>
        );
    }
});
