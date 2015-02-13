# Rallly

Rallly is a free collaborative scheduling service that helps you and your friends vote on a date to host an event.

## Dependencies

To run Rallly you will need:

* MongoDB
* Node.js + npm
* Bower

If you're going to do some development on Rallly you will need to install [gulp.js](http://gulpjs.com/).


## Setup

Clone the repository on your machine and set the current directory to the root of the repository

```bash
git clone git@github.com:lukevella/Rallly.git
cd Rallly
```
Run the install script. You may need to adjust the permissions of the file to execute (`chmod 775 install.sh`). This will install the node and bower dependencies and create a sample configuration file.

```bash
./install.sh
```

### Configuration
Open up `config/main.js` and fill in the parameters. 

```javascript
    app.set('port', 3000);
    app.set('siteUrl', ''); // Used for creating an absolute URL
    app.set('absoluteUrl', function(path){
        return app.get('siteUrl') + ':' + app.get('port') + '/' + path;
    });
    app.set('dbname', ''); // MongoDB database name
    app.set('dbuser', ''); // MongoDB user name
    app.set('dbpwd', ''); // MongoDB user password
    app.set('mandrillAPIKey',''); // https://mandrillapp.com
```

### Development
If you're going to be developing, run the `watch` task with gulp. This will process all the scss, js and templates and allow you to view any changes you make to them.

```bash
gulp watch
```

### Running
To start the app simply run
```bash
npm start
```

## License
See the LICENSE file for license rights and limitations (CC-BY-NC)
