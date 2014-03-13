/*
  This library consist of three main components channels, processes
  and operations. A process takes a generator function that yields
  operations. Operations are a tuple of [type, fn], depending on what
  type an operation has the process does different things, currently
  there are four types chan, fn, spawn and quit. Channels are object
  that have two methods, take and put, both of these methods return
  operations that have type chan and functions that return whether they
  should continue executing or block.
*/

var Chan = exports.Chan = function (size) {
  this.size   = size+1 || 1;
  this.buffer = [];
  this.drain  = false; // This will be true if the channels buffer is full.
};

Chan.prototype.put = function (msg) {
  return ["chan", function () {
    if (this.drain && this.buffer.length === 0) { // Was the buffer previously full?
      this.drain = false;
      return { state: "continue" };
    }

    if (this.buffer.length < this.size) { // There is still space in the buffer.
      this.buffer.push(msg);
      this.drain = this.buffer.length === this.size; // Was the size limit reached?
      if (this.drain) {
        return { state: "sleep" }; // If so block.
      }
      return { state: "continue" }; // Otherwise carry on.
    }

    return { state: "sleep" }; // Nobody has taken our messages yet.
  }.bind(this)];
};

Chan.prototype.take = function () {
  return ["chan", function () {
    if (this.buffer.length === 0) { // There are no messages to be taken.
      return { state: "sleep" }; // So block.
    }
    return { state: "continue", msg: this.buffer.shift() }; // Take a messages.
  }.bind(this)];
};

var Proc = function (gen) {
  this.gen      = gen;
  this.step     = gen.next();
  this.done     = false;
  this.subprocs = [];
};

Proc.prototype.run = function () {
  if (this.step.done || this.done) { // Is the process done?
    this.subprocs.forEach(function (proc) {
      proc.done = true; // If so all subprocess are done too.
    });

    return ;
  }

  var value = this.step.value // Operation.
    , type = value[0]
    , fn = value[1];

  if (type === "chan") {
    var op = fn();
    if (op.state === "continue") {
      this.step = this.gen.next(op.msg); // Go to the next yield.
    }
    return this.spin(); // Schedule the process.
  }

  if (type === "fn") { // A function to block on.
    fn(function (err, msg) {
      if (err) {
        this.step = this.gen.throw(err);
      } else {
        this.step = this.gen.next(msg);
      }
      this.spin();
    }.bind(this));
    return ;
  }

  if (type === "spawn") { // A new sub process.
    this.step = this.gen.next();
    this.subprocs.push(fn);
    return this.spin();
  }

  if (type === "quit") {
    this.done = true;
    return this.spin();
  }
};

// Hand over the process to node's scheduler.
Proc.prototype.spin = function () {
  setImmediate(function () { this.run(); }.bind(this), 0);
};

// Create and run a new process.
var spawn = exports.spawn = function () {
  var args = Array.prototype.slice.call(arguments, 0)
    , gen = args.shift().apply(undefined, args)
    , proc = new Proc(gen);
  proc.run();
  return ["spawn", proc];
};

// Wait on several channels.
var select = exports.select = function () {
  var chans = Array.prototype.slice.call(arguments, 0);
  return ["chan", function () {
    for (var i=0; i < chans.length; i += 1) {
      var chan = chans[i];
      if (chan.buffer.length === 0) { continue; } // Peak into the channel to see if there are any messages pending.
      return { state: "continue", msg: chan }; // If there is send the channel back to the process.
    }
    return { state: "sleep" };
  }];
};

// Wrapper around setTimeout.
var wait = exports.wait = function (ms) {
  return ["fn", function (cb) {
    setTimeout(cb, ms);
  }];
};

// Wrap functions that follow the node convention fn(values ..., cb(err, value))
var wrap = exports.wrap = function (fn) {
  return function () {
    var args = Array.prototype.slice.call(arguments, 0);
    return ["fn", function (cb) {
      args.push(cb);
      fn.apply(undefined, args);
    }];
  };
};

// Make a function take a channel instead of a callback.
var chanify = exports.chanify = function (fn) {
  return function () {
    var args = Array.prototype.slice.call(arguments, 0)
      , ch = args.pop();
    args.push(function (err, val) {
      spawn(function* () {
        yield ch.put(val);
      });
    });
    fn.apply(undefined, args);
  };
};

// Force a process to quit.
var quit = exports.quit = function () {
  return ["quit"];
};
