var csp = require("..");

var chan1 = new csp.Chan()
  , chan2 = new csp.Chan()
  , quit = new csp.Chan();

csp.spawn(function* () {
  yield csp.wait(500);
  yield chan1.put("one");
});

csp.spawn(function* () {
  yield csp.wait(100);
  yield chan2.put("two");
});

csp.spawn(function* () {
  yield csp.wait(700);
  yield quit.put();
});

csp.spawn(function* () {
  var val;
  for (;;) {
    switch (yield csp.select(chan1, chan2, quit)) {
      case chan1:
        val = yield chan1.take();
        console.log("chan1");
        break;
      case chan2:
        val = yield chan2.take();
        console.log("chan2");
        break;
      case quit:
        yield quit.take();
        console.log("good bye.");
        return ;
    }
  }
});
