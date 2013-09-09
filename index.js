var Chan = exports.Chan = function (size) {
  this.size   = size+1 || 1;
  this.buffer = [];
  this.drain  = false;
};

Chan.prototype.put = function (msg) {
  return ["chan", function () {
    if (this.drain && this.buffer.length === 0) {
      this.drain = false;
      return { state: "continue" };
    }

    if (this.buffer.length < this.size) {
      this.buffer.push(msg);
      this.drain = this.buffer.length === this.size;
      if (this.drain) {
        return { state: "sleep" };
      }
      return { state: "continue" };
    }

    return { state: "sleep" };
  }.bind(this)];
};

Chan.prototype.take = function () {
  return ["chan", function () {
    if (this.buffer.length === 0) {
      return { state: "sleep" };
    }
    return { state: "continue", msg: this.buffer.shift() };
  }.bind(this)];
};

var Proc = function (gen) {
  this.gen      = gen;
  this.step     = gen.next();
  this.done     = false;
  this.subprocs = [];
};

Proc.prototype.run = function () {
  if (this.step.done || this.done) {
    this.subprocs.forEach(function (proc) {
      proc.done = true;
    });

    return ;
  }

  var value = this.step.value
    , type = value[0]
    , fn = value[1];

  if (type === "chan") {
    var op = fn();
    if (op.state === "continue") {
      this.step = this.gen.next(op.msg);
    }
    return this.spin();
  }

  if (type === "fn") {
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

  if (type === "spawn") {
    this.step = this.gen.next();
    this.subprocs.push(fn);
    return this.spin();
  }

  if (type === "quit") {
    this.done = true;
    return this.spin();
  }
};

Proc.prototype.spin = function () {
  setImmediate(function () { this.run(); }.bind(this), 0);
};

var spawn = exports.spawn = function () {
  var args = Array.prototype.slice.call(arguments, 0)
    , gen = args.shift().apply(undefined, args)
    , proc = new Proc(gen);
  proc.run();
  return ["spawn", proc];
};

var select = exports.select = function () {
  var chans = Array.prototype.slice.call(arguments, 0);
  return ["chan", function () {
    for (var i=0; i < chans.length; i += 1) {
      var chan = chans[i];
      if (chan.buffer.length === 0) { continue; }
      return { state: "continue", msg: chan };
    }
    return { state: "sleep" };
  }];
};

var wait = exports.wait = function (ms) {
  return ["fn", function (cb) {
    setTimeout(cb, ms);
  }];
};

var wrap = exports.wrap = function (fn) {
  return function () {
    var args = Array.prototype.slice.call(arguments, 0);
    return ["fn", function (cb) {
      args.push(cb);
      fn.apply(undefined, args);
    }];
  };
};

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

var quit = exports.quit = function () {
  return ["quit"];
};
