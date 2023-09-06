# @gamestdio/timer [![Build Status](https://secure.travis-ci.org/gamestdio/timer.png?branch=master)](http://travis-ci.org/gamestdio/timer)

Timing Events tied to [@gamestdio/clock](https://github.com/gamestdio/clock).

`ClockTimer` is a subclass of `Clock`, which adds methods to handle timeout and
intervals relying on `Clock`'s ticks.

## Why?

Once built-in `setTimeout` and `setInterval` relies on CPU load, functions may
delay an unexpected amount of time to execute. Having it tied to a clock's time
is guaranteed to execute in a precise way.

See a quote from [W3C Timers Specification](http://www.w3.org/TR/2011/WD-html5-20110525/timers.html):

> This API does not guarantee that timers will fire exactly on schedule.  Delays
> due to CPU load, other tasks, etc, are to be expected.

## API

**Clock**

- `setInterval(handler, time, ...args)` -> `Delayed`
- `setTimeout(handler, time, ...args)` -> `Delayed`
- `clear()` - clear all intervals and timeouts.

**Delayed**

- `clear()` -> `void` - Clear timeout/interval
- `reset()` -> `void` - Reset elapsed time
- `active` -> `Boolean` - Is it still active?
- `pause()` -> `void` - Pause the execution
- `resume()` -> `void` - Continue the execution
- `paused` -> `Boolean` - Is is paused?

## License

MIT
