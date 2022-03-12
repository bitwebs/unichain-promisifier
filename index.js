const { EventEmitter } = require('events')
const maybe = require('call-me-maybe')
const inspect = require('inspect-custom-symbol')

const SUPPORTS_PROMISES = Symbol.for('unichain.promises')
const CHAIN = Symbol('unichain-promisifier.chain')
const REQUEST = Symbol('unichain-promisifier.request')

class BaseWrapper extends EventEmitter {
  constructor (chain) {
    super()
    this[CHAIN] = chain
    this.on('newListener', (eventName, listener) => {
      chain.on(eventName, listener)
    })
    this.on('removeListener', (eventName, listener) => {
      chain.removeListener(eventName, listener)
    })
  }

  [inspect] (depth, opts) {
    return this[CHAIN][inspect](depth, opts)
  }

  get key () {
    return this[CHAIN].key
  }

  get discoveryKey () {
    return this[CHAIN].discoveryKey
  }

  get length () {
    return this[CHAIN].length
  }

  get byteLength () {
    return this[CHAIN].byteLength
  }

  get writable () {
    return this[CHAIN].writable
  }

  get sparse () {
    return this[CHAIN].sparse
  }

  get peers () {
    return this[CHAIN].peers
  }

  get valueEncoding () {
    return this[CHAIN].valueEncoding
  }

  get weak () {
    return this[CHAIN].weak
  }

  get lazy () {
    return this[CHAIN].lazy
  }
}

class CallbackToPromiseUnichain extends BaseWrapper {
  constructor (chain) {
    super(chain)
    this[SUPPORTS_PROMISES] = true
  }

  // Async Methods

  ready () {
    return alwaysCatch(new Promise((resolve, reject) => {
      this[CHAIN].ready(err => {
        if (err) return reject(err)
        return resolve(null)
      })
    }))
  }

  close () {
    return alwaysCatch(new Promise((resolve, reject) => {
      this[CHAIN].close(err => {
        if (err) return reject(err)
        return resolve(null)
      })
    }))
  }

  get (index, opts) {
    let req = null
    const prom = new Promise((resolve, reject) => {
      req = this[CHAIN].get(index, opts, (err, block) => {
        if (err) return reject(err)
        return resolve(block)
      })
    })
    prom[REQUEST] = req
    return prom
  }

  append (batch) {
    return alwaysCatch(new Promise((resolve, reject) => {
      this[CHAIN].append(batch, (err, seq) => {
        if (err) return reject(err)
        return resolve(seq)
      })
    }))
  }

  update (opts) {
    return alwaysCatch(new Promise((resolve, reject) => {
      this[CHAIN].update(opts, err => {
        if (err) return reject(err)
        return resolve(null)
      })
    }))
  }

  seek (bytes, opts) {
    return new Promise((resolve, reject) => {
      this[CHAIN].seek(bytes, opts, (err, index, relativeOffset) => {
        if (err) return reject(err)
        return resolve([index, relativeOffset])
      })
    })
  }

  download (range) {
    let req = null
    const prom = alwaysCatch(new Promise((resolve, reject) => {
      req = this[CHAIN].download(range, err => {
        if (err) return reject(err)
        return resolve(null)
      })
    }))
    prom[REQUEST] = req
    return prom
  }

  has (start, end) {
    return new Promise((resolve, reject) => {
      this[CHAIN].has(start, end, (err, res) => {
        if (err) return reject(err)
        return resolve(res)
      })
    })
  }

  audit () {
    return new Promise((resolve, reject) => {
      this[CHAIN].audit((err, report) => {
        if (err) return reject(err)
        return resolve(report)
      })
    })
  }

  destroyStorage () {
    return new Promise((resolve, reject) => {
      this[CHAIN].destroyStorage(err => {
        if (err) return reject(err)
        return resolve(null)
      })
    })
  }

  // Sync Methods

  createReadStream (opts) {
    return this[CHAIN].createReadStream(opts)
  }

  createWriteStream (opts) {
    return this[CHAIN].createWriteStream(opts)
  }

  undownload (range) {
    return this[CHAIN].undownload(range[REQUEST] || range)
  }

  cancel (range) {
    return this[CHAIN].cancel(range[REQUEST] || range)
  }

  replicate (initiator, opts) {
    return this[CHAIN].replicate(initiator, opts)
  }

  registerExtension (name, handlers) {
    return this[CHAIN].registerExtension(name, handlers)
  }

  setUploading (uploading) {
    return this[CHAIN].setUploading(uploading)
  }

  setDownloading (downloading) {
    return this[CHAIN].setDownloading(downloading)
  }
}

class PromiseToCallbackUnichain extends BaseWrapper {
  constructor (chain) {
    super(chain)
    this[SUPPORTS_PROMISES] = false
  }

  // Async Methods

  ready (cb) {
    return maybeOptional(cb, this[CHAIN].ready())
  }

  close (cb) {
    return maybeOptional(cb, this[CHAIN].close())
  }

  get (index, opts, cb) {
    const prom = this[CHAIN].get(index, opts)
    maybe(cb, prom)
    return prom
  }

  append (batch, cb) {
    return maybeOptional(cb, this[CHAIN].append(batch))
  }

  update (opts, cb) {
    return maybeOptional(cb, this[CHAIN].update(opts))
  }

  seek (bytes, opts, cb) {
    return maybe(cb, this[CHAIN].seek(bytes, opts))
  }

  download (range, cb) {
    const prom = this[CHAIN].download(range)
    maybeOptional(cb, prom)
    return prom
  }

  has (start, end, cb) {
    return maybe(cb, this[CHAIN].has(start, end))
  }

  audit (cb) {
    return maybe(cb, this[CHAIN].audit())
  }

  destroyStorage (cb) {
    return maybe(cb, this[CHAIN].destroyStorage())
  }

  // Sync Methods

  createReadStream (opts) {
    return this[CHAIN].createReadStream(opts)
  }

  createWriteStream (opts) {
    return this[CHAIN].createWriteStream(opts)
  }

  undownload (range) {
    return this[CHAIN].undownload(range)
  }

  cancel (range) {
    return this[CHAIN].cancel(range)
  }

  replicate (initiator, opts) {
    return this[CHAIN].replicate(initiator, opts)
  }

  registerExtension (name, handlers) {
    return this[CHAIN].registerExtension(name, handlers)
  }

  setUploading (uploading) {
    return this[CHAIN].setUploading(uploading)
  }

  setDownloading (downloading) {
    return this[CHAIN].setDownloading(downloading)
  }
}

module.exports = {
  toPromises,
  toCallbacks,
  unwrap
}

function toPromises (chain) {
  return chain[SUPPORTS_PROMISES] ? chain : new CallbackToPromiseUnichain(chain)
}

function toCallbacks (chain) {
  return chain[SUPPORTS_PROMISES] ? new PromiseToCallbackUnichain(chain) : chain
}

function unwrap (chain) {
  return chain[CHAIN] || chain
}

function maybeOptional (cb, prom) {
  prom = maybe(cb, prom)
  if (prom) prom.catch(noop)
  return prom
}

function alwaysCatch (prom) {
  prom.catch(noop)
  return prom
}

function noop () {}
