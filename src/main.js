var Vue = require('vue')

var VueRouter = require('vue-router')
var sync = require('vuex-router-sync').sync

Vue.use(VueRouter)

var store = require('./lib/vuex/store.js');

var App = Vue.extend(require('./app.vue'));

var router = new VueRouter({
    mode: 'history',
    saveScrollPosition: true,
    routes: [
        {
            path: '/',
            name: 'index',
            component: require('./views/index.vue')
        },
        {
            path: '/analytics',
            name: 'analytics',
            component: require('./views/analytics/index.vue'),
            children: [
                {
                    path: '/',
                    name: 'analyticsHelper',
                    component: require('./views/analytics/helper.vue')
                },
                {
                    path: '/analytics/:termId/:courseNum',
                    name: 'analyticsCourse',
                    component: require('./views/analytics/course.vue')
                }
            ]
        },
        {
            path: '/explain',
            name: 'explain',
            component: require('./views/explain/index.vue'),
            children: [
                {
                    path: '/',
                    name: 'explainText',
                    component: require('./views/explain/text.vue')
                },
                {
                    path: '/explain/gif',
                    name: 'explainGif',
                    component: require('./views/explain/gif.vue')
                },
                {
                    path: '/explain/privacy',
                    name: 'explainPrivacy',
                    component: require('./views/explain/privacy.vue')
                }
            ]
        },
        {
            path: '/calendar',
            redirect: '/planner'
        },
        {
            path: '/calendar/:termId',
            redirect: '/planner/:termId'
        },
        {
            path: '/planner',
            name: 'planner',
            component: require('./views/planner/index.vue'),
            children: [
                {
                    path: '/',
                    name: 'termsList',
                    component: require('./views/planner/termsList.vue')
                },
                {
                    path: '/planner/:termId',
                    name: 'term',
                    component: require('./views/planner/term.vue')
                }
            ]
        },
        {
            path: '/enrollment',
            name: 'enrollment',
            component: require('./views/enrollment/index.vue'),
            children: [
                {
                    path: '/',
                    name: 'enrollHelper',
                    component: require('./views/enrollment/helper.vue')
                },
                {
                    path: '/enrollment/manage',
                    name: 'enrollManage',
                    component: require('./views/enrollment/manage.vue')
                }
            ]
        }
    ]
})

require('./lib/init.js')(store, router)
require('./lib/registerComponents.js')(Vue)
//require('./lib/registerTransistions.js')(Vue)

sync(store, router);

var vm = new App({
    router: router,
    store: store
}).$mount('#app')
