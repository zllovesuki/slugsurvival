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
		} else {
			return Promise.resolve(_.state.courses[termId])
		}
	},
	courseHasSections: function(_, courseNumber) {
		var termId = _.state.route.params.termId;
		return _.state.courseInfo[termId][courseNumber].sections.length > 0;
	},
	refreshCalendar: function(_) {
		$('#calendar-' + _.state.route.params.termId).fullCalendar('refetchEvents')
	},
	returnEventSourceSnapshot: function(_) {
		var termId = _.state.route.params.termId;
		return _.state.events[termId]
	},
	pushToEventSource: function(_, course, edit) {
		edit = edit || false;
		var termId = _.state.route.params.termId;
		var courseInfo = _.state.courseInfo[termId][course.number];
		var code;
		var obj = {};
		if (!!!course.time) {
			// TBA will be in the allDaySlot
			obj.title = [course.code + ' - ' + course.section, courseInfo.type, course.name].join("\n");
			obj.number = course.number;
			obj.allDay = true;
			obj.start = _.state.dateMap['Monday'];
			obj.end = _.state.dateMap['Saturday'];
			obj.course = course;
			obj.color = 'green';
			_.dispatch('pushToEventSource', termId, obj);
			obj = {};
		} else {
			course.time.day.forEach(function(day) {
				obj.title = [course.code + ' - ' + course.section, courseInfo.type, course.name].join("\n");
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
		} else {
			this.alert().success(course.code + ' added to the planner!')
		}
		return Promise.resolve();
	},
	removeFromSource: function(_, termId, courseNumber) {
		_.dispatch('removeFromSource', termId, courseNumber);
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

		if (edit) this.removeFromSource(termId, course.number);

		if ((code = this.checkForConflict(section)) !== false) {
			this.alert().error('Section ' + section.section + ' conflict with ' + code + '!')
			if (edit) _.dispatch('restoreEventSourceSnapshot', termId, snapshot);
			return Promise.resolve();
		}
		var day = section.time.day[0];
		obj.title = [course.code, 'Section', 'DIS - ' + section.section].join("\n");
		obj.number = course.number;
		obj._number = section.number;
		if (!!!section.time) {
			// TBA will be in the allDaySlot
			obj.start = _.state.dateMap['Monday'];
			obj.end = _.state.dateMap['Saturday'];
		} else {
			obj.start = _.state.dateMap[day] + ' ' + section.time.time.start;
			obj.end = _.state.dateMap[day] + ' ' + section.time.time.end;
		}
		obj.color = 'grey';
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
		var events =  _.state.events[termId];
		var intersectDays = [];
		var existingDays = [];
		var existingTimes = {};
		var comingTime = {};
		var keys = [];
		var conflict = false;
		if (typeof events === 'undefined') return false;
		for (var i = 0, length = events.length; i < length; i++) {
			// You can't take the same class twice in a quarter
			// At least you shouldn't
			if (events[i].course.code === course.code) {
				conflict = course.code;
				break;
			}
			if (events[i].allDay) continue;
			if (typeof events[i].section !== 'undefined') {
				existingDays.push(events[i].section.time.day);
			} else {
				existingDays.push(events[i].course.time.day);
			}
		}
		if (conflict !== false) return null;
		if (!!!course.time) {
			// TBA
			return false;
		}

		existingDays.forEach(function(days) {
			if (helper.intersect(days, course.time.day)) {
				intersectDays.push(course.time.day);
			}
		})

		intersectDays = [].concat.apply([], intersectDays).filter(function(e, i, c) {
			return c.indexOf(e) === i;
		});

		if (intersectDays.length === 0) return false;
		intersectDays.forEach(function(potentialConflictDay) {
			_.state.events[termId].forEach(function(event) {
				if (event.allDay) return;
				if (typeof event.section !== 'undefined') {
					if (event.section.time.day.indexOf(potentialConflictDay) !== -1) {
						existingTimes[event.course.code + ' Section'] = event.section.time.time;
					}
				} else {
					if (event.course.time.day.indexOf(potentialConflictDay) !== -1) {
						existingTimes[event.course.code] = event.course.time.time;
					}
				}
			})
		})
		keys = Object.keys(existingTimes);
		if (keys.length === 0) return false;
		comingTime = course.time.time;
		var oldStart, newStart, oldEnd, newEnd;
		keys.forEach(function(code) {
			oldStart = existingTimes[code].start.replace(':', '');
			oldEnd = existingTimes[code].end.replace(':', '');
			newStart = comingTime.start.replace(':', '');
			newEnd = comingTime.end.replace(':', '');

			if ((newEnd > oldStart && newStart < oldEnd)) {
				// new course is eating from behind
				conflict = code;
				return;
			}

			if ((newEnd > oldStart && newEnd < oldEnd)) {
				// new course is eating from ahead
				conflict = code;
				return;
			}

			if ((newEnd == oldStart || newStart == oldEnd)) {
				// piggy back
				conflict = code;
				return;
			}

			if ((newEnd == oldEnd && newStart == oldStart)) {
				// overlap
				conflict = code;
				return;
			}

			if ((newEnd == oldEnd && newStart > oldStart)) {
				// new course is inside (bottom)
				conflict = code;
				return;
			}

			if ((newStart == oldStart && newEnd < oldEnd)) {
				// new course is inside (top)
				conflict = code;
				return;
			}

			if ((newEnd == oldEnd && newStart < oldStart)) {
				// new course is outside (existing bottom)
				conflict = code;
				return;
			}

			if ((newStart == oldStart && newEnd > oldEnd)) {
				// new course is outside (existing top)
				conflict = code;
				return;
			}

			if ((oldEnd > newEnd && newStart > oldStart)) {
				// new course is inside
				conflict = code;
				return;
			}

			if ((oldEnd < newEnd && newStart < oldStart)) {
				// new course is outside
				conflict = code;
				return;
			}

		})
		return conflict;
	},
	tConvert: function(_, time) {
		// Check correct time format and split into components
		time = time.toString().match(/^([01]\d|2[0-3])(:)([0-5]\d)(:[0-5]\d)?$/) || [time];

		if (time.length > 1) { // If time format correct
			time = time.slice(1); // Remove full string match value
			time[5] = +time[0] < 12 ? 'AM' : 'PM'; // Set AM/PM
			time[0] = +time[0] % 12 || 12; // Adjust hours
		}
		return time.join(''); // return adjusted time or original string
	} // http://stackoverflow.com/questions/13898423/javascript-convert-24-hour-time-of-day-string-to-12-hour-time-with-am-pm-and-no
}
