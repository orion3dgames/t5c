import { dataDB } from "../../../shared/Data/dataDB";
import { LootSchema } from "../schema";

class Loot {
    public _schema;

    public sessionId: string;
    public x: number = 0;
    public y: number = 0;
    public z: number = 0;
    public rot: number = 0;
    public key: string = "";
    public quantity: number = 0;
    public name: string = "";
    public description: string = "";

    constructor(gameroom, data, ...args: any[]) {
        // assign data
        Object.assign(this, data);
        Object.assign(this, dataDB.get("item", this.key));

        // initialize Colyseus Schema
        let schema = new LootSchema();
        gameroom.entities.set(data.sessionId, schema);
        this._schema = schema;
    }

    // entity update
    public update(delta) {
        this.sync();
    }

    // send updates to colyseus schema
    sync() {
        let update = {
            sessionId: this.sessionId,
            x: this.x,
            y: this.y,
            z: this.z,
            rot: this.rot,
            key: this.key,
            quantity: this.quantity,
        };
        for (const key in update) {
            // only update if they is a change
            if (update[key] !== this._schema[key]) {
                console.log("[LOOT] update ", key, update[key]);
                this._schema[key] = update[key];
            }
        }
    }
}

export { Loot };
