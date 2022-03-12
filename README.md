# unichain-promisifier

A wrapper that provides conversion to/from callback/promise interfaces in Unichain and RemoteUnichain.

## Installation
```
npm i @web4/unichain-promisifier
```

## Usage
```js
const unichain = require('@web4/unichain')
const ram = require('random-access-memory')
const { toPromises } = require('@web4/unichain-promisifier')

const chain = unichain(ram)

// A promisified Unichain interface
const wrapper = toPromises(chain)
```

## API
The API supports two methods, each one returning a compatibilty wrapper around Unichain.

#### `const { toCallbacks, toPromises, unwrap } = require('@web4/unichain-promisifier')`

`toCallbacks(chain)` takes a Unichain-like object with a Promises API, and returns a wrapper with a
callbacks interfaced.

`toPromises(chain)` takes a Unichain-like object with a callbacks API, and returns a wrapper with a
Promises interface.

`unwrap(chain)` takes either a wrapper object, or a normal Unichain, and returns a normal (callbacks API) Unichain.

## License
MIT

