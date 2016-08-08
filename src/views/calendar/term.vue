<template>
	<div>
		<div class="overflow-hidden bg-white rounded mb2 clearfix">
			<div class="m0 p2">
				<div class="clearfix">
					<div class="left">
						<a class="btn btn-outline h5 m0 {{ color }}" @click="showAllModal">
							{{ show.calendar ? 'show all classes' : 'show planner' }}
						</a>
					</div>
					<div class="right">
						<a class="btn btn-outline h5 m0 {{ color }}" @click="showSearchModal" v-show="show.calendar">
							add classes by search
						</a>
					</div>
				</div>
			</div>
		</div>
		<div class="overflow-hidden bg-white rounded mb2 clearfix" v-bind:class="{ 'hide': !show.calendar }">
			<div class="m0 p2">
				<div id="calendar-{{ termId }}"></div>
			</div>
		</div>
		<div id="all" v-if="ready" v-bind:class="{ 'hide': !show.table }">
			<v-client-table :data="dataForTable" :columns="allTable.columns" :options=allTable.options></v-client-table>
		</div>
		<modal :show.sync="searchModal">
			<h4 slot="header">
				<input type="text" class="field block col-12 mb1 search-box" v-model="search.string" debounce="250" placeholder="ECON 197, Design, Baskin, Mendes, etc...">
			</h4>
			<span slot="body">
					<ul class="list-reset block y-scrollable">
					<li class="overflow-hidden" v-for="result in search.results" track-by="$index">
						<a class="btn" @click="addToSource(result)">
							{{ result.code }} - {{ result.section }}  - {{ result.name }}
						</a>
					</li>
					<li v-if="search.string.length > 0 && search.results.length === 0">No results.</li>
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
			ready: false,
			searchModal: false,
			search: {
				string: '',
				results: []
			},
			allTable: {
				columns: ['code', 'section', 'name', 'type'],
				options: {
					perPage: 25,
					perPageValues: [10, 25, 50, 100],
					onRowClick: function(row) {
						this.addToSource(row);
					}.bind(this)
				}
			},
			show: {
				calendar: true,
				table: false
			}
		}
	},
	computed: {
		dataForTable: function() {
			return this.flatCourses[this.termId];
		}
	},
	watch: {
		'search.string': function(val, oldVal) {
			if (val.length < 1) return;
			this.search.results = this.bruteForceSearch(val);
		}
	},
	methods: {
		showAllModal: function() {
			this.show.calendar = !this.show.calendar;
			this.show.table = !this.show.table;
		},
		showSearchModal: function() {
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
			results = this.flatCourses[this.termId].filter(function(course) {
				return course.code.toLowerCase().indexOf(string) !== -1
				|| course.name.toLowerCase().indexOf(string) !== -1
				|| (!!!course.location ? false : course.location.toLowerCase().indexOf(string) !== -1)
				|| (!!!course.instructor.firstName ? false : course.instructor.firstName.toLowerCase().indexOf(string) !== -1)
				|| (!!!course.instructor.lastName ? false : course.instructor.lastName.toLowerCase().indexOf(string) !== -1);
			});
			return results;
		},
		promptSections: function(courseNumber) {
			var course = this.courseInfo[this.termId][courseNumber];
			// TODO: customize display (like NOT hard coding it)
			var headTemplate = function(name) {
				return ['<th>', name, '</th>'].join('');
			}
			var generateRows = function(sections) {
				var string = '';
				sections.forEach(function(section) {
					string += '<tr class="clickable" onclick="window.App._pushSectionToEventSource(' + courseNumber + ', ' + section.number + ')">';
					string += ['<td>', section.section, '</td>'].join('');
					string += ['<td>', !!!section.time ? 'TBA' : section.time.day.join(','), '<br>', [section.time.time.start, section.time.time.end].join('-'), '</td>'].join('');
					string += ['<td>', section.location, '</td>'].join('');
					string += '</a></tr>';
				})
				return string;
			}
			var table = '<table class="table-light">'
			+ '<thead>'
			+ headTemplate('Section')
			+ headTemplate('Meeting Time')
			+ headTemplate('Location')
			+ '</thead>'
			+ '<tbody>'
			+ generateRows(course.sections)
			+ '</tbody>'
			+ '</table>';

			this.alert()
			.okBtn("Return")
			.alert(table)
		},
		addToSource: function(course) {
			var courseHasSections = this.courseHasSections(course.number);
			var code = this.checkForConflict(course);
			var alertHandle = function() {};
			var html = '';
			var template = function(key, value) {
				return ['<p>', '<span class="muted h6">', key, ': </span><b>', value, '</b>', '</p>'].join('');
			}

			html += template('This class', courseHasSections ? 'has sections': 'has NO sections');
			//html += template('Course Number', course.number);
			html += template('Instructor(s)', course.instructor.displayName.join(', '));
			html += template('Location', !!!course.location ? 'TBA': course.location);
			html += template('Meeting Day', !!!course.time ? 'TBA' : course.time.day.join(', '));
			html += template('Meeting Time', !!!course.time ? 'TBA' : course.time.time.start + '-' + course.time.time.end);
			html += template('Capacity', course.capacity);

			if (code !== false || code === null) {
				alertHandle = function() {
					return this.alert()
					.okBtn(code === null ? 'Taking the same class twice?' : 'Conflict with ' + code)
					.alert(html)
				}.bind(this)
			}else{
				alertHandle = function() {
					this.alert()
					.okBtn(courseHasSections ? 'Sections' : 'Add')
					.cancelBtn("Return")
					.confirm(html)
					.then(function(resolved) {
						resolved.event.preventDefault();
						if (resolved.buttonClicked !== 'ok') return;
						if (courseHasSections) {
							this.promptSections(course.number);
						} else {
							this.pushToEventSource(course);
						}
					}.bind(this));
				}.bind(this)
			}
			return alertHandle()
		}
	},
	ready: function() {
		this.setTitle('Planner')
		this.fetchTermCourses().then(function() {
			this.ready = true;
			this.initializeCalendar();
			$('[class*="fc-button"]').addClass('btn btn-outline');
			$('[class*="fc-button"]').removeClass('fc-state-default');

		}.bind(this))
	}
}
</script>

<style>
ul {
	max-height: 20em;
}
</style>
