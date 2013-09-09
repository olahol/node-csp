var csp = require("..");

var chan1 = new csp.Chan()
  , chan2 = new csp.Chan();

csp.spawn(function* () {
  for (var i = 0; i < 10; i += 1) {
    console.log("chan1 ->", i);
    yield chan1.put(i);
  }
  yield chan1.put(null);
});

csp.spawn(function* () {
  for (;;) {
    var msg = yield chan1.take();
    if (msg === null) break;
    console.log("chan1 <-", msg);
  }
});

csp.spawn(function* () {
  for (var i = 0; i < 10; i += 1) {
    console.log("chan2 ->", i);
    yield chan2.put(i);
  }
  yield chan2.put(null);
});

csp.spawn(function* () {
  for (;;) {
    var msg = yield chan2.take();
    if (msg === null) break;
    console.log("chan2 <-", msg);
  }
});
