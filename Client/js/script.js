////////////////////////////////////////
// Storage Variables
////////////////////////////////////////
let socket = io();
let players = [];
let player_id = '';
let player1Code = '';
let player2Code = '';

$(document).ready(() => {
    // Bind enter to chat input
    $("#chatInput").keypress((event)=>{
        let keycode = (event.keyCode ? event.keyCode : event.which);
        if(keycode == '13'){
            sendMessage();
        }
    });
    // Enter Name Button
    $("#submitUsername").click(() => {
        changeName("#username");
    });
    // Change Name Button
    $("#changeButton").click(() => {
        changeName("#changeUsername");
    });
    // Copy Lobby Code to Clipboard
    $("#lobbyCopy").click(() => {
        let $temp = $("<input>");
        $("body").append($temp);
        $temp.val($("#lobbyCode").text()).select();
        document.execCommand("copy");
        $temp.remove();
        $("#lobbyCopy").css("border-color","green");
    });
    // Create Lobby Button
    $("#createGuns1v1Button").click(() => {
        if (!players[player_id].game.ingame) {
            socket.emit('createLobby', {gamemode: 'Guns1v1'});
        }
    });
    // Join Lobby Button
    $("#joinCodeButton").click(() => {
        if (!players[player_id].game.ingame && $("#joinCode").val().length != 0) {
            socket.emit('joinLobby', {id: $("#joinCode").val()});
        }
        else {
            $("#joinCode").val("");
            $("#joinCode").css("border-color","red");
            if (players[player_id].game.ingame) {
                $("#joinCode").attr("placeholder", "You are already in a game!");
            }
            else if ($("#joinCode").val().length == 0) {
                $("#joinCode").attr("placeholder", "Please enter a code!");
            }
            else {
                $("#joinCode").css("border-color","gray");
                $("#joinCode").attr("placeholder", "Code of Lobby");
            }         
        }
    });
    // Leave Lobby
    $("#lobbyLeave").click(() => {
        if (players[player_id].game.ingame) {
            socket.emit('leaveLobby', players[player_id]);
        }        
    });
    // Start Game From Score
    $("#scoreStart").click(()=>{
        if (players[player_id].game.ingame && players[player_id].game.lobby_id != '') {            
            socket.emit('lobbyStart', {id: player_id, lobby_id: players[player_id].game.lobby_id});
        }        
    });
    $("#scoreLeave").click(() => {
        if (players[player_id].game.ingame) {
            socket.emit('leaveLobby', players[player_id]);
        }        
    });
    // Send Chat Message
    $("#chatInputButton").click(() => {
        sendMessage();
    });
    // Start Game
    $("#lobbyStart").click(()=>{
        if (players[player_id].game.ingame && players[player_id].game.lobby_id != '') {
            socket.emit('lobbyStart', {id: player_id, lobby_id: players[player_id].game.lobby_id});
        }        
    });
    // Send Choice to server
    // Send Charge
    $("#charge").click(()=>{
        sendChoice('charge');
        player2Show('charge');
    });
    $("#pistol").click(()=>{
        sendChoice('pistol');
        player2Show('pistol');
    });
    $("#d_pistol").click(()=>{
        sendChoice('d_pistol');
        player2Show('d_pistol');
    });
    $("#block").click(()=>{
        sendChoice('block');
        player2Show('block');
    });
    $("#counter").click(()=>{
        sendChoice('counter');
        player2Show('counter');
    });
});

function sendChoice(choice) {
    if (players[player_id].game.ingame && players[player_id].game.lobby_id != '') {
        socket.emit('playerChoice', {id: player_id, lobby_id:players[player_id].game.lobby_id, choice})
    }    
}

////////////////////////////////////////
// Socket Receive
////////////////////////////////////////
// Shows How Many Players Online from Server
socket.on('playersOnline', (data) => {
   $("#player_count").text(data.number);
});

// Gets Client ID from Server on connection
socket.on('registerClient', (data) => {
    if (player_id == '') {
        player_id = data.id;
        players[player_id] = data;
    }   
    else {
        location.reload();
    } 
});

// Method to handle updated Client Username on entering
socket.on('updateUsername', (data) => {
    players[data.id].username = data.username;     
    $("#client_name").text(data.username);
    show("#sectionMenu", "#sectionLogin");
});

// Creating a lobby
socket.on('createLobbySuccess', (data) => {
    players[player_id] = data.player;
    $("#lobbyGameMode").text(data.gamemode);
    $("#lobbyCode").text(data.id);
    $("#lobbyPlayerList").html('');
    var playerNames = "<p> Players: <ul>";
    for (var x = 0; x < data.players.length; x++) {
        playerNames += "<li>" + data.players[x].username + "</li>";
    }
    playerNames += "</ul> </p>";
    $("#lobbyPlayerList").append(playerNames);
    $("#scoreArea").hide();
    $("#lobbyControls").show();
    show("#sectionLobby", "#sectionMenu");    
});

// Receive Player Status Update from server
socket.on('updatePlayer', (data) => {    
    players[data.id] = data;    
});

// Update lobby
socket.on('updateLobby', (data) => { 
    if (data.join) {
        addMessage(data.username + " joined the game!");
    }
    else if (!data.join) {
        addMessage(players[data.id].username + " left the game!");
    }
    delete players[data.id];
    $("#lobbyPlayerList").html('');
    var playerNames = "<p> Players (" + data.players.length +  "): <ul>";    
    for (var x = 0; x < data.players.length; x++) {
        playerNames += "<li>" + data.players[x].username + "</li>";
    }
    playerNames += "</ul> </p>";
    $("#lobbyGameMode").text(data.gamemode);
    $("#lobbyCode").text(data.lobby_id);
    $("#lobbyPlayerList").append(playerNames);    
});

// Confirm Leave Lobby
socket.on('leaveLobbyConfirmed', () => {
    players[player_id].game.ingame = false;
    players[player_id].game.lobby_id = '';
    $("#chatArea").html("");
    show("#sectionMenu", "#sectionLobby");
});

// Join Lobby Success
socket.on('joinLobbySuccess', () => {
    $("#joinCode").val("");
    $("#joinCode").css("border-color","green"); 
    $("#scoreArea").hide();  
    $("#lobbyControls").show();
    show("#sectionLobby", "#sectionMenu");    
});

// Join Lobby Fail
socket.on('joinLobbyFail', () => {
    $("#joinCode").val("");    
    $("#joinCode").attr("placeholder", "Lobby does not exist!");
});

// Join Lobby Fail Full
socket.on('joinLobbyFailFull', () => {
    $("#joinCode").val("");    
    $("#joinCode").attr("placeholder", "Lobby is already full!");
});

// Game Ongoing
socket.on('gameOngoing', () => {
    $("#joinCode").val("");    
    $("#joinCode").attr("placeholder", "Game is ongoing!");
})

// Receive a chat message
socket.on('receiveChatMessage', (data) => {
    addMessage(data.sender + ": " + data.message);
});

// Fail Start of Game
socket.on('lobbyStartFail', ()=>{
    addMessage("Failed to start game! Need 2 or more players!")
});

// Invalid Action
socket.on('invalidAction', ()=>{
    addMessage("Invalid Action! Lacking Charges. Choose another one!")
});

// Already Chosen
socket.on('alreadyChosen', ()=>{
    addMessage("You already chose an action!");
});

// Valid Action
socket.on('validAction', (data)=>{
    addMessage("UPDATE: " + players[data.id].username + " has chosen an action!")
    if (player1Code == data.id) {
        $("#player1").css('color', 'green');
    }
    else if (player2Code == data.id) {
        $("#player2").css('color', 'green');
    }
});

// Continuing Round
socket.on('gameContinue', (data)=> {
    updateCurrent(data);
    $("#status").text("DRAW");    
});

// End Game and Show Scores
socket.on('gameEnd', (data)=> {
    $("#scoreArea").show();
    $("#gameArea").hide();
    for (let x = 0; x < data.players.length; x++) {
        let $w = $('<p>').text((x + 1) + ".) " + data.players[x].username + " (" + data.players[x].score + ")");
        $w.addClass("message2");
        $("#scores").append($w);
    }
});

// Show round review
socket.on('gameReview', (winner, data) => {
    addMessage("UPDATE: " + players[winner.winner].username + " won the round!");
    $("#choices").hide();
    updateCurrent(data);
    $("#status").text(players[winner.winner].username + " won the round!"); 
})

// New Round
socket.on('gameNew', (data)=> {
    let player1 = data.player1;
    let player2 = data.player2;
    $("#playerCharges").text("0");
    
    addMessage("UPDATE: A new round is starting!");
    addMessage(players[player1].username + " vs " + players[player2].username);

    // Show the choices
    $("#choices").hide();
    if (player_id == player1 || player_id == player2) {
        $("#choices").show();
    }

    hidePast();
    $("#status").text("VS");    
    player1Code = player1;
    player2Code = player2;
    // Name Placement
    // If client is not yet the player
    if (player_id != player1 && player_id != player2) {
        $("#player1").text(players[player1].username);
        $("#player2").text(players[player2].username);
    }
    else if (player_id == player1) {
        $("#player1").text(players[player2].username);
        $("#player2").text(players[player1].username + " (You)");
        player1Code = player2;
        player2Code = player1;
    }
    else if (player_id == player2) {
        $("#player1").text(players[player1].username);
        $("#player2").text(players[player2].username + " (You)");
    }
    $("#player1").css('color', '#b29c44');
    $("#player2").css('color', '#b29c44');
});

// Start of a round
socket.on('gameStart', (data)=> {
    let player1 = data.player1;
    let player2 = data.player2;
    $("#player1").css('color', '#b29c44');
    $("#player2").css('color', '#b29c44');
    hidePast();
    $("#status").text("VS");    
    $("#scores").empty();
    $("#playerCharges").text("0");
    $("#scoreArea").hide();

    // Show game area
    addMessage("UPDATE: Game is starting!");
    show("#gameArea", "#lobbyControls");
    addMessage(players[player1].username + " vs " + players[player2].username);
    
    // If the client is one of the players of the current round
    // Show the choices
    $("#choices").hide();
    if (player_id == player1 || player_id == player2) {
        $("#choices").show();
    }

    player1Code = player1;
    player2Code = player2;
    // Name Placement
    // If client is not yet the player
    if (player_id != player1 && player_id != player2) {
        $("#player1").text(players[player1].username);
        $("#player2").text(players[player2].username);
    }
    else if (player_id == player1) {
        $("#player1").text(players[player2].username);
        $("#player2").text(players[player1].username + " (You)");
        player1Code = player2;
        player2Code = player1;
    }
    else if (player_id == player2) {
        $("#player1").text(players[player1].username);
        $("#player2").text(players[player2].username + " (You)");
    }
    $("#player1").css('color', '#b29c44');
    $("#player2").css('color', '#b29c44');
});

// Receving Countdown Timer
socket.on('counter', (data) => {
    $("#timer").text(data);
});

////////////////////////////////////////
// Helper Functions
////////////////////////////////////////
function changeName (field) {
    let inputName = $(field);
    if (inputName.val().length == 0) {
        inputName.attr("placeholder", "Please Input a Name!");
        inputName.css("border-color","red");
    }
    else if (inputName.val().length < 3) {
        inputName.attr("placeholder", "Name Too Short!");
        inputName.css("border-color","red");
    }
    else if (inputName.val().length > 10) {        
        inputName.attr("placeholder", "Name Too Long!");
        inputName.css("border-color","red");
    }
    else {
        inputName.attr("placeholder", "Enter Name");
        inputName.css("border-color","green");
        socket.emit('changeUsername', {id: player_id, username: inputName.val()});
    }
    inputName.val("");
}

function addMessage(message) {
    let $p = $('<p>').text(message);
    $p.addClass("message");
    $("#chatArea").append($p);
    $('#chatArea').animate({scrollTop: $('#chatArea')[0].scrollHeight}, "slow");
}

function sendMessage() {
    if (players[player_id].game.ingame && players[player_id].game.lobby_id != '') {
        if ($("#chatInput").val().length > 0) {
            socket.emit('sendChatMessage', {id: player_id, message: $("#chatInput").val()});                            
        }         
        else {
            $("#chatInput").attr("placeholder", "Please enter a message!");
        }   
        $("#chatInput").val('');
    }
}

function updateCurrent(data) {
    if (player2Code == player_id && data.player1 == player_id) {
        $("#playerCharges").text(data.player1Charges);
        player1Show(data.player2Choice);
        player2Show(data.player1Choice);
    }
    else if (player2Code == player_id && data.player2 == player_id) {
        $("#playerCharges").text(data.player2Charges);
        player1Show(data.player1Choice);
        player2Show(data.player2Choice);
    }
    else {
        player1Show(data.player1Choice);
        player2Show(data.player2Choice);
    }    
    $("#player1").css('color', '#b29c44');
    $("#player2").css('color', '#b29c44');
}