var React       = require('react'),
    $           = require('jquery');

var Controls = React.createClass({
    render: function(){
        var img = (this.props.playing) ? 'img/ic_pause_black_24dp.png' : 'img/ic_play_arrow_black_24dp.png';
        return(
            <div className="ctrls">
                <img src="img/ic_skip_previous_black_24dp.png" alt="prev" onClick={this.props.playPrev}/>
                <img src={img} alt="pause_play" className="pause_play" onClick={this.props.changePlay}/>
                <img src="img/ic_skip_next_black_24dp.png" alt="next" onClick={this.props.playNext}/>
                <img src="img/ic_shuffle_black_24dp.png" alt="shuffle" onClick={this.props.changePlay}/>
            </div>
        );
    }
});

var Meta = React.createClass({
    render: function(){
        return(
            <div className="metaPlaying">
                <div className="curPlaying">
                    <span  className="itemPlayingMeta">{this.props.song.title}</span>
                    <span className="itemPlayingMeta"><i>From: </i>{(this.props.song.artist) ? this.props.song.artist[0] : ''}</span>
                    <span className="itemPlayingMeta"><i>Album: </i>{this.props.song.album || ''}</span>
                </div>
                <img className="metaPlayingImg" src={'http://azerty.gq' + (this.props.song.picture || '/img/default_cover.png')} alt="cover"/>
            </div>
        );
    }
});

var TimeLine = React.createClass({
    canMoveAuto : true,
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
        this.total = this.prettytime(this.props.total);
        if(this.canMoveAuto)
            this.width = ~~this.props.cur * 100 / this.props.total;
    },
    changeTime: function(e){
        var timeElem = $('.timeLine');
        var totW = timeElem.width();
        var curW = e.pageX - timeElem.offset().left;
        var newTime = curW * this.props.total / totW;
        this.props.moveToTime(newTime);
    },
    mouseDown: function(){
        this.canMoveAuto = false;
        var c = $('.curElapsed');
        var ht = $('html');
        var timeElem = $('.timeLine');
        var elaps = $('.Elapsed');
        c.css('transition-duration', '0.5s');
        c.css('transform', 'scale(1.5)');
        ht.on('mousemove', function(e){
            var totW = timeElem.width();
            var curW = e.pageX - timeElem.offset().left;
            var newW = ~~curW * 100 / totW;
            if(newW < 0) newW = 0;
            if(newW > 100) newW = 100;
            elaps.width(newW + '%');
            ht.bind('mouseup', function(evt){
                c.css('transform', 'scale(1)');
                ht.unbind(e);
                ht.unbind(evt);
                ht.off(e);
                this.canMoveAuto = true;
                // avoid to much mess due to multi combo fracking click ...
                setTimeout(function(){c.unbind(); c.off(); ht.unbind(); ht.off();},500);
            }.bind(this));
        }.bind(this));
    },
    render: function(){
        return(
            <div className="wrapTimeLine">
                <span className="time cur">{this.cur}</span>
                <div className="timeLine" onClick={this.changeTime}>
                    <span className="Elapsed" style={{width:this.width + '%'}} ></span>
                    <span className="curElapsed" onMouseDown={this.mouseDown} ></span>
                </div>
                <span className="time tot">{this.total}</span>
            </div>
        );
    }
});

var Player = React.createClass({
    getInitialState: function(){
        return {
            currentTime: 0,
            totalTime: 0,
            playing: false,
            shuffle: false,
            meta: {},
        };
    },
    changePlay: function(){
        if(this.state.playing)
            this.player.pause();
        else
            this.player.play();
    },
    componentDidMount: function(){
        this.player = new Audio();
        this.player.onloadedmetadata = function(){
            this.setState({totalTime: ~~this.player.duration});
        }.bind(this);
        this.player.ontimeupdate = function(){
            this.setState({currentTime: ~~this.player.currentTime});
        }.bind(this);
        this.player.onpause = function(){
            this.setState({playing: false});
        }.bind(this);
        this.player.onplay = function(){
            this.setState({playing: true});
        }.bind(this);
        this.player.onended = function(){
            this.props.next();
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
            this.player.src = this.props.path;
            this.player.type = this.props.type;
            this.player.pause();
            this.player.load();
            this.player.oncanplaythrough = this.player.play();
            this.setState({
                playing: true,
                meta: this.props.meta
            });
        }
    },
    move: function(desiredTime){
        if(this.player)
            this.player.currentTime = desiredTime;
    },
    render: function(){
        return(
            <div id="player">
                <Meta song={this.state.meta}/>
                <Controls
                    cur={this.state.currentTime}
                    total={this.state.totalTime}
                    playing={this.state.playing}
                    changePlay={this.changePlay}
                    playNext={this.props.next}
                    playPrev={this.props.prev}
                />
                <TimeLine
                    cur={this.state.currentTime}
                    total={this.state.totalTime}
                    moveToTime={this.move}
                />
            </div>
        );
    }
});

module.exports = {
    Player: Player
};