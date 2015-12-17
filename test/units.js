var test = require('unit.js'),
    Changify = require('../index.js'),
    mongoose = require('mongoose'),
    tools = require('../lib/tools');

describe('tools', function() {

  it('tools.foreach', function() {
    var obj;

    test.when('we loop through an object', function() {
          obj = { a: 7, b: 8, c: 9 };
        })
        .then('test looping through the object', function() {
          var keys = [],
              values = [];

          tools.forEach(obj, function(v, k) {
            keys.push(k);
            values.push(v);
          });

          keys.sort();
          values.sort();

          keys.must.eql(Object.keys(obj).sort());
          values.must.eql([7, 8, 9]);
        })
        .when('we loop through an array', function() {
          obj = [7, 8, 9];
        })
        .then('test looping through the object', function() {
          var a = [],
              b = [];

          tools.forEach(obj, function(v, k) {
            a.push(v, k);
          });

          obj.forEach(function(v, k) {
            b.push(v, k);
          });

          a.must.eql(b);
        })
  });

  it('tools.randI', function() {
    var is = [],
        min = 13,
        max = 27;

    test.when('test a bunch', function() {
          var i = 0;

          while (i++ < 1000) is.push(tools.randI(min, max))
        })
        .then(function() {
          is.forEach(function(d) {

            d.must.be.lte(max);
            d.must.be.gte(min);
            test.assert.deepEqual(d % 1, 0, 'Must be integer');
          });
        });
  });

  it('tools.respond', function() {
    var d = 'data ---',
        e = 'error ----',
        result,
        mockRes = {
          json: function(d) {
            result = d;
          }
        };

    tools.respond(mockRes, e, d);

    result.must.be.eql({ error: e, data: d });

  });

  it('tools.createCors', function() {
    var hasCors;

    test.when('No cors', function() {})
      .then(function() {
        var x = tools.createCors(hasCors),
            nextCalled = false,
            next = function() {
              nextCalled = true;
            };

        x(null, null, next);
        nextCalled.must.be.true();
      })
      .when('Yes cors', function() {
        hasCors = true;
      })
      .then(function() {
        var x = tools.createCors(hasCors),
            nextCalled = false,
            next = function() {
              nextCalled = true;
            };

        x.bind({}, null, null, next)
         .must.throw();
        nextCalled.must.be.false();
      })
  });

});

describe('proto', function() {

  it('proto.launch', function() {
    var getCalled = 0,
        postCalled = 0,
        getRoute, postRoute;

    // must provide useful stuff for these three
    Changify.launch.bind(Changify).must.throw();
    Changify.inited = false;
    Changify.launch.bind(Changify, { mongoose: true }).must.throw();
    Changify.inited = false;
    Changify.launch.bind(Changify, {
      mongoose: true,
      router: true
    }).must.throw();
    Changify.inited = false;
    Changify.launch.bind(Changify, {
      mongoose: true,
      router: true,
      model: true
    }).must.throw();
    Changify.inited = false;

    Changify.launch({
      mongoose: mongoose,
      model: mongoose.model('users', new mongoose.Schema({
        test: 'string'
      })),
      router: {
        get: function(r) {
          ++getCalled;
          getRoute = r;
        },
        post: function(r) {
          ++postCalled;
          postRoute = r;
        }
      }
    })

    getCalled.must.equal(1);
    postCalled.must.equal(1);
    postRoute.must.equal('/changify');
    getRoute.must.equal('/changify/:code');
  });

  it('proto.uuid', function() {
    var uuid = Changify.uuid(),
        i = 0, id;

    uuid.must.be.a.function();

    while (i++ < 100) {
      id = uuid();
      id.must.be.a.string();
      id.must.match(
        /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/
      );
    }
  });

  it('proto.nums', function() {
    var nums = Changify.nums(),
        i = 0, id;

    nums.must.be.a.function();

    while (i++ < 100) {
      id = nums();
      id.must.be.a.string();
      id.must.match(/[2-9]{5}/);
    }

    nums = Changify.nums(7);

    nums.must.be.a.function();

    while (i++ < 100) {
      id = nums();
      id.must.be.a.string();
      id.must.match(/[2-9]{7}/);
    }
  });

  it('proto.add', function() {
    var k = 7,
        type = 'type',
        gen = 'gen',
        send = 'send',
        change = 'change';

    Changify.add(k, type, gen, send, change);

    Changify.config.keys[k].must.be.eql({
      type: type,
      gen: gen,
      send: send,
      change: change
    });
  });

});
