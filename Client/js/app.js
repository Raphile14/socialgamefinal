try {
    ////////////////////////////////////////
    // Storage Variables
    ////////////////////////////////////////

    // Handles Socket.IO and Game Logic
    const socket = io();

    // Container for All Players
    let players = [];

    // ID of this Particular User
    let playerID = "";

    ////////////////////////////////////////
    // Socket Receive
    ////////////////////////////////////////

    // Gets Client ID from Server
    socket.on('registerClient', function(data) {
        playerID = data.id;
        players[playerID] = data;
        console.log("me:");
        console.log(players);
    });

    // TODO: Get Other Player Data from Server WHEN IN GAME
    socket.on('registerPlayer', function(data){
        players[data.id] = data;
    });

    // TODO: CHANGE THIS TO RECEIVE FROM PRIVATE LOBBIES 
    // Receive Player Status Update from server
    socket.on('updatePlayer', function(data){
        players[data.id] = data;
    });

    // Method to handle updated Client Username
    socket.on('updateUsername', function(data){
        players[data.id].username = data.username;        
        document.getElementById("name").innerText = "Welcome: " + data.username +"!";
        show("joinSelection", "login");
        console.log(players[data.id].username);
        console.log(players);
    });

    // Shows How Many Players Online from Server
    socket.on('playersOnline', function(data) {
        document.getElementById("playerCount").innerText = "Players Online: " + data.number;
    });

    // Delete data of Disconnected Players in Lobby
    socket.on('disconnected', function(data) {
        delete players[data.id];
    })

    // When the Client Lost Connection
    socket.on('disconnect', function(){
        console.log('Disconnected! No connection')
    });

    ////////////////////////////////////////
    // Handles Button Actions
    ////////////////////////////////////////

    // Input Name Enter Logic
    document.getElementById("loginButton").addEventListener("click", function(){
        var inputName = document.getElementById("loginUsername").value;
        if (inputName.length == 0) {
            document.getElementById("loginUsername").placeholder = "Please Input a Name!";
            document.getElementById("loginUsername").value = "";
        }
        else if (inputName.length < 3) {
            document.getElementById("loginUsername").placeholder = "Name Too Short!";
            document.getElementById("loginUsername").value = "";
        }
        else {
            socket.emit('changeUsername', {id: playerID, username: inputName});            
        }
    });

    // Input Name Enter Logic
    document.getElementById("changeButton").addEventListener("click", function(){
        var inputName = document.getElementById("changeUsername").value;
        if (inputName.length == 0) {
            document.getElementById("changeUsername").placeholder = "Please Input a Name!";
            document.getElementById("changeUsername").value = "";
        }
        else if (inputName.length < 3) {
            document.getElementById("changeUsername").placeholder = "Name Too Short!";
            document.getElementById("changeUsername").value = "";
        }
        else {
            socket.emit('changeUsername', {id: playerID, username: inputName});            
        }
    });

    // Create Guns1v1 Lobby
    document.getElementById("createGuns1v1Button").addEventListener("click", function(){
        socket.emit('createLobby', {gamemode: 'Guns1v1'});
    });

    // // Create Guns1v1 Lobby
    // document.getElementById("createSnakeButton").addEventListener("click", function(){
    //     socket.emit('createLobby', {gamemode: 'Snake'});
    // });

    // // Create Guns1v1 Lobby
    // document.getElementById("createPongButton").addEventListener("click", function(){
    //     socket.emit('createLobby', {gamemode: 'Pong'});
    // });

    // Success Creation of Lobby
    socket.on('createLobbySuccess', function(data){
        players[playerID] = data.player;
        console.log(players[playerID]);
        document.getElementById("lobbyGameMode").innerText = "Gamemode: " + data.gamemode;
        document.getElementById("lobbyCode").innerText = "Code: " + data.id;
        var playerNames = "Players: \n";
        for (var x = 0; x < data.players.length; x++) {
            playerNames += data.players[x].username + "\n";
        }
        document.getElementById("lobbyPlayerList").innerText = playerNames;
        show("lobby", "joinSelection");
    });

    // Confirm Leave Lobby
    socket.on('leaveLobbyConfirmed', function(){
        show("joinSelection", "lobby");
    });

    // Update lobby
    socket.on('updateLobby', function(data){
        // TODO: Add code to change player list
        delete players[data.id];
        var playerNames = "Players: \n";
        for (var x = 0; x < data.players.length; x++) {
            playerNames += data.players[x].username + "\n";
        }
        document.getElementById("lobbyGameMode").innerText = "Gamemode: " + data.gamemode;
        document.getElementById("lobbyCode").innerText = "Code: " + data.lobby_id;
        document.getElementById("lobbyPlayerList").innerText = playerNames;
        console.log("updating players")
        console.log(players);
    });

    // Join Lobby Query
    document.getElementById("joinCodeButton").addEventListener("click", function(){
        var code = document.getElementById("joinCode").value;
        socket.emit('joinLobby', {id: code});      
    });

    // Join Lobby Success
    socket.on('joinLobbySuccess', function(){
        document.getElementById("joinCode").value = "";
        show("lobby", "joinSelection");
    });

    // Join Lobby Fail
    socket.on('joinLobbyFail', function(){
        document.getElementById("joinCode").value = "";
        document.getElementById("joinCode").placeholder = "Lobby does not exist!";
    });

    // Leave Lobby
    document.getElementById("lobbyLeave").addEventListener("click", function(){
        console.log( players[playerID])
        socket.emit('leaveLobby', players[playerID]);            
    });
    
}
catch (e) {
    console.log('Lost connection to server!')
}
