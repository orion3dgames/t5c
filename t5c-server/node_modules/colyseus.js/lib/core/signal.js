"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSignal = exports.EventEmitter = void 0;
class EventEmitter {
    constructor() {
        this.handlers = [];
    }
    register(cb, once = false) {
        this.handlers.push(cb);
        return this;
    }
    invoke(...args) {
        this.handlers.forEach((handler) => handler.apply(this, args));
    }
    invokeAsync(...args) {
        return Promise.all(this.handlers.map((handler) => handler.apply(this, args)));
    }
    remove(cb) {
        const index = this.handlers.indexOf(cb);
        this.handlers[index] = this.handlers[this.handlers.length - 1];
        this.handlers.pop();
    }
    clear() {
        this.handlers = [];
    }
}
exports.EventEmitter = EventEmitter;
function createSignal() {
    const emitter = new EventEmitter();
    function register(cb) {
        return emitter.register(cb, this === null);
    }
    ;
    register.once = (cb) => {
        const callback = function (...args) {
            cb.apply(this, args);
            emitter.remove(callback);
        };
        emitter.register(callback);
    };
    register.remove = (cb) => emitter.remove(cb);
    register.invoke = (...args) => emitter.invoke(...args);
    register.invokeAsync = (...args) => emitter.invokeAsync(...args);
    register.clear = () => emitter.clear();
    return register;
}
exports.createSignal = createSignal;
//# sourceMappingURL=signal.js.map