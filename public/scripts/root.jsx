var
    React       = require('react'),
    moment      = require('moment'),
    highlight   = require('./highlight.js'),
    $           = require('jquery');

var User = React.createClass({
    getInitialState: function(){
        return {
            show: false
        }
    },
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
    show: function(){
        this.props.show(this.props.data.id);
    },
    render: function(){
        return(
            <li className="userItem">
                <h3>{this.props.data.pseudo}</h3>
                <b>Played tracks: {this.props.data.totalSongs}</b>
                <p>
                    is root? : {this.props.data.root ? 'Yes' : 'No' }
                </p>
                <button className="btn btn-default btn-sm" onClick={this.switchRoot}>
                    Switch status
                </button>
                <button className="btn btn-warning btn-sm" onClick={this.delete}>Delete</button>
                <br/><small onClick={this.show}>{this.props.data.id}</small>
            </li>
        );
    }
});

exports.RootBox = React.createClass({
    logsPage: 0,
    componentWillUnmount: function(){
        this.socket = null;
    },
    getInitialState: function(){
        return {
            users: [],
            logs: [],
            page: 0,
            focus: ''
        };
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
        this.logsPage = 0;
        this.getLogs();
    },
    componentDidMount: function(){
        this.amIRoot((amI)=>{
            if(!amI) window.location.href = '/';
            this.getAllUsers();
            this.getLogs();
            this.socket = io({secure: true});
        });
    },
    byDate: function(a, b){
        if(a.when > b.when) return -1;
        else return 1;
    },
    getLogs: function(){
        var url = '/api/root/logs/' + this.logsPage;
        $.get(url, function(data){
            var logs = data.logs,
                page = data.page;
            if(logs.length == 0 && this.logsPage != 0){
                console.log('set to 0');
                this.logsPage = 0;
                this.getLogs();
            }else{
                // logs = logs.sort(this.byDate);
                this.setState({logs: logs, page: page});
                this.logsPage = page;
            }
            this.show(this.state.focus);
        }.bind(this));
    },
    create: function(){
        var pseudo = $('#pseudo').val();
        var pass = $('#pass').val();
        var mail = $('#mail').val();
        console.log('create ' + pseudo + ' with ' + pass);
        if(pseudo.length <= 3 || pass.length <= 3){
            $('#msg').html('not long enough. min 3 char');
        }else{
            $('#msg').html('');
            $.post('/api/root/new', {pseudo: pseudo, password: pass, email: mail}, function(res){
                console.log(res);
                this.refresh();
            }.bind(this));
        }

    },
    nextLogs: function(){
        this.logsPage++;
        this.getLogs();
    },
    prevLogs: function(){
        var prev = this.logsPage -1;
        if(prev < 0) prev = 0;
        this.logsPage = prev;
        this.getLogs();
    },
    show: function(id){
        this.setState({focus : id});
        console.log(id);
        var logs = $('.oneLog');
        logs.removeHighlight();
        if (id) logs.highlight(id);
    },
    render: function(){
        var mountUsers = this.state.users.map((user)=>{
            return(
                <User data={user} key={user.id} refresh={this.refresh} show={this.show}/>
            );
        });
        var mountLogs = this.state.logs.map((log)=>{
            return(
                <div key={log.id} className="oneLog">
                    <span><b>{log.log}</b></span>  |  
                    <span>{moment(log.when).format("dddd, MMMM Do YYYY, h:mm:ss a")}</span>
                    <pre className="code">{JSON.stringify(log, null, '\t')}</pre>
                </div>
            );
        });
        return (
            <div className="rootStuff">
                <h2>Root stuff. yup</h2>
                <button className="btn btn-default btn-sm" onClick={this.refresh}>Refresh</button>
                <span id="msg"></span>
                <div>
                    <p>Create user here:</p>
                    <input type="text" placeholder="Pseudo" id="pseudo"/><br/>
                    <input type="text" placeholder="Password" id="pass"/><br/>
                    <input type="email" placeholder="Email (optional)" id="mail"/><br/>
                    <button className="btn btn-default btn-sm" onClick={this.create}>Create</button>
                </div>
                <ul className="listUser">
                    {mountUsers}
                </ul>
                <hr/><h3>Logs en base:</h3>
                <button className="btn btn-default btn-sm" onClick={this.refresh}>Refresh</button>
                <button className="btn btn-default btn-sm" onClick={this.prevLogs}>Previous Page</button>
                <button className="btn btn-default btn-sm" onClick={this.nextLogs}>Next Page</button>
                <span>current Page: {this.state.page}</span>
                <div id="logs">{mountLogs}</div>
            </div>
        );
    }
});
