// Initialization and Requirements
const express = require('express');
const path = require('path');
const app = express();
const server = require('http').createServer(app);
let SocketIO = require('./Classes/SocketIO.js');
new SocketIO(server);

// Setting Up Express App
app.use(express.static(__dirname + '/Client'));

// Express Routes
app.get('/', function(req, res){
    res.sendFile(path.join(__dirname, 'Client', 'index.html'));
});

server.listen((process.env.PORT), () => {
    console.log("Server Running on Port: " + process.env.PORT);
});