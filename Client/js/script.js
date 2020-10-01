////////////////////////////////////////
// Storage Variables
////////////////////////////////////////
let socket = io();
let players = [];
let player_id = '';

$(document).ready(() => {
    $("#submitUsername").click(() => {
        changeName("#username");
    });
    $("#changeButton").click(() => {
        changeName("#changeUsername");
    });
    $("#createGuns1v1Button").click(() => {
        socket.emit('createLobby', {gamemode: 'Guns1v1'});
    });
});

////////////////////////////////////////
// Socket Receive
////////////////////////////////////////

// Shows How Many Players Online from Server
socket.on('playersOnline', function(data) {
   $("#player_count").text(data.number);
});

// Gets Client ID from Server on connection
socket.on('registerClient', function(data) {
    playerID = data.id;
    players[playerID] = data;
    console.log("me:");
    console.log(players);
});

// Method to handle updated Client Username on entering
socket.on('updateUsername', function(data){
    players[data.id].username = data.username;     
    $("#client_name").text(data.username);
    show("#selectionJoin", "#sectionLogin");
    console.log(players[data.id].username);
    console.log(players);
});

socket.on('createLobbySuccess', function(data){
    console.log(data);
    // players[playerID] = data.player;
    // console.log(players[playerID]);
    // document.getElementById("lobbyGameMode").innerText = "Gamemode: " + data.gamemode;
    // document.getElementById("lobbyCode").innerText = "Code: " + data.id;
    // var playerNames = "Players: \n";
    // for (var x = 0; x < data.players.length; x++) {
    //     playerNames += data.players[x].username + "\n";
    // }
    // document.getElementById("lobbyPlayerList").innerText = playerNames;
    // show("lobby", "joinSelection");
});

////////////////////////////////////////
// Functions
////////////////////////////////////////
function changeName (field) {
    console.log("test");
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
        socket.emit('changeUsername', {id: playerID, username: inputName.val()});                        
    }
}
