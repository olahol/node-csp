var csp = require("..");

var chan1 = new csp.Chan();

csp.spawn(function* () {
  var i = 0;
  for (;;) {
    yield chan1.put(i);
    console.log("->", i);
    i += 1;
  }
});

csp.spawn(function* () {
  for (;;) {
    console.log("<-", yield chan1.take());
  }
});
