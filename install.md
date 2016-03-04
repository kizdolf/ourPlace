# How to install. Full procedure.

> Note: I would like to have a Docker container ready to deploy. But I don't have it yet. 

## Install dependencies.
 * youtube-dl : https://github.com/rg3/youtube-dl
 * avconc : install package libav-tools (on debian alike system.)
 * rethinkdb : http://rethinkdb.com/docs/install/

## Check versionning.
 * node version 4 minimum (I'm running 5.7.1 at the moment)

 > You should use nvm to manage node versions with ease: 
 
 ```
    npm install -g nvm
    nvm install 5.7.1
    nvm alias default 5.7.1
    source ~/.zshrc (or ~/.bashrc or whatever you use)
 ```

## Install npm dependencies.
```
    npm i -g forever
    npm i -g webpack
```

## Rethink finalisation. 

go to  **/etc/rethinkdb/instances.d/**
copy default conf (located at **/etc/rethinkdb/default.conf.sample**) and update it. 
Rename it as **instance1.conf** (or whatever name you want)
restart rethinkdb 
```
sudo /etc/init.d/rethinkdb restart
```
> Default setting prevent any external connection to rethinkdb. Even to the dashboard. We don't give a shit when we're working on localhost (_dashboard avaible at localhost:8080 by default_) but it's not that nice when you're running it on a server. So here it is: https://www.rethinkdb.com/docs/security/ 
You should really read that up. Or at least run the iptables commands.

Then create tables. Trough rethinkdb dashboard, I'll probably make a script soon, in the while go to your rethinkdb dashboard, tab **Data Explorer**. 

You'll have to create a dataBase first, figure out that, then the tables.
the table list is in the configuration file. There is just missing the indexes. I'll add them soon.
```
r.db('dbName').tableCreate('tableName', {primaryKey: 'colName'})
r.db('dbName').table('tableName').indexCreate('indexColomun')

```
as for now there is the table list: 
```

[

    "logRequests" , PK: id (default)
    "logs" , PK: id (default), index: "timestamp"
    "notes" , PK: id (default)
    "playlists" , PK: uuid
    "session" , PK: id (default), index: "expires" (should be created automatically by the module)
    "share" , PK: token
    "songs" , PK: id (default)
    "userStats" , PK: uuid 
    "users" , PK: id (default)

]
```
## Finish the install and run!
```
cd /path/to/ourPlace
npm install
```
 * create **app/criticalConf.js** and populate it like the exemple file.
 * update the **app/config.js** file with your info/choices
```
forever start index.js
```
enjoy.
