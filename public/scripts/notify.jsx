'use strict';
var React       = require('react');

var Notify = React.createClass({
	componentDidUpdate: function(){
		if(this.props.can && this.props.what.meta){
			this.notify(this.props.what);
		}
	},
	notify: function(what){
		var html = '';
		html += '<h3>' + what.meta.title + '</h3>';
		console.log(what);
		console.log(html);
        new Notification(html);
    },
    render: function(){
    	return (<span></span>);
    }
});

module.exports = {
	Notify: Notify
};
