var sax = require("sax"),
  strict = true, // set to false for html-mode
  parser = sax.parser(strict),
  fs = require("fs");


parser.onopentag = function (node) {
  // opened a tag.  node has "name" and "attributes"
    console.log("open:", arguments)
};
parser.onclosetag = function (node) {
  // opened a tag.  node has "name" and "attributes"
    console.log("close:", node)
};
parser.ontext = function (node) {
  // opened a tag.  node has "name" and "attributes"
    console.log(node)
};

var t = fs.readFileSync("testParser.html", "utf-8");
parser.write(t).close();

