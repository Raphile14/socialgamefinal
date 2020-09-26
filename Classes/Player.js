let shortID = require('shortid');

module.exports = class Player {
    constructor() {
        this.username = 'Anonymous';
        this.id = shortID.generate();
        this.game = {
            ingame : false,
            lobby_id : ''
        }
    }
}