var	Vue = require('vue'),
    Vuex = require('vuex'),
    localforage = require('localforage');

Vue.use(Vuex);

var store = new Vuex.Store({
    state: require('./state'),
    mutations: require('./mutations'),
    plugins: [
        require('./plugins/autosave')(storage)
    ]
})

module.exports = store;
