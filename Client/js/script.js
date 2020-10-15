////////////////////////////////////////
// Storage Variables
////////////////////////////////////////
let socket = io();
let players = [];
let player_id = '';

$(document).ready(() => {
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
        $("#copyNotif").text("Code Copied Successfully!");
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
        }
    });
    // Leave Lobby
    $("#lobbyLeave").click(() => {
        if (players[player_id].game.ingame) {
            socket.emit('leaveLobby', players[player_id]);
        }        
    });
    // Send Chat Message
    $("#chatInputButton").click(() => {
        if (players[player_id].game.ingame && players[player_id].game.lobby_id != '') {
            if ($("#chatInput").val().length > 0) {
                socket.emit('sendChatMessage', {id: player_id, message: $("#chatInput").val()});                
            }         
            else {
                $("#chatInput").attr("placeholder", "Please enter a message!");
            }   
            $("#chatInput").val('');
        }
    });
    // Start Game
    $("#lobbyStart").click(()=>{
        if (players[player_id].game.ingame && players[player_id].game.lobby_id != '') {
            socket.emit('lobbyStart', {id: player_id, lobby_id: players[player_id].game.lobby_id});
        }        
    });
});

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
    show("#sectionLobby", "#sectionMenu");
});

// Receive Player Status Update from server
socket.on('updatePlayer', (data) => {    
    players[data.id] = data;    
});

// Update lobby
socket.on('updateLobby', (data) => { 
    if (data.join) {
        $("#chatArea").append('<p class="message"> ' + data.username + " joined the game! </p>");
    }
    else if (!data.join) {
        $("#chatArea").append('<p class="message"> ' + players[data.id].username + " left the game! </p>");
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
    show("#sectionLobby", "#sectionMenu");
});

// Join Lobby Fail
socket.on('joinLobbyFail', () => {
    $("#joinCode").val("");    
    $("#joinCode").attr("placeholder", "Lobby does not exist!");
});

// Game Ongoing
socket.on('gameOngoing', () => {
    $("#joinCode").val("");    
    $("#joinCode").attr("placeholder", "Game is ongoing!");
})

// Receive a chat message
socket.on('receiveChatMessage', (data) => {
    let $p = $('<p>').text(data.sender + ": " + data.message);
    $p.addClass("message");
    $("#chatArea").append($p);
    // $("#chatArea").animate({ scrollTop: $('#chatArea').prop("scrollHeight")}, 1000);    
});

// Fail Start of Game
socket.on('lobbyStartFail', ()=>{
    let $p = $('<p>').text("Failed to start game! Need 2 or more players!");
    $p.addClass("message");
    $("#chatArea").append($p);
});

// Success Start of Game
socket.on('lobbyStartSuccess', ()=> {
    show("#gameArea", "#lobbyControls");
});

////////////////////////////////////////
// Helper Functions
////////////////////////////////////////
function changeName (field) {
    let inputName = $(field);
    if (inputName.val().length == 0) {
        inputName.val("");
        inputName.attr("placeholder", "Please Input a Name!");
        inputName.css("border-color","red");
    }
    else if (inputName.val().length < 3) {
        inputName.val("");
        inputName.attr("placeholder", "Name Too Short!");
        inputName.css("border-color","red");
    }
    else {
        inputName.css("border-color","green");
        socket.emit('changeUsername', {id: player_id, username: inputName.val()});
    }
}
