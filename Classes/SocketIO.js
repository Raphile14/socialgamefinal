// Requirements
const Server = require('socket.io');

// Import Custom Classes
let Player = require('./Player.js');
let Lobby = require('./Lobby.js');
let utility = require('./Utility.js');

// Variables
let playersOnline = 0;
// Storage for all Connected Players
let players = [];
// Storage for all Connected Sockets
let sockets = [];
// Storage for all Created and Ongoing Game Lobbies
let lobbies = [];
let Utility = new utility(lobbies, players);

module.exports = class SocketIO {
    constructor(server) {
        // this.io = require('socket.io')(server);
        const io = new Server(server);

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
            // TODO: Maybe add functionality to change name while ingame
            socket.on('changeUsername', function(data){
                players[player.id].username = data.username;
                // Return name to sender
                socket.emit('updateUsername', {id: player.id, username: player.username});
            });

            socket.on('disconnect', function(){
                playersOnline--;
                io.emit('playersOnline', {number: playersOnline});
                let username = players[playerID].username;
                let lobbyID = players[playerID].game.lobby_id;
                if (players[playerID].game.ingame) {            
                    Utility.removeUser(lobbies[players[playerID].game.lobby_id], playerID, socket);         
                    if (lobbies[lobbyID]) {
                        updateLobby(lobbyID, playerID, username, lobbies[lobbyID].players, false);
                    }               
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
                    let lobby = new Lobby(playerID, data.gamemode);
                    lobbies[lobby.id] = lobby;  
                    lobby.addPlayer({id: playerID, username: players[playerID].username});          
                    // Update Player Status
                    players[playerID].setGame(lobby.id)

                    // Join a Private Lobby
                    socket.join(lobby.id);

                    socket.emit('createLobbySuccess', {
                        id: lobbies[lobby.id].id,
                        gamemode: lobbies[lobby.id].gamemode,
                        players: lobbies[lobby.id].players,
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
                else {
                    lobbies[data.id].players.push({id: playerID, username: players[playerID].username});
                    players[playerID].game.ingame = true;
                    players[playerID].game.lobby_id = data.id;
                    socket.join(data.id);
                    socket.emit('joinLobbySuccess');
                    updateLobby(data.id, player.id, players[player.id].username, lobbies[data.id].players, true);
                    io.to(data.id).emit('updatePlayer', players[playerID]);
                    for (var keys in lobbies[data.id].players) {
                        socket.emit('updatePlayer', players[lobbies[data.id].players[keys].id]);
                    };            
                }
            });

            // Send Chat Message
            socket.on('sendChatMessage', (data) => {
                if (players[data.id].game.ingame && players[data.id].game.lobby_id != '') {
                    io.to(players[data.id].game.lobby_id).emit('receiveChatMessage', {sender: players[data.id].username, message: data.message});
                }
            });

            // Leave Lobby
            socket.on('leaveLobby', (data) => {
                Utility.removeUser(lobbies[data.game.lobby_id], data.id, socket);              
                socket.leave(data.game.lobby_id);
                socket.emit("leaveLobbyConfirmed");  
                if (lobbies[data.game.lobby_id]) {
                    updateLobby(data.game.lobby_id, player.id, players[player.id].username, lobbies[data.game.lobby_id].players, false)
                }
            });
        });

        ////////////////////////////////////////
        // Helper Functions
        ////////////////////////////////////////
        // Updating Lobby
        function updateLobby(lobbyID, playerID, username, players, join) {
            io.to(lobbyID).emit("updateLobby", {
                id: playerID, username, gamemode: "Guns1v1", lobby_id: lobbyID, players, join
            });
        }
    }
}