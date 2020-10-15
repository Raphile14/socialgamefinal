let shortID = require('shortid');

module.exports = class Lobby {
    constructor(playerID, gamemode) {
        this.id = shortID.generate();
        this.creator = playerID;
        this.leader = playerID;
        this.gamemode = gamemode;
        this.players = [/* {id, username} */];
        this.game = {
            ongoing: false,
            round: 0,
            game: 0,
            queue: [/* {[player1, player2]} */]
        }
    }
    addPlayer (player) {
        this.players.push(player);
    }
    generateQueue() {
        let currentRound = 0;
        let queuedPeople = [];
        for (let x in this.players) {
            let enemies = [];
            // Current Player
            let currentPlayer = this.players[x].id;
            for (let y in this.players) {
                if (this.players[y].id != currentPlayer && !queuedPeople.includes(this.players[y].id)) {
                    enemies.push(this.players[y].id);                    
                }
            }
            if (enemies.length != 0) {
                this.game.queue.push({player: currentPlayer, enemies: enemies});
            }   
            queuedPeople.push(currentPlayer);
            currentRound++;         
        }
        console.log(this.game.queue);
    }
}