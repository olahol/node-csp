// Concurrent prime sieve.
// http://golang.org/doc/play/sieve.go

var csp = require("..");

// Send the sequence 2, 3, 4, ... to channel 'ch'.
var generate = function* (ch) {
  for (var i = 2;;i++) {
    yield ch.put(i); // Send 'i' to channel 'ch'.
  }
};


// Copy the values from channel 'inch' to channel 'outch',
// removing those divisible by 'prime'.
var filter = function* (inch, outch, prime) {
  for (;;) {
    var i = yield inch.take(); // Receive value from 'inch'.
    if (i % prime != 0) {
      yield outch.put(i); // Send 'i' to 'out'.
    }
  }
};

// The prime sieve: Daisy-chain Filter processes.
var main = function* () {
  var ch = new csp.Chan(); // Create a new channel.
  yield csp.spawn(generate, ch); // Launch Generate goroutine.
  for (var i = 0; i < 10; i++) {
    var prime = yield ch.take();
    console.log(prime);
    ch1 = new csp.Chan();
    yield csp.spawn(filter, ch, ch1, prime);
    ch = ch1;
  }
};

// Start a main routine.
csp.spawn(main);
