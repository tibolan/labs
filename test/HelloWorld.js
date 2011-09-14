var http = require('http');
http.createServer(function (req, res) {
  res.writeHead(200, {'Content-Type': 'text/html'});
  res.end('Hello World\n<script>alert("red")</script>');
}).listen(1337, "127.0.0.1");
console.log('Server running at http://127.0.0.1:1337/');
console.warn(__filename);
console.info(__dirname);
