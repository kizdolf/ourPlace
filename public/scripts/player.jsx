var React       = require('react'),
    $           = require('jquery');


var Controls = React.createClass({
    prettytime: function(time){
        var minutes = Math.floor(time / 60);
        var seconds = time % 60;
        var pad_left = function(string,pad,length) {
            return (new Array(length+1).join(pad)+string).slice(-length);
        };
        return(pad_left(minutes,'0',2)+':'+pad_left(seconds,'0',2));
    },
    componentDidUpdate: function(){
        this.cur = this.prettytime(this.props.cur);
    },
    render: function(){
        var img = (this.props.playing) ? 'img/ic_pause_black_24dp.png' : 'img/ic_play_arrow_black_24dp.png';
        return(
            <div className="ctrls">
                <span>{this.cur}</span>
                <img src="img/ic_skip_previous_black_24dp.png" alt="prev" />
                <img src={img} alt="pause_play" className="pause_play" onClick={this.props.changePlay}/>
                <img src="img/ic_skip_next_black_24dp.png" alt="next"/>
                <img src="img/ic_shuffle_black_24dp.png" alt="next" />
            </div>
        );
    }
});

var Player = React.createClass({
    getInitialState: function(){
        return {
            currentTime: 0,
            playing: false,
            shuffle: false
        };
    },
    changePlay: function(){
        if(this.state.playing)
            this.player.pause();
        else
            this.player.play();
    },
    componentDidMount: function(){
        this.player = $('#audioPlayer')[0];
        this.player.ontimeupdate = function(){
            this.setState({currentTime: ~~this.player.currentTime});
        }.bind(this);
        this.player.onpause = function(){
            this.setState({playing: false});
        }.bind(this);
        this.player.onplay = function(){
            this.setState({playing: true});
        }.bind(this);
        this.audioSource = $('#audioSource');
    },
    componentDidUpdate: function(prev){
        /*Something unfortunate here:
            MusicList change is state each two seconds.
            Changing this state also change the props here, even they remain the same.
            e.g : before : 'coucou', after 'coucou'. DOM is not updated, props are. (thanks react)
            So componentDidUpdate is called. But we don't want to touch to the audio element. So "if" ..
        */
        if(prev.path != this.props.path){
            this.audioSource.attr('src', this.props.path);
            this.audioSource.attr('type', this.props.type);
            this.player.pause();
            this.player.load();
            this.player.oncanplaythrough = this.player.play();
            this.setState({playing: true});
        }
    },
    render: function(){
        return(
            <div id="player">
                <audio controls id="audioPlayer">
                    <source src={this.props.path} type={this.props.type} autoPlay id="audioSource" />
                    Your browser does not support the audio element.
                </audio>
                <Controls
                    cur={this.state.currentTime}
                    playing={this.state.playing}
                    changePlay={this.changePlay}
                    playNext={this.props.next}
                    playPrev={this.props.prev}
                />
            </div>
        );
    }
});

module.exports = {
    Player: Player
};
