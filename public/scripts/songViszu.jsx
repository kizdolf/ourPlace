'use strict';
var React       = require('react'),
    $           = require('jquery');


exports.Visualizer = React.createClass({
    getInitialState: function(){
        return({
            url: '',
            data: null
        });
    },
    getSong: function(){
        var url = this.props.url;
        var request = new XMLHttpRequest();
        request.open('GET', url, true);
        request.responseType = "arraybuffer";

        request.onload = function() {};
    },
    componentDidMount: function(){
        this.getSong();
    },
    render: function(){
        return(
            <div id="songViszu">
                <button onClick={this.start}>Play song in the Visualizer</button>
                <div id="visualizer">
                    <h3>Soooonn</h3>
                </div>
            </div>
        );
    }
});
