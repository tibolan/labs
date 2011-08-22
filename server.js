var sys = require("sys"),
    http = require("http"),
    url = require("url"),
    path = require("path"),
    fs = require("fs");

http.createServer(function(request, response) {

    //console.dir(response);

    var uri = url.parse(request.url).pathname;

    // noindexes
    if(uri == "/") {uri = "/index.html"};


    var filename = path.join(process.cwd(), uri);

    path.exists(filename, function(exists) {
    	if(!exists) {
    		response.writeHead(404, {"Content-Type": "text/plain"});
    		response.write("404 Not Found\n");
    		response.end();
    		return;
    	}

    	fs.readFile(filename, "binary", function(err, file) {
    		if(err) {
    			response.writeHead(500, {"Content-Type": "text/plain"});
        			response.write(err + "\n");
    			response.end();
    			return;
    		}

    		response.writeHead(200);
    		response.write(file, "binary");
    		response.end();
    	});
    });
}).listen(1177);

sys.puts("Server running at http://localhost:1177/");
