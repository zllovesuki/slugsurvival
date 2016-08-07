<template>
	<div>
		<div class="overflow-hidden bg-white rounded mb2 clearfix">
			<div class="m0 p2">
				<div id="calendar"></div>
			</div>
		</div>
		<modal :show.sync="searchModal">
			<h4 slot="header">
				<input type="text" class="field block col-12 mb1 search-box" v-model="search.string" debounce="500">
			</h4>
			<span slot="body">
					<ul class="list-reset block y-scrollable">
					<li class="overflow-hidden" v-for="result in search.results" track-by="$index">
						<a class="btn" @click="addToSource(result)">
							{{ result.code }} - {{ result.section }}  - {{ result.name }}
						</a>
					</li>
				</ul>
			</span>
		</modal>
	</div>
</template>

<script>

var getters = require('../../lib/vuex/getters.js')
var actions = require('../../lib/vuex/actions.js')

module.exports = {
	vuex: {
		getters: getters,
		actions: actions
	},
	data: function() {
		return {
			searchModal: false,
			search: {
				string: '',
				results: []
			}
		}
	},
	watch: {
		'search.string': function(val, oldVal) {
			if (val.length < 1) return;
			this.search.results = this.bruteForceSearch(val);
		}
	},
	methods: {
		showModal: function() {
			this.searchModal = true;
			this.search.string = '';
			this.search.results = [];
			setTimeout(function() {
				document.getElementsByClassName('search-box')[0].focus();
			}, 500);
		},
		bruteForceSearch: function(string) {
			var results = [];
			string = string.toLowerCase();
			results = this.flatTerms[this.termId].filter(function(course) {
				return course.code.toLowerCase().indexOf(string) !== -1 || course.name.toLowerCase().indexOf(string) !== -1;
			});
			return results;
		},
		addToSource: function(course) {
			var html = '';
			var template = function(key, value) {
				return ['<p>', '<span class="muted">', key, ': </span><b>', value, '</b>', '</p>'].join('');
			}
			html += template('Course Number', course.number);
			if (!!course.time) {
				html += template('Location', course.location);
				html += template('Meeting Day', course.time.day.join(', '));
				html += template('Meeting Time', course.time.time.start + '-' + course.time.time.end);
				this.alert()
				.okBtn("Add")
				.cancelBtn("Return")
				.confirm(html)
				.then(function(resolved) {
					resolved.event.preventDefault();
					if (resolved.buttonClicked !== 'ok') return;
					this.pushToEventSource(course)
				}.bind(this));
			}else{
				html += template('Location', 'TBA');
				html += template('Meeting Day', 'TBA');
				html += template('Meeting Time', 'TBA');
				this.alert()
				.alert(html)
			}

		}
	},
	ready: function() {
		this.fetchTerms().then(function() {
			return this.fetchTermCourses()
		}.bind(this)).then(function(courses) {
			return this.initializeCalendar()
		}.bind(this))

	}
}
</script>

<style>
ul {
	max-height: 20em;
}
</style>
