var app = require('http').createServer(handler)
    , io = require('socket.io').listen(app)
    , fs = require('fs')
    , mongoose = require('mongoose'),
    Schema = mongoose.Schema;

mongoose.connect('mongodb://localhost/my_database');

var MouseStorage = new Schema({
    timestamp       : { 'type': Date, 'default':Date.now},
    x               : Number,
    y               : Number
});


var Mouse = mongoose.model('MouseStorage', MouseStorage);


app.listen(1177);

function handler(req, res) {
    fs.readFile('index.html',
        function (err, data) {
            if (err) {
                res.writeHead(500);
                return res.end('Error loading index.html');
            }

            res.writeHead(200);
            res.end(data);
        });
}

io.sockets.on('connection', function (socket) {
        socket.volatile.emit('bye', "byebye");


    socket.on('mouse', function (data) {
        var s = new Mouse();
        s.x = data.x;
        s.y = data.y;
        s.timestamp = data.timestamp;
        console.log("******************************************", s);
        s.save(function(e){
        //    console.log(e);
        })
    });

    socket.on('disconnect', function () {
        
    })




});



setInterval(function (){
    Mouse.count(function (err, docs){
        console.log('_|_', docs);
    });
}, 1000);