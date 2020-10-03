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
        console.log(players)
        if (players[player_id].game.ingame) {
            socket.emit('leaveLobby', players[player_id]);
        }        
    });
    // Send Chat Message
    $("#chatInputButton").click(() => {
        if (players[player_id].game.ingame && players[player_id].game.lobby_id != '') {
            socket.emit('sendChatMessage', {id: player_id, message: $("#chatInput").val()});
            $("#chatInput").val('');
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
    console.log("me:");
    console.log(players);
});

// Method to handle updated Client Username on entering
socket.on('updateUsername', (data) => {
    players[data.id].username = data.username;     
    $("#client_name").text(data.username);
    show("#sectionMenu", "#sectionLogin");
    console.log(players[data.id].username);
    console.log(players);
});

// Creating a lobby
socket.on('createLobbySuccess', (data) => {
    console.log(data);
    players[player_id] = data.player;
    console.log(players[player_id]);
    $("#lobbyGameMode").text(data.gamemode);
    $("#lobbyCode").text(data.id);
    var playerNames = "Players: \n";
    for (var x = 0; x < data.players.length; x++) {
        playerNames += data.players[x].username + "\n";
    }
    console.log(playerNames);
    $("#lobbyPlayerList").text(playerNames);
    show("#sectionLobby", "#sectionMenu");
});

// Receive Player Status Update from server
socket.on('updatePlayer', (data) => {
    players[data.id] = data;
});

// Update lobby
socket.on('updateLobby', (data) => {
    delete players[data.id];
    var playerNames = "Players: \n";
    for (var x = 0; x < data.players.length; x++) {
        playerNames += data.players[x].username + "\n";
    }
    $("#lobbyGameMode").text(data.gamemode);
    $("#lobbyCode").text(data.lobby_id);
    $("#lobbyPlayerList").text(playerNames);
    console.log("updating players")
    console.log(players);
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

// Receive a chat message
socket.on('receiveChatMessage', (data) => {
    $("#chatArea").append('<p class="message"> ' + data.sender + ": " + data.message + " </p>")
});

////////////////////////////////////////
// Functions
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
