let shortID = require('shortid');

module.exports = class Lobby {
    constructor(playerID, gamemode) {
        this.id = shortID.generate();
        this.creator = playerID;
        this.leader = playerID;
        this.gamemode = gamemode;
        this.players = [/* {id, username, score} */];
        this.game = {
            ongoing: false,
            round: 0, // Counter for each player
            index: 0, // Counter for each enemy per player
            game: 0, // Incremental counter counting every game played
            queue: [/* {[player1, player2]} */],
            player1: '',
            player1Choice: '',
            player1Charges: 0,
            player2: '',
            player2Choice: '',
            player2Charges: 0
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
        console.log(this.game.queue)
    }
    assignPlayers() {    
        this.game.player1 = this.game.queue[this.game.round].player;
        this.game.player1Choice = '';
        this.game.player1Charges = 0;
        this.game.player2 = this.game.queue[this.game.round].enemies[this.game.index];
        this.game.player2Choice = '';
        this.game.player2Charges = 0;
        // console.log({player1: this.game.player1, player2: this.game.player2});
        return {player1: this.game.player1, player2: this.game.player2};
    }
    // Increment Score of Winner
    winnerDetected(player) {
        for (let x = 0; x < this.players.length; x++) {
            if (this.players[x].id == player) {
                this.players[x].score += 1;
            }
        }
    }
    nextPlayers() {
        if (this.game.round == this.game.queue.length - 1) {
            this.game.round = 0;
            if (this.game.index == this.game.queue[this.game.round].enemies.length) {
                this.game.index = 0;
            }
            else if (this.game.index < this.game.queue[this.game.round].enemies.length) {
                this.game.index += 1;
            }
        }
        else if (this.game.round < this.game.queue.length - 1) {
            this.game.round += 1;
        }
        if (this.game.round == this.game.queue.length - 1 && this.game.index == this.game.queue[this.game.round].enemies.length) {
            return "lastQueue";
        }
        return "Ongoing";
    }
}