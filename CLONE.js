/*
 * require & vars
 * */

var fs = require("fs");
var ET = require("elementtree");
var filename = "testParser2.html";
var INPUT = fs.readFileSync(filename, "utf-8");

var tree = new ET.ElementTree;
tree.parse(INPUT);

var root = tree.getroot()
var div = root.find("div");

var cl = cloneNode(div, true);
replaceWithChildren(div, root, 0, {toto: "prout"})

console.log(tree.write());



function replaceWithChildren(who, whoparent, index, datas) {
    var replacer = new ET.Element("xsl:done"),
        ch = who._children;
    for (var i = 0; i < ch.length; i++) {
        var child = ch[i];
        var clone = cloneNode(child, true);
        replacer.append(clone);
        //build(replacer, clone, i, datas);

    }
    whoparent.remove(null, who);
    whoparent.setSlice(0,1, replacer._children);
}


function cloneNode(original, deep) {
    var newOne = new ET.Element(original.tag, original.attrib);
    if (deep) {
        for (var i = 0,ch = original._children,l = ch.length; i < l; i++) {
            newOne.append(cloneNode(ch[i], true));
        }
    }
    else {
        newOne.text = original.text;
    }
    return newOne;
}

