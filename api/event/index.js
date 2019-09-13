var express = require('express');
var router = express.Router();
var controller = require('./event.controller');
var rateLimit = require("express-rate-limit")
/* GET home page. */

var after = function(req, res) {
    if (req.event){
        var event = req.event.toObject();
        delete event['__private'];
        res.json(event);
    } else {
        res.status(204).end();
    }
}

router.post('/', rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour window
    max: 15, // start blocking after 5 requests
    message: 'Too many requests from your IP, please try again after an hour'
}), controller.create, after);
router.get('/:id', controller.show, after);
router.put('/:id', rateLimit({
    windowMs: 60 * 1000,
    max: 25,
    message: 'Too many requests from your IP, please try again later'
}), controller.update, after);
router.delete('/:id', controller.delete, after);
router.delete('/:id/code/:code', controller.delete, after);
router.get('/:id/code/:code', controller.verifyEmail, after);

router.post('/:id/comment', rateLimit({
    windowMs: 60 * 1000, // 1 hour window
    max: 10, // start blocking after 5 requests
    message: 'Too many requests from your IP, please try again after an hour'
}), controller.createComment, after);
router.delete('/:id/comment/:cid', controller.deleteComment, after);

router.post('/:id/participant', rateLimit({
    windowMs: 60 * 1000, // 1 hour window
    max: 10, // start blocking after 5 requests
    message: 'Too many requests from your IP, please try again after an hour'
}),  controller.createParticipant, after);
router.delete('/:id/participant/:pid', controller.deleteParticipant, after);
router.put('/:id/participant/:pid', rateLimit({
    windowMs: 60 * 1000, // 1 hour window
    max: 10, // start blocking after 5 requests
    message: 'Too many requests from your IP, please try again after an hour'
}), controller.updateParticipant, after);

module.exports = router;