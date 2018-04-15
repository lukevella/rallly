var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var debug = require('debug')('rallly');
var mongoose = require('mongoose');

var app = module.exports = express();

require('./config/main')(app);
require('./helpers/notification.helper');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

if (process.env.NODE_ENV === 'maintenance') {
    app.get('*', function(req, res) {
        res.send('Rallly is down for maintenance. Please check back in a few minutes');
    })
} else {
    require('./config/routes')(app);
}

var mongoAddress = app.get('db');
mongoose.connect(mongoAddress, {
    useMongoClient: true,
});

var db = mongoose.connection;
db.on('error', debug.bind(debug, 'connection error'));
db.once('open', function(){
    debug('connected successfully to db: ' + mongoAddress);
});
