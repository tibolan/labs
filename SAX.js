console.dir = function (what){
    for(var prop in what){
        console.log(prop +": "+ what[prop]);
    }
}


var fs = require("fs");
var sax = require("sax");
var filename = "testParser.html";
var INPUT = fs.readFileSync(filename, "utf-8");
var tree = sax.parser(true);
var a = tree.write(INPUT);

