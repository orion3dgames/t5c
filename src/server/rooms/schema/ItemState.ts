import { Schema, type } from "@colyseus/schema";

export class ItemState extends Schema {
    // networked player specific
    @type("string") public key: string = "";
    @type("string") public name: string = "";
    @type("string") public sessionId: string;
    @type("string") public location: string = "";
    @type("number") public x: number = 0;
    @type("number") public y: number = 0;
    @type("number") public z: number = 0;
    @type("number") public rot: number = 0;

    public label;
    public description;

    constructor(gameroom, data) {
        super(gameroom, data);
        console.log('LOG DATA', data);
        Object.assign(this, data);
    }

}
