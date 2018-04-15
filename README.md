![c3bc254fbaf76152cc6a9dc5d91714874bfc294b8d8d785db87157ed68aa2b3c45e82ab55f6f0e346aeec0bca00ea85862ba06e247ed4d365b968812fbc43c78](https://cloud.githubusercontent.com/assets/676849/25313656/e3a04458-2832-11e7-9bad-c9cf2c3264e0.png)

[![Build Status](https://travis-ci.org/lukevella/Rallly.svg?branch=master)](https://travis-ci.org/lukevella/Rallly)

Rallly is a free collaborative scheduling service that helps you and your friends vote on a date to host an event. The application has been developed with the [MEAN](http://en.wikipedia.org/wiki/MEAN) stack of technologies.


## Getting Started Quickly with Docker
*This assumes that you have Docker installed*

To get started quickly and easily, simply run the following:

```bash
git clone git@github.com:lukevella/Rallly.git
cd Rallly
```
Copy the sample `.env` file then open it and set the variables.
```bash
cp sample.env .env
```

Now run the server!
```bash
docker-compose up -d
```

Now that was simple!

## Manual Setup [Detailed Production Docs](docs/production/README.md)
### Requirements

To run Rallly you will need:

* MongoDB
* Node.js + npm
* Bower

### Setup

Clone the repository on your machine and set the current directory to the root of the repository

```bash
git clone git@github.com:lukevella/Rallly.git
cd Rallly
```
Run the install script. This will install the node and bower dependencies and create a configuration file.

```bash
npm run installation
```

#### Manual Configuration
*Only do this if you did not run `npm run installation`*

Run the config script.
```bash
npm run installation -- -p
```
Open up `config.json` and fill in the parameters.

```javascript
{
    "port": 3000,
    "siteUrl": "http://localhost:3000", // Used for creating an absolute URL
    "fromName": "Rallly", // Email from name
    "fromEmail": "no-reploy@rallly.co", // Email from address
    "db": "mongodb://localhost:27017/rallly", // MongoDB connection string
    "smtpUser": "", // SMTP user name
    "smtpPwd": "", // SMTP user password
    "smtpHost": "", // SMTP host
    "smtpPort": 587 // SMTP port
}
```

#### Running
To start the node server simply run `npm start`.

### Development [Detailed Docs](docs/development/README.md)
If you're going to be developing, run the `watch` task with gulp. Gulp is used to build the CSS (with SASS), JS and templates.

```bash
gulp watch
npm start
```

## License
See the [LICENSE](LICENSE) file.
