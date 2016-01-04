'use strict';
var React = require('react'),
    Player = require('./player.jsx').Player,
    Link = require('react-router').Link;


var Menu = React.createClass({
    render: function(){
        return (
            <div className="WrapperMenu">
                <ul className="links">
                    <li className="oneLink"><Link to="/notes">Notes</Link></li>
                    <li className="oneLink"><Link to="/">Music</Link></li>
                </ul>
            </div>
        );
    }
});

exports.Layout = React.createClass({
    playItem: function(id){
        var playing = {is: true, id: id};
        this.setState({playing: playing});
    },
    doFromPlayer: function(kind){
        switch (kind) {
            case 'default':
                this.setState({
                    actionFromPlayer : {index: 0}
                });
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
    getInitialState: function(){
        return{
            playing: {is: false, id: null},
            actionFromPlayer : {index: null}
        };
    },
    render: function(){
        return(
            <div>
                <Player
                    playing={this.state.playing}
                    doFromPlayer={this.doFromPlayer}

                />
                <Menu/>
                {
                    this.props.children &&
                    React.cloneElement(this.props.children,
                        {
                            playing: this.state.playing,
                            actionFromPlayer: this.state.actionFromPlayer,
                            playItem: this.playItem,
                            doFromPlayer: this.playFromPlayer,
                            fromPlayer: this.state.fromPlayer
                        }
                    )
                }
                {/*<Upload/>
                <MicroMenu/>
                <TopScreen/>*/}
            </div>
        );
    }
});
