
var debug = require('debug')('changify'),
    utile = require('utile'),
    proto = require('./proto');

function Changify() {
  // Do nothing
}

Changify.prototype = utile.mixin(Changify.prototype, proto);
module.exports = exports = new Changify();
