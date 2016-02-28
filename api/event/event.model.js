var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var debug = require('debug')('rallly');
var shortid = require('shortid');

var EventSchema = new Schema({
    _id : {
      type: String,
      unique: true,
      default: shortid.generate
    },
    description : String,
    creator : {
        name : String,
        email : String,
        isVerified : {
            type : Boolean,
            default : false
        },
        allowNotifications : {
            type : Boolean,
            default : true
        }
    },
    created : {
        type : Date,
        default : Date.now
    },
    updated : Date,
    title : String,
    dates : [Date],
    emails : [{
        email : String
    }],
    comments : [{
        id : Schema.Types.ObjectId,
        author : {
            name : String
        },
        content : String,
        created : {
            type: Date,
            default : Date.now
        }
    }],
    location: String,
    participants : [{
        id : Schema.Types.ObjectId,
        name : String,
        votes : [Boolean]
    }],
    isClosed : {
        type : Boolean,
        default : false
    },
    isDeleted : {
        type : Boolean,
        default : false
    },
    isExample : {
        type : Boolean,
        default : false
    },
    __private : {
        verificationCode : String,
        unsubscribeCode : String
    }
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
