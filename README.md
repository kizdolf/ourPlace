# ourPlace

> Node / React / Rethinkdb application as a small but personnal cloud. Under development. 

###__NOTE__ 
> This repository was private, was meant to stay private. But hey, it's now public. I tried to supress critical files from repo, but it's not as easy as it look. So the tool (wonderfull) : https://rtyley.github.io/bfg-repo-cleaner/ was more than helpful.
Maybe there is somewhere some traces of database password and stuff, I changed them all anyway. 

*before running it:*

**[the full install steps are here (not completely finished)](https://github.com/kizdolf/ourPlace/blob/master/install.md)**

 * create app/criticalConf.js file, populate it like in the [example file](https://github.com/kizdolf/ourPlace/blob/master/app/example.criticalConf.js).
 * Check this to know a bit more: https://www.rethinkdb.com/docs/security/
 * create the tables on rethinkDB. list in [app/config.js](https://github.com/kizdolf/ourPlace/blob/master/app/config.js#L44) => exports.rethink.tables.

it should be accessible visible here: http://azerty.gq   (*but it require a login, which you have to ask me personnaly.*)

**Using what else?**

 * [freebox-node](https://github.com/kizdolf/freebox-node) **in dev (twice)** used to communicate with a freebox.
 * socket.io : because sockets. And to not overload the api for small data.
 * express-session && socket.io-express-session to manage session, session are stored in a rethinkdb table, avaible from request or socket. <3
 * Table listener from rethinkdb. It tell me when something happen (and what) on a table. Allow to react properly. 
 * youtube-dl : under the hood, it's used to download youtube song, extract metadata, image etc.
 * webpack : just one file to serve, and help to dev and versions.
 * mandrill: to send mails. An Api key is needed. Sorry, but if you want to change mail provider, you'll have to code it.

### What's here already? 

* Music: Upload it, play it, edit it.
* Notes: Because I needed it badly. 
* Rss: under light construction. (slow and dumb as hell)
* Usuable from a mobile. (even if not optimal) 
* Admin interface (alt+enter). Only if your 'root'. 
* Nothing more. See the next section for the rest. 

### What's need to be done in a later future?

* Tests. I don't do tests. I should. I should use tools for this. I should, but I don't...
* CSS. I am not good in css. I do not like css. The existing one is... working at least.
* Streaming managment. As the moment a user start to listen a song, I would like to store in the user device the whole playlist (at least the x nexts songs) to allow the user to listen music when network is down. And to retrieve this data even after a reload of the page. 
* Documents:  store stuff you want to download later somewhere else. Store stuff you want to share. Do not store personnal stuff. Not if you share this cloud with others people. 
* Live stats of listening trends (when do you listen the more music, and what)
* Sharing. Under dev. Share a music anyone can listen, for a period or a number of times.

P.s: this project is as well a lab time to time...
