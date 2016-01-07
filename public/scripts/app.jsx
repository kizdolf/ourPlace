var
    React       = require('react'),
    ReactDOM    = require('react-dom'),
    Router      = require('react-router').Router,
    Route       = require('react-router').Route,
    IndexRoute  = require('react-router').IndexRoute,
    Layout      = require('./layout.jsx').Layout,
    NoteBox     = require('./note.jsx').NoteBox,
    RssBox     = require('./rss.jsx').RssBox,
    RootBox     = require('./root.jsx').RootBox,
    MusicBox    = require('./music.jsx').MusicBox;

ReactDOM.render((
    <Router>
        <Route path="/" component={Layout}>
            <IndexRoute component={MusicBox} />
            <Route path="rss" component={RssBox} />
            <Route path="notes" component={NoteBox} />
            <Route path="root" component={RootBox} />
            <Route path="*" component={MusicBox} />
        </Route>
    </Router>
), document.getElementById('app'));
