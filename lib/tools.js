var uuid = require('uuid'),
    utile = require('utile'),
    cors = require('cors'),
    tools = module.exports = exports = {};

tools.defaultConfig = function() {
  return cfg = {
    // Required Options --------------------------------------------------------
    router: undefined,       /* Express JS Router */
    model: undefined,        /* Mongoose model */
    mongoose: undefined,     /* Mongoose object */

    // Default Options ---------------------------------------------------------
    keys: {},
    redirect: '/',
    cors: false
  }
}

tools.forEach = function(obj, fn) {
  var k;
  for (k in obj) fn(obj[k], k);
}

tools.randI = function(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

tools.respond = function(res, e, d) {
  res.json({ error: e, data: d });
}


tools.createCors = function(obj) {
  if (!obj) return function(a, b, c) { c() };
  obj = utile.mixin({
           credentials: true,
           origin: function(o, cb) { cb(null, true); }
        }, typeof obj == 'object' ? obj : {});
  return cors(obj);
}
