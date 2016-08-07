var Vue = require('vue')

var VueRouter = require('vue-router')
var sync = require('vuex-router-sync').sync

Vue.use(VueRouter)
Vue.use(require('vue-resource'))
Vue.use(require('vue-moment'))

var store = require('./lib/vuex/store.js');

var App = require('./app.vue')
var router = new VueRouter({
	history: true,
	saveScrollPosition: true
})

router.map({
	'/calendar': {
		name: 'calendar',
		component: require('./views/calendar/index.vue'),
		subRoutes: {
			':termId': {
				name: 'term',
				component: require('./views/calendar/term.vue')
			}
		}
	}
})

require('./lib/registerIcons.js')(Vue)
require('./lib/registerComponents.js')(Vue)

window.App = App;

sync(store, router);

router.start(App, '#app')
