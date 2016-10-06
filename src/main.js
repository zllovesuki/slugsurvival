var Vue = require('vue')

var VueRouter = require('vue-router')
var sync = require('vuex-router-sync').sync

Vue.use(VueRouter)

var store = require('./lib/vuex/store.js');

var App = require('./app.vue')
var router = new VueRouter({
    history: true,
    saveScrollPosition: true
})

router.map({
    '/': {
        name: 'index',
        component: require('./views/index.vue')
    },
    '/planner': {
        name: 'planner',
        component: require('./views/planner/index.vue'),
        subRoutes: {
            '/': {
                name: 'termsList',
                component: require('./views/planner/termsList.vue')
            },
            '/:termId': {
                name: 'term',
                component: require('./views/planner/term.vue')
            }
        }
    },
    '/enrollment': {
        name: 'enrollment',
        component: require('./views/enrollment/index.vue'),
        subRoutes: {
            '/': {
                name: 'enrollHelper',
                component: require('./views/enrollment/helper.vue')
            },
            '/manage': {
                name: 'enrollManage',
                component: require('./views/enrollment/manage.vue')
            }
        }
    }
})

require('./lib/init.js')(store, router)
require('./lib/registerIcons.js')(Vue)
require('./lib/registerComponents.js')(Vue)
require('./lib/registerTransistions.js')(Vue)

sync(store, router);

router.start(App, '#app')
