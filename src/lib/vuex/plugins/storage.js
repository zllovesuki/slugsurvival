var localforage = require('localforage')

module.exports = localforage.createInstance({
    name: "events",
    version: 1.0,
    storeName: "kvStoreForCalendar"
})
