/*
 * jeu de données
 * */

var DATAS = {
    title: "Poney !",
    url : "home",
    users: [
        {
            name: "tibo",
            nickname: "tibolan",
            array: [1,2,3]
        },

        {
            name: "toto",
            nickname: "tototo",
            array: [4,5,6]
        },

        {
            name: "tata",
            nickname: "tatata",
            array: [7,8,9]
        }

    ]
}


/*
 * require & vars
 * */

var fs = require("fs");
var ET = require("elementtree");
var filename = "testParser.html";
var INPUT = fs.readFileSync(filename, "utf-8");

var tree = new ET.ElementTree;
tree.parse(INPUT);
var root = tree.getroot()


/*
 * START
 * */
build(null, root, 0, DATAS);


/*
 * function recursive servant a parser le DOM
 * */
function build(parent, node, index, datas) {
    if (!parent) parent = node;
    //console.log(parent.tag, node.tag);
    var tag = node.tag,
        isXsl = tag.match(/^xsl:([^ ]*)/),
        cmd = isXsl ? isXsl[1] : null,
        children = node.getchildren();

    if (isXsl) {
        processXsl(parent, node, index, cmd, datas);
    }
    else {
        for (var i = children.length; i > 0; i--) {
            build(node, children[i - 1], i - 1, datas);
        }
    }
}


/*
 * XSL engine
 * */
function processXsl(parent, node, index, cmd, datas) {
    //console.log("XSL:", cmd, parent.tag, node.tag, datas)
    switch (cmd) {
        case "value-of":
            // replace value-of
            var repl = new ET.SubElement(parent, "xsl:done");
            repl.text = pointer2obj(node.get("select"), datas);
            // remove xsl node
            parent.remove(null, node);
            break;
        case "if":
            var test = node.get("test");
            var sp = test.split(" ");
            var data = pointer2obj(sp[0], datas);
            var ok = evalTest(data, sp[1], sp[2]);
            if (ok) {
                var ch = node._children;
                for (var i = ch.length; i > 0; i--) {
                    var elm = ch[i - 1];
                    var repl = parent.makeelement(elm.tag, elm.keys());
                    parent.insert(index, repl);
                    repl.text = elm.text;
                }
            }
            parent.remove(null, node);
            break;
        case "for-each":
            var targets = node.get("select");
            var tg = pointer2obj(targets, datas);
            var ch = node._children;

            var ctn = new ET.Element("xsl:done");
            for (var i = 0; i < tg.length; i++) {
                var obj = tg[i];
                for (var j = 0,l = ch.length; j < l; j++) {
                    var child = ch[j];
                    var clone = cloneNode(child, true);
                    var ctn2 = new ET.Element("xsl:done");
                    ctn2.append(clone);
                    build(ctn2, clone, 0, obj);
                    ctn.append(ctn2);
                }
            }
            parent.insert(index, ctn);
            break;
    }
}


/*
 * eval test
 * */


function evalTest(left, operator, right) {
    right = right.replace(/\'/g, "")
    if (operator == "=") operator = "==";
    return eval("'" + left + "'" + operator + "'" + right + "'");
}


function cloneNode(original, deep) {
    var newOne = new ET.Element(original.tag, original.attrib);
    newOne.text = original.text;
    if (deep) {
        for (var i = 0,ch = original._children,l = ch.length; i < l; i++) {
            newOne.append(cloneNode(ch[i], true));
        }
    }
    return newOne;
}


function pointer2obj(sPointer, oScope) {
    console.log(oScope)
    var target = oScope;
    if (sPointer != ".") {
        var sp = sPointer.split(".");
        //console.log(sp);

        for (var i = 0,l = sp.length; i < l; i++) {
            target = target[sp[i]];
            if (!target) break;


        }

    }
    return target;
}


/*
 * recuperation du doc sous forme de string
 * */
var txt = tree.write();
//console.log(tree.write());

/* not to good... */
txt = txt.replace(/<\/?xsl:done\/?>/g, "");

/*
 * save file
 * */
var OUTPUT = fs.writeFile("page.html", txt, function(err) {
    if (err) {
        console.log(err);
    } else {
        console.log("The file was saved!");
    }
});


