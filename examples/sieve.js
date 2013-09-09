// Concurrent prime sieve.
// http://golang.org/doc/play/sieve.go

var csp = require("..");

var generate = function (n) {
  return function* (ch) {
    for (var i = 2; i < n; i++) {
      yield ch.put(i);
    }
  };
};

var filter = function* (inc, out, prime) {
  for (;;) {
    var i = yield inc.take();
    if (i % prime != 0) {
      yield out.put(i);
    }
  }
};

csp.spawn(function* () {
  var ch = new csp.Chan();

  yield csp.spawn(generate(1000), ch);

  for (var i = 0; i < 10; i++) {
    var prime = yield ch.take();
    console.log(prime);
    ch1 = new csp.Chan();
    yield csp.spawn(filter, ch, ch1, prime);
    ch = ch1;
  }
});
