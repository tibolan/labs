var StartTime = new Date;
var sugar = require("sugar");

/**
 *
 * @param input -> sFile
 * @param output -> sFile
 * @param datas -> oJson
 */
var xslt = function (input, output, datas) {
    this.fs = require("fs");
    this.source = this.fs.readFileSync(input, "utf-8");
    this.destination = output;
    this.tmp = "";
    this.datas = datas;
    // clear old document
    this.fs.unlinkSync(this.destination);
    
};

xslt.prototype.transform = function () {
    this.parse(this.source, 0, null);
    this.fs.writeFileSync(this.destination, this.tmp, "utf-8");
    return this.fs.readFileSync(this.destination, "utf-8");
}
xslt.prototype.parse = function (src, from, to) {
    var i           = from,
        ch          = null,
        lockedTill  = -1,
        output      = "";

    this.lockComment = false;
    this.lockWrite = false;
    while ((ch = src.charAt(i++)) && ((to) ? i<=to : true)) {
        if (ch === "<" && !this.lockComment) {
            var isXSL = this.checkXSLTagOpen(i);
            var isComment = this.checkCommentOpen(i);
            //console.log(isXSL, isComment, isDoctype);
            //var isCDATA = this.checkCData(i);
            if (isXSL) {
                // find whole tag string
                var oTag = this.extractXSLTag(i);
                this.lockWrite = true;
                // processXSL
                // replace in this.tmp
                // change i to this.tmp.
            }
            else if(isComment){
                this.lockComment = true;
                this.pushInDestination(ch);
            }
            else {
                this.pushInDestination(ch);
            }
        }
        else if (ch === ">"){
            // closeTag
            var isXSL = this.checkXSLTagClose(i);
            var isComment = this.checkCommentClose(i);

            if(isXSL){
                this.lockWrite = false;
            }
            else if(isComment){
                this.lockComment = false;
                this.pushInDestination(ch);
            }
            else {
                this.pushInDestination(ch);
            }
            // unlock
        }
        else if (ch) {
            this.pushInDestination(ch);
        }
    }
}

xslt.prototype.checkXSLTagOpen = function (index) {
    // shorten the source and test it
    return xslt.REGEX_OPEN_XSL.test(this.source.slice(index));
}

xslt.prototype.checkDoctypeOpen = function (index) {
    // shorten the source and test it
    return xslt.REGEX_OPEN_DOCTYPE.test(this.source.slice(index));
}

xslt.prototype.checkCommentOpen = function (index) {
    // shorten the source and test it
    return xslt.REGEX_OPEN_COMMENT.test(this.source.slice(index));
}

xslt.prototype.checkXSLTagClose = function (index) {
    // shorten the source and test it
    return xslt.REGEX_CLOSE_XSL.test(this.source.slice(0, index));
}

xslt.prototype.checkDoctypeClose = function (index) {
    // shorten the source and test it
    return xslt.REGEX_CLOSE_DOCTYPE.test(this.source.slice(0, index));
}

xslt.prototype.checkCommentClose = function (index) {
    // shorten the source and test it
    return xslt.REGEX_CLOSE_COMMENT.test(this.source.slice(0, index));
}

xslt.prototype.extractXSLTag = function (index) {
    // shorten the source and test it
    //console.log(this.source.slice(index));
    var ext = (this.source.slice(index)).match(xslt.REGEX_EXTRACT_XSL_TAG);
    var oTag = this.getXSLTagObject(ext, index);
    //console.log(oTag);
    return oTag;
}

xslt.prototype.getXSLTagObject = function (match, index) {
    var o = {};
    o.cmd = match[1];
    o.attributes = this.extractAttribute(match[2])
    o.length = match[0].length + 1;
    o.wholeString = this.findWholeTag(index,o.cmd);
    return o;
}

xslt.prototype.extractAttribute = function (str) {
    // clear all space in attribute value
    str = str.replace(xslt.REGEX_CLEAN_SPACE_IN_ATTRIBUTE, function() {
        return arguments[2].replace(/ /g, "");
    })

    var o = {};
    var sp = str.split(" ");
    
    for(var i=0,l=sp.length;i<l;i++){
        var attr = sp[i];
        var kv = this.readAttributeFromString(attr);
        if(kv){
            o[kv[0]] = kv[1];
        }
    }


    return o;
}

xslt.prototype.pushInDestination = function (str) {
    this.tmp += str;
}

xslt.prototype.readAttributeFromString = function (str) {
    var match = str.match(xslt.REGEX_SPLIT_ATTRIBUTE);
    if(match){
        return [match[1],match[2]];
    }
    return false;
}

xslt.prototype.findWholeTag = function (startIndex, tagName) {
    var src = this.source.slice(startIndex);
    switch(tagName){
        case "value-of":
            break;

    }

}




xslt.REGEX_OPEN_XSL = /^xsl:/;
xslt.REGEX_CLOSE_XSL = /\/xsl:[^>]*?>$/;
xslt.REGEX_OPEN_DOCTYPE = /^!DOCTYPE/;
xslt.REGEX_CLOSE_DOCTYPE = /^<!DOCTYPE [^>]*?>$/;
xslt.REGEX_CLOSE_COMMENT = /-->$/;
xslt.REGEX_OPEN_COMMENT = /^!--/;
xslt.REGEX_EXTRACT_XSL_TAG = /^xsl:([a-z-]*) ?((.)*?)\/?>/;
xslt.REGEX_CLEAN_SPACE_IN_ATTRIBUTE = /(['"])(.*?)(['"])/g;
xslt.REGEX_SPLIT_ATTRIBUTE = /([^=]*?)=(.*)/;

var input = "testParser.html",
    output = "generatedPage.html";

var xsl = new xslt(input, output, {test:"test"});
var out = xsl.transform();
//console.log(out);


console.log("\n\nFile \""+ xsl.destination +"\" have been generated in", (new Date)-StartTime, "ms.");