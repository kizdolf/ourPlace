var
    React       = require('react'),
    $           = require('jquery');

var Note = React.createClass({
    render: function(){
        var setContent = function(content){
            return {__html: content};
        };
        return(
            <li className="oneNote">
                <span className="date">{this.props.data.date}</span>
                <div className="contentNote" dangerouslySetInnerHTML={setContent(this.props.data.content)} />
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
                <Note data={note} key={note.name}/>
            );
        });
        return(
            <div id="Notes">
                <ul className="notes">
                    {mountNotes}
                </ul>
            </div>
        );
    }
});
