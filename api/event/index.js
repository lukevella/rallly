var express = require('express');
var router = express.Router();
var controller = require('./event.controller');
var debug = require('debug')('api/event/index');
/* GET home page. */

router.post('/', controller.create);
router.get('/:id', controller.show);
router.post('/:id/participant', controller.createParticipant);
router.delete('/:id/participant/:pid', controller.deleteParticipant);
module.exports = router;
