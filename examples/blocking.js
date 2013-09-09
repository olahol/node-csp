var csp = require("..");

var chan1 = new csp.Chan();

csp.spawn(function* () {
  console.log("will block");
  yield chan1.put("channel");
  console.log(yield chan1.take());
});
