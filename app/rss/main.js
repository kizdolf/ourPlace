'use strict';

var feed = require('feed-read');

var feeds = [
    'https://reflets.info/feed/',
    'http://www.numerama.com/feed/',
    'http://www.futura-sciences.com/rss/espace/actualites.xml',
    'http://www.futura-sciences.com/rss/espace/dossiers.xml',
    'http://rss.nouvelobs.com/c/32581/fe.ed/www.sciencesetavenir.fr/espace/rss.xml',
    'http://rss.nouvelobs.com/c/32581/fe.ed/www.sciencesetavenir.fr/high-tech/rss.xml'
];

var nbFeeds = feeds.length;
var done = 0;

var getRss = (req, res)=>{
    if(done === 0){
        var articles = {};
        feeds.forEach((url)=>{
            feed(url, (e, ul)=>{
                done++;
                if(e){
                    console.log(e);
                }else{
                    ul.forEach((li)=>{
                        if(!articles[li.feed.name])
                            articles[li.feed.name] = [];
                        articles[li.feed.name].push(li);
                    });
                }
                if(done == nbFeeds){
                    done = 0;
                    res.json(articles);
                }
            });
        });
    }
};

module.exports = {
    getRss: getRss
};
