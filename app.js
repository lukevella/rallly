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

require('./config/routes')(app);

var dbname = app.get('dbname');
var dbaddress = app.get('dbaddress');
var mongoAddress = 'mongodb://' + dbaddress + '/' + dbname;
debug(mongoAddress);
mongoose.connect(mongoAddress, {
    user : app.get('dbuser'),
    pass : app.get('dbpwd'),
});
var db = mongoose.connection;
db.on('error', debug.bind(debug, 'connection error'));
db.once('open', function(){
    debug('connected successfully to db: ' + dbname);
});
