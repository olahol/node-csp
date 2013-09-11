var csp = require("..");

var chan1 = new csp.Chan(); // Create an unbuffered channel.

csp.spawn(function* () {
  for (var i = 0; i < 10; i++) {
    console.log("put", i);
    yield chan1.put(i); // Send 'i' on channel 'chan1'.
  }
  yield chan1.put(null);
});

csp.spawn(function* () {
  for (;;) {
    var i = yield chan1.take(); // Take a value of 'chan1'.
    if (i === null) break; // Quit if we get 'null'.
    console.log("take", i);
  }
});
