/**
 * @TODO: xsl in comment processing option (true parse xsl, false write chars)
 * @TODO: xsl:apply, xsl:templates
 * @TODO: test="exists(path.to.a.property)"
 * @TODO: disable_output_escaping
 * @TODO: supprimer &gt; et &lt;
 * @TODO: supprimer &gt; et &lt;
 *
 *
 * @TOEXPLAIN: space in test value between left, operand and right
 */


console.dir = function (item) {
    var txt = "";
    if (item.push) {
        for (var i = 0,l = item.length; i < l; i++) {
            txt += item[i] + "\n";
        }
    }
    else {
        for (var p in item) {
            txt += p + " = " + item[p] + "\n";
        }

    }
    console.log(txt);

}

// measure perf


/**
 *  @constructor XSLT
 * @param input -> sFile
 * @param output -> sFile
 * @param datas -> oJson
 */
function XSLT(input, output, datas) {
    this.datas = datas;
    this.destination = output;
    this.fs = require("fs");
    this.source = this.fs.readFileSync(input, "utf-8");
    this.templates = {}
    this.tmp = "";
    // clear old document
    try {
        this.fs.unlinkSync(this.destination);
    }
    catch(e) {

    }
}
;

/**
 * Public method for launch the transformation
 */
XSLT.prototype.transform = function () {
    this.tmp = this.parse(this.source, this.datas, null);
    this.fs.writeFileSync(this.destination, this.tmp, "utf-8");
    return this.fs.readFileSync(this.destination, "utf-8");
}
/**
 *
 * @param src String
 * @param from Int
 * @param to Int
 */
XSLT.prototype.parse = function (src, datas, vars) {
    var i = 0,
        ch = null,
        output = "";
    //
    this.lockComment = this.lockComment || false;

    // start parsing chars by chars the src
    while (ch = src.charAt(i++)) {
        //XSLT.PARSERCHARS += ch;
        // we listen to "<" char
        if (ch === "<" && !this.lockComment) {
            // check if it's the beginning of an xsl tag
            var isXSL = this.checkXSLTagOpen(src, i);
            // check if it's the beginning of an comment
            var isComment = this.checkCommentOpen(src, i);

            if (isXSL) {
                // built the object representing the node
                var oTag = this.extractXSLTag(src, i);
                // jump directly at the end of the tag
                i += oTag.length - 1;
                // processXSL
                var result = this.processXSL(oTag, datas, vars);
                // do not copy any char if processXSL return false, to eliminate the \n for non-printable command
                // ie:import, templates
                // TODO: DO NOT WORK, but to dig
                if(result) {
                    output += result;
                }
                // change i to this.tmp.
            }
            else if (isComment) {
                // lock the comment section xsl search
                this.lockComment = true;
                // push char
                output += ch;
            }
            else {
                output += ch;
            }
        }
        // we listen to ">" char
        else if (ch === ">") {
            // check if it's the end of an xsl tag
            var isXSL = this.checkXSLTagClose(src, i);
            // check if it's the end of an comment
            var isComment = this.checkCommentClose(src, i);

            if (isXSL) {
                // unlock
                this.lockWrite = Math.Infinite;
            }
            else if (isComment) {
                // unlock
                this.lockComment = false;
                output += ch;
            }
            else {
                output += ch;
            }
        }
        else if (ch) {
            output += ch;
        }
    }
    //console.log("output:", output);
    return output;
}

XSLT.prototype.checkXSLTagOpen = function (src, index) {
    // shorten the source and test it
    return XSLT.REGEX_OPEN_XSL.test(src.slice(index));
}

XSLT.prototype.checkCommentOpen = function (src, index) {
    // shorten the source and test it
    return XSLT.REGEX_OPEN_COMMENT.test(src.slice(index));
}

XSLT.prototype.checkXSLTagClose = function (src, index) {
    // shorten the source and test it
    return XSLT.REGEX_CLOSE_XSL.test(src.slice(0, index));
}

XSLT.prototype.checkCommentClose = function (src, index) {
    // shorten the source and test it
    return XSLT.REGEX_CLOSE_COMMENT.test(src.slice(0, index));
}

XSLT.prototype.extractXSLTag = function (src, index) {
    // shorten the source and test it
    var ext = (src.slice(index)).match(XSLT.REGEX_EXTRACT_XSL_TAG);
    var oTag = this.getXSLTagObject(src, ext, index);
    return oTag;
}

XSLT.prototype.readAttributeFromString = function (str) {
    var match = str.match(XSLT.REGEX_SPLIT_ATTRIBUTE);
    if (match) {
        return [match[1],match[2]];
    }
    return false;
}

/**
 * build an object representing the xsl tag
 * @param match
 * @param index
 */

XSLT.prototype.getXSLTagObject = function (src, match, index) {
    var o = {};
    o.cmd = match[1];
    o.attributes = this.extractAttribute(match[2])
    o.wholeString = this.findWholeTag(src, index, o.cmd);
    o.length = o.wholeString.length;
    //o.openTag = match[0];

    return o;
}

/**
 * extract an attribute object from string
 * @param str
 */
XSLT.prototype.extractAttribute = function (str) {
    // clear all space in attribute value
    str = str.replace(XSLT.REGEX_CLEAN_SPACE_IN_ATTRIBUTE, function() {
        return arguments[2].replace(/ /g, "");
    });
    //
    var o = {};

    // separate attribute
    var sp = str.split(" ");

    for (var i = 0,l = sp.length; i < l; i++) {
        var attr = sp[i];
        // split attribyte as key/value
        var kv = this.readAttributeFromString(attr);
        // store
        if (kv) {
            o[kv[0]] = kv[1];
        }
    }


    return o;
}

/**
 * write in the Buffer
 * @param str
 */
XSLT.prototype.processXSL = function (oTag, datas, vars) {
    switch (oTag.cmd) {
        case "value-of":
            return this.objectPropertyPointer(oTag.attributes.select, datas, vars);
        case  "if":
            var ok = this.evalTest(oTag.attributes.test, datas, vars);
            if (ok) {
                return this.parse(this.getInnerTag(oTag.cmd, oTag.wholeString), datas, vars);
            }
            else {
                return "";
            }
        case  "for-each":
            var select = this.objectPropertyPointer(oTag.attributes.select, datas, vars);
            var out = "";
            var inner = this.getInnerTag(oTag.cmd, oTag.wholeString);
            for (var i = 0, l = select.length; i < l; i++) {
                var obj = select[i];
                out += this.parse(inner, obj, vars);
            }
            return out;
        // when are manually treated for simulate break in switch/case
        case "choose":
            var src = this.getInnerTag(oTag.cmd, oTag.wholeString);
            var whens = src.split("</xsl:when>");
            var OneWhenOK = false;
            for (var i = 0, l = whens.length; i < l; i++) {
                if (i != l - 1) {
                    var when = whens[i];
                    var test = when.match(/test=(['"])(.*?)\1/)[2].replace(/\s/g, "");
                    var ok = this.evalTest(test, datas, vars);
                    if(ok){
                        OneWhenOK = true;
                        var inner = this.getInnerTag(oTag.cmd, when);
                        return this.parse(inner, datas, vars);
                    }
                    else {
                        continue;
                    }

                }
            }

            if(!OneWhenOK){
                var otherwise = src.split("<xsl:otherwise>");
                var wholeTag = "<xsl:otherwise>" + otherwise[1];
                return this.parse(wholeTag, datas);
            }
            break;
        case "otherwise":
            return this.parse(this.getInnerTag(oTag.cmd, oTag.wholeString), datas, true);
        case "import":
            var src = oTag.attributes.href;
            return this.parse(this.fs.readFileSync(src, "utf-8"), datas, true);
        case "template":
            this.templates[oTag.attributes.name] = this.getInnerTag(oTag.cmd, oTag.wholeString);
            return false;
        case "apply-templates":
            var tpl = oTag.attributes.select;
            var inner = this.getInnerTag(oTag.cmd, oTag.wholeString);

            vars = {};

            // with-param
            if(inner.length){
                var sp = inner.split("</xsl:with-param>");
                for (var i = 0, l = sp.length; i < l; i++) {
                    var param = sp[i];
                    var tmp = param.match(/name=(['"])(.*?)\1.*?>(.*)$/);
                    if(tmp){
                        vars[tmp[2]] = tmp[3];
                    }
                }
            }


            return this.parse(this.templates[tpl], datas, vars);
        default:
            return "<xsl:unknow />";
    }
}

/**
 *
 * @param test: the test attribute as string without space (cause of splitting on space on extractAttribute method)
 * @param datas: the data scoping the test
 * @use
 */

XSLT.prototype.evalTest = function (test, datas, vars) {

    // transform &gt; en >
    test = test.replace(/&gt;/g, ">");
    // transform &lt; en <
    test = test.replace(/&lt;/g, ">");
    // transform = en ==
    test = test.replace(/([^!<>=])=([^!<>=])/g, "$1==$2");

    var fnToExec = test.match(/(\w+)\(((["'])(\w+)\3)\)/);
    if (fnToExec) {
        test = test.replace(fnToExec[0], eval(fnToExec[1]).apply(datas, [fnToExec[4]]));
    }

    var _self = this;
    var test = test.replace(/([^!<>=&])*/g, function () {
        var str = arguments[0];
        if (!str) return "";
        return _self.objectPropertyPointer(str, datas, vars) || str;
    });


    //console.log("evaluated test:", test);
    return eval(test);
}

/**
 * reach the value of the property of object, selected by path
 * @param path: the path of the property searched
  * @param datas: the datas to search in
  * @param vars: the local vars to know
 * @use:
 *      var object = {
 *          o2: {
 *              o3: {
 *                  property: "value"
 *              }
 *          }
 *      }
 *      this.objectPropertyPointer("o2.o3.property", datas, vars ); // return "value";
 */
XSLT.prototype.objectPropertyPointer = function (path, datas, vars) {

    var target = datas;
    var predica = path.match(/(\w+(\[(.*?)\]))/);
    var _self = this;

    // if path is a vars instead of a path to property
    var isVar = path.match(/^(\$)(.*)$/);
    if(isVar){
        return vars[isVar[2]];
    }


    if (predica) {
        path = path.substring(0, path.length - predica[2].length);
    }

    if (path != ".") {
        var sp = path.split(".");
        for (var i = 0,l = sp.length; i < l; i++) {
            target = target[sp[i]];
            if (!target) break;
        }
    }

    if (predica) {
        target = target.filter(function (item, index) {
            if (_self.evalTest(predica[3], item)) {
                return true;
            }
            return false;
        });
    }

    return target;
}

XSLT.prototype.getInnerTag = function (cmd, str) {
    var start = str.indexOf(">") + 1;
    var end = cmd.length + 7; // </xsl:>
    var l = str.length;
    return str.slice(start, l - end).trim();
}
/**
 * Extract the whole tag from the open tag to the close tag as string
 * @param startIndex
 * @param tagName
 */
XSLT.prototype.findWholeTag = function (src, startIndex, tagName) {
    var src = src.slice(startIndex);
    var out = "<";

    switch (tagName) {
        // value-of is autoclose tag
        case "import":
        case "value-of":
            out += src.match(XSLT.REGEX_EXTRACT_XSL_TAG)[0];
            break;
        case "apply-templates":
            var ioClose = src.indexOf("/>");
            var ioOpen = src.indexOf("<");
            if(ioClose != -1 && ioClose < ioOpen){
                out += src.match(XSLT.REGEX_EXTRACT_XSL_TAG)[0];
                break;
            }
        // do not break here, if apply-template is not an autoclose tag (if param)
        default:
            var openTag = "<xsl:" + tagName;
            var closeTag = "</xsl:" + tagName + ">";
            var ioClose = src.indexOf(closeTag);
            var ioOpen = src.indexOf(openTag);
            //
            if (ioOpen == -1) {
                ioOpen = Math.Infinite;
            }
            // if we found a open before a close we are nested
            var nested = ioClose > ioOpen;

            // if same xsl tag is nested in the current tag (ie: xsl:if inside a xsl:if);
            if (nested) {
                // build regexp match both open and close
                var re = openTag + "|" + closeTag;
                //
                var tagMatch = src.match(new RegExp(re, "g"));
                var nNested = 1;
                var open = 1;

                // find the position of the closeTag of the current node, ignoring nested one
                for (var i = 0,l = tagMatch.length; i < l; i++) {
                    // if we loop on open, increment nNested and open
                    if (tagMatch[i] == openTag) {
                        nNested++;
                        open++;
                    }
                    // if we loop on close, decrement nNested
                    else {
                        nNested--;
                    }
                    // if nNested reach 0, that mean we found the closeTag of the current tag, with nested one
                    if (nNested <= 0) break;
                }
                // split the source on closeTag
                var sp = src.split(closeTag);
                // build the output since i < number of nested
                for (var i = 0; i < open; i++) {
                    out += sp[i] + closeTag
                }
            }
            // if not nested
            else {
                out += src.slice(0, ioClose) + closeTag;
            }
    }


    return out;
}


XSLT.REGEX_OPEN_XSL = /^<?xsl:/;
XSLT.REGEX_CLOSE_XSL = /\/xsl:[^>]*?>$/;
XSLT.REGEX_CLOSE_COMMENT = /-->$/;
XSLT.REGEX_OPEN_COMMENT = /^!--/;

XSLT.REGEX_EXTRACT_XSL_TAG = /^xsl:([a-z-]*) ?((.)*?)\/?>/;
XSLT.REGEX_EXTRACT_INNER_TAG = /^<xsl:[a-z-]* ?((.)*?)\/?>/;
XSLT.REGEX_CLEAN_SPACE_IN_ATTRIBUTE = /(['"])(.*?)(\1)/g;
XSLT.REGEX_SPLIT_ATTRIBUTE = /([^=]*?)=(.*)/;
XSLT.REGEX_XSL_ATTRIBUTE = /([^=]*?)=(.*)/;
// test
XSLT.PARSERCHARS = "";

/**
 * TEST
 */


var input = "testParser.html",
    output = "generatedPage.html";
var StartTime = (new Date).getTime();

var xsl = new XSLT(input, output, {
    title:"test test test",
    id: 4,
    id2: 5,
    test: {
        retest: {
            toto: "cheeeeeeeeeeeeeze",
            test: 999
        }
    },
    users: [
        {id: 1, name:"tata", hobbies: ["athletism"]},
        {id: 2, name:"tete", hobbies: ["basket", "baseball", "beachVolley"]},
        {id: 3, name:"titi", hobbies: ["cricket", "curling", "climbing"]},
        {id: 4, name:"toto", hobbies: ["diving", "dining"]}
    ]

});
var out = xsl.transform();
var EndTime = (new Date).getTime();
console.log("\n*** File \"" + xsl.destination + "\" have been generated in", EndTime - StartTime, "ms. ***");
function normalizeWhiteSpace(what) {
    console.log("WHAT:", what.match(/^\W*(.*)/))
    return what.replace(/^\W*|\W*$/g, "");
}

function exists(what) {
    return typeof XSLT.prototype.objectPropertyPointer.apply(XSLT.prototype, [what, this]) != "undefined";
}