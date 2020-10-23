////////////////////////////////////////
// Functions 
////////////////////////////////////////

module.exports = class Utility {
    constructor(lobbies, players) {
        this.lobbies = lobbies;
        this.players = players;
    }
    removeUser(lobby, id, socket) {     
        if (lobby) {
            this.players[id].game.ingame = false;
            this.players[id].game.lobby_id = '';
            if (lobby.players.length == 1) {
                delete this.lobbies[lobby.id];
                console.log("lobby: " + lobby.id + " has been deleted");
                // console.log(this.lobbies);
            }
            else {
                var index = 0;
                // Remove player from lobbies                
                for (var x = 0; x < this.lobbies[lobby.id].players.length; x++) {
                    if (this.lobbies[lobby.id].players[x].id == id) {
                        index = x;
                    }         
                    // console.log("removing index: " + index);
                    // console.log(this.lobbies[lobby.id].players[x].id);                               
                }    
                this.lobbies[lobby.id].players.splice(index, 1);
                // console.log("players in lobby: ");
                // console.log(this.lobbies[lobby.id].players)
                // Update Player Status      
                // console.log("player length: " + this.lobbies[lobby.id].players.length);          
                socket.emit('updatePlayer', this.players[id]);
            }
        }
    }
}