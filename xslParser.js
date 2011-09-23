// measure perf
var StartTime = new Date;
// import sugar 4 js
//var sugar = require("sugar");

/**
 *  @constructor XSLT
 * @param input -> sFile
 * @param output -> sFile
 * @param datas -> oJson
 */
function XSLT (input, output, datas) {
    this.fs = require("fs");
    this.source = this.fs.readFileSync(input, "utf-8");
    this.destination = output;
    this.tmp = "";
    this.datas = datas;
    // clear old document
    try{
        this.fs.unlinkSync(this.destination);
    }
    catch(e){}


};

/**
 * Public method for launch the transformation
 */
XSLT.prototype.transform = function () {
    this.parse(this.source, 0, null);
    this.fs.writeFileSync(this.destination, this.tmp, "utf-8");
    return this.fs.readFileSync(this.destination, "utf-8");
}
/**
 *
 * @param src String
 * @param from Int
 * @param to Int
 */
XSLT.prototype.parse = function (src, from, to) {
    var i           = from,
        ch          = null,
        lockedTill  = -1,
        output      = "";
    //
    this.lockComment = this.lockComment || false;

    // start parsing chars by chars the src
    while ((ch = src.charAt(i++)) && ((to) ? i<=to : true)) {
        // exit from the loop, all xsl transfo
        if(i<=this.lockWrite){
            continue;
        }
        // we listen to "<" char
        else if (ch === "<" && !this.lockComment) {
            // check if it's the beginning of an xsl tag
            var isXSL = this.checkXSLTagOpen(i);
            // check if it's the beginning of an comment
            var isComment = this.checkCommentOpen(i);

            if (isXSL) {
                // built the object representing the node
                var oTag = this.extractXSLTag(i);

                // lock the while until the tag parsing is finish
                this.lockWrite = i + oTag.length -1;

                // processXSL
                // replace in this.tmp
                this.pushInDestination("<xsl:"+oTag.cmd+"/>");
                // change i to this.tmp.
            }
            else if(isComment){
                // lock the comment section xsl search
                this.lockComment = true;
                // push char
                this.pushInDestination(ch);
            }
            else {
                this.pushInDestination(ch);
            }
        }
        // we listen to ">" char
        else if (ch === ">"){
            // check if it's the end of an xsl tag
            var isXSL = this.checkXSLTagClose(i);
            // check if it's the end of an comment
            var isComment = this.checkCommentClose(i);

            if(isXSL){
                // unlock
                this.lockWrite = Math.Infinite;
            }
            else if(isComment){
                // unlock
                this.lockComment = false;
                this.pushInDestination(ch);
            }
            else {
                this.pushInDestination(ch);
            }
        }
        else if (ch) {
            this.pushInDestination(ch);
        }
    }
}

XSLT.prototype.checkXSLTagOpen = function (index) {
    // shorten the source and test it
    return XSLT.REGEX_OPEN_XSL.test(this.source.slice(index));
}

XSLT.prototype.checkDoctypeOpen = function (index) {
    // shorten the source and test it
    return XSLT.REGEX_OPEN_DOCTYPE.test(this.source.slice(index));
}

XSLT.prototype.checkCommentOpen = function (index) {
    // shorten the source and test it
    return XSLT.REGEX_OPEN_COMMENT.test(this.source.slice(index));
}

XSLT.prototype.checkXSLTagClose = function (index) {
    // shorten the source and test it
    return XSLT.REGEX_CLOSE_XSL.test(this.source.slice(0, index));
}

XSLT.prototype.checkDoctypeClose = function (index) {
    // shorten the source and test it
    return XSLT.REGEX_CLOSE_DOCTYPE.test(this.source.slice(0, index));
}

XSLT.prototype.checkCommentClose = function (index) {
    // shorten the source and test it
    return XSLT.REGEX_CLOSE_COMMENT.test(this.source.slice(0, index));
}

XSLT.prototype.extractXSLTag = function (index) {
    // shorten the source and test it
    var ext = (this.source.slice(index)).match(XSLT.REGEX_EXTRACT_XSL_TAG);
    var oTag = this.getXSLTagObject(ext, index);
    return oTag;
}

XSLT.prototype.readAttributeFromString = function (str) {
    var match = str.match(XSLT.REGEX_SPLIT_ATTRIBUTE);
    if(match){
        return [match[1],match[2]];
    }
    return false;
}

/**
 * build an object representing the xsl tag
 * @param match
 * @param index
 */

XSLT.prototype.getXSLTagObject = function (match, index) {
    var o = {};
    o.cmd = match[1];
    o.attributes = this.extractAttribute(match[2])
    o.wholeString = this.findWholeTag(index, o.cmd);
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
    })
    // 
    var o = {};
    
    // separate attribute
    var sp = str.split(" ");
    
    for(var i=0,l=sp.length;i<l;i++){
        var attr = sp[i];
        // split attribyte as key/value
        var kv = this.readAttributeFromString(attr);
        // store
        if(kv){
            o[kv[0]] = kv[1];
        }
    }


    return o;
}

/**
 * write in the Buffer
 * @param str
 */
XSLT.prototype.pushInDestination = function (str) {
    this.tmp += str;
}

/**
 * Extract the whole tag from the open tag to the close tag as string
 * @param startIndex
 * @param tagName
 */


XSLT.prototype.findWholeTag = function (startIndex, tagName) {
    var src = this.source.slice(startIndex);
    var out = "<";
    switch(tagName){
        // value-of is autoclose tag
        case "value-of":
            out += src.match(XSLT.REGEX_EXTRACT_XSL_TAG)[0];
            break;
        default:
            var openTag     = "<xsl:"+tagName;
            var closeTag    = "</xsl:"+tagName+">";
            var ioClose     = src.indexOf(closeTag);
            var ioOpen      = src.indexOf(openTag);
            if(ioOpen == -1) {
                ioOpen = Math.Infinite;
            }

            var nested      =  ioClose > ioOpen;

            // if same xsl tag is nested in the current tag (ie: xsl:if inside a xsl:if);

            if(nested){
                var re = openTag +"|"+ closeTag;
                var nbOpen = src.match(new RegExp(re, "g"));
                var nNested = 1;

                for(var i=0,open=1,l=nbOpen.length;i<l;i++){
                    //console.log(i,":",nbOpen[i], openTag)
                    if(nbOpen[i] == openTag){
                        nNested++;
                        open++;
                    }
                    else {
                        nNested--;
                    }
                    if(nNested <= 0) break;
                }


                var re2 = new RegExp("(.+?\\/xsl:"+tagName+">){"+(open)+"}", "g");

                /*
                               /^(.*?\/xsl:if>){3}/g;

                            */


                console.log(re2)
                console.log(src.match(re2))



                
                
            }
            else {
                out += src.slice(0, ioClose) + closeTag;
            }
    }
    return out;

}




XSLT.REGEX_OPEN_XSL = /^xsl:/;
XSLT.REGEX_CLOSE_XSL = /\/xsl:[^>]*?>$/;
XSLT.REGEX_OPEN_DOCTYPE = /^!DOCTYPE/;
XSLT.REGEX_CLOSE_DOCTYPE = /^<!DOCTYPE [^>]*?>$/;
XSLT.REGEX_CLOSE_COMMENT = /-->$/;
XSLT.REGEX_OPEN_COMMENT = /^!--/;

XSLT.REGEX_EXTRACT_XSL_TAG = /^xsl:([a-z-]*) ?((.)*?)\/?>/;
XSLT.REGEX_CLEAN_SPACE_IN_ATTRIBUTE = /(['"])(.*?)(['"])/g;
XSLT.REGEX_SPLIT_ATTRIBUTE = /([^=]*?)=(.*)/;
XSLT.REGEX_XSL_ATTRIBUTE = /([^=]*?)=(.*)/;


/**
 * TEST
 */


var input = "testParser.html",
    output = "generatedPage.html";

var xsl = new XSLT(input, output, {test:"test"});
var out = xsl.transform();



console.log("\n\nFile \""+ xsl.destination +"\" have been generated in", (new Date)-StartTime, "ms.");