# node-csp

Communicating sequential processes for node. Go style concurrency with
channels.

**WARNING: This package is at an experimental stage at the moment.**

## Requirements

This package requires ES6 generators which are switched on in node 0.11.6
through passing the `-harmony` flag to the node interpreter.

## Install

    $ npm i csp

## Run

    $ node -harmony <file>.js

## Example

A simple example sending and receiving values on a channel between
two routines.

```js
var csp = require("csp");

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
```

A more complex example setting up a daisy chained prime sieve.

```js
// Concurrent prime sieve.
// http://golang.org/doc/play/sieve.go

var csp = require("csp");

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
  yield csp.spawn(generate, ch); // Launch Generate routine.
  for (var i = 0; i < 10; i++) {
    var prime = yield ch.take();
    console.log(prime);
    ch1 = new csp.Chan();
    yield csp.spawn(filter, ch, ch1, prime);
    ch = ch1;
  }
};

// Start the main routine.
csp.spawn(main);
```

## Documentation

### (yield) spawn(*gen, arg1 ... argN)

Create a new process from `gen` and pass arguments `arg1 ... argN` to it.
If prefixed by yield the process will be managed by the outer process
and will be destroyed when the outer process quits.

* * *

### new Chan(size = 0)

Create a new channel with buffering `size`.

* * *

### yield Chan.prototype.put(val)

Send `val` on the channel and depending on the channels buffering
either block or move on.

* * *

### yield Chan.prototype.take() = val

Block until a value is sent on the channel and return that value as `val`.

* * *

### yield wait(ms)

Block for `ms` milliseconds.

* * *

### yield select(chan1 ... chanN) = chan

Block until a value is sent on one of `chan1 ... chanN` and then return
that channel as `chan`. Important to note that `select` does not issue a
`take` on the channel, you have to do this yourself.

* * *

### yield quit()

Forcefully quit the current process.

* * *

### wrap(fn(arg1 ... argN, cb(err, val)))

Take a function that uses node's usual callback convention and return
one that blocks until it is finished.

* * *

### chanify(fn(arg1 ... argN, cb(err, val)), chan)

Take a function that uses node's usual callback convention and return
one that sends a value on channel `chan` when it is finished.

## Inspiration

* http://swannodette.github.io/2013/08/24/es6-generators-and-csp
* http://golang.org/
* http://en.wikipedia.org/wiki/Communicating_sequential_processes
