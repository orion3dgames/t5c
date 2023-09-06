"use strict";
var Clock = (function () {
    function Clock(useInterval) {
        if (useInterval === void 0) { useInterval = false; }
        this.running = false;
        this.now = (typeof (window) !== "undefined" && window.performance && window.performance.now && (window.performance.now).bind(window.performance)) || Date.now;
        this.start(useInterval);
    }
    Clock.prototype.start = function (useInterval) {
        if (useInterval === void 0) { useInterval = false; }
        this.deltaTime = 0;
        this.currentTime = this.now();
        this.elapsedTime = 0;
        this.running = true;
        if (useInterval) {
            // auto set interval to 60 ticks per second
            this._interval = setInterval(this.tick.bind(this), 1000 / 60);
        }
    };
    Clock.prototype.stop = function () {
        this.running = false;
        if (this._interval) {
            clearInterval(this._interval);
        }
    };
    Clock.prototype.tick = function (newTime) {
        if (newTime === void 0) { newTime = this.now(); }
        this.deltaTime = newTime - this.currentTime;
        this.currentTime = newTime;
        this.elapsedTime += this.deltaTime;
    };
    return Clock;
}());
module.exports = Clock;
