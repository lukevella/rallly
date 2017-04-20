### Update: 11 Nov 2016 📝

Hey guys, thanks for all your feedback and your interest in Rallly! I'm currently working on a new version that will address all the issues being brought up in this project along with a visual refresh and an up to date technology stack. I'm really excited to bring you this new and improved Rallly and hope to see even more people using it in the future. *– Luke*

# [Rallly](http://rallly.co)
[![Build Status](https://travis-ci.org/nprail/Rallly.svg?branch=master)](https://travis-ci.org/nprail/Rallly)
[![Known Vulnerabilities](https://snyk.io/test/github/nprail/rallly/badge.svg)](https://snyk.io/test/github/nprail/rallly)

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
* Bower (Not Necessary)

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
    "dbName": "rallly", // MongoDB database name
    "dbAddress": "localhost", // MongoDB address not including port. 
    "dbUser": "", // MongoDB user name - leave blank if MongoDB auth is disabled
    "dbPwd": "", // MongoDB user password - leave blank if MongoDB auth is disabled
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
See the [LICENSE](LICENSE.txt) file for license rights and limitations (CC-BY-NC)
