var localforage = require('localforage')

module.exports = localforage.createInstance({
    driver: localforage.INDEXEDDB,
    name: "events",
    version: 1.0,
    storeName: "kvStoreForCalendar"
})
