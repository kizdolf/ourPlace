var
    React       = require('react'),
    $           = require('jquery');

var User = React.createClass({
    switchRoot: function(){
        var newStatus = !this.props.data.root;
        var id = this.props.data.id;
        $.post('/api/root/update', {id: id, update: {root: newStatus}}, (ret)=>{
            if(ret !== false) this.props.refresh();
        });
    },
    delete: function(){
        var id = this.props.data.id;
        $.ajax({
            url: '/api/root/' + id,
            type: 'DELETE',
            success: (ret)=>{
                console.log(ret);
                if(ret !== false) this.props.refresh();
            }
        });
    },
    render: function(){
        return(
            <li>
                <b>{this.props.data.pseudo} </b>
                is root? : {this.props.data.root ? 'Yes' : 'No' }<br/> <button onClick={this.switchRoot}>Switch root status</button><br/>
            <button onClick={this.delete}>Delete</button>
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
            console.log(res);
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
            <div>
                <h2>Root stuff. yup</h2>
                <span id="msg"></span>
                <div>
                    <p>Create user here:</p>
                    <input type="text" placeholder="Pseudo" id="pseudo"/>
                    <input type="text" placeholder="Password" id="pass"/>
                    <button onClick={this.create}>Create</button>
                </div>
                <ul>
                    {mountUsers}
                </ul>
            </div>
        );
    }
});
