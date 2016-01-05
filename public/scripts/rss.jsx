var
    React       = require('react'),
    $           = require('jquery');

var Feed = React.createClass({
    createMarkup: function(inner){
        return{__html: inner};
    },
    toggleVisi: function(e){
        $(e.target.parentElement).find('.oneFeed').toggleClass('full');
    },
    render: function(){
        var i = 0;
        var mountArticles = this.props.feed.articles.map((article)=>{
            return(
                <li key={i++} className="oneArticle">
                    <a href={article.link} target="_blank">{article.title}</a><br/>
                    <span className="content" dangerouslySetInnerHTML={this.createMarkup(article.content)}>
                    </span>
                </li>
            );
        });
        return(
            <div className="feed">
                <h3 onClick={this.toggleVisi}>{this.props.feed.name}</h3>
                <div className="oneFeed">{mountArticles}</div>
            </div>
        );
    }
});

exports.RssBox = React.createClass({
    urlApi: '/api/rss',
    getRssFromAPI: function(){
        var feeds = [];
        $.get(this.urlApi, function(data){
            for (var name in data) {
                if (data.hasOwnProperty(name)) {
                    feeds.push({name: name, articles: data[name]});
                }
            }
            this.setState({feeds: feeds});
        }.bind(this));
    },
    getInitialState: function(){
        return {
            feeds: []
        };
    },
    componentDidMount: function(){
        this.getRssFromAPI();
        this.load = setInterval(this.getRssFromAPI, 25000);
    },
    render: function(){
        var i =0;
        var mountFeeds = this.state.feeds.map((feed)=>{
            return( <Feed feed={feed} key={i++}/>);
        });
        return(
            <div id="rss">
                <div className="feeds">
                    {mountFeeds}
                </div>
            </div>
        );
    }
});
