var helper = require('./helper')

var self = module.exports = {
	alert: function(_) {
		return _.state.alert;
	},
	setTitle: function(_, title) {
		_.dispatch('setTitle', title)
	},
	fetchTerms: function(_) {
		return helper.getWithHeader(this.$http, _.state, '/db/terms.json')
		.then(function(res) {
			if (typeof res === 'undefined') return;
			var data = res.json();
			_.dispatch('saveTermsList', data);
			return data;
		})
	},
	fetchTermCourses: function(_) {
		var termId = _.state.route.params.termId;
		_.dispatch('setTermName', _.state.termsList[termId])
		if (typeof _.state.courses[termId] === 'undefined') {
			return helper.getWithHeader(this.$http, _.state, '/db/terms/' + termId + '.json')
			.then(function(res) {
				if (typeof res === 'undefined') return;
				var coursesData = res.json();
				_.dispatch('saveTermCourses', termId, coursesData);
				return helper.getWithHeader(this.$http, _.state, '/db/courses/' + termId + '.json')
				.then(function(res) {
					if (typeof res === 'undefined') return;
					var courseInfo = res.json();
					_.dispatch('saveCourseInfo', termId, courseInfo);
					return coursesData
				})
			})
		}else{
			return Promise.resolve(_.state.courses[termId])
		}
	},
	courseHasSections: function(_, courseNumber) {
		var termId = _.state.route.params.termId;
		return _.state.courseInfo[termId][courseNumber].sections.length > 0;
	},
	initializeCalendar: function(_) {
		// TODO: do not couple this tightly with views/calendar/term.vue
		var self = this;
		var termId = _.state.route.params.termId;
		$('#calendar-' + termId).fullCalendar({
			columnFormat: 'ddd',
			minTime: '07:00',
			maxTime: '23:00',
			defaultDate: _.state.dateMap.Monday,
			allDayText: 'TBA',
			//allDaySlot: false,
			weekends: false,
			defaultView: 'agendaWeek',
			header: false,
			contentHeight: 'auto',
			eventSources: [
				{
		            events: function(start, end, timezone, callback) {
		                callback(_.state.events[termId]);
		            },
		            //color: 'yellow',   // an option!
		            //textColor: 'black' // an option!
		        }
		    ],
			eventClick: function(calEvent, jsEvent, view) {
				if (typeof calEvent._number !== 'undefined') {
					// clicked on a section, ask if user wants to change
					self.promptSections(calEvent.number, true);
				}else{
					// or else just ask to remove the whole damn thing
					self.alert()
					.okBtn("Yes")
					.cancelBtn("No")
					.confirm('Remove ' + calEvent.course.code + ' from calendar?')
					.then(function(resolved) {
						resolved.event.preventDefault();
						if (resolved.buttonClicked !== 'ok') return;
						_.dispatch('removeFromSource', termId, calEvent.number);
						self.refreshCalendar();
						_.state.alert.success('Removed!')
					}.bind(self));
				}
			}
		})
	},
	refreshCalendar: function(_) {
		$('#calendar-' + _.state.route.params.termId).fullCalendar( 'refetchEvents' )
	},
	promptSections: function(_, courseNumber, edit) {
		edit = edit || false;
		var course = this.courseInfo[this.termId][courseNumber];
		// TODO: customize display (like NOT hard coding it)
		var headTemplate = function(name) {
			return ['<th>', name, '</th>'].join('');
		}
		var generateRows = function(sections) {
			var string = '';
			sections.forEach(function(section) {
				string += '<tr class="clickable" onclick="window.App._pushSectionToEventSource(' + courseNumber + ', ' + section.number + ', ' + edit + ')">';
				string += ['<td>', section.section, '</td>'].join('');
				string += ['<td>', !!!section.time ? 'TBA' : section.time.day.join(','), '<br>', [section.time.time.start, section.time.time.end].join('-'), '</td>'].join('');
				string += ['<td>', section.location, '</td>'].join('');
				string += '</a></tr>';
			})
			return string;
		}
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
		.okBtn("Return")
		.alert(table)
	},
	returnEventSourceSnapshot: function(_) {
		var termId = _.state.route.params.termId;
		return _.state.events[termId]
	},
	pushToEventSource: function(_, course, edit) {
		edit = edit || false;
		var termId = _.state.route.params.termId;
		var code;
		var obj = {};
		if (!!!course.time) {
			// TBA will be in the allDaySlot
			obj.title = [course.code + ' - ' + course.section, course.name].join("\n");
			obj.number = course.number;
			obj.allDay = true;
			obj.start = _.state.dateMap['Monday'];
			obj.end = _.state.dateMap['Saturday'];
			obj.course = course;
			_.dispatch('pushToEventSource', termId, obj);
			obj = {};
		}else{
			course.time.day.forEach(function(day) {
				obj.title = [course.code + ' - ' + course.section, course.name].join("\n");
				obj.number = course.number;
				obj.allDay = false;
				obj.start = _.state.dateMap[day] + ' ' + course.time.time.start;
				obj.end = _.state.dateMap[day] + ' ' + course.time.time.end;
				obj.course = course;
				_.dispatch('pushToEventSource', termId, obj);
				obj = {};
			})
		}
		this.refreshCalendar();
		if (edit) {
			this.alert().success(course.code + ' edited!')
		}else{
			this.alert().success(course.code + ' added to the planner!')
		}
		return Promise.resolve();
	},
	_pushSectionToEventSource: function(_, courseNumber, sectionNumber, edit) {
		edit = edit || false;
		var termId = _.state.route.params.termId;
		var courseInfo = _.state.courseInfo[termId][courseNumber];
		var courses = _.state.flatCourses[termId];
		var obj = {};
		var snapshot = [];
		var code;
		var section = courseInfo.sections.filter(function(section) {
			return section.number == sectionNumber
		});
		section = section[0];
		var course = courses.filter(function(course) {
			return course.number == courseNumber;
		})
		course = course[0];
		snapshot = this.returnEventSourceSnapshot();
		if (edit) {
			_.dispatch('removeFromSource', termId, course.number);
		}
		if ((code = this.checkForConflict(section)) !== false) {
			this.alert().error('Section conflict with ' + code + '!')
			_.dispatch('restoreEventSourceSnapshot', termId, snapshot);
			return Promise.resolve();
		}
		var day = section.time.day[0];
		obj.title = ['DIS ' + section.section, 'Section for ' + course.code].join("\n");
		obj.number = course.number;
		obj._number = section.number;
		if (!!!section.time) {
			// TBA will be in the allDaySlot
			obj.start = _.state.dateMap['Monday'];
			obj.end = _.state.dateMap['Saturday'];
		}else{
			obj.start = _.state.dateMap[day] + ' ' + section.time.time.start;
			obj.end = _.state.dateMap[day] + ' ' + section.time.time.end;
		}
		obj.course = course;
		obj.section = section;
		_.dispatch('pushToEventSource', termId, obj);
		this.pushToEventSource(course, edit);
		this.refreshCalendar();
		$('.alertify').remove();
		return Promise.resolve();
	},
	checkForConflict: function(_, course) {
		/*
			TODO: This method needs a more efficient rewrite
			Who the fuck write so many forLoops anyway?
		*/
		var termId = _.state.route.params.termId;
		var intersectDays = [];
		var existingDays = [];
		var existingTimes = {};
		var comingTime = {};
		var keys = [];
		var conflict = false;
		if (typeof _.state.events[termId] === 'undefined') return conflict;
		_.state.events[termId].forEach(function(event) {
			// You can't take the same class twice in a quarter
			// At least you shouldn't
			if (event.course.code === course.code) {
				conflict = course.code;
				return;
			}
			if (event.allDay) return;
			existingDays.push(event.course.time.day);
		})
		if (conflict !== false) return null;
		if (!!!course.time) {
			// TBA
			return conflict;
		}
		intersectDays = helper.containsAll.apply(this, existingDays.concat([course.time.day]))
		if (intersectDays.length === 0) return false;
		intersectDays.forEach(function(conflictDay) {
			_.state.events[termId].forEach(function(event) {
				if (event.allDay) return;
				if (event.course.time.day.indexOf(conflictDay) !== -1) {
					existingTimes[event.course.code] = event.course.time.time;
				}
			})
		})
		keys = Object.keys(existingTimes);
		if (keys.length === 0) return conflict;
		comingTime = course.time.time;
		keys.forEach(function(code) {
			if ( (comingTime.end.replace(':', '') > existingTimes[code].start.replace(':', '')
			&& comingTime.start.replace(':', '') < existingTimes[code].end.replace(':', '')) ) {
				// new course is eating from behind
				conflict = code;
				return;
			}

			if ( (comingTime.end.replace(':', '') > existingTimes[code].start.replace(':', '')
			&& comingTime.end.replace(':', '') < existingTimes[code].end.replace(':', '')) ) {
				// new course is eating from ahead
				conflict = code;
				return;
			}

			if ( (comingTime.end.replace(':', '') == existingTimes[code].start.replace(':', '')
			|| comingTime.start.replace(':', '') == existingTimes[code].end.replace(':', '')) ) {
				// piggy back
				conflict = code;
				return;
			}

			if ( (comingTime.end.replace(':', '') == existingTimes[code].end.replace(':', '')
			|| comingTime.start.replace(':', '') == existingTimes[code].start.replace(':', '')) ) {
				// overlap
				conflict = code;
				return;
			}

			if ( (comingTime.end.replace(':', '') >= existingTimes[code].end.replace(':', '')
			&& comingTime.start.replace(':', '') < existingTimes[code].start.replace(':', '')) ) {
				// new course is outside (existing bottom)
				conflict = code;
				return;
			}

			if ( (comingTime.start.replace(':', '') == existingTimes[code].start.replace(':', '')
			&& comingTime.end.replace(':', '') < existingTimes[code].end.replace(':', '')) ) {
				// new course is outside (existing top)
				conflict = code;
				return;
			}

			if ( (comingTime.start.replace(':', '') == existingTimes[code].start.replace(':', '')
			&& comingTime.end.replace(':', '') < existingTimes[code].end.replace(':', '')) ) {
				// new course is inside (top)
				conflict = code;
				return;
			}

			if ( (comingTime.start.replace(':', '') < existingTimes[code].start.replace(':', '')
			&& comingTime.end.replace(':', '') == existingTimes[code].end.replace(':', '')) ) {
				// new course is inside (bottom)
				conflict = code;
				return;
			}
		})
		return conflict;
	}
}
