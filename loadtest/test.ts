import { Room, Client } from "@colyseus/core";

export function requestJoinOptions (this: Client, i: number) {
    return { requestNumber: i };
}

export function onJoin(this: Room) {

    this.onMessage("*", (type, message) => {
        console.log("onMessage:", type, message);
    });
}

export function onLeave(this: Room) {
}

export function onError(this: Room, err) {

}

export function onStateChange(this: Room, state) {
    
}
