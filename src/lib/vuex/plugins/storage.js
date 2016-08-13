var localforage = require('localforage')

module.exports = localforage.createInstance({
    name: "offlineStore",
    version: 1.0,
    storeName: "kvStoreForCalendar"
})
