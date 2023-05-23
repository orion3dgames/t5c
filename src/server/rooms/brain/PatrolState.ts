import State from "./State";
import { BrainSchema } from "../schema/BrainSchema2";

export default class PatrolState extends State {
    enter(entity) {
        console.log("ENTER", entity);
    }

    execute(entity) {
        console.log("EXECUTE", entity);
    }

    exit(entity) {
        console.log("EXIT", entity);
    }
}
