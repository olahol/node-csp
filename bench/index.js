// Lazy benchmarks, change these.
var csp = require("..")
  , ben = require("ben");

var N = 1000
  , S = 5;

ben.async(S, function (done) {
  var chan1 = new csp.Chan();

  csp.spawn(function* () {
    for (var i = 0; i < N; i++) {
      yield chan1.put(i);
    }
    yield chan1.put(null);
  });

  csp.spawn(function* () {
    for (;;) {
      var i = yield chan1.take();
      if (i == null) break;
    }
    done();
  });
}, function (ms) {
  console.log("sending", N, "msgs on a channel took avg.", ms, "ms");
});

ben.async(S, function (done) {
  var chan1 = new csp.Chan()
    , chan2 = new csp.Chan();

  csp.spawn(function* () {
    for (var i = 0; i < N; i++) {
      yield chan1.put(i);
    }
    yield chan1.put(null);
  });

  csp.spawn(function* () {
    for (var i = 0; i < N; i++) {
      yield chan2.put(i);
    }
    yield chan2.put(null);
  });

  csp.spawn(function* () {
    var count = 0
      , i = 0;
    while (count != 2) {
      switch (yield csp.select(chan1, chan2)) {
        case chan1:
          i = yield chan1.take();
          if (i === null) count += 1;
          break;
        case chan2:
          i = yield chan2.take();
          if (i === null) count += 1;
          break
      }
    }
    done();
  });
}, function (ms) {
  console.log("sending", N*2, "msgs on two channels took avg.", ms, "ms");
});
