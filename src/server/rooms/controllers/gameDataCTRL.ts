export class gameDataCTRL {
    private _gameData;

    constructor(gameData) {
        this._gameData = gameData;
    }

    get all() {
        return this._gameData;
    }
}
