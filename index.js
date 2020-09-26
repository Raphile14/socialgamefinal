// Initialization and Requirements
let shortID = require('shortid');
const express = require('express');
const path = require('path');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

// Import Custom Classes
let Player = require('./Classes/Player.js');
let Lobby = require('./Classes/Lobby.js');

// Variables
let playersOnline = 0;
// Storage for all Connected Players
let players = [];
// Storage for all Connected Sockets
let sockets = [];
// Storage for all Created and Ongoing Game Lobbies
let lobbies = [];

// Setting Up Express App
app.use(express.static(__dirname + '/Client'));

// Express Routes
app.get('/', function(req, res){
    res.sendFile(path.join(__dirname, 'Client', 'index.html'));
});

// Socket.IO Connection
io.on('connection', function(socket){
    // Instantiate Player
    let player = new Player();
    let playerID = player.id;

    // Store this Player to a Dictionary
    players[playerID] = player;
    // Store this connection to a Dictionary
    sockets[playerID] = socket;
    // Increment Player Count and Announce it
    playersOnline++;
    io.emit('playersOnline', {number: playersOnline});

    // Announce to the Client the Player ID
    socket.emit('registerClient', player);

    // Method to Handle Change Player Name
    socket.on('changeUsername', function(data){
        players[player.id].username = data.username;
        // Return name to sender
        socket.emit('updateUsername', {id: player.id, username: player.username});
        // TODO: Add code for other players in the lobby
        console.log(players[player.id].username);
    });

    socket.on('disconnect', function(){
        playersOnline--;
        io.emit('playersOnline', {number: playersOnline});

        if (players[playerID].game.ingame) {
            removeUser(lobbies[players[playerID].game.lobby_id], playerID);  
        }  
        // Remove Player from Dictionary Storage        
        delete players[playerID];
        // Remove Connection from Dictionary Storage
        delete sockets[playerID];
        // Announce Disconnection of Client Player to Other Players
        socket.broadcast.emit('disconnected', {id: playerID}); 
    });

    ////////////////////////////////////////
    // Handles Lobby Logic
    ////////////////////////////////////////
    
    // Lobby Creation
    socket.on('createLobby', function(data){
        // Check if player already in a game or lobby
        if (!players[playerID].game.ingame) {
            // Create Lobby Cache and Store to Local Storage
            var lobby = new Lobby();
            lobbies[playerID] = lobby;
            lobbies[playerID].id = playerID;
            lobbies[playerID].creator = playerID;
            lobbies[playerID].leader = playerID;
            lobbies[playerID].gamemode = data.gamemode;
            lobbies[playerID].players.push({id: playerID, username: players[playerID].username});

            // Update Player Status
            players[playerID].game.ingame = true;
            players[playerID].game.lobby_id = playerID;
            // console.log(lobbies);
            console.log(lobbies[playerID].players);

            // TODO: CREATE PRIVATE LOBBY HERE
            socket.emit('createLobbySuccess', {
                id: lobbies[playerID].id,
                gamemode: lobbies[playerID].gamemode,
                players: lobbies[playerID].players,
                player: players[playerID]
            });
        }      
        // TODO: Add error message if player already in game
    });

    // Join Lobby
    socket.on('joinLobby', function(data){
        if (!lobbies[data.id]) {
            socket.emit('joinLobbyFail');
        }
        // TODO: Add code for successful login
        // TODO: USE SOCKET IO PRIVATE LOBBIES
    });

    // Leave Lobby
    socket.on('leaveLobby', function(data){
        // TODO: Add code for leaving lobby
        removeUser(lobbies[data.game.lobby_id], player.id);        
    });
});

server.listen((process.env.PORT || 5000), function(){
    console.log("Server Running on Port: " + (process.env.PORT || 5000));
});

////////////////////////////////////////
// Functions 
////////////////////////////////////////

function removeUser(lobby, id) {
    if (lobby) {
        if (lobby.players.length == 1) {
            delete lobbies[lobby.id];
            console.log("success");
            console.log(lobbies);
        }
        else {
            // TODO: Remove player from lobbies
            // TODO: Update Player Status
            players[id].game.ingame = false;
            players[id].game.lobby_id = '';
            // TODO: EMIT TO PRIVATE LOBBIES
            socket.emit('updatePlayer', players[id]);
        }
    }
}