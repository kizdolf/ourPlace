'use strict';

var
    React       = require('react'),
    moment      = require('moment'),
    $           = require('jquery');

var ItemStream = React.createClass({
    stream: function(){
        console.log('stream func');
        console.log(this.props.item);
        if(this.props.item.mimetype == 'inode/directory'){
            $.get('/api/streams/list/' + this.props.item.path, (data)=>{
                console.log('more:');
                console.log(data);
            });
        }else{
            $.get('/api/streams/stream/' +this.props.item.path, function(data){
                console.log('stream file');
                console.log(data);
                var win = window.open(data.path, '_blank');
                win.focus();
            }.bind(this));
        }
    },
    render: function(){
        return(
            <div className="itemCls stream" onClick={this.stream}>{this.props.item.name}</div>
        );
    }
});

var StreamBox = React.createClass({
    getInitialState: function(){
        return({
            files: [],
            current: {}
        });
    },
    componentDidMount: function() {
        $.get('/api/streams/list', (data)=>{
            if(data.list){
                var files = data.list;
                if(!files.error){
                    this.setState({files: files});
                }
            }
        });
    },
    render: function(){
        var i = 0;
        var items = this.state.files;
        var mountItems = items.map((file)=>{
            ++i;
            return(
                <ItemStream item={file} key={i} play={this.play}/>
            );
        });
        return(
            <div className="streams">
                <h2>Streams!</h2>
                {mountItems}
            </div>
        );
    }
});

module.exports = {
    StreamBox: StreamBox
};
