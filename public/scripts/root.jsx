var
    React       = require('react'),
    $           = require('jquery');


exports.RootBox = React.createClass({
    amIRoot: function(cb){
        $.get('/api/root/amI', (res)=>{
            cb(res);
        });
    },
    getAllUsers: function(){
        $.get('/api/root/users/all', (res)=>{
            console.log(res);
        });
    },
    componentDidMount: function(){
        this.amIRoot((amI)=>{
            if(!amI) window.location.href = '/';
            this.getAllUsers();
        });
    },
    render: function(){
        return (
            <div>
                
            </div>
        );
    }
});