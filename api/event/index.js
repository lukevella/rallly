var express = require('express');
var router = express.Router();
var controller = require('./event.controller');
var debug = require('debug')('rallly');
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

router.post('/', controller.create, after);
router.get('/:id', controller.show, after);
router.put('/:id', controller.update, after);
router.delete('/:id', controller.delete, after);
router.delete('/:id/code/:code', controller.delete, after);
router.get('/:id/code/:code', controller.verifyEmail, after);

router.post('/:id/comment', controller.createComment, after);
router.delete('/:id/comment/:cid', controller.deleteComment, after);

router.post('/:id/participant', controller.createParticipant, after);
router.delete('/:id/participant/:pid', controller.deleteParticipant, after);
router.put('/:id/participant/:pid', controller.updateParticipant, after);




module.exports = router;
