
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
    getInitialState: function(){
        /*
            should be able to store and update the state of all uploading data.
            And do display it Nicely. Actually the div display the state of the uplaod should be a component.
        */
        return { pct: null };
    },
    componentDidMount: function(){
        var dZ = $('.dropZone'),
            ht = $('html'),
            rmClass = function(){
                dZ.removeClass('willDrop');
            },
            putClass = function(){
                dZ.addClass('willDrop');
            };

        ht.on({
            dragenter: putClass,
            dragover: function(){
                if(!dZ.hasClass('willDrop'))
                    putClass();
            }
        });
        dZ.on({
            dragleave: rmClass,
            drop: rmClass
        });
    },
    onDrop: function(files){
        files.forEach(function(file) {
            request.post(this.props.url)
            .attach('file', file, file.name)
            .on('progress', function(e){
                this.setState({pct: e.percent});
            }.bind(this))
            .on('error', function(err){
                console.log(err);
            })
            .end(function(res){
                console.log('res from request.');
                console.log(res);
            });
        }.bind(this));
    },
    render: function(){
        return(
            <div>
                <Dropzone onDrop={this.onDrop} className="dropZone">
                  <div className="innerDrop">Drop stuff!</div>
                </Dropzone>
                <div className="uploadStatus">
                    done at {this.state.pct} %.
                </div>
            </div>
        );
    }
});

var Layout = React.createClass({
    url: "/api/music",
    uploadAPI: "/api/upload",
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
    byDate: function(a, b){
        if(a.date > b.date) return -1;
        else return 1;
    },
    getMusicFromAPI: function(){
        $.get(this.url, function(data){
            data.music = data.music.sort(this.byDate);
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
                    path={this.state.path}
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
