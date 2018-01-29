var	Vue = require('vue'),
    Vuex = require('vuex'),
    storage = require('./plugins/storage');

Vue.use(Vuex);

window._storage = storage;

var store = new Vuex.Store({
    actions: require('./actions'),
    getters: require('./getters'),
    state: require('./state'),
    mutations: require('./mutations'),
    plugins: [
        require('./plugins/offline')(storage)
    ]
})

module.exports = store;
