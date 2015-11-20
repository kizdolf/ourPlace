var
    React       = require('react');

exports.NoteBox = React.createClass({
    render: function(){
        return(
            <div>
                <ul>
                    <li>Note0</li>
                    <li>Note1</li>
                    <li>Note2</li>
                    <li>Note3</li>
                </ul>
            </div>
        );
    }
});
