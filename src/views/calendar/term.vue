<template>
	<div>
		<div class="overflow-hidden bg-white rounded mb2 clearfix">
			<div class="m0 p2">
				<div class="clearfix">
					<div class="left">
						<a class="btn btn-outline h6 m0 {{ color }}" v-on:click.prevent.stop="showAllModal">
							{{ show.calendar ? 'show all classes' : 'show planner' }}
						</a>
					</div>
					<div class="right">
						<a class="btn btn-outline h6 m0 {{ color }}" v-on:click.prevent.stop="showSearchModal" v-show="show.calendar">
							add classes by search
						</a>
					</div>
				</div>
			</div>
		</div>
		<div id="calendar-container" class="overflow-hidden bg-white rounded mb2 clearfix" v-bind:class="{ 'hide': !show.calendar }">
			<div class="m0 p2">
				<div id="calendar-{{ termId }}"></div>
			</div>
		</div>
		<div class="overflow-hidden bg-white rounded mb2 clearfix" v-show="show.calendar">
			<div class="m0 p2">
				<div class="clearfix">
					<div class="left">
						<a class="btn btn-outline red h6" v-on:click="saveCalendarAsImage">
							Save Calendar As Image
						</a>
					</div>
					<div class="right">
						<a class="btn h6 m0 {{ color }}">
							Color code:
						</a>
						<a class="btn btn-outline white h6" style="background-color: #008000">
							TBA
						</a>
						<a class="btn btn-outline white h6" style="background-color: #6aa4c1">
							Class
						</a>
						<a class="btn btn-outline white h6" style="background-color: #9f9f9f">
							Section
						</a>
					</div>
				</div>
			</div>
		</div>
		<div id="all" v-if="ready" v-bind:class="{ 'hide': !show.table }">
			<v-client-table :data="dataForTable" :columns="allTable.columns" :options="allTable.options"></v-client-table>
		</div>
		<modal :show.sync="searchModal">
			<h4 slot="header">
				<input type="text" class="field block col-12 mb1 search-box" v-model="search.string" debounce="250" placeholder="ECON 197, Design, Baskin, Mendes, etc...">
			</h4>
			<span slot="body">
					<ul class="list-reset block">
					<li class="overflow-hidden" v-for="result in search.results" track-by="$index">
						<a class="btn h5" v-on:click.prevent.stop="promptAddClass(result)">
							{{ result.code }} - {{ result.section }}  - {{ result.name }}
						</a>
					</li>
					<li v-show="search.string.length > 0 && search.results.length === 0">No results.</li>
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
				columns: ['code', 'section', 'name', 'type', 'Has Sections'],
				options: {
					perPage: 25,
					perPageValues: [10, 25, 50, 100],
					onRowClick: function(row) {
						this.promptAddClass(row);
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
			var self = this;
			return this.flatCourses[this.termId].map(function(course) {
				course.type = self.courseInfo[self.termId][course.number].type;
				course['Has Sections'] = self.courseInfo[self.termId][course.number].sections.length > 0 ? 'Yes' : 'No';
				return course;
			});
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
		getCourseDom: function(course, isSection) {
			// TODO: Reduce special cases
			isSection = isSection || false;
			if (!isSection) {
				var courseHasSections = this.courseHasSections(course.number);
			}
			var html = '';
			var template = function(key, value) {
				return ['<p>', '<span class="muted h6">', key, ': </span><b class="h5">', value, '</b>', '</p>'].join('');
			}
			// html += template('Course Number', course.number);
			if (isSection) {
				html += template('Section', 'DIS - ' + course.section);
				html += template('TA', course.instructor);
			}else{
				html += template(course.code, courseHasSections ? 'has sections': 'has NO sections');
				html += template('Instructor(s)', course.instructor.displayName.join(', ') + (!!!course.instructor.firstName ? '' : '<sup class="muted clickable" onclick="window.App._showInstructorRMP(\'' + course.instructor.firstName.replace(/'/g, '\\\'') + '\', \'' + course.instructor.lastName.replace(/'/g, '\\\'') + '\')">RateMyProfessors</sup>') );
			}
			html += template('Location', !!!course.location ? 'TBA': course.location);
			html += template('Meeting Day', !!!course.time ? 'TBA' : course.time.day.join(', '));
			html += template('Meeting Time', !!!course.time ? 'TBA' : this.tConvert(course.time.time.start) + '-' + this.tConvert(course.time.time.end));
			if (!isSection) {
				html += template('Capacity', course.capacity);
			}

			return html;
		},
		promptToRemove: function(calEvent) {
			var termId = this.route.params.termId;
			this.alert()
			.okBtn("Yes")
			.cancelBtn("No")
			.confirm('Remove ' + calEvent.course.code + ' from calendar?')
			.then(function(resolved) {
				resolved.event.preventDefault();
				if (resolved.buttonClicked !== 'ok') return;
				this.removeFromSource(termId, calEvent.number);
				this.refreshCalendar();
				this.alert().success('Removed!')
			}.bind(this));
		},
		promptForAction: function(calEvent) {
			var isSection = typeof calEvent.section !== 'undefined';
			var course = isSection ? calEvent.section : calEvent.course;
			if (isSection && course === null) {
				// Choose later
				return this.promptSections(calEvent.number, true);
			}
			var html = this.getCourseDom(course, isSection);
			return this.alert()
			.okBtn(isSection ? 'Change Section' : 'Remove Class')
			.cancelBtn("Go Back")
			.confirm(html)
			.then(function(resolved) {
				resolved.event.preventDefault();
				if (resolved.buttonClicked !== 'ok') return;
				if (isSection) {
					this.promptSections(calEvent.number, true);
				}else{
					this.promptToRemove(calEvent);
				}
			}.bind(this));
		},
		promptAddClass: function(course) {
			var courseHasSections = this.courseHasSections(course.number);
			var code = this.checkForConflict(course);
			var alertHandle = function() {};

			var html = this.getCourseDom(course);

			if (code !== false || code === null) {
				alertHandle = function() {
					return this.alert()
					.okBtn(code === null ? 'Taking the same class twice?' : 'Conflict with ' + code)
					.alert(html)
				}.bind(this)
			}else{
				alertHandle = function() {
					return this.alert()
					.okBtn(courseHasSections ? 'Choose Section' : 'Add Class')
					.cancelBtn("Go Back")
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
		},
		promptSections: function(courseNumber, edit) {
			edit = edit || false;
			var course = this.courseInfo[this.termId][courseNumber];
			// TODO: customize display (like NOT hard coding it)
			var headTemplate = function(name) {
				return ['<th>', name, '</th>'].join('');
			}
			var conflictClass = 'muted not-clickable';
			var notConflictClass = 'clickable';
			var generateRows = function(sections) {
				var string = '';
				for (var i = 0, length = sections.length; i < length; i++) {
					if (this.checkForConflict(sections[i]) === false) {
						string += '<tr class="' + notConflictClass + '" onclick="window.App._pushSectionToEventSource(' + courseNumber + ', ' + sections[i].number + ', ' + edit + ')">';
					}else{
						string += '<tr class="' + conflictClass + '" onclick="window.App._pushSectionToEventSource(' + courseNumber + ', ' + sections[i].number + ', ' + edit + ')">';
					}
					string += ['<td>', sections[i].section, '</td>'].join('');
					string += ['<td>', !!!sections[i].time ? 'TBA' : sections[i].time.day.join(', '), '<br>', [this.tConvert(sections[i].time.time.start), this.tConvert(sections[i].time.time.end)].join('-'), '</td>'].join('');
					string += ['<td>', sections[i].location, '</td>'].join('');
					string += '</a></tr>';
				}
				return string;
			}.bind(this)
			var table = '<p>' + (edit ? 'Choose another section' : 'Choose a section') + '</p>'
			+ '<table class="table-light h6">'
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
			.okBtn("Choose Later")
			.cancelBtn("Go Back")
			.confirm(table)
			.then(function(resolved) {
				resolved.event.preventDefault();
				if (resolved.buttonClicked !== 'ok') return;
				this._pushSectionToEventSource(courseNumber, null, true);
			}.bind(this));
		},
		initializeCalendar: function() {
			var self = this;
			var termId = this.route.params.termId;
			$('#calendar-' + termId).fullCalendar({
				columnFormat: 'ddd',
				minTime: '07:00',
				maxTime: '23:00',
				defaultDate: self.dateMap.Monday,
				allDayText: 'TBA',
				//allDaySlot: false,
				weekends: false,
				defaultView: 'agendaWeek',
				header: false,
				contentHeight: 'auto',
				eventSources: [{
					events: function(start, end, timezone, callback) {
						callback(self.eventSource[termId]);
					},
				}],
				eventClick: function(calEvent, jsEvent, view) {
					self.promptForAction(calEvent);
				}
			})
		},
		loadCanvasBundle: function(callback) {
			var self = this;
			$script(dist + 'html2canvas/0.5.0-beta4-no-585a96a/html2canvas.min.js', 'canvasRootDep');
			$script.ready('canvasRootDep', function() {
				self.loading.go(60);
				$script([dist + 'html2canvas/0.5.0-beta4-no-585a96a/html2canvas.svg.min.js', dist + 'canvas/canvas-toBlob.js', dist + 'canvas/FileSaver.min.js'], 'canvasBundle')
				$script.ready('canvasBundle', callback)
			})
		},
		saveCalendarAsImage: function() {
			var self = this;
			this.loading.go(30);
			this.loadCanvasBundle(function() {
				self.loading.go(80);
				html2canvas(document.getElementById('calendar-container'), {
					useCORS: true
				}).then(function(canvas) {
					canvas.toBlob(function(blob) {
						self.loading.go(100);
						saveAs(blob, 'Schedule for ' + self.termName + '.png');
					});
				})
			})
		}
	},
	ready: function() {
		var self = this;
		this.loading.go(30);
		this.setTitle('Planner');
		this.fetchTermCourses().then(function() {
			this.loading.go(50);
			this.ready = true;
			$script([dist + 'jquery/3.1.0/jquery-3.1.0.min.js', dist + 'moment/2.14.1/moment.min.js'], 'jQuery');
			$script.ready('jQuery', function() {
				self.loading.go(70);
				$script(dist + 'fullcalender/2.9.1/fullcalendar.min.js', 'calendar')
				$script.ready('calendar', function() {
					self.loading.go(100);
					self.initializeCalendar();
				})
			})
		}.bind(this))
	}
}
</script>

<style>
ul {
	max-height: 20em;
}
.fc-agenda-view tr {
     height: 40px !important;
}
</style>
