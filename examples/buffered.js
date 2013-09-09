var csp = require("..");

var chan1 = new csp.Chan(2);

csp.spawn(function* () {
  yield chan1.put("buffered");
  yield chan1.put("channel");

  console.log(yield chan1.take());
  console.log(yield chan1.take());
});
