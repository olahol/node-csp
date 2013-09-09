var assert = require("assert")
  , csp = require("..");

describe("#spawn()", function(){
  it("should spawn a process and exit", function (done) {
    csp.spawn(function* () {
      done();
    });
  });
});

describe("#put() && #take()", function(){
  it("unbufferd channel put should block", function (done) {
    var chan1 = new csp.Chan();

    csp.spawn(function* () {
      yield chan1.put("test");
      assert.ok(false);
    });

    setTimeout(function () {
      done();
    }, 300);
  });

  it("unbufferd channel take should block", function (done) {
    var chan1 = new csp.Chan();

    csp.spawn(function* () {
      yield chan1.take();
      assert.ok(false);
    });

    setTimeout(function () {
      done();
    }, 300);
  });
});

describe("#put()", function(){
  it("bufferd channel should not block", function (done) {
    var chan1 = new csp.Chan(2);

    csp.spawn(function* () {
      yield chan1.put("test");
      yield chan1.put("test");
      done();
    });
  });
});

describe("#put() && #take()", function(){
  it("should pass a message on a channel", function (done) {
    var chan1 = new csp.Chan();

    csp.spawn(function* () {
      yield chan1.put("test");
    });

    csp.spawn(function* () {
      assert.equal("test", yield chan1.take());
      done();
    });
  });
});

describe("#select()", function(){
  it("should pass a message on two channels", function (done) {
    var chan1 = new csp.Chan()
      , chan2 = new csp.Chan();

    csp.spawn(function* () {
      yield csp.wait(100);
      yield chan1.put(true);
    });

    csp.spawn(function* () {
      yield csp.wait(101);
      yield chan2.put(false);
    });

    csp.spawn(function* () {
      switch (yield csp.select(chan1, chan2)) {
        case chan1:
          assert.ok(yield chan1.take());
          break;
        case chan2:
          assert.ok(yield chan2.take());
          break;
      }
      done();
    });
  });
});

var timeout = function (ms, cb) {
  setTimeout(cb, ms);
};

describe("#wrap()", function(){
  it("wait on a function", function (done) {
    var chan1 = new csp.Chan()
      , fn = csp.wrap(timeout);

    csp.spawn(function* () {
      yield fn(100);
      yield chan1.put(true);
    });

    csp.spawn(function* () {
      assert.ok(yield chan1.take());
      done();
    });
  });
});

describe("#chanify()", function(){
  it("wait on a function passing a value to a channel", function (done) {
    var chan1 = new csp.Chan()
      , ch = csp.chanify(timeout);

    csp.spawn(function* () {
      ch(100, chan1);
      yield chan1.take();
      done();
    });
  });
});

describe("#quit()", function(){
  it("quit a spinning process", function (done) {
    var chan1 = new csp.Chan();

    csp.spawn(function* () {
      yield csp.spawn(function* () {
        yield chan1.take();
        assert.ok(false);
      });

      done();
    });

  });
});
