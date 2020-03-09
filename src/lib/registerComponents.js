"use strict"
module.exports = function(Vue) {
    Vue.component('modal', require('../components/modal.vue').default)
    Vue.component('search', require('../components/search.vue').default)
    Vue.component('graph', require('../components/graph.vue').default)
}
