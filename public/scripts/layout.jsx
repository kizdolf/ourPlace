
var React       = require('react'),
    Link        = require('react-router').Link,
    $           = require('jquery'),
    Player      = require('./player.jsx').Player,
    Dropzone    = require('react-dropzone'),
    request     = require('superagent');

var Menu = React.createClass({
    render: function(){
        return (
            <div>
                <ul>
                    <li><Link to="/notes">Notes</Link></li>
                    <li><Link to="/">Music</Link></li>
                </ul>
            </div>
        );
    }
});

var Upload = React.createClass({
    componentDidMount: function(){
        $('html').on('dragenter', function(){
            $('.dropZone').addClass('willDrop');
        });
        $('html').on('dragover', function(){
            if(!$('.dropZone').hasClass('willDrop'))
                $('.dropZone').addClass('willDrop');
        });
        $('.dropZone').on('dragleave', function(){
            $('.dropZone').removeClass('willDrop');
        });
        $('.dropZone').on('drop', function(){
            $('.dropZone').removeClass('willDrop');
        });
    },
    onDrop: function(files){
        files.forEach(function(file) {
            request.post(this.props.url)
            .attach('file', file)
            .on('progress', function(e){
                console.log('done at ' + e.percent + ' %');
            })
            .on('error', function(err){
                console.log(err);
            })
            .end(function(res){
                console.log('res from request.');
                console.log(res);
            });
        }.bind(this));
        console.log(files);
    },
    render: function(){
        return(
            <div>
                <Dropzone onDrop={this.onDrop} className="dropZone">
                  <div className="innerDrop">Drop stuff!</div>
                </Dropzone>
            </div>
        );
    }
});

var Layout = React.createClass({
    url: "/api/music",
    uploadAPI: "api/upload",
    inter: 20000,
    getInitialState: function(){
        return {
            musics: [],
            type: '',
            path: '',
            index: 0,
            current: {}
        };
    },
    getMusicFromAPI: function(){
        $.get(this.url, function(data){
            this.setState({musics: data.music});
        }.bind(this));
    },
    componentDidMount: function(){
        this.getMusicFromAPI();
        this.load = setInterval(this.getMusicFromAPI, this.inter);
    },
    componentWillUnmount: function(){
        clearInterval(this.load);
    },
    play: function(path, type, meta){
        this.setState({path: path, type: type, current: meta});
        this.state.musics.forEach(function(music, i){
            if(music.path === path){
                this.setState({index: i});
                return;
            }
        }.bind(this));
    },
    next: function(){
        var n = (this.state.musics[this.state.index + 1]) ? this.state.musics[this.state.index + 1] :  this.state.musics[0];
        this.play(n.path, n.type, n.meta);
    },
    prev: function(){
        var n =(this.state.index > 0) ? this.state.musics[this.state.index - 1] : this.state.musics[this.state.musics.length - 1];
        this.play(n.path, n.type, n.meta);
    },
    render: function(){
        return (
            <div>
                <Upload url={this.uploadAPI} />
                <Player
                    path={'http://azerty.gq' + this.state.path}
                    type={this.state.type}
                    meta={this.state.current}
                    next={this.next}
                    prev={this.prev}
                />
                <Menu />
                    {
                        this.props.children &&
                        React.cloneElement(this.props.children,
                            {

                                play: this.play,
                                prev: this.prev,
                                next: this.next,
                                musics: this.state.musics,
                            }
                        )
                    }
            </div>
        );
    }
});

module.exports = {
    Layout: Layout
};
