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

```js
// Concurrent prime sieve.
// http://golang.org/doc/play/sieve.go

var csp = require("csp");

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
