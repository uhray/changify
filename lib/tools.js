var uuid = require('uuid'),
    tools = module.exports = exports = {};

tools.defaultConfig = function() {
  return cfg = {
    // Required Options --------------------------------------------------------
    router: undefined,       /* Express JS Router */
    model: undefined,        /* Mongoose model */
    mongoose: undefined,     /* Mongoose object */

    // Default Options ---------------------------------------------------------
    keys: {},
    redirect: '/'
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
