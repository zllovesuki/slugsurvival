"use strict"
var Vue = require('vue').default

var VueRouter = require('vue-router').default
var sync = require('vuex-router-sync').sync
var VTooltip = require('v-tooltip').default

Vue.use(VueRouter)
Vue.use(VTooltip)

var store = require('./lib/vuex/store.js');

var App = Vue.extend(require('./app.vue').default);

var router = new VueRouter({
    mode: 'history',
    saveScrollPosition: true,
    routes: [
        {
            path: '/',
            name: 'mainPage',
            component: require('./views/index.vue').default
        },
        {
            path: '/bugzilla',
            name: 'bugzilla',
            component: require('./views/bugzilla.vue').default
        },
        {
            path: '/donate',
            name: 'donate',
            component: require('./views/donate.vue').default
        },
        {
            path: '/analytics',
            component: require('./views/analytics/index.vue').default,
            children: [
                {
                    path: 'realtime',
                    name: 'analyticsRealtime',
                    component: require('./views/analytics/realtime.vue').default
                },
                {
                    path: ':termId?/:courseNum?',
                    name: 'analyticsCourse',
                    component: require('./views/analytics/course.vue').default
                }
            ]
        },
        {
            path: '/explain',
            component: require('./views/explain/index.vue').default,
            children: [
                {
                    path: '',
                    name: 'explainText',
                    component: require('./views/explain/text.vue').default
                },
                {
                    path: 'gif',
                    name: 'explainGif',
                    component: require('./views/explain/gif.vue').default
                },
                {
                    path: 'privacy',
                    name: 'explainPrivacy',
                    component: require('./views/explain/privacy.vue').default
                },
                {
                    path: 'opensource',
                    name: 'openSource',
                    component: require('./views/explain/opensource.vue').default
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
            component: require('./views/planner/index.vue').default,
            children: [
                {
                    path: '',
                    name: 'termsList',
                    component: require('./views/planner/termsList.vue').default
                },
                {
                    path: ':termId',
                    name: 'term',
                    component: require('./views/planner/term.vue').default
                },
                {
                    path: ':termId/list',
                    name: 'viewList',
                    component: require('./views/planner/list.vue').default
                }
            ]
        },
        {
            path: '/enrollment',
            component: require('./views/enrollment/index.vue').default,
            children: [
                {
                    path: '',
                    name: 'enrollHelper',
                    component: require('./views/enrollment/helper.vue').default
                },
                {
                    path: 'manage',
                    name: 'enrollManage',
                    component: require('./views/enrollment/manage.vue').default
                }
            ]
        },
        {
            path: '/advisory',
            component: require('./views/advisory/index.vue').default,
            children: [
                {
                    path: '',
                    name: 'advMenu',
                    component: require('./views/advisory/menu.vue').default
                },
                {
                    path: 'planner',
                    name: 'advPlanner',
                    component: require('./views/advisory/planner.vue').default
                }
                /*,
                {
                    path: 'volunteer',
                    name: 'reqVolunteer',
                    component: require('./views/req/volunteer.vue').default
                },
                {
                    path: 'volunteer/:type?/:name?',
                    name: 'reqVolunteerForm',
                    component: require('./views/req/volunteer.vue').default
                }*/
            ]
        }
    ]
})

require('./lib/registerComponents.js')(Vue)

require('./lib/init.js')(store, router).then(function() {
    sync(store, router);
    var vm = new App({
        router: router,
        store: store
    }).$mount('#app')
    window.App = vm;
})