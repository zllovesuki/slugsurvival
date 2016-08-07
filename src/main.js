var Vue = require('vue')

var VueRouter = require('vue-router')
var sync = require('vuex-router-sync').sync
var VueTables = require('vue-tables')

Vue.use(VueRouter)
Vue.use(require('vue-resource'))
Vue.use(require('vue-moment'))
Vue.use(VueTables.client, {}, {
	template: require('./components/tableTemplate.html')
});

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
	'/calendar': {
		name: 'calendar',
		component: require('./views/calendar/index.vue'),
		subRoutes: {
			'/': {
				name: 'termsList',
				component: require('./views/calendar/termsList.vue')
			},
			'/:termId': {
				name: 'term',
				component: require('./views/calendar/term.vue')
			}
		}
	}
})

require('./lib/init.js')(store, router)
require('./lib/registerIcons.js')(Vue)
require('./lib/registerComponents.js')(Vue)
require('./lib/registerTransistions.js')(Vue)

window.App = App;

sync(store, router);

router.start(App, '#app')
