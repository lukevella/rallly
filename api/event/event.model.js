var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var debug = require('debug')('event.model');
var ShortId = require('mongoose-shortid');

var EventSchema = new Schema({
    _id : ShortId,
    description : String,
    creator : {
        name : String,
        email : String
    },
    title : String,
    dates : [Date],
    emails : [String],
    participants : [{
        id : Schema.Types.ObjectId,
        name : String,
        dates : [Boolean]
    }],
    comments : [{
        id : Schema.Types.ObjectId,
        author : String,
        comment : String,
    }]
});

var model = mongoose.model('Event', EventSchema);

model.schema
    .path('title')
    .required('You need to give your event a title');
model.schema
    .path('creator.name')
    .required('You need to type in your name')
model.schema
    .path('creator.email')
    .required('You need to type in your email')
    .validate(function(email) {
        debug("email: " + email);
        var emailRegex = /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/;
        return emailRegex.test(email);
    }, 'You need to type in a valid email')
model.schema
    .path('dates')
    .validate(function(dates){
        return dates.length
    }, 'You didn\'t select any dates');
model.schema
    .path('participants')
    .validate(function(participants){
        for (var i = 0; i < participants.length; i++){
            if (!participants[i].name){
                return false;
            }
        }
        return true;
    }, 'Participants must have a name')
module.exports = model
