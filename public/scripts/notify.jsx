'use strict';
var React       = require('react');

var Notify = React.createClass({
    getInitialState: function(){
        return {
            id: '',
            notifs : []
        };
    },
    componentDidUpdate: function(){
        if(this.props.can && this.props.what.meta){
            if(this.props.what.id != this.state.id){
                this.notify(this.props.what);
                var id = this.props.what.id;
                this.setState({id: id});
            }
        }
    },
    notify: function(what){
        this.state.notifs.forEach((notif)=>{
            notif.close();
        });
        var options = {
            body: what.meta.title,
            icon: what.meta.picture || '/img/default_cover.png',
        },
        notif = new Notification('Playing:', options),
        notifs = this.state.notifs;
        notifs.push(notif);
        this.setState({notifs: notifs});
        setTimeout(()=>{
            notif.close();
        },3500);
    },
    render: function(){
        return false;
    }
});

module.exports = {
    Notify: Notify
};
