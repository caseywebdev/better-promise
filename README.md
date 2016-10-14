# BetterPromise

Forcing a minimum timeout on a Promise like the spec requires is needless and
wasteful. BetterPromise allows synchronous resolutions to keep things moving
quickly.

[Try it out in your browser.](https://tonicdev.com/npm/pave)

## Install

```bash
npm install better-promise
```

## API

Reference the `BetterPromise` class by `require`-ing it.

```js
const Promise = require('better-promise');
```

`BetterPromise` has the same API as the native [Promise] class with the addition
of a couple static helper methods.

### `BetterPromise.isPromise(obj) => Boolean`

Recevies any value and returns whether or not that value looks like a `Promise`.

### `BetterPromise.promisify(fn[, context]) => Function`

Receives a function and an optional context and returns a function that returns
the given function wrapped in a `BetterPromise`.

[Promise]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
