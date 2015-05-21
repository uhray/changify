var debug = require('debug')('changify'),
    assert = require('assert'),
    utile = require('utile'),
    tools = require('./tools'),
    uuid = require('uuid'),
    moment = require('moment'),
    proto = module.exports = exports = {},
    mongoose, ObjectId, Mixed, Schema, Model;

proto.launch = function(options) {
  var cfg = this.config = utile.mixin(tools.defaultConfig(), options || {}),
      app;

  debug('Initializing changify.');

  // assertions
  assert(cfg.mongoose, 'Mongoose not configured for changify.');
  assert(cfg.model, 'Model not configured for changify.');
  assert(cfg.router, 'App not configured for changify.');
  assert(!this.inited, 'Changify already initialized');

  // setup vars
  this.inited = true;
  mongoose = cfg.mongoose;
  ObjectId = cfg.mongoose.Schema.Types.ObjectId;
  Mixed = cfg.mongoose.Schema.Types.Mixed;

  // create schema + model
  Schema = new mongoose.Schema({
    docid:     { type: ObjectId, required: true },
    key:       { type: String, required: true },
    code:      { type: String, required: true, unique: true, index: true },
    newValue:  { type: Mixed, required: true },
    createdAt: { type: Date, default: Date.now }
  });
  Model = mongoose.model('changify', Schema);

  // routes
  app = cfg.router;
  app.post('/changify', function(req, res) {
    var uid = req.user && req.user._id,
        data = req.body || {},
        kinfo = cfg.keys[data.key],
        obj = {};

    if (!uid) return tools.respond(res, 'Unauthorized');
    if (!kinfo) return tools.respond(res, 'Can\'t change this.');

    debug('data: %j', data);
    kinfo.type(data.value, function(d) {
      if (!d) return tools.respond(res, 'Invalid value');
      obj.key = data.key;
      obj.docid = uid;
      obj.code = kinfo.gen();
      obj.newValue = data.value;
      debug('changify obj: %j', obj);
      new Model(obj).save(function(e, d) {
        tools.respond(res, e, !!d);
        kinfo.send(obj.code, obj.newValue, req.user);
      });
    });
  });

  app.get('/changify/:code', function(req, res) {
    var code = req.params.code,
        json = req.query && req.query.json,
        q = { code: code,
              createdAt: { $gte: moment().subtract(1, 'days').toDate() } };

    Model.findOne({ code: code }, function(e, update) {
      var up;
      if (e || !update) return tools.respond(res, 'Invalid Code');
      debug('will change: %j', update)
      up = { $set: {} };
      up.$set[update.key] = update.newValue;
      debug('update command: %j', up);
      cfg.model.findByIdAndUpdate(update.docid, up, function(e, d) {
        var success = !e && d,
            r = cfg.redirect + '?changify=' + (success ? 'success' : 'failure');

        update.remove(function(e) {
          debug(e ? 'Error removing update.' : 'Removed update.');
        });

        if (json) tools.respond(res, !success, !!success);
        else res.redirect(r);
      });

    });
  });
};

proto.uuid = function() {
  return function() { return uuid.v1(); }
}

proto.nums = function(n) {
  n = n || 5;
  return function() {
    var chars = ['2', '3', '4', '5', '6', '7', '8', '9'],
        s = '';
    while (s.length < n) s += chars[tools.randI(0, chars.length - 1)];
    return s;
  }
}

proto.add = function(k, type, gen, send) {
  this.config.keys[k] = { type: type, gen: gen, send: send };
}