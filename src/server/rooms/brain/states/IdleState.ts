import { State } from "../../../../shared/yuka";

class IdleState extends State {
    enter(owner) {
        console.log("ENTER", owner.sessionId);
    }

    execute(owner) {
        console.log("execute", owner.x);
    }

    exit(owner) {
        console.log("exit", owner.sessionId);
    }
}

export default IdleState;
