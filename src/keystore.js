'use strict'

const EC = require('elliptic').ec;
const ec = new EC('secp256k1');
// const LRU = require('lru')

// let keystore
// const cache = new LRU(100)

// if (typeof localStorage === "undefined" || localStorage === null) {
//   const LocalStorage = require('node-localstorage').LocalStorage
//   keystore = new LocalStorage('./')
// } else {
//   keystore = localStorage
// }

class OrbitCrypto {
  constructor(directory = './keystore') {
    if (typeof localStorage === "undefined" || localStorage === null) {
      const LocalStorage = require('node-localstorage').LocalStorage
      this._keystore = new LocalStorage(directory)
    } else {
      this._keystore = localStorage
    }
    // this._cache = new LRU(100)
  }

  createKey(id) {
    const key = ec.genKeyPair()
    const publicKey = key.getPublic('hex')
    const privateKey = key.getPrivate('hex')
    this._keystore.setItem(id, JSON.stringify({ publicKey: publicKey, privateKey: privateKey }))
    return { publicKey: key, privateKey: key }
  }

  getKey(id) {
    let key = JSON.parse(this._keystore.getItem(id))
    // const publicKey = ec.keyFromPublic(key.publicKey, 'hex')
    // const privateKey = ec.keyFromPrivate(key.privateKey, 'hex')
    return { publicKey: key.publicKey, privateKey: key.privateKey }
  }

  static importKeyFromIpfs(ipfs, hash) {
    const cached = cache.get(hash)
    if (cached)
      return Promise.resolve(cached)

    return ipfs.object.get(hash, { enc: 'base58' })
      .then((obj) => JSON.parse(obj.toJSON().Data))
      .then((key) => {
        cache.set(hash, ec.keyFromPublic(key, 'hex'))
        return OrbitCrypto.importPublicKey(key)
      })
  }

  static exportKeyToIpfs(ipfs, key) {
    const k = key.getPublic('hex')
    const cached = cache.get(k)
    if (cached)
      return Promise.resolve(cached)

    return OrbitCrypto.exportPublicKey(key)
      .then((k) => JSON.stringify(k, null, 2))
      .then((s) => new Buffer(s))
      .then((buffer) => ipfs.object.put(buffer))
      .then((res) => {
        cache.set(k, res.toJSON().Hash)
        return res.toJSON().Hash
      })
  }

  static getKey(id = 'default') {
    let savedKeys = JSON.parse(keystore.getItem(id))
    let key, publicKey, privateKey

    if(savedKeys) {
      return OrbitCrypto.importPrivateKey(savedKeys.privateKey)
        .then((privKey) => privateKey = privKey)
        .then(() => OrbitCrypto.importPublicKey(savedKeys.publicKey))
        .then((pubKey) => publicKey = pubKey)
        .then(() => {
          return { publicKey: publicKey, privateKey: privateKey }
        })
    }

    return OrbitCrypto.generateKey()
      .then((keyPair) => key = keyPair)
      .then(() => OrbitCrypto.exportPrivateKey(key))
      .then((privKey) => privateKey = privKey)
      .then(() => OrbitCrypto.exportPublicKey(key))
      .then((pubKey) => publicKey = pubKey)
      .then(() =>{
        keystore.setItem(id, JSON.stringify({ publicKey: publicKey, privateKey: privateKey }))
        return { publicKey: key, privateKey: key }
      })
  }

  static generateKey() {
    return Promise.resolve(ec.genKeyPair())
  }

  static exportPublicKey(key) {
    return Promise.resolve(key.getPublic('hex'))
  }

  static exportPrivateKey(key) {
    return Promise.resolve(key.getPrivate('hex'))
  }

  static importPublicKey(key) {
    return Promise.resolve(ec.keyFromPublic(key, 'hex'))
  }

  static importPrivateKey(key) {
    return Promise.resolve(ec.keyFromPrivate(key, 'hex'))
  }

  static sign(key, data) {
    const sig = ec.sign(data, key)
    return Promise.resolve(sig.toDER('hex'))
  }

  static verify(signature, key, data) {
    let res = false
    try {
      res = ec.verify(data, signature, key)
    } catch(e) {
    }

    return Promise.resolve(res)
  }
}

module.exports = OrbitCrypto