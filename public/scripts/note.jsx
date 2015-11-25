var
    React       = require('react'),
    $           = require('jquery');

var Note = React.createClass({
    render: function(){
        return(
            <li>
                Note!
            </li>
        );
    }
});

exports.NoteBox = React.createClass({
    getInitialState: function(){
        return {
            notes: [],
        };
    },
    getNotesFromAPI: function(){
        $.get(this.props.noteAPI, function(data){
            this.setState({notes: data});
        }.bind(this));
    },
    componentDidMount: function(){
        this.getNotesFromAPI();
        this.load = setInterval(this.getNotesFromAPI, 25000);
    },
    render: function(){
        var mountNotes = this.state.notes.map((note)=>{
            return(
                <Note data={note} />
            );
        });
        return(
            <div>
                <ul>
                    {mountNotes}
                </ul>
            </div>
        );
    }
});
