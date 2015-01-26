var express = require('express');
var router = express.Router();
var controller = require('./event.controller');
var debug = require('debug')('api/event/index');
/* GET home page. */

router.post('/', controller.create);
router.get('/:id', controller.show);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);
router.delete('/:id/code/:code', controller.delete);
router.get('/:id/code/:code', controller.verifyEmail);

router.post('/:id/comment', controller.createComment);
router.delete('/:id/comment/:cid', controller.deleteComment);

router.post('/:id/participant', controller.createParticipant);
router.delete('/:id/participant/:pid', controller.deleteParticipant);
router.put('/:id/participant/:pid', controller.updateParticipant);

router.all('/*', function(req, res){
    if (req.event){
        var event = req.event.toObject();
        delete event['__private'];
        res.json(event);
    } else {
        res.status(204).end();
    }
});

module.exports = router;
