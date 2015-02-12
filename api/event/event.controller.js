var express = require('express');
var Event = require('./event.model');
var debug = require('debug')('rallly');
var communicator = require('../../communicator');

var getRandomString = function(){
    return require('crypto').randomBytes(16).toString('hex');
}

exports.model = Event;

exports.verifyEmail = function(req, res, next){
    var id = req.params.id,
        code = req.params.code;

    Event
        .update({
                '_id' : id,
                '__private.verificationCode' : code
            }, {
                'creator.isVerified' : true ,
                '__private.verificationCode' : getRandomString()
            })
        .exec(function(err, num){
            if (err) return handleError(res, err);
            if (num == 0) return res.status(498).end();
            next();
        });
}

exports.create = function(req, res, next){
    var event = req.body;

    event.__private = {
        'verificationCode' : getRandomString(),
        'unsubscribeCode' : getRandomString()
    }

    return Event
        .create(req.body, function(err, event){
            if (err) return handleError(res, err);
            if (!event) return res.status(404);
            communicator.emit('event:create', event);
            req.event = event;
            next();
        });
}

exports.show = function(req, res, next){
    Event
        .findById(req.params.id)
        .exec(function(err, event){
            if (err) return handleError(res, err);
            if (!event) return res.status(404).end();
            req.event = event;
            next();
        });
}

exports.update = function(req, res){
    var updatedEvent = req.body;
    updatedEvent.updated = Date.now();

    Event
        .findById(req.params.id)
        .exec(function(err, event){
            if (err) return handleError(res, err);
            if (!event) return res.status(404).end();
            // If the creator's email has changed OR the notifications setting has changed - start a new email confirmation transaction
            if (event.creator.email != updatedEvent.creator.email ||
                (!event.creator.allowNotifications && updatedEvent.creator.allowNotifications)) {
                    updatedEvent.creator.isVerified = false;
                    updatedEvent.creator.allowNotifications = true;
                    updatedEvent.__private = event.__private;
                    communicator.emit('event:update:creator.email', updatedEvent, event);
            }

            Event
                .update({ '_id' : req.params.id }, updatedEvent)
                .exec(function(){
                    communicator.emit('event:update', updatedEvent, event);
                    return res.status(204).end();
                });
        });
}

exports.delete = function(req, res, next){
    var eventId = req.params.id
    Event
        .update({
            '_id' : eventId
        }, {
            'isDeleted' : true
        })
        .exec(function(err, num){
            if (err) return handleError(res, err);
            if (num == 0) return res.status(498).end();
            next();
        });
}

exports.createComment = function(req, res, next){
    var eventId = req.params.id,
        comment = req.body;

    Event
        .findById(eventId)
        .exec(function(err, event){
            if (err) return handleError(res, err);
            event.comments.push(comment);
            event.save(function(err, event){
                if (err) return next(err);
                communicator.emit('comment:add', event, comment);
                req.event = event;
                next();
            });
        });
}

exports.deleteComment = function(req, res, next){
    var eventId = req.params.id,
        commentId = req.params.cid;

    Event
        .findById(eventId)
        .exec(function(err, event){
            if (err) return handleError(res, err);
            event.comments.pull({ '_id' : commentId });
            event.save(function(err, event){
                req.event = event;
                next();
            })
        });
}


exports.createParticipant = function(req, res, next){
    var eventId = req.params.id,
        participant = req.body;

    Event
        .findById(eventId)
        .exec(function(err, event){
            if (err) return handleError(res, err);
            event.updated = Date.now();
            event.participants.push(participant);
            event.save(function(err, event){
                if (err) return next(err);
                communicator.emit('participant:add', event, participant);
                req.event = event;
                next();
        });
    });
}

exports.updateParticipant = function(req, res, next){
    var eventId = req.params.id,
        participantId = req.params.pid;

    Event
        .update({
            '_id' : eventId,
            'participants._id': participantId
        }, {
            '$set': {
                'updated' : Date.now(),
                'participants.$' : req.body
            }
        })
        .exec(function(err, num){
            if (err) return handleError(res, err);
            res.status(204).end();
        });
}

exports.deleteParticipant = function(req, res, next){
    var eventId = req.params.id,
        participantId = req.params.pid;

    Event
        .findById(eventId)
        .exec(function(err, event){
            if (err) return handleError(res, err);
            event.updated = Date.now();
            event.participants.pull({ '_id' : participantId });
            event.save(function(err, event){
                req.event = event;
                next();
            })
        });
}


function handleError(res, err) {
    debug("ERROR: " + err);
    return res.status(500).send(err);
}
