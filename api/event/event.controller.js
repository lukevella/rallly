var express = require('express');
var Event = require('./event.model');
var debug = require('debug')('myapp');

exports.create = function(req, res){
    Event.create(req.body, function(err, event){
        if (err) return handleError(res, err);
        if (!event) return res.status(404);
        return res.json(event);
    });
}

exports.show = function(req, res, next){
    Event.findById(req.params.id, function(err, event){
        if (err) return handleError(res, err);
        if (!event) return res.status(404).end();
        return res.json(event);
    });
}

exports.update = function(req, res){
    req.body.updated = Date.now();
    Event.update({ '_id' : req.params.id }, req.body, function(){
        return res.status(204).end();
    });
}

exports.createParticipant = function(req, res, next){
    var eventId = req.params.id;
    var participant = req.body;
    Event.findById(eventId, function(err, event){
        if (err) return handleError(res, err);
        event.updated = Date.now();
        event.participants.push(participant);
        event.save(function(err, event){
            if (err) return next(err);
            res.json(event);
        });
    });
}

exports.updateParticipant = function(req, res, next){
    var eventId = req.params.id;
    var participantId = req.params.pid;
    Event.update({
        '_id' : eventId,
        'participants._id': participantId
    }, {
        '$set': {
            'updated' : Date.now(),
            'participants.$' : req.body
        }
    }, function(err, num){
        if (err) return next(err);
        res.status(204).end();
    });
}

exports.deleteParticipant = function(req, res, next){
    var eventId = req.params.id;
    var participantId = req.params.pid;
    Event.findById(eventId, function(err, event){
        if (err) return handleError(res, err);
        event.updated = Date.now();
        event.participants.pull({ '_id' : participantId });
        event.save(function(err, event){
            res.json(event);
        })
    });
}


function handleError(res, err) {
    return res.status(500).send(err);
}
