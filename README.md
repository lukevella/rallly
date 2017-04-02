### Update: 11 Nov 2016 📝

Hey guys, thanks for all your feedback and your interest in Rallly! I'm currently working on a new version that will address all the issues being brought up in this project along with a visual refresh and an up to date technology stack. I'm really excited to bring you this new and improved Rallly and hope to see even more people using it in the future. *– Luke*

# [Rallly](http://rallly.co)

Rallly is a free collaborative scheduling service that helps you and your friends vote on a date to host an event. The application has been developed with the [MEAN](http://en.wikipedia.org/wiki/MEAN) stack of technologies.

## Requirements

To run Rallly you will need:

* MongoDB
* Node.js + npm
* Bower (Not Necessary)

## Setup

Clone the repository on your machine and set the current directory to the root of the repository

```bash
git clone git@github.com:lukevella/Rallly.git
cd Rallly
```
Run the install script. This will install the node and bower dependencies and create a sample configuration file.

```bash
npm run installation
```

### Configuration
Open up `config/main.js` and fill in the parameters.

```javascript
app.set('port', 3000);
app.set('siteUrl', ''); // Used for creating an absolute URL
app.set('absoluteUrl', function(path){
    // If you're using port 80 or a proxy, remove the port from the absoluteUrl
    return app.get('siteUrl') + ':' + app.get('port') + '/' + path;
});
app.set('dbname', ''); // MongoDB database name
app.set('dbuser', ''); // MongoDB user name
app.set('dbpwd', ''); // MongoDB user password
app.set('sendGridAPIKey',''); // https://sendgrid.com
```

### Development
If you're going to be developing, run the `watch` task with gulp. Gulp is used to build the css (with sass), js and templates.

```bash
gulp watch
```

### Running
To start the node server simply run `npm start`.

## License
See the LICENSE file for license rights and limitations (CC-BY-NC)
