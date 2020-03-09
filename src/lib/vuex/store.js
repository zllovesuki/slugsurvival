"use strict"
var	Vue = require('vue').default,
    Vuex = require('vuex');

Vue.use(Vuex);

var store = new Vuex.Store({
    actions: require('./actions'),
    getters: require('./getters'),
    state: require('./state'),
    mutations: require('./mutations'),
    plugins: [
        require('./plugins/offline')()
    ]
})

module.exports = store;
