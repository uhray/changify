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
      hasCors = this.config.cors,
      cors = tools.createCors(this.config.cors),
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

  if (hasCors) cfg.router.options('/changify', cors);
  app.post('/changify', cors, handlePost);

  if (hasCors) cfg.router.options('/changify/:code', cors);
  app.get('/changify/:code', cors, handleGet);

  function handleGet(req, res) {
    var code = req.params.code,
        json = req.query && req.query.json,
        q = { code: code,
              createdAt: { $gte: moment().subtract(1, 'days').toDate() } };

    Model.findOne({ code: code }, function(e, update) {
      var kinfo, up;

      if (e || !update) return tools.respond(res, 'Invalid Code');

      debug('will change: %j', update)
      kinfo = cfg.keys[update.key];
      up = { $set: {} };
      up.$set[update.key] = update.newValue;
      debug('update command: %j', up);
      cfg.model.findByIdAndUpdate(update.docid, up, function(e, d) {
        var success = !e && d,
            r = cfg.redirect + '?changify=' + (success ? 'success' : 'failure');

        update.remove(function(e) {
          debug(e ? 'Error removing update.' : 'Removed update.');
        });

        if (kinfo && kinfo.change) {
          process.nextTick(function() {
            kinfo.change(update.docid, update.newValue, update.key, d);
          });
        }

        if (json) tools.respond(res, !success, !!success);
        else res.redirect(r);
      });

    });
  }

  function handlePost(req, res) {
    var uid = req.user && req.user._id,
        data = req.body || {},
        kinfo = cfg.keys[data.key],
        obj = {};

    if (!uid) return tools.respond(res, 'Unauthorized');
    if (!kinfo) return tools.respond(res, 'Can\'t change this.');

    debug('data: %j', data);
    kinfo.type(data.value, function(d, v) {
      if (!d) return tools.respond(res, 'Invalid value');
      if (arguments.length > 1) data.value = v;
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
  }

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

proto.add = function(k, type, gen, send, change) {
  this.config.keys[k] = { type: type, gen: gen, send: send, change: change };
}
