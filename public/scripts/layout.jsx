
var React       = require('react'),
    Link        = require('react-router').Link,
    $           = require('jquery'),
    Player      = require('./player.jsx').Player;

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

var Layout = React.createClass({
    url: "/api/music",
    inter: 2000,
    getInitialState: function(){
        return {
            musics: [],
            type: '',
            path: '',
            index: 0
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
    play: function(path, type){
        this.setState({path: path, type: type});
    },
    next: function(){

    },
    prev: function(){

    },
    render: function(){
        return (
            <div>
                <Player path={'http://azerty.gq' + this.state.path} type={this.state.type}/>
                <Menu />
                    {
                        this.props.children &&
                        React.cloneElement(this.props.children,
                            {

                                play: this.play,
                                prev: this.prev,
                                next: this.next,
                                musics: this.state.musics
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
