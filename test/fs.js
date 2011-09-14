var filename = "HelloWorld.js";
var fs = require('fs');

var s = fs.ReadStream(filename);



fs.unlink('./circle.js', function (err) {
  if (err) throw err;
  console.log('successfully deleted /tmp/hello');
});
s.on('data', function(d) {
    console.log("DATA:",d);
    console.dir(arguments);
});

s.on('end', function(d) {
  console.log("END:"+ d + '  ' + filename);
  console.dir(arguments);
});