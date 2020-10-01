let shortID = require('shortid');

module.exports = class Lobby {
    constructor(playerID, gamemode) {
        this.id = shortID.generate();
        this.creator = playerID;
        this.leader = playerID;
        this.gamemode = gamemode;
        this.players = [/* {id, username} */];
    }
    addPlayer (player) {
        this.players.push(player);
    }
}