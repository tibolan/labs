/*
 * jeu de données
 * */

var DATAS = {
    title: "Poney !",
    url : "home",
    id: 5,
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

var START = new Date();
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


for(var a in root) console.log(a);
return;


/*
 * START
 * */
build(null, root, 0, DATAS);


/*
 * function recursive servant a parser le DOM
 * */
function build(parent, node, index, datas) {
    if (!parent) parent = node;
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
    switch (cmd) {
        case "value-of":
            // replace value-of
            var repl = new ET.SubElement(parent, "xsl:done");
            repl.text = pointer2obj(node.get("select"), datas);
            // remove xsl node
            parent.remove(null, node);
            break;
        case "if":
            break;
            var test = node.get("test");
            var sp = test.split(" ");
            var data = pointer2obj(sp[0], datas);
            console.log(node);
            var ok = evalTest(data, sp[1], sp[2]);
            if (ok) {
                var ch = node._children;
                var ctn = new et.ElementTree();
                //var clone = cloneNode(ch, true);


                /*for (var i = ch.length; i > 0; i--) {
                 var elm = ch[i - 1];
                 var repl = cloneNode(elm, true);
                 parent.insert(index, repl);
                 repl.text = elm.text;
                 // TODO build le contenu genere
                 }*/
            }
            parent.remove(null, node);
            break;
        case "for-each":
            var targets = node.get("select"),
                tg = pointer2obj(targets, datas),
                ch = node._children;

            for (var i = 0,l = tg.length; i < l; i++) {
                replaceWithChildren(node, parent, index, tg[i]);
            }
            parent.insert(index, ctn);
            break;
    }
}


function replaceWithChildren(who, whoparent, index, datas) {
    var replacer = new ET.Element("xsl:done"),
        ch = who._children;
    for (var i = 0; i < ch.length; i++) {
        var child = ch[i];
        if (tree.iselement(child)) {
            var clone = cloneNode(child, true);
            replacer.append(clone);
            build(replacer, clone, i, datas);
        }
    }
    whoparent.insert(index, replacer);
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


function pointer2obj(sPointer, oScope) {
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
console.dir(tree._children);


console.log(tree.write());

/* not to good... */
//txt = txt.replace(/<\/?xsl:done\/?>/g, "");
/* no too good too ...*/
/*txt = txt.replace(/(\/>)|(\/\w+>)/g, function (m) {
 return m + '\n';
 });*/

/*
 * save file-
 * */
/*var OUTPUT = fs.writeFile("page.html", txt, function(err) {
 if (err) {
 console.log(err);
 } else {
 console.log("The file was saved!");
 }
 console.log("-----------------------------------*\n duration:" + (new Date - START) + "msl\n-----------------------------------*");
 });*/


