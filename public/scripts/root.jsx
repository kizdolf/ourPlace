var
    React       = require('react'),
    $           = require('jquery');

var User = React.createClass({
    switchRoot: function(){
        var newStatus = !this.props.data.root;
        var id = this.props.data.id;
        $.post('/api/root/update', {id: id, update: {root: newStatus}}, (ret)=>{
            if(ret !== false) this.props.refresh();
            if(ret.err){
                $('#msg').html(ret.err);
            }
        });
    },
    delete: function(){
        var id = this.props.data.id;
        $.ajax({
            url: '/api/root/' + id,
            type: 'DELETE',
            success: (ret)=>{
                if(!ret.err) this.props.refresh();
                else{
                    $('#msg').html(ret.err);
                }
            }
        });
    },
    render: function(){
        return(
            <li>
                <h3>{this.props.data.pseudo}</h3>
                <b>Played tracks: {this.props.data.played}</b>
                <p>
                    is root status? : {this.props.data.root ? 'Yes' : 'No' }
                    <button className="btn btn-default btn-sm" onClick={this.switchRoot}>
                        Switch status
                    </button>
                </p>
                <button className="btn btn-warning btn-sm" onClick={this.delete}>Delete</button>
            </li>
        );
    }
});

exports.RootBox = React.createClass({
    getInitialState: function(){
        return {users: [] };
    },
    amIRoot: function(cb){
        $.get('/api/root/amI', (res)=>{
            cb(res);
        });
    },
    getAllUsers: function(){
        $.get('/api/root/users/all', (users)=>{
            this.setState({users: users});
        });
    },
    refresh: function(){
        this.getAllUsers();
    },
    componentDidMount: function(){
        this.amIRoot((amI)=>{
            if(!amI) window.location.href = '/';
            this.getAllUsers();
        });
    },
    create: function(){
        var pseudo = $('#pseudo').val();
        var pass = $('#pass').val();
        console.log('create ' + pseudo + ' with ' + pass);
        if(pseudo.length <= 3 || pass.length <= 3){
            $('#msg').html('not long enough. min 3 char');
        }else{
            $('#msg').html('');
            $.post('/api/root/new', {pseudo: pseudo, password: pass}, function(res){
                console.log(res);
                this.refresh();
            }.bind(this));
        }
    },
    render: function(){
        var mountUsers = this.state.users.map((user)=>{
            return(
                <User data={user} key={user.id} refresh={this.refresh}/>
            );
        });
        return (
            <div className="rootStuff">
                <h2>Root stuff. yup</h2>
                <button className="btn btn-default btn-sm" onClick={this.refresh}>Refresh</button>
                <span id="msg"></span>
                <div>
                    <p>Create user here:</p>
                    <input type="text" placeholder="Pseudo" id="pseudo"/>
                    <input type="text" placeholder="Password" id="pass"/>
                    <button className="btn btn-default btn-sm" onClick={this.create}>Create</button>
                </div>
                <ul>
                    {mountUsers}
                </ul>
            </div>
        );
    }
});
