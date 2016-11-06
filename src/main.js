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
            name: 'mainPage',
            component: require('./views/index.vue')
        },
        {
            path: '/analytics',
            name: 'analytics',
            component: require('./views/analytics/index.vue'),
            children: [
                {
                    path: ':termId?/:courseNum?',
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
                    path: '',
                    name: 'explainText',
                    component: require('./views/explain/text.vue')
                },
                {
                    path: 'gif',
                    name: 'explainGif',
                    component: require('./views/explain/gif.vue')
                },
                {
                    path: 'privacy',
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
                    path: '',
                    name: 'termsList',
                    component: require('./views/planner/termsList.vue')
                },
                {
                    path: ':termId',
                    name: 'term',
                    component: require('./views/planner/term.vue')
                },
                {
                    path: ':termId/list',
                    name: 'viewList',
                    component: require('./views/planner/list.vue')
                }
            ]
        },
        {
            path: '/enrollment',
            name: 'enrollment',
            component: require('./views/enrollment/index.vue'),
            children: [
                {
                    path: '',
                    name: 'enrollHelper',
                    component: require('./views/enrollment/helper.vue')
                },
                {
                    path: 'manage',
                    name: 'enrollManage',
                    component: require('./views/enrollment/manage.vue')
                }
            ]
        },
        {
            path: '/requirement',
            name: 'requirement',
            component: require('./views/req/index.vue'),
            children: [
                {
                    path: '',
                    name: 'reqMenu',
                    component: require('./views/req/menu.vue')
                },
                {
                    path: 'volunteer',
                    name: 'reqVolunteer',
                    component: require('./views/req/volunteer.vue')
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
