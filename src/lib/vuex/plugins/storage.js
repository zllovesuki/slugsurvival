"use strict"
var localforage = require('localforage')

console.log('storage support: IndexedDB - ' + localforage.supports(localforage.INDEXEDDB))
console.log('storage support: WebSQL - ' + localforage.supports(localforage.WEBSQL))

var driver = localforage.INDEXEDDB

if (!!navigator.platform && /iPad|iPhone|iPod/.test(navigator.platform)) {
    // iOS is fucking broken with its IndexedDB implementation...
    console.log('storage support: iOS detected, forcing to WebSQL')
    driver = localforage.WEBSQL
}

var adapter = localforage.createInstance({
    driver: driver,
    name: "offlineStore",
    version: 1.0,
    storeName: "kvStoreForCalendar"
})

adapter.ready().then(function() {
    console.log('storage engine: ' + adapter.driver())
})

module.exports = {
    // pass thru
    adapter: adapter,
    keys: function() {
        return adapter.keys()
    },
    removeItem: function(key) {
        return adapter.removeItem(key)
    },
    // compatibility layer
    getItem: function(key) {
        if (key.slice(0, 3) === 'lz-') {
            return adapter.getItem(key).then(function(compressed) {
                if (compressed === null) return null
                else return JSON.parse(LZString.decompressFromUTF16(compressed))
            })
        }else{
            return adapter.getItem(key)
        }
    },
    setItem: function(key, value) {
        if (key.slice(0, 3) === 'lz-') {
            return adapter.setItem(key, LZString.compressToUTF16(JSON.stringify(value)))
        }else{
            return adapter.setItem(key, value)
        }
    }
}
