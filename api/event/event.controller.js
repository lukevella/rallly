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
        if (!event) return res.status(404);
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
