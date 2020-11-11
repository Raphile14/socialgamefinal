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

// Game Logic
let pistolDefeats = ["charge", "counter"];
let dPistolDefeats = ["charge", "pistol", "counter"];
let counterDefeats = ["block"];

module.exports = class SocketIO {
    constructor(server) {
        // this.io = require('socket.io')(server);
        const io = new Server(server);

        // Counter
        let reviewCountdown;
        let counter = 5;

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

            socket.on('disconnect', async function(){
                playersOnline--;
                io.emit('playersOnline', {number: playersOnline});
                let username = players[playerID].username;
                let lobbyID = players[playerID].game.lobby_id;
                // If player is in the middle of the game
                if (players[playerID].game.ingame) {    
                    if (lobbies[lobbyID].game.player1 == playerID || lobbies[lobbyID].game.player2 == playerID) {
                        if (lobbies[lobbyID].game.player1 == playerID) {
                            updateGame({id: playerID, lobby_id: lobbyID, choice: ''}, true, socket);
                        }
                        else {
                            updateGame({id: playerID, lobby_id: lobbyID, choice: ''}, false, socket);
                        }
                    }        
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
                    lobby.addPlayer({id: playerID, username: players[playerID].username, score: 0});          
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
            socket.on('joinLobby', async (data) => {
                if (!lobbies[data.id]) {
                    socket.emit('joinLobbyFail');
                }
                else if (lobbies[data.id].players.length >= 10) {
                    socket.emit('joinLobbyFailFull');
                }
                else {
                    if (!lobbies[data.id].game.ongoing) {
                        lobbies[data.id].addPlayer({id: playerID, username: players[playerID].username, score: 0});
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
                    else {
                        socket.emit('gameOngoing');
                    }                                
                }
            });

            // Send Chat Message
            socket.on('sendChatMessage', async (data) => {
                if (players[data.id].game.ingame && players[data.id].game.lobby_id != '') {
                    io.to(players[data.id].game.lobby_id).emit('receiveChatMessage', {sender: players[data.id].username, message: data.message});
                }
            });

            // Leave Lobby
            socket.on('leaveLobby', async (data) => {
                Utility.removeUser(lobbies[data.game.lobby_id], data.id, socket);              
                socket.leave(data.game.lobby_id);
                socket.emit("leaveLobbyConfirmed");  
                if (lobbies[data.game.lobby_id]) {
                    updateLobby(data.game.lobby_id, player.id, players[player.id].username, lobbies[data.game.lobby_id].players, false)
                }
            });

            // Start Game
            socket.on('lobbyStart', async (data)=>{
                if (lobbies[data.lobby_id]) {
                    if (lobbies[data.lobby_id].players.length < 2) {
                        io.to(players[data.id].game.lobby_id).emit('lobbyStartFail');
                    }
                    else {
                        lobbies[data.lobby_id].game.ongoing = true;
                        await lobbies[data.lobby_id].clearQueue();
                        await lobbies[data.lobby_id].generateQueue();                        
                        let fighters = await lobbies[data.lobby_id].assignPlayers();
                        io.to(players[data.id].game.lobby_id).emit('gameStart', fighters);
                        countdownAction(data.lobby_id, socket);
                    }
                }
            });

            // Receiving choices
            socket.on('playerChoice', (data) => {
                playerChoiceAuto(data, socket);
            }); 
        });

        ////////////////////////////////////////
        // Helper Functions
        ////////////////////////////////////////
        // Updating Lobby
        function updateLobby(lobbyID, playerID, username, players, join) {
            io.to(lobbyID).emit("updateLobby", {
                id: playerID, username, gamemode: "GUNS1V1", lobby_id: lobbyID, players, join
            });
        }

        function updateGame(data, player2Win, socket) {
            let winner = lobbies[data.lobby_id].game.player1;
            if (player2Win) {
                winner = lobbies[data.lobby_id].game.player2;                                
            }
            lobbies[data.lobby_id].winnerDetected(winner);                            
            let player1Online = false;
            let player2Online = false;
            let fighters;

            let player1OldName = lobbies[data.lobby_id].game.player1;
            let player2OldName = lobbies[data.lobby_id].game.player2;
            let player1OldAction = lobbies[data.lobby_id].game.player1Choice;
            let player2OldAction = lobbies[data.lobby_id].game.player2Choice;

            while (!player1Online || !player2Online) {
                player1Online = false;
                player2Online = false;
                let status = lobbies[data.lobby_id].nextPlayers();
                fighters = lobbies[data.lobby_id].assignPlayers();
                if (players[lobbies[data.lobby_id].game.player1]) {
                    player1Online = true;
                }
                if (players[lobbies[data.lobby_id].game.player2]) {
                    player2Online = true;
                }
                if ((!player1Online || !player2Online) && status == "lastQueue") {
                    break;
                }
            }            

            if (fighters.player1 && fighters.player2) {
                players[data.id].game.player1Charges = 0;
                players[data.id].game.player2Charges = 0;
                io.to(players[data.id].game.lobby_id).emit('gameReview', {winner}, {
                    player1: player1OldName, 
                    player1Choice: player1OldAction,
                    player2: player2OldName,
                    player2Choice: player2OldAction
                });
                clearInterval(reviewCountdown);
                countdown(players[data.id].game.lobby_id,
                    function() {
                        io.to(players[data.id].game.lobby_id).emit('gameNew', fighters);   
                        countdownAction(data.lobby_id, socket);
                    }
                );                
            }
            else {
                io.to(players[data.id].game.lobby_id).emit('gameReview', {winner}, {
                    player1: player1OldName, 
                    player1Choice: player1OldAction,
                    player2: player2OldName,
                    player2Choice: player2OldAction
                });
                clearInterval(reviewCountdown);
                countdown(players[data.id].game.lobby_id,
                    function() {
                        io.to(players[data.id].game.lobby_id).emit('gameEnd', {players: lobbies[data.lobby_id].players});
                    }
                );  
            }
        }

        // Helper Functions
        // Countdown for review
        function countdown(lobby_id, response) {
            let counter = 10;
            let endCountdown = setInterval(function(){
                io.to(lobby_id).emit('counter', counter);
                counter--
                if (counter === -1) {    
                    response();            
                    clearInterval(endCountdown);                   
                }
            }, 1000);
        }

        // Countdown for actions
        function countdownAction(lobby_id, socket) {
            counter = 5;
            reviewCountdown = setInterval(function(){
                if (lobbies[lobby_id].game.player1Choice != '' && lobbies[lobby_id].game.player2Choice != '') {
                    // lobbies[lobby_id].game.player1Choice = '';
                    // lobbies[lobby_id].game.player2Choice = '';
                    console.log("dito")
                    clearInterval(reviewCountdown);
                }
                io.to(lobby_id).emit('counter', counter);                
                counter--;
                if (counter === -1) {
                    if (lobbies[lobby_id].game.player1Choice == '') {
                        playerChoiceAuto({id: lobbies[lobby_id].game.player1, lobby_id, choice: 'charge'}, socket);
                    }
                    if (lobbies[lobby_id].game.player2Choice == '') {
                        playerChoiceAuto({id: lobbies[lobby_id].game.player2, lobby_id, choice: 'charge'}, socket);
                    }  
                }
            }, 1000);
        }

        //
        function playerChoiceAuto(data, socket) {
            let valid = false;
            let player = '';
            if (lobbies[data.lobby_id]) {
                if (lobbies[data.lobby_id].game.player1 == data.id) {
                    player = "player1";
                }
                else if (lobbies[data.lobby_id].game.player2 == data.id) {
                    player = "player2";
                }
                // Update choices and checking of charges
                if (player != '' && lobbies[data.lobby_id].game[player+"Choice"] == '') {
                    if (data.choice == 'charge') {
                        lobbies[data.lobby_id].game[player+"Charges"] += 1;
                        valid = true;
                    }
                    else if ((data.choice == 'pistol' || data.choice == 'counter') && lobbies[data.lobby_id].game[player+"Charges"] > 0) {
                        lobbies[data.lobby_id].game[player+"Charges"] -= 1;
                        valid = true;                      
                    }
                    else if (data.choice == 'd_pistol' && lobbies[data.lobby_id].game[player+"Charges"] > 1) {
                        lobbies[data.lobby_id].game[player+"Charges"] -= 2;
                        valid = true;                      
                    }
                    else if (data.choice == "block" || data.choice == "evade") {
                        valid = true;
                    }
                    if (valid) {
                        lobbies[data.lobby_id].game[player+"Choice"] = data.choice;
                    }                        
                }
                if (valid) {
                    io.to(data.lobby_id).emit('validAction', {id: data.id});
                }
                else {
                    if (player != '' && lobbies[data.lobby_id].game[player+"Choice"] != '') {
                        socket.emit('alreadyChosen');
                    }
                    else {
                        socket.emit('invalidAction');
                    }                        
                }
                // Check if both players have chosen actions and validate who wins or continue game
                if (lobbies[data.lobby_id].game["player1Choice"] != '' && lobbies[data.lobby_id].game["player2Choice"] != '') {
                    let player1chosen = lobbies[data.lobby_id].game["player1Choice"];
                    let player2chosen = lobbies[data.lobby_id].game["player2Choice"];
                    let player1Win = false;
                    let player2Win = false;
                    if ((player1chosen == "pistol" && pistolDefeats.includes(player2chosen)) 
                    || (player1chosen == "d_pistol" && dPistolDefeats.includes(player2chosen)) 
                    || (player1chosen == "counter" && counterDefeats.includes(player2chosen))) {
                        player1Win = true;
                    }
                    else if ((player2chosen == "pistol" && pistolDefeats.includes(player1chosen)) 
                    || (player2chosen == "d_pistol" && dPistolDefeats.includes(player1chosen)) 
                    || (player2chosen == "counter" && counterDefeats.includes(player1chosen))) {
                        player2Win = true;
                    }
                    if (player1Win || player2Win) {
                        // console.log(lobbies[data.lobby_id].players);
                        updateGame(data, player2Win, socket);
                    }
                    else {
                        clearInterval(reviewCountdown)
                        io.to(data.lobby_id).emit('gameContinue', {
                            player1: lobbies[data.lobby_id].game.player1, 
                            player1Charges: lobbies[data.lobby_id].game.player1Charges,
                            player1Choice: lobbies[data.lobby_id].game.player1Choice,
                            player2: lobbies[data.lobby_id].game.player2,
                            player2Charges: lobbies[data.lobby_id].game.player2Charges,
                            player2Choice: lobbies[data.lobby_id].game.player2Choice
                        });
                        countdownAction(data.lobby_id, socket);                  
                    }
                    lobbies[data.lobby_id].game["player1Choice"] = '';
                    lobbies[data.lobby_id].game["player2Choice"] = '';
                }   
            }
        }
    }
    
}