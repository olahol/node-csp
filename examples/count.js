var fs = require("fs");

var csp = require("..");

var chan1 = new csp.Chan();

var read = csp.wrap(fs.readFile);

csp.spawn(function* () {
  try {
    var src = yield read(__filename, { encoding: "utf-8" })
      , lines = src.split("\n");
  } catch (e) {
    yield chan1.put(null);
    return console.log("Error: " + e.message);
  }

  for (var i = 0; i < lines.length; i++) {
    yield chan1.put(lines[i]);
  }

  yield chan1.put(null);
});

csp.spawn(function* () {
  var count = 0
    , line = "";

  for (;;) {
    line = yield chan1.take();
    if (line === null) { break; }
    count += 1;
  }

  console.log("Line count " + count);
});
