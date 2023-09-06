"use strict";
/**
 * The MIT License (MIT)
 *
 * Copyright 2016 Andrey Sitnik <andrey@sitnik.ru>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNanoEvents = void 0;
const createNanoEvents = () => ({
    emit(event, ...args) {
        let callbacks = this.events[event] || [];
        for (let i = 0, length = callbacks.length; i < length; i++) {
            callbacks[i](...args);
        }
    },
    events: {},
    on(event, cb) {
        var _a;
        ((_a = this.events[event]) === null || _a === void 0 ? void 0 : _a.push(cb)) || (this.events[event] = [cb]);
        return () => {
            var _a;
            this.events[event] = (_a = this.events[event]) === null || _a === void 0 ? void 0 : _a.filter(i => cb !== i);
        };
    }
});
exports.createNanoEvents = createNanoEvents;
//# sourceMappingURL=nanoevents.js.map