var util = require('util');
var EventEmitter = require('events').EventEmitter;

function Communicator(){
    EventEmitter.call(this);
}

util.inherits(Communicator, EventEmitter);

module.exports = new Communicator();
